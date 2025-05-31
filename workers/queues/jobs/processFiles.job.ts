import { Queue, Worker, Job } from "bullmq";
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
  pageLimit: number | null,
  fileLimit: number | null,
  files: SerializedFile[],
  links: string[],
  texts: string[],
  service: string,
  metadata: string | null,
};

const processfilesQueue = new Queue(processFilesJobName, {
  connection: redisConnection,
  defaultJobOptions: {
    ...defaultQueueConfig,
    delay: 500,
  }
});


new Worker(processFilesJobName, async (job: Job) => {
  const isCancelled = async () =>
    (await redisConnection.get(`cancel-job:${job.id}`)) === '1';

  const { service }: TQueue = job.data
  if (service === "DIRECT_UPLOAD") {
    await processWithCancellation(directProcessFiles, job, isCancelled)
  } else {
    await processWithCancellation(connectionProcessFiles, job, isCancelled);
  }

  await redisConnection.del(`cancel-job:${job.id}`);
}, {
  connection: redisConnection
});

export const addToProcessFilesQueue = async (data: TQueue) => {
  const newJob = await processfilesQueue.add(processFilesJobName, data)
  return newJob.id
};

/**
 * Wraps a processing function to inject cancellation checks.
 */
async function processWithCancellation(
  f: (data: any, checkCancel: () => Promise<boolean>) => Promise<void>,
  job: Job,
  checkCancel: () => Promise<boolean>
) {
  await f(job.data, checkCancel);
}
