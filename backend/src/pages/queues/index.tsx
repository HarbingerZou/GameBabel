import { GetServerSideProps } from "next";
import { queueManager } from "../../queue_workers/QueueManager";
import { JobStats } from "../../queue_workers/JobQueue";

interface QueueInfo {
  name: string;
  stats: JobStats;
}

interface QueuesPageProps {
  queues: QueueInfo[];
  error?: string;
}

export default function QueuesPage({ queues, error }: QueuesPageProps) {
  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h1 className="text-xl font-semibold text-red-800 mb-2">Error</h1>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (queues.length === 0) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Queue Status</h1>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">No queues found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Queue Status</h1>
      <div className="grid gap-4">
        {queues.map((queue) => (
          <div
            key={queue.name}
            className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">{queue.name}</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-sm text-blue-600">Active</div>
                <div className="text-2xl font-bold">{queue.stats.active}</div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="text-sm text-green-600">Completed</div>
                <div className="text-2xl font-bold">
                  {queue.stats.completed}
                </div>
              </div>
              <div className="bg-red-50 p-3 rounded">
                <div className="text-sm text-red-600">Failed</div>
                <div className="text-2xl font-bold">{queue.stats.failed}</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded">
                <div className="text-sm text-yellow-600">Waiting</div>
                <div className="text-2xl font-bold">{queue.stats.waiting}</div>
              </div>
              <div className="bg-purple-50 p-3 rounded">
                <div className="text-sm text-purple-600">Delayed</div>
                <div className="text-2xl font-bold">{queue.stats.delayed}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-600">Total</div>
                <div className="text-2xl font-bold">{queue.stats.total}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<
  QueuesPageProps
> = async () => {
  try {
    const queueNames = queueManager.getQueueNames();
    const queues: QueueInfo[] = [];

    for (const queueName of queueNames) {
      try {
        const stats = await queueManager.getQueueStats(queueName);
        queues.push({
          name: queueName,
          stats,
        });
      } catch (error) {
        console.error(`Failed to get stats for queue ${queueName}:`, error);
        // Add queue with error stats
        queues.push({
          name: queueName,
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

    return {
      props: {
        queues,
      },
    };
  } catch (error) {
    console.error("Error fetching queue stats:", error);
    return {
      props: {
        queues: [],
        error: "Failed to fetch queue statistics",
      },
    };
  }
};
