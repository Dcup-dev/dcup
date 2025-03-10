import { Queue, Worker } from "bullmq";
import { redisConnection } from "../../redis";
import { defaultQueueConfig } from "../config";
import { databaseDrizzle } from "@/db";
import { processGoogleDriveFiles } from "@/lib/processors/storages/googleDrive";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { v4 as uuidv4 } from 'uuid';
import crypto from "crypto";
import { getTitleAndSummary, vectorizeText } from "@/openAi";
import { qdrant_collection_name, qdrantCLient } from "@/qdrant";

const queueName = 'processFiles';

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

type TQueue = {
  connectionId: string;
};

export const addToProcessFilesQueue = (data: TQueue) => {
  return processfilesQueue.add(queueName, data)
};

const processfilesQueue = new Queue(queueName, {
  connection: redisConnection,
  defaultJobOptions: {
    ...defaultQueueConfig,
    delay: 500,
  }
});

new Worker(queueName, async (job) => {
  const { connectionId }: TQueue = job.data;
  await processFiles(connectionId)
}, {
  connection: redisConnection
});

const processFiles = async (connectionId: string) => {
  try {
    const connection = await databaseDrizzle.query.connections.findFirst({
      where: (c, ops) => ops.eq(c.id, connectionId)
    })
    if (!connection) {
      return;
    }

    let filesContent: FileContent[] = []

    switch (connection.service) {
      case 'GOOGLE_DRIVE':
        filesContent = await processGoogleDriveFiles(connection)
        break;

      default:
        console.error("todo")
        break;
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 4096,
      chunkOverlap: Math.floor(4096 * 0.15),
      keepSeparator: true,
      separators: ["\n\n## ", "\n\n# ", "\n\n", "\n", ". ", "! ", "? ", " "],
    });

    const { collections } = await qdrantCLient.getCollections();
    // Create collection if needed
    if (!collections.find(col => col.name === qdrant_collection_name)) {
      await qdrantCLient.createCollection(qdrant_collection_name, {
        vectors: { size: 1536, distance: 'Cosine' },
      });
    }
    // Process all content first
    const allPoints = [];
    // todo:fix: update the metadata 
    for (const file of filesContent) {
      const baseMetadata = {
        _document_id: file.name,
        _source: connection.service,
        _metadata: {
          ...file.metadata,
          ...JSON.parse(connection.metadata || "{}"),
        },
      };
      for (const [pageIndex, page] of file.pages.entries()) {
        const chunks = await splitter.splitText(page.text)

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
              allPoints.push({
                id: uuidv4(),
                vector: textVectors,
                payload: metadata,
              });
            }
          }
        }

        const pageTables = page.tables.map(t => JSON.stringify(t)).join("\n-------------\n")
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
            allPoints.push({
              id: uuidv4(),
              vector: tableVectors,
              payload: metadata,
            });
          }
        }
      }
    }

    if (allPoints.length > 0) {
      const doc = await qdrantCLient.upsert(qdrant_collection_name, {
        points: allPoints,
        wait: true
      })

      if (doc.status === 'completed') {
        allPoints.forEach(async point => {
          await redisConnection.set(point.payload._hash, point.id, "EX", 3600 * 5) // Cache for 5 hours
        })
      }
      //  todo:send notifcation to the server 
      console.log({ doc })
    }

  } catch (error: any) {
    console.error('Full error details:', error.data); // Log complete error
  }
}

function generateHash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}
