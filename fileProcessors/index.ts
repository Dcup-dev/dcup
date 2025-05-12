import crypto from "crypto";
import { databaseDrizzle } from "@/db";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { v4 as uuidv4 } from 'uuid';
import { getTitleAndSummary, vectorizeText } from "@/openAi";
import { qdrant_collection_name, qdrantCLient } from "@/qdrant";
import { publishProgress } from "@/events";
import { connections, processedFiles } from "@/db/schemas/connections";
import { eq } from "drizzle-orm";
import { getFileContent } from "./connectors";
import { processPdfLink, processPdfBuffer } from "./Files/pdf";
import { TQueue } from "@/workers/queues/jobs/processFiles.job";


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

export const directProcessFiles = async ({ files, metadata, service, connectionId, links, pageLimit, fileLimit }: TQueue) => {
  // Create promises for processing file URLs
  const filePromises = files.map(async (file) => {
    const arrayBuffer = Buffer.from(file.content, 'base64').buffer;

    const content = await processPdfBuffer(new Blob([arrayBuffer]));

    return {
      name: file.name || "",
      pages: content,
      metadata: metadata,
    } as FileContent;
  });

  // Create promises for processing links
  const linkPromises = links.map(async (link) => {
    const content = await processPdfLink(link);
    return {
      name: link,
      pages: content,
      metadata: metadata,
    } as FileContent;
  });

  const filesContent = await Promise.all([...filePromises, ...linkPromises]);
  return processFiles(filesContent, service, connectionId, pageLimit, fileLimit)
}

export const connectionProcessFiles = async ({ connectionId, service, pageLimit, fileLimit }: TQueue) => {
  const connection = await databaseDrizzle.query.connections.findFirst({
    where: (c, ops) => ops.eq(c.id, connectionId)
  })
  if (!connection || !connection.isSyncing) return;
  const filesContent = await getFileContent(connection)
  return processFiles(filesContent, service, connectionId, pageLimit, fileLimit)
}

const processFiles = async (filesContent: FileContent[], service: string, connectionId: string, pageLimit: number | null, fileLimit: number | null) => {
  const completedFiles: typeof processedFiles.$inferInsert[] = []
  const allPoints = [];
  let processedPage = 0;
  let processedAllPages = 0
  let limits = pageLimit ?? Infinity;
  const now = new Date()

  await publishProgress({
    connectionId: connectionId,
    processedFile: 0,
    processedPage: 0,
    lastAsync: now,
    status: 'PROCESSING',
  })

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 4096,
    chunkOverlap: Math.floor(4096 * 0.15),
    keepSeparator: true,
    separators: ["\n\n## ", "\n\n# ", "\n\n", "\n", ". ", "! ", "? ", " "],
  });

  try {
    for (let fileIndex = 0; fileIndex < filesContent.length && limits > 0; fileIndex++) {
      const file = filesContent[fileIndex]
      const chunksId = [];
      if (fileLimit !== null && fileLimit > 0 && fileIndex >= fileLimit) break;
      const baseMetadata = {
        _document_id: file.name,
        _metadata: {
          ...file.metadata,
          source: service,
        },
      };
      for (let pageIndex = 0; pageIndex < file.pages.length && limits > 0; pageIndex++) {
        const page = file.pages[pageIndex]
        if (limits <= 0) break;
        const textPoints = await processingTextPage(page.text, pageIndex, baseMetadata, splitter)
        if (textPoints) {
          allPoints.push(textPoints);
          chunksId.push(textPoints.id)
        }

        const tablePoints = await processingTablePage(page.tables, pageIndex, baseMetadata)
        if (tablePoints) {
          allPoints.push(tablePoints)
          chunksId.push(tablePoints.id)
        }

        processedAllPages += 1;
        processedPage += 1;

        await publishProgress({
          connectionId,
          processedPage: processedAllPages,
          processedFile: fileIndex + 1,
          lastAsync: now,
          status: 'PROCESSING'
        })
        limits -= 1
      }

      completedFiles.push({
        connectionId: connectionId,
        name: file.name,
        totalPages: processedPage,
        chunksIds: chunksId as string[],
      })
      processedPage = 0
    }

    await publishProgress({
      connectionId: connectionId,
      processedFile: completedFiles.length,
      processedPage: processedAllPages,
      lastAsync: now,
      status: 'FINISHED',
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
      processedFile: 0,
      processedPage: 0,
      errorMessage: errorMessage,
      lastAsync: now,
      status: 'FINISHED'
    })
  }
  if (allPoints.length > 0) {
    await qdrantCLient.upsert(qdrant_collection_name, {
      points: allPoints,
      wait: true
    })

    for (let file of completedFiles) {
      await databaseDrizzle
        .insert(processedFiles)
        .values(file)
        .onConflictDoUpdate({
          target: [processedFiles.name, processedFiles.connectionId],
          set: file
        })
    }
  }
  await databaseDrizzle
    .update(connections)
    .set({ lastSynced: now, isSyncing: false })
    .where(eq(connections.id, connectionId))
}

const processingTextPage = async (pageText: string, pageIndex: number, baseMetadata: any, splitter: RecursiveCharacterTextSplitter) => {
  const chunks = await splitter.splitText(pageText)
  for (const [chunkIdx, chunk] of chunks.entries()) {
    if (chunk.length === 0) continue;
    const textHash = generateHash(chunk);
    const textMetadata = {
      ...baseMetadata,
      _chunk_id: chunkIdx + 1,
      _page_number: pageIndex + 1,
      _type: "text",
      _content: chunk,
      _hash: textHash,
    };

    try {
      const existingPoints = await qdrantCLient.scroll(qdrant_collection_name, {
        filter: {
          must: [{ key: "_hash", match: { value: textHash } }]
        },
        limit: 1,
        with_payload: true,
        with_vector: true,
      });
      if (existingPoints.points.length > 0) {
        return {
          id: existingPoints.points[0].id,
          vector: existingPoints.points[0].vector as number[],
          payload: {
            ...existingPoints.points[0].payload,
            _metadata: baseMetadata._metadata
          }
        }
      }
    } catch { }

    const textVectors = await vectorizeText(chunk);
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

const processingTablePage = async (tables: unknown[], pageIndex: number, baseMetadata: any) => {
  const pageTables = tables.map((t, i) => `_Table_${i + 1}:\n${JSON.stringify(t)}`).join(" ")
  const tableHash = generateHash(pageTables);
  if (!pageTables) return;
  const tableMetadata = {
    ...baseMetadata,
    _page_number: pageIndex + 1,
    _type: "table",
    _content: pageTables,
    _hash: tableHash,
  };

  try {
    const existingPoints = await qdrantCLient.scroll(qdrant_collection_name, {
      filter: {
        must: [{ key: "_hash", match: { value: tableHash } }]
      },
      limit: 1,
      with_payload: true,
      with_vector: true,
    });
    if (existingPoints.points.length > 0) {
      return {
        id: existingPoints.points[0].id,
        vector: existingPoints.points[0].vector as number[],
        payload: {
          ...existingPoints.points[0].payload,
          _metadata: baseMetadata._metadata
        }
      }
    }
  } catch { }

  const tableVectors = await vectorizeText(pageTables);
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

function generateHash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}
