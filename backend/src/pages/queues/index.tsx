import { GetServerSideProps } from "next";
import { useState } from "react";
import { RedisManager } from "../../queue_workers/RedisManager";
import { JobStats } from "../../queue_workers/JobQueue";

interface QueueInfo {
  name: string;
  stats: JobStats;
}

interface QueuesPageProps {
  queueInfos: QueueInfo[];
  error?: string;
}

export default function QueuesPage({ queueInfos, error }: QueuesPageProps) {
  const [isTriggering, setIsTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState<{
    success: boolean;
    message: string;
    jobId?: string;
    testId?: string;
  } | null>(null);

  const handleTriggerTest = async () => {
    setIsTriggering(true);
    setTriggerResult(null);

    try {
      const response = await fetch("/api/queues/trigger-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (response.ok) {
        setTriggerResult({
          success: true,
          message: result.message,
          jobId: result.jobId,
          testId: result.testId,
        });
      } else {
        setTriggerResult({
          success: false,
          message: result.error || "Failed to trigger test processing",
        });
      }
    } catch (error) {
      setTriggerResult({
        success: false,
        message: "Network error occurred",
      });
    } finally {
      setIsTriggering(false);
    }
  };

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

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Queue Status</h1>
        <button
          onClick={handleTriggerTest}
          disabled={isTriggering}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isTriggering
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {isTriggering ? "Triggering..." : "Trigger Test Processing"}
        </button>
      </div>

      {triggerResult && (
        <div
          className={`mb-4 p-4 rounded-lg border ${
            triggerResult.success
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="font-medium">
            {triggerResult.success ? "Success!" : "Error"}
          </div>
          <div className="text-sm mt-1">{triggerResult.message}</div>
          {triggerResult.success && triggerResult.jobId && (
            <div className="text-sm mt-1">
              Job ID:{" "}
              <code className="bg-green-100 px-1 rounded">
                {triggerResult.jobId}
              </code>
            </div>
          )}
          {triggerResult.success && triggerResult.testId && (
            <div className="text-sm mt-1">
              Test ID:{" "}
              <code className="bg-green-100 px-1 rounded">
                {triggerResult.testId}
              </code>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4">
        {queueInfos.map((queueInfo) => (
          <div
            key={queueInfo.name}
            className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">{queueInfo.name}</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-600">Total</div>
                <div className="text-lg font-semibold">
                  {queueInfo.stats.total}
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-600">Active</div>
                <div className="text-lg font-semibold text-blue-600">
                  {queueInfo.stats.active}
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-600">Waiting</div>
                <div className="text-lg font-semibold text-yellow-600">
                  {queueInfo.stats.waiting}
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-600">Completed</div>
                <div className="text-lg font-semibold text-green-600">
                  {queueInfo.stats.completed}
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-600">Failed</div>
                <div className="text-lg font-semibold text-red-600">
                  {queueInfo.stats.failed}
                </div>
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
    const queueInfos = await RedisManager.getAllQueueInfo();
    return {
      props: {
        queueInfos,
      },
    };
  } catch (error) {
    console.error("Error fetching queue stats:", error);
    return {
      props: {
        queueInfos: [],
        error: "Failed to fetch queue statistics",
      },
    };
  }
};
