import { JobQueue, JobData, JobResult, JobStats, JobInfo } from "./JobQueue";
import Redis from "ioredis";
import { redisConnection } from "./config";
export interface QueueInfo {
  name: string;
  stats: JobStats;
  jobs?: JobInfo[];
}

export class RedisManager {
  private static queues: Map<string, JobQueue<any, any>> = new Map();
  private static redis: Redis;

  private static initializeRedis(): Redis {
    if (!RedisManager.redis) {
      RedisManager.redis = redisConnection;
      
      RedisManager.redis.on("connect", () => console.log("RedisManager: Redis connected"));
      RedisManager.redis.on("error", (err) => console.error("RedisManager: Redis error", err));
    }
    return RedisManager.redis;
  }

  /**
   * Initialize the RedisManager by syncing with Redis queues
   */
  public static async initialize(): Promise<void> {
    try {
      await RedisManager.syncWithRedis();
      console.log(
        `RedisManager initialized with ${RedisManager.queues.size} queues`
      );
    } catch (error) {
      console.error("Error initializing RedisManager:", error);
      throw error;
    }
  }

  /**
   * Sync in-memory queues with Redis queues
   */
  public static async syncWithRedis(): Promise<void> {
    try {
      const redisQueueNames = await RedisManager.listQueueNamesInRedis();

      // Add queues that exist in Redis but not in memory
      for (const queueName of redisQueueNames) {
        if (!RedisManager.queues.has(queueName)) {
          const placeholderQueue = new JobQueue(queueName);
          RedisManager.queues.set(queueName, placeholderQueue);
          console.log(`Synced Redis queue '${queueName}' to memory`);
        }
      }

      // Remove queues that no longer exist in Redis
      const memoryQueueNames = Array.from(RedisManager.queues.keys());
      for (const queueName of memoryQueueNames) {
        if (!redisQueueNames.includes(queueName)) {
          const queue = RedisManager.queues.get(queueName);
          if (queue) {
            await queue.close();
          }
          RedisManager.queues.delete(queueName);
          console.log(
            `Removed queue '${queueName}' from memory (no longer in Redis)`
          );
        }
      }
    } catch (error) {
      console.error("Error syncing queues with Redis:", error);
      throw error;
    }
  }

  /**
   * Get an existing queue by name, with automatic Redis sync
   */
  public static async getExistingQueue<T extends JobData, R extends JobResult>(
    name: string
  ): Promise<JobQueue<T, R> | undefined> {
    if (!RedisManager.queues.has(name)) {
      await RedisManager.syncWithRedis();
    }

    return RedisManager.queues.get(name) as JobQueue<T, R> | undefined;
  }

  /**
   * List all queue names from Redis
   */
  public static async listQueueNamesInRedis(): Promise<string[]> {
    try {
      const redis = RedisManager.initializeRedis();
      const keys = await redis.keys("bull:*:id");
      return keys
        .map((key: string) => {
          const match = key.match(/^bull:(.*):id$/);
          return match ? match[1] : null;
        })
        .filter((name): name is string => !!name);
    } catch (error) {
      console.error("Error listing queue names from Redis:", error);
      return [];
    }
  }

  /**
   * Get comprehensive information about all queues
   */
  public static async getAllQueueInfo(): Promise<QueueInfo[]> {
    const queueNames = await RedisManager.listQueueNamesInRedis();
    const queueInfos: QueueInfo[] = [];
    for (const name of queueNames) {
      try {
        const queue = await RedisManager.getExistingQueue(name);
        if (queue) {
          const stats = await queue.getStats();
          const jobs = await queue.getAllJobs();
          queueInfos.push({ name, stats, jobs });
        } else {
          // Queue exists in Redis but not in memory, create a temporary one to get stats
          const tempQueue = new JobQueue(name);
          const stats = await tempQueue.getStats();
          await tempQueue.close();
          queueInfos.push({ name, stats });
        }
      } catch (error) {
        console.error(`Error getting info for queue ${name}:`, error);
        queueInfos.push({
          name,
          stats: {
            total: 0,
            completed: 0,
            failed: 0,
            delayed: 0,
            active: 0,
            waiting: 0,
          },
        });
      }
    }

    return queueInfos;
  }

  /**
   * Get Redis connection info
   */
  public static async getRedisInfo(): Promise<any> {
    try {
      const redis = RedisManager.initializeRedis();
      const info = await redis.info();
      const memory = await redis.memory("STATS");
      const dbsize = await redis.dbsize();

      return {
        info: info.split("\r\n").reduce((acc: any, line) => {
          if (line.includes(":")) {
            const [key, value] = line.split(":");
            acc[key] = value;
          }
          return acc;
        }, {}),
        memory,
        dbsize,
        connected: redis.status === "ready",
      };
    } catch (error) {
      console.error("Error getting Redis info:", error);
      return {
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get the Redis instance
   */
  public static getRedisInstance(): Redis {
    return RedisManager.initializeRedis();
  }

  /**
   * Clear all queues in Redis: obliterate each queue and remove from memory
   */
  public static async clearAllQueues(): Promise<{ cleared: string[]; errors: string[] }> {
    const cleared: string[] = [];
    const errors: string[] = [];
    const queueNames = await RedisManager.listQueueNamesInRedis();

    for (const name of queueNames) {
      try {
        const queue = await RedisManager.getExistingQueue(name);
        if (queue) {
          await queue.obliterate({ force: true });
          await queue.close();
          RedisManager.queues.delete(name);
          cleared.push(name);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`${name}: ${message}`);
      }
    }

    return { cleared, errors };
  }

  /**
   * Close all queues and Redis connection
   */
  public static async close(): Promise<void> {
    for (const queue of Array.from(RedisManager.queues.values())) {
      try {
        await queue.close();
      } catch (error) {
        console.error("Error closing queue:", error);
      }
    }
    RedisManager.queues.clear();

    if (RedisManager.redis) {
      try {
        await RedisManager.redis.quit();
        RedisManager.redis = undefined as any;
      } catch (error) {
        console.error("Error closing Redis connection:", error);
      }
    }
  }
}
