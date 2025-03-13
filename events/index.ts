import { redisConnection } from "@/workers/redis";


export const subscriber = redisConnection.duplicate()

export type FileProgress = {
  connectionId: string,
  fileName: string,
  processedPage: number,
  processedFile: number,
  lastAsync: Date,
  errorMessage?: string,
  isFinished: boolean
}

export const processingUpdates = "processing-updates"
const publisher = redisConnection.duplicate()

export const publishProgress = async (progress: FileProgress) => {
  return await publisher.publish(processingUpdates, JSON.stringify(progress));
};
