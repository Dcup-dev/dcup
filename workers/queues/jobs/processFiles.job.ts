import { Queue, Worker } from "bullmq";
import { redisConnection } from "../../redis";
import { defaultQueueConfig } from "../config";
import { connectionProcessFiles, directProcessFiles } from "@/fileProcessors";

export const processFilesJobName = 'processFiles';

export type SerializedFile = {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  content: string; // base64 encoded string
};
export type TQueue = {
  connectionId: string;
  pageLimit: number| null,
  fileLimit: number | null,
  files: SerializedFile[],
  links: string[],
  service: string,
  metadata: string | null,
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

new Worker(processFilesJobName, async ({ data }) => {
  const { service }: TQueue = data
  if (service === "DIRECT_UPLOAD") {
    await directProcessFiles(data)
  } else {
    await connectionProcessFiles(data)
  }
}, {
  connection: redisConnection
});
