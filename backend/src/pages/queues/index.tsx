import { GetServerSideProps } from "next";
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
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
  const router = useRouter();
  const [isTriggering, setIsTriggering] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearResult, setClearResult] = useState<{
    success: boolean;
    message: string;
    cleared?: string[];
    errors?: string[];
  } | null>(null);
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

  const handleClearAllQueues = async () => {
    if (
      !confirm(
        "This will permanently remove all jobs from all queues in Redis. Continue?"
      )
    ) {
      return;
    }
    setIsClearing(true);
    setClearResult(null);
    try {
      const response = await fetch("/api/queues/clear-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.json();
      if (response.ok) {
        setClearResult({
          success: true,
          message: result.message,
          cleared: result.cleared,
          errors: result.errors,
        });
        router.replace(router.asPath);
      } else {
        setClearResult({
          success: false,
          message: result.error || "Failed to clear queues",
        });
      }
    } catch (err) {
      setClearResult({
        success: false,
        message: "Network error occurred",
      });
    } finally {
      setIsClearing(false);
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
        <div className="flex gap-2">
          <button
            onClick={handleClearAllQueues}
            disabled={isClearing}
            className="px-4 py-2 rounded-lg font-medium transition-colors bg-red-900 text-white hover:bg-red-800 disabled:opacity-50"
          >
            {isClearing ? "Clearing..." : "Clear All Queues"}
          </button>
          <button
            onClick={handleTriggerTest}
            disabled={isTriggering}
            className="px-4 py-2 rounded-lg font-medium transition-colors bg-blue-900 text-white hover:bg-blue-800 disabled:opacity-50"
          >
            {isTriggering ? "Triggering..." : "Trigger Test Processing"}
          </button>
        </div>
      </div>

      {clearResult && (
        <div
          className={`mb-4 p-4 rounded-lg border ${
            clearResult.success
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="font-medium">
            {clearResult.success ? "Queues cleared" : "Error"}
          </div>
          <div className="text-sm mt-1">{clearResult.message}</div>
          {clearResult.cleared?.length ? (
            <div className="text-sm mt-1">
              Cleared: {clearResult.cleared.join(", ")}
            </div>
          ) : null}
          {clearResult.errors?.length ? (
            <ul className="text-sm mt-1 list-disc list-inside">
              {clearResult.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

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
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-semibold">{queueInfo.name}</h2>
              <Link
                href={`/queues/${queueInfo.name}`}
                className="px-3 py-1 text-sm bg-gray-700 text-white rounded hover:bg-gray-800 transition-colors"
              >
                View Jobs
              </Link>
            </div>
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
