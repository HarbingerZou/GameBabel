import { JobQueue, JobData, JobResult } from "./JobQueue";

// Global variable to store the singleton instance
let globalQueueManager: QueueManager | null = null;

class QueueManager {
  private static instance: QueueManager;
  private queues: Map<string, JobQueue<any, any>>;

  private constructor() {
    this.queues = new Map();
  }

  public static getInstance(): QueueManager {
    if (!globalQueueManager) {
      globalQueueManager = new QueueManager();
    }
    return globalQueueManager;
  }

  public getQueueNames(): string[] {
    return Array.from(this.queues.keys());
  }

  public getQueue<T extends JobData, R extends JobResult>(
    queueName: string,
    processor?: (
      data: T,
      updateProgress: (progress: number) => Promise<void>
    ) => Promise<R>
  ): JobQueue<T, R> {
    if (!this.queues.has(queueName)) {
      if (!processor) {
        throw new Error(
          `Queue ${queueName} does not exist and no processor provided`
        );
      }
      this.queues.set(queueName, new JobQueue<T, R>(queueName, processor));
    }
    return this.queues.get(queueName) as JobQueue<T, R>;
  }

  public async getQueueStats(queueName: string) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} does not exist`);
    }
    return queue.getStats();
  }

  public async getJobInfo(queueName: string, jobId: string) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} does not exist`);
    }
    return queue.getJobInfo(jobId);
  }

  public async getAllJobs(queueName: string) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} does not exist`);
    }
    return queue.getAllJobs();
  }

  public async getJobsByStatus(queueName: string, status: string) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} does not exist`);
    }
    return queue.getJobsByStatus(status as any);
  }

  public async getRecentCompletedJobs(queueName: string, limit: number = 10) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} does not exist`);
    }
    return queue.getRecentCompletedJobs(limit);
  }

  public async getFailedJobs(queueName: string, limit: number = 10) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} does not exist`);
    }
    return queue.getFailedJobs(limit);
  }
}

export const queueManager = QueueManager.getInstance();
