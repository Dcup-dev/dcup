import { Queue, Worker } from "bullmq";
import { redisConnection } from "../../redis";
import { defaultQueueConfig } from "../config";
import { databaseDrizzle } from "@/db";
import { processGoogleDriveFiles } from "@/lib/processors/storages/googleDrive";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import OpenAI from "openai";


const queueName = 'processFiles';

export type FileContent = {
  text: string;
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

    const combinedText = filesContent.map(page => page.text.trim()).join("\n")
    const prepareTables = filesContent.map(page => page.tables.map(table => JSON.stringify(table)).join("\n"))
    const chunks = await splitter.splitText(combinedText)
    await textEmbedding(chunks);
    await textEmbedding(prepareTables)

  } catch (error) {
    console.log({ error })
  }
}

const textEmbedding = async (chunks: string[]) => {
  const token = process.env.OPENAI_KEY!;
  const endpoint = process.env.OPENAI_ENDPOINT!
  const modelName = process.env.OPENAI_MODEL_NAME!

  const client = new OpenAI({ baseURL: endpoint, apiKey: token });

  const response = await client.embeddings.create({
    input: chunks,
    model: modelName
  });

  for (const item of response.data) {
    let length = item.embedding.length;
    console.log(
      `data[${item.index}]: length=${length}, ` +
      `[${item.embedding[0]}, ${item.embedding[1]}, ` +
      `..., ${item.embedding[length - 2]}, ${item.embedding[length - 1]}]`);
  }
  console.log(response.usage);
}
