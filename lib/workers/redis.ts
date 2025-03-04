import Redis from 'ioredis';


export const redisConnection = new Redis(`redis://${process.env.REDIS_DB_ADDRESS}:${process.env.REDIS_DB_PORT}`, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});
