import crypto from "crypto";
import { databaseDrizzle } from "@/db";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { v4 as uuidv4 } from 'uuid';
import { getTitleAndSummary, vectorizeText } from "@/openAi";
import { qdrant_collection_name, qdrantCLient } from "@/qdrant";
import { redisConnection } from "@/workers/redis";
import { publishProgress } from "@/events";
import { connections, processedFiles } from "@/db/schemas/connections";
import { eq } from "drizzle-orm";
import { getFileContent } from "./connectors";

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

export const processFiles = async (connectionId: string, pageLimit: number | null, fileLimit: number | null) => {
  const completedFiles: typeof processedFiles.$inferInsert[] = []
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

    const filesContent = await getFileContent(connection)

    for (const [fileIndex, file] of filesContent.entries()) {
      if (fileLimit && fileLimit > 0 && fileLimit === fileIndex) break;
      const baseMetadata = {
        _document_id: file.name,
        _source: connection.service,
        _metadata: {
          ...file.metadata,
          ...JSON.parse(connection.metadata || "{}"),
        },
      };
      for (const [pageIndex, page] of file.pages.entries()) {
        if (pageLimit && pageLimit > 0 && pageLimit === pageIndex) break;
        try {
          const textPoints = await processingTextPage(page.text, pageIndex, baseMetadata, splitter)
          if (textPoints) allPoints.push(textPoints)
          const vectorPoints = await processingTablePage(page.tables, pageIndex, baseMetadata)
          if (vectorPoints) allPoints.push(vectorPoints)

          processedAllPages += 1;
          processedPage += 1;

          await publishProgress({
            connectionId,
            fileName: file.name,
            processedPage: processedAllPages,
            processedFile: fileIndex + 1,
            lastAsync: now,
            isFinished: false,
          })

        } catch (error: any) {
          let errorMessage = "";
          if (error instanceof Error) {
            errorMessage = error.message;
          } if (error.data) {
            errorMessage = error.data
          } else {
            errorMessage = String(error);
          }
          await publishProgress({
            connectionId: connectionId,
            fileName: file.name,
            processedFile: fileIndex + 1,
            processedPage: processedAllPages,
            errorMessage: errorMessage,
            lastAsync: now,
            isFinished: false,
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

      allPoints.forEach(async point => {
        await redisConnection.set(point.payload._hash, JSON.stringify(point.payload._metadata), "EX", 3600 * 5) // Cache for 5 hours
      })
    }
    await databaseDrizzle
      .update(connections)
      .set({ lastSynced: now, isSyncing: false })
      .where(eq(connections.id, connectionId))

    await publishProgress({
      connectionId: connectionId,
      fileName: "",
      processedFile: filesContent.length,
      processedPage: processedAllPages,
      lastAsync: now,
      isFinished: true,
    })

  } catch (error: any) {
    await publishProgress({
      connectionId: connectionId,
      fileName: "",
      processedFile: 0,
      processedPage: 0,
      errorMessage: error.data,
      lastAsync: now,
      isFinished: true,
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

    const cachedMetadata = await redisConnection.get(textHash)
    if (!cachedMetadata || cachedMetadata !== JSON.stringify(baseMetadata._metadata)) {
      const textVectors = await vectorizeText(chunk);
      const existingPoints = await qdrantCLient.search(qdrant_collection_name, {
        vector: textVectors,
        filter: {
          must: [{ key: "_hash", match: { value: textHash } }]
        },
        limit: 1,
        with_payload: {
          include: ["_metadata"]
        }
      });

      const { title, summary } = await getTitleAndSummary(chunk, JSON.stringify(textMetadata))
      const metadata = {
        ...textMetadata,
        _title: title,
        _summary: summary
      }

      return {
        id: existingPoints.length > 0 ? existingPoints[0].id : uuidv4(),
        vector: textVectors,
        payload: metadata,
      };
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

  const cachedMetadata = await redisConnection.get(tableHash)
  if (!cachedMetadata || cachedMetadata !== JSON.stringify(baseMetadata._metadata)) {
    const tableVectors = await vectorizeText(pageTables);
    const existingPoints = await qdrantCLient.search(qdrant_collection_name, {
      vector: tableVectors,
      filter: {
        must: [{ key: "_hash", match: { value: tableHash } }]
      },
      limit: 1,
      with_payload: {
        include: ["_metadata"]
      }
    });

    const { title, summary } = await getTitleAndSummary(pageTables, JSON.stringify(tableMetadata))
    const metadata = {
      ...tableMetadata,
      _title: title,
      _summary: summary
    }

    return {
      id: existingPoints.length > 0 ? existingPoints[0].id : uuidv4(),
      vector: tableVectors,
      payload: metadata,
    };
  }
}

function generateHash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}
