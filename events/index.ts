import { redisConnection } from "@/workers/redis";


export const subscriber = redisConnection.duplicate()

export type ConnectionProgress = {
  connectionId: string
  processedPage: number,
  processedFile: number,
  lastAsync: Date,
  errorMessage?: string,
  status: "PROCESSING" | "FINISHED"
}

export const processingUpdates = "processing-updates"
const publisher = redisConnection.duplicate()

export const publishProgress = async (progress: ConnectionProgress) => {
  return await publisher.publish(processingUpdates, JSON.stringify(progress));
};
