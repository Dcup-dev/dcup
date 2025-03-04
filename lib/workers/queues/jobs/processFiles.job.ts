import { Queue, Worker } from "bullmq";
import { redisConnection } from "../../redis";
import { defaultQueueConfig } from "../config";
import { databaseDrizzle } from "@/db";


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
  const connection = await databaseDrizzle.query.connections.findFirst({
    where: (c, ops) => ops.eq(c.id, connectionId)
  })
  // todo
  console.log({ connection })
}
