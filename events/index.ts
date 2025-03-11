import { redisConnection } from "@/workers/redis";

export const subscriber = redisConnection.duplicate();

const publisher = redisConnection.duplicate();

export type FailedFile = {
  fileName: string,
  errorMessage: string
}

type FileProgress = {
  filesCompleted: string[],
  filesFailed: FailedFile[],
  processedPage: number
}

export const processingUpdates = "processing-updates"
export const publishProgress = async (progress: FileProgress) => {
  return await publisher.publish(processingUpdates, JSON.stringify(progress));
}
