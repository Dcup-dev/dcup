import { DefaultJobOptions } from "bullmq";

export const defaultQueueConfig: DefaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
};
