import { QueueOptions, WorkerOptions } from "bullmq";
import Redis from "ioredis";

// BullMQ requires maxRetriesPerRequest to be null
// This allows BullMQ to handle retries internally
export const redisConnection = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379",
  {
    maxRetriesPerRequest: null,
  }
);

export const defaultQueueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: false, // Changed to false to keep completed jobs
    removeOnFail: false,
  },
};

export const defaultWorkerOptions: WorkerOptions = {
  connection: redisConnection,
  concurrency: 4, // Process only 1 job at a time
};
