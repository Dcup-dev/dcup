import { Queue, Worker } from "bullmq";
import { redisConnection } from "../../redis";
import { defaultQueueConfig } from "../config";
import { databaseDrizzle } from "@/db";
import { processGoogleDriveFiles } from "@/lib/processors/storages/googleDrive";


const queueName = 'processFiles';

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
    switch (connection.service) {
      case 'GOOGLE_DRIVE':
        console.log("we found google drive")
        await processGoogleDriveFiles(connection)
        break;

      default:
        console.error("todo")
        break;
    }
  } catch (error) {
    console.log({ error })
  }
}
