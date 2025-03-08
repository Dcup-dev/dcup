import { Queue, Worker } from "bullmq";
import { redisConnection } from "../../redis";
import { defaultQueueConfig } from "../config";
import { databaseDrizzle } from "@/db";
import { processGoogleDriveFiles } from "@/lib/processors/storages/googleDrive";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import OpenAI from "openai";

import { QdrantClient } from '@qdrant/js-client-rest';


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
  console.log("start processing FIles")
  try {
    const connection = await databaseDrizzle.query.connections.findFirst({
      where: (c, ops) => ops.eq(c.id, connectionId)
    })
    if (!connection) {
      console.error("Connection not found");
      return;
    }

    let filesContent: FileContent[] = []

    switch (connection.service) {
      case 'GOOGLE_DRIVE':
        console.log("we found google drive")
        filesContent = await processGoogleDriveFiles(connection)
        break;

      default:
        console.error("todo")
        break;
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 512,
      chunkOverlap: 100
    })

    const token = process.env.OPENAI_KEY!;
    const endpoint = process.env.OPENAI_ENDPOINT!;
    const openAiClient = new OpenAI({ baseURL: endpoint, apiKey: token });
    const qdrant = new QdrantClient({ url: 'http://127.0.0.1:6333' });
    const documents = "document";
    const { collections } = await qdrant.getCollections();

    // Create collection if needed
    if (!collections.find(col => col.name === documents)) {
      await qdrant.createCollection(documents, {
        vectors: { size: 1536, distance: 'Cosine' },
      });
    }

    // Process all content first
    const allPoints = [];

    for (const file of filesContent) {
      for (const [pageIndex, page] of file.pages.entries()) {
        // Process tables
        for (const [tableIndex, table] of page.tables.entries()) {
          const tableContent = JSON.stringify(table);
          const metadata = {
            _document_id: file.name,
            _page_number: pageIndex + 1,
            _type: "table",
            _content: tableContent,
            _chunk_id: tableIndex + 1,
            _metadata: {
              ...file.metadata,
              ...JSON.parse(connection.metadata || "{}"),
            },
          };

          const tableVectors = await vectorizeChunks(openAiClient, tableContent);
          allPoints.push({
            id: `${metadata._document_id}_page_${metadata._page_number}_type_${metadata._type}_chunk_${metadata._chunk_id}`,
            vector: tableVectors[0].embedding, // Use first (and only) vector
            payload: metadata,
          });
        }

        // Process text chunks
        const textChunks = await splitter.splitText(page.text);
        for (const [chunkIndex, chunk] of textChunks.entries()) {
          const metadata = {
            _document_id: file.name,
            _page_number: pageIndex + 1,
            _type: "text",
            _content: chunk,
            _chunk_id: chunkIndex + 1,
            _metadata: {
              ...file.metadata,
              ...JSON.parse(connection.metadata || "{}"),
            },
          };

          const textVectors = await vectorizeChunks(openAiClient, chunk);
          allPoints.push({
            id: `${metadata._document_id}_page_${metadata._page_number}_type_${metadata._type}_chunk_${metadata._chunk_id}`,
            vector: textVectors[0].embedding, // Use first (and only) vector
            payload: metadata,
          });
        }
      }
    }
    
    // todo : save vector database 
    console.log({ allvectors: allPoints.map(x => x.vector) });
    const doc = await qdrant.upsert(documents, {
      points: allPoints
    })
    console.log({ doc })


  } catch (error) {
    console.error('Full error details:', error); // Log complete error
  }
}

const vectorizeChunks = async (openAiClient: OpenAI, chunk: string) => {
  const modelName = process.env.OPENAI_MODEL_NAME!
  const response = await openAiClient.embeddings.create({
    input: chunk,
    model: modelName
  });
  return response.data;
}
