import { Queue, Worker, Job, JobState, JobsOptions, JobProgress } from "bullmq";
import { defaultQueueOptions, defaultWorkerOptions } from "./config";
import { RedisManager } from "./RedisManager";

export interface JobData {
  [key: string]: any;
}

export interface JobResult {
  [key: string]: any;
}

export interface JobStats {
  total: number;
  completed: number;
  failed: number;
  delayed: number;
  active: number;
  waiting: number;
}

export interface JobInfo {
  id: string;
  name: string;
  status: JobState | "unknown";
  progress: number;
  timestamp: number;
  data: JobData;
  result: JobResult | null;
  error: string | null;
  duration: number | null;
}

export type JobProcessor<T extends JobData, R extends JobResult> = (
  data: T,
  updateProgress: (progress: number) => Promise<void>
) => Promise<R>;

//use only to create a a reference to a queue in redis
export class JobQueue<
  T extends JobData = JobData,
  R extends JobResult = JobResult
> {
  private queue: Queue;
  private worker: Worker | null = null;
  private processor: JobProcessor<T, R> | null = null;

  constructor(queueName: string) {
    this.queue = new Queue(queueName, defaultQueueOptions);
  }

  /**
   * Create a new jobQueue
   * @param queueName - The name of the jobQueue to create
   * @param processor - The processor function for the jobQueue
   */
  //Enforce one and only one queue per processor
  public static async createQueue<
    T extends JobData = JobData,
    R extends JobResult = JobResult
  >(
    queueName: string,
    processor?: JobProcessor<T, R>
  ): Promise<JobQueue<T, R>> {
    const queueNames = await RedisManager.listQueueNamesInRedis();
    let jobQueue: JobQueue<T, R>;
    if (queueNames.includes(queueName)) {
      jobQueue = new JobQueue<T, R>(queueName);
    } else {
      jobQueue = new JobQueue<T, R>(queueName);
      if (!processor) {
        throw new Error("Processor is required to create a new queue");
      }
      const worker = new Worker(
        jobQueue.queue.name,
        async (job: Job<T>) => {
          if (!processor) {
            throw new Error("No processor set for this queue");
          }
          return processor(job.data, async (progress) => {
            await job.updateProgress(progress);
          });
        },
        defaultWorkerOptions
      );
      JobQueue.setupEventListeners(worker);
    }
    return jobQueue;
  }

  //Set up event listeners
  private static setupEventListeners(worker: Worker) {
    if (!worker) return;

    worker.on("completed", (job) => {
      console.log(`Job ${job.id} completed successfully`);
    });

    worker.on("failed", (job, error) => {
      console.error(`Job ${job?.id} failed:`, error);
    });

    worker.on("progress", (job, progress) => {
      console.log(`Job ${job.id} progress: ${progress}%`);
    });
  }

  // Add a new job to the queue
  async addJob(name: string, data: T, options?: JobsOptions): Promise<Job> {
    return this.queue.add(name, data, options);
  }

  // Get current queue statistics
  async getStats(): Promise<JobStats> {
    const [active, waiting, completed, failed, delayed] = await Promise.all([
      this.queue.getActiveCount(),
      this.queue.getWaitingCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    return {
      total: active + waiting + completed + failed + delayed,
      active,
      waiting,
      completed,
      failed,
      delayed,
    };
  }

  // Get detailed information about a specific job
  async getJobInfo(jobId: string): Promise<JobInfo | null> {
    const job: Job | null = await this.queue.getJob(jobId);
    if (!job) return null;

    const state: JobState | "unknown" = await job.getState();
    const progress: JobProgress = job.progress;
    const timestamp: number = job.timestamp;
    const duration: number | null = job.finishedOn
      ? job.finishedOn - job.timestamp
      : null;

    return {
      id: job.id!,
      name: job.name,
      status: state,
      progress: typeof progress === "number" ? progress : 0,
      timestamp,
      data: job.data,
      result: job.returnvalue || null,
      error: job.failedReason || null,
      duration: duration,
    };
  }

  // Get all jobs with their current status
  async getAllJobs(): Promise<JobInfo[]> {
    const jobs: Job[] = await this.queue.getJobs([
      "active",
      "waiting",
      "delayed",
      "failed",
      "completed",
    ]);
    const jobInfos = await Promise.all(
      jobs.map((job) => this.getJobInfo(job.id!))
    );
    return jobInfos.filter((info): info is JobInfo => info !== null);
  }

  // Pause the queue
  async pause(): Promise<void> {
    await this.queue.pause();
  }

  // Resume the queue
  async resume(): Promise<void> {
    await this.queue.resume();
  }

  // Close the queue and worker
  async close(): Promise<void> {
    await this.queue.close();
    if (this.worker) {
      await this.worker.close();
    }
  }
}
