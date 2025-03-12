import crypto from "crypto";
import { databaseDrizzle } from "@/db";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { v4 as uuidv4 } from 'uuid';
import { getTitleAndSummary, vectorizeText } from "@/openAi";
import { qdrant_collection_name, qdrantCLient } from "@/qdrant";
import { processGoogleDriveFiles } from "./processors/storages/googleDrive";
import { redisConnection } from "@/workers/redis";
import { publishProgress } from "@/events";
import { connections, processedFiles } from "@/db/schemas/connections";

export type FileContent = {
  name: string,
  pages: PageContent[],
  metadata: {},
}

export type PageContent = {
  title: string,
  text: string,
  tables: unknown[]
}

export const processFiles = async (connectionId: string) => {
  const completedFiles: typeof processedFiles.$inferInsert[] = []
  let filesContent: FileContent[] = []
  const allPoints = [];
  let processedPage = 0;
  let processedAllPages = 0
  const now = new Date()

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 4096,
    chunkOverlap: Math.floor(4096 * 0.15),
    keepSeparator: true,
    separators: ["\n\n## ", "\n\n# ", "\n\n", "\n", ". ", "! ", "? ", " "],
  });

  try {
    const connection = await databaseDrizzle.query.connections.findFirst({
      where: (c, ops) => ops.eq(c.id, connectionId)
    })

    if (!connection) return;

    switch (connection.service) {
      case 'GOOGLE_DRIVE':
        filesContent = await processGoogleDriveFiles(connection)
        break;
    }

    // todo: fix(bugs): update the metadata 
    for (const [fileIndex, file] of filesContent.entries()) {
      const baseMetadata = {
        _document_id: file.name,
        _source: connection.service,
        _metadata: {
          ...file.metadata,
          ...JSON.parse(connection.metadata || "{}"),
        },
      };
      for (const [pageIndex, page] of file.pages.entries()) {
        try {
          const textPoints = await processingTextPage(page.text, pageIndex, baseMetadata, splitter)
          if (textPoints) allPoints.push(textPoints)
          const tablesPoints = await processingTablePage(page.tables, pageIndex, baseMetadata)
          if (tablesPoints) allPoints.push(tablesPoints)

          processedAllPages += 1;
          processedPage += 1;


          await publishProgress({
            connectionId,
            fileName: file.name,
            processedPage: processedAllPages,
            processedFile: fileIndex + 1,
            lastAsync: now
          })

        } catch (error: any) {
          let errorMessage = "";
          if (error instanceof Error) {
            errorMessage = error.message;
          } else {
            errorMessage = String(error);
          }
          await publishProgress({
            connectionId: connectionId,
            fileName: file.name,
            processedFile: fileIndex + 1,
            processedPage: processedAllPages,
            errorMessage: errorMessage,
            lastAsync: now
          })
        }
      }

      completedFiles.push({
        connectionId: connectionId,
        name: file.name,
        totalPages: processedPage,
      })
      processedPage = 0
    }

    if (allPoints.length > 0) {
      await qdrantCLient.upsert(qdrant_collection_name, {
        points: allPoints,
        wait: true
      })

      completedFiles.map(async (file) =>
        await databaseDrizzle
          .insert(processedFiles)
          .values(file).onConflictDoUpdate({
            target: processedFiles.name,
            set: file
          })
      )

      await databaseDrizzle
        .update(connections)
        .set({ lastSynced: now })

      allPoints.forEach(async point => {
        await redisConnection.set(point.payload._hash, point.id, "EX", 3600 * 5) // Cache for 5 hours
      })
    }
  } catch (error: any) {
    await publishProgress({
      connectionId: connectionId,
      fileName: "",
      processedFile: 0,
      processedPage: 0,
      errorMessage: error.data,
      lastAsync: now
    })
  }
}

const processingTextPage = async (pageText: string, pageIndex: number, baseMetadata: any, splitter: RecursiveCharacterTextSplitter) => {
  const chunks = await splitter.splitText(pageText)
  for (const [chunkIdx, chunk] of chunks.entries()) {
    const textHash = generateHash(chunk);
    const textMetadata = {
      ...baseMetadata,
      _chunk_id: chunkIdx + 1,
      _page_number: pageIndex + 1,
      _type: "text",
      _content: chunk,
      _hash: textHash,
    };

    const pointCached = await redisConnection.get(textHash)
    if (!pointCached) {
      const textVectors = await vectorizeText(chunk);
      const existingPoints = await qdrantCLient.search(qdrant_collection_name, {
        vector: textVectors,
        filter: {
          must: [{ key: "_hash", match: { value: textHash } }]
        },
        limit: 1,
      });

      if (existingPoints.length === 0) {
        const { title, summary } = await getTitleAndSummary(chunk, JSON.stringify(textMetadata))
        const metadata = {
          ...textMetadata,
          _title: title,
          _summary: summary
        }
        return {
          id: uuidv4(),
          vector: textVectors,
          payload: metadata,
        };
      }
    }
  }
}

const processingTablePage = async (tables: unknown[], pageIndex: number, baseMetadata: any) => {
  const pageTables = tables.map(t => JSON.stringify(t)).join("\n-------------\n")

  const tableHash = generateHash(pageTables);
  const tableMetadata = {
    ...baseMetadata,
    _page_number: pageIndex + 1,
    _type: "table",
    _content: pageTables,
    _hash: tableHash,
  };

  const pointCached = await redisConnection.get(tableHash)
  if (!pointCached) {
    const tableVectors = await vectorizeText(pageTables);
    const existingPoints = await qdrantCLient.search(qdrant_collection_name, {
      vector: tableVectors,
      filter: {
        must: [{ key: "_hash", match: { value: tableHash } }]
      },
      limit: 1,
    });

    if (existingPoints.length === 0) {
      const { title, summary } = await getTitleAndSummary(pageTables, JSON.stringify(tableMetadata))
      const metadata = {
        ...tableMetadata,
        _title: title,
        _summary: summary
      }
      return {
        id: uuidv4(),
        vector: tableVectors,
        payload: metadata,
      };
    }
  }
}

function generateHash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}
