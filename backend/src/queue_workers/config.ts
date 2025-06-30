import { QueueOptions, WorkerOptions } from "bullmq";

export const defaultQueueOptions: QueueOptions = {
  connection: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD,
  },
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
  connection: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD,
  },
  concurrency: 1, // Process only 1 job at a time
};
