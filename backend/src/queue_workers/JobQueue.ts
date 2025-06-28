import { Queue, Worker, Job, JobState } from "bullmq";
import { defaultQueueOptions } from "./config";

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
  status: JobState;
  progress: number;
  timestamp: number;
  data: JobData;
  result?: JobResult;
  error?: string;
  duration?: number;
}

export type JobProcessor<T extends JobData, R extends JobResult> = (
  data: T,
  updateProgress: (progress: number) => Promise<void>
) => Promise<R>;

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
   * Set the processor function for this queue
   */
  public setProcessor(processor: JobProcessor<T, R>): void {
    this.processor = processor;

    // Close existing worker if any
    if (this.worker) {
      this.worker.close();
    }

    // Create new worker with the processor
    this.worker = new Worker(
      this.queue.name,
      async (job: Job<T>) => {
        if (!this.processor) {
          throw new Error("No processor set for this queue");
        }
        return this.processor(job.data, async (progress) => {
          await job.updateProgress(progress);
        });
      },
      defaultQueueOptions
    );

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Check if the queue has a processor set
   */
  public hasProcessor(): boolean {
    return this.processor !== null;
  }

  private setupEventListeners() {
    if (!this.worker) return;

    this.worker.on("completed", (job) => {
      console.log(`Job ${job.id} completed successfully`);
    });

    this.worker.on("failed", (job, error) => {
      console.error(`Job ${job?.id} failed:`, error);
    });

    this.worker.on("progress", (job, progress) => {
      console.log(`Job ${job.id} progress: ${progress}%`);
    });
  }

  // Add a new job to the queue
  async addJob(name: string, data: T, options?: any): Promise<Job> {
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
    const job = await this.queue.getJob(jobId);
    if (!job) return null;

    const state = await job.getState();
    const progress = await job.progress;
    const timestamp = job.timestamp;
    const duration = job.finishedOn
      ? job.finishedOn - job.timestamp
      : undefined;

    return {
      id: job.id!,
      name: job.name,
      status: state,
      progress: typeof progress === "number" ? progress : 0,
      timestamp,
      data: job.data,
      result: job.returnvalue,
      error: job.failedReason,
      duration,
    };
  }

  // Get all jobs with their current status
  async getAllJobs(): Promise<JobInfo[]> {
    const jobs = await this.queue.getJobs([
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

  // Get jobs by status
  async getJobsByStatus(status: JobState): Promise<JobInfo[]> {
    const jobs = await this.queue.getJobs([status]);
    const jobInfos = await Promise.all(
      jobs.map((job) => this.getJobInfo(job.id!))
    );
    return jobInfos.filter((info): info is JobInfo => info !== null);
  }

  // Get recent completed jobs with their duration
  async getRecentCompletedJobs(limit: number = 10): Promise<JobInfo[]> {
    const jobs = await this.queue.getJobs(["completed"], 0, limit, true);
    const jobInfos = await Promise.all(
      jobs.map((job) => this.getJobInfo(job.id!))
    );
    return jobInfos.filter((info): info is JobInfo => info !== null);
  }

  // Get failed jobs
  async getFailedJobs(limit: number = 10): Promise<JobInfo[]> {
    const jobs = await this.queue.getJobs(["failed"], 0, limit, true);
    const jobInfos = await Promise.all(
      jobs.map((job) => this.getJobInfo(job.id!))
    );
    return jobInfos.filter((info): info is JobInfo => info !== null);
  }

  // Clean up completed jobs older than a certain age
  async cleanOldJobs(age: number = 24 * 60 * 60 * 1000): Promise<void> {
    await this.queue.clean(age, "completed" as any);
    await this.queue.clean(age, "failed" as any);
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
