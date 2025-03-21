import { Queue, Worker } from "bullmq";
import { redisConnection } from "../../redis";
import { defaultQueueConfig } from "../config";
import { processFiles } from "@/fileProcessors";

export const processFilesJobName = 'processFiles';

type TQueue = {
  connectionId: string;
  pageLimit: number| null,
  fileLimit: number | null,
};

export const addToProcessFilesQueue = (data: TQueue) => {
  return processfilesQueue.add(processFilesJobName, data)
};

const processfilesQueue = new Queue(processFilesJobName, {
  connection: redisConnection,
  defaultJobOptions: {
    ...defaultQueueConfig,
    delay: 500,
  }
});

new Worker(processFilesJobName, async (job) => {
  const { connectionId, pageLimit, fileLimit }: TQueue = job.data;
  await processFiles(connectionId, pageLimit, fileLimit)
}, {
  connection: redisConnection
});
