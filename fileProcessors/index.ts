import crypto from "crypto";
import { databaseDrizzle } from "@/db";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { v4 as uuidv4 } from 'uuid';
import { getTitleAndSummary, vectorizeText } from "@/openAi";
import { qdrant_collection_name, qdrantClient } from "@/qdrant";
import { publishProgress } from "@/events";
import { and, eq } from "drizzle-orm";
import { getFileContent } from "./connectors";
import { processPdfLink, processPdfBuffer } from "./Files/pdf";
import { TQueue } from "@/workers/queues/jobs/processFiles.job";
import { tryAndCatch } from "@/lib/try-catch";
import { processDirectText } from "./Files/text";
import { connections, processedFiles } from "@/db/schema";

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

export const directProcessFiles = async ({ files, metadata, service, connectionId, links, pageLimit, fileLimit, texts }: TQueue, checkCancel?: () => Promise<boolean>) => {
  // Create promises for processing file URLs
  const filePromises = files.map(async (file) => {
    let content: PageContent[] = [];
    switch (file.type) {
      case "application/pdf":
        const arrayBuffer = Buffer.from(file.content, 'base64').buffer;
        content = await processPdfBuffer(new Blob([arrayBuffer]));
        break;
      case "text/plain":
        const text = Buffer.from(file.content, "base64").toString("utf8");
        content = await processDirectText(text)
        break;
      default:
        throw new Error(`${file.type} is not supported yet`)
    }
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

  const textPromises = texts.map(async (txt) => {
    const content = await processDirectText(txt)
    return {
      name: "TEXT",
      pages: content,
      metadata: metadata,
    } as FileContent;
  })

  const filesContent = await Promise.all([...filePromises, ...linkPromises, ...textPromises]);
  const filesNames = filesContent.map(f => f.name)
  const connection = await databaseDrizzle.query.connections.findFirst({
    where: (c, ops) => ops.eq(c.id, connectionId),
    with: {
      files: {
        where: (f, ops) => ops.notInArray(f.name, filesNames),
        columns: {
          totalPages: true,
        }
      }
    }
  })
  if (!connection) return;

  const currentPagesCount = connection?.files.reduce((sum, f) => f.totalPages + sum, 0) ?? 0
  if (pageLimit && pageLimit < currentPagesCount) {
    await databaseDrizzle
      .update(connections)
      .set({ jobId: null })
      .where(eq(connections.id, connectionId))

    await publishProgress({
      connectionId: connectionId,
      processedFile: connection.files.length,
      processedPage: currentPagesCount,
      lastAsync: new Date(),
      status: 'FINISHED',
    })
    return;
  }
  return await processFiles(connection.userId, filesContent, service, connectionId, pageLimit, fileLimit, currentPagesCount, connection.files.length, checkCancel)
}

export const connectionProcessFiles = async ({ connectionId, service, pageLimit, fileLimit }: TQueue, checkCancel?: () => Promise<boolean>) => {
  const connection = await databaseDrizzle.query.connections.findFirst({
    where: (c, ops) => ops.eq(c.id, connectionId),
    with: {
      files: true,
    }
  })
  if (!connection) return;
  const filesContent = await getFileContent(connection)

  const newFileNames = new Set(filesContent.map(f => f.name));
  const filesToRemove = connection.files.filter(f => !newFileNames.has(f.name));

  for (const file of filesToRemove) {
    await databaseDrizzle
      .delete(processedFiles)
      .where(and(
        eq(processedFiles.connectionId, connection.id),
        eq(processedFiles.name, file.name)
      ))

    await tryAndCatch(qdrantClient.delete(qdrant_collection_name, {
      points: file.chunksIds,
      filter: {
        must: [
          { key: "_document_id", match: { value: file.name } },
          { key: "_userId", match: { value: connection.userId } }
        ]
      }
    }))
  }
  // check the limits 
  const currentPagesCount = connection?.files.reduce((sum, f) => f.totalPages + sum, 0) ?? 0
  if (pageLimit && pageLimit < currentPagesCount) {
    await databaseDrizzle
      .update(connections)
      .set({ jobId: null })
      .where(eq(connections.id, connectionId))

    await publishProgress({
      connectionId: connectionId,
      processedFile: connection.files.length,
      processedPage: currentPagesCount,
      lastAsync: new Date(),
      status: 'FINISHED',
    })
    return;
  }
  return processFiles(connection.userId, filesContent, service, connectionId, pageLimit, fileLimit, 0, 0, checkCancel)
}

const processFiles = async (userId: string, filesContent: FileContent[], service: string, connectionId: string, pageLimit: number | null, fileLimit: number | null, currentPagesCount: number, currentFileCount: number, checkCancel?: () => Promise<boolean>) => {
  const completedFiles: typeof processedFiles.$inferInsert[] = []
  const allPoints = [];
  let processedPage = 0;
  let processedAllPages = currentPagesCount;
  let limits = pageLimit ? pageLimit - currentPagesCount : Infinity;
  let shouldCancel = false;
  const now = new Date()
  try {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 4096,
      chunkOverlap: Math.floor(4096 * 0.15),
      keepSeparator: true,
      separators: ["\n\n## ", "\n\n# ", "\n\n", "\n", ". ", "! ", "? ", " "],
    });
    fileLoop: for (let fileIndex = 0; fileIndex < filesContent.length && limits > 0; fileIndex++) {
      const file = filesContent[fileIndex]
      const chunksId = [];
      if (fileLimit !== null && fileLimit > 0 && fileIndex >= fileLimit) break;
      const baseMetadata = {
        _document_id: file.name,
        _userId: userId,
        _metadata: {
          ...file.metadata,
          source: service,
        },
      };
      for (let pageIndex = 0; pageIndex < file.pages.length && limits > 0; pageIndex++) {
        if (checkCancel && await checkCancel()) {
          shouldCancel = true;
          break;
        }
        if (process.env.NEXT_PUBLIC_APP_ENV === 'TEST') {
          const delay = (ms: number) => new Promise(res => setTimeout(res, ms))
          await delay(1000)
        }

        const page = file.pages[pageIndex]
        if (limits <= 0 || shouldCancel) break;
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
      if (limits <= 0 || shouldCancel) break fileLoop;
    }

    if (allPoints.length > 0) {
      await qdrantClient.upsert(qdrant_collection_name, {
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
      .set({
        lastSynced: now,
        jobId: null,
      })
      .where(eq(connections.id, connectionId))

    await publishProgress({
      connectionId: connectionId,
      processedFile: completedFiles.length + currentFileCount,
      processedPage: processedAllPages,
      lastAsync: now,
      status: 'FINISHED',
    })

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : error.data ? error.data : String(error);
    await publishProgress({
      connectionId: connectionId,
      processedFile: completedFiles.length + currentFileCount,
      processedPage: processedAllPages,
      errorMessage: errorMessage,
      lastAsync: now,
      status: 'FINISHED'
    })
    throw error
  }
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

    const { data: existingPoints } = await tryAndCatch(qdrantClient.scroll(qdrant_collection_name, {
      filter: {
        must: [
          { key: "_hash", match: { value: textHash } },
          { key: "_userId", match: { value: baseMetadata._userId } }
        ]
      },
      limit: 1,
      with_payload: true,
      with_vector: true,
    }));

    if (existingPoints && existingPoints.points.length > 0) {
      return {
        id: existingPoints.points[0].id,
        vector: existingPoints.points[0].vector as number[],
        payload: {
          ...existingPoints.points[0].payload,
          _metadata: baseMetadata._metadata
        }
      }
    }

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
  const { data: existingPoints } = await tryAndCatch(qdrantClient.scroll(qdrant_collection_name, {
    filter: {
      must: [
        { key: "_hash", match: { value: tableHash } },
        { key: "_userId", match: { value: baseMetadata._userId } }
      ]
    },
    limit: 1,
    with_payload: true,
    with_vector: true,
  }));

  if (existingPoints && existingPoints.points.length > 0) {
    return {
      id: existingPoints.points[0].id,
      vector: existingPoints.points[0].vector as number[],
      payload: {
        ...existingPoints.points[0].payload,
        _metadata: baseMetadata._metadata
      }
    }
  }

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
