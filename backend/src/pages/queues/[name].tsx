import { GetServerSideProps } from "next";
import { useState } from "react";
import { useRouter } from "next/router";
import { RedisManager } from "../../queue_workers/RedisManager";
import { JobQueue, JobInfo, JobStats } from "../../queue_workers/JobQueue";

interface QueueDetailPageProps {
  queueName: string;
  stats: JobStats;
  jobs: JobInfo[];
  error?: string;
}

export default function QueueDetailPage({
  queueName,
  stats,
  jobs: initialJobs,
  error,
}: QueueDetailPageProps) {
  const router = useRouter();
  const [jobs] = useState<JobInfo[]>(initialJobs);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredJobs = jobs.filter((job) => {
    const matchesStatus =
      selectedStatus === "all" || job.status === selectedStatus;
    const matchesSearch =
      job.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-50";
      case "failed":
        return "text-red-600 bg-red-50";
      case "active":
        return "text-emerald-600 bg-emerald-50";
      case "waiting":
        return "text-yellow-600 bg-yellow-50";
      case "delayed":
        return "text-purple-600 bg-purple-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (duration: number | null) => {
    if (!duration) return "N/A";
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => router.back()}
            className="text-gray-700 hover:text-black mb-2 flex items-center"
          >
            ← Back to Queues
          </button>
          <h1 className="text-2xl font-bold">Queue: {queueName}</h1>
        </div>
      </div>

      {/* Queue Stats */}
      <div className="bg-white border rounded-lg p-4 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Queue Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div>
            <div className="font-medium text-gray-600">Total</div>
            <div className="text-lg font-semibold">{stats.total}</div>
          </div>
          <div>
            <div className="font-medium text-gray-600">Active</div>
            <div className="text-lg font-semibold text-emerald-600">
              {stats.active}
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-600">Waiting</div>
            <div className="text-lg font-semibold text-yellow-600">
              {stats.waiting}
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-600">Completed</div>
            <div className="text-lg font-semibold text-green-600">
              {stats.completed}
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-600">Failed</div>
            <div className="text-lg font-semibold text-red-600">
              {stats.failed}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-lg p-4 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Jobs
            </label>
            <input
              type="text"
              placeholder="Search by job ID or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status Filter
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="waiting">Waiting</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="delayed">Delayed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="bg-white border rounded-lg shadow-sm">
        <div className="px-4 py-3 border-b">
          <h2 className="text-lg font-semibold">
            Jobs ({filteredJobs.length})
          </h2>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No jobs found matching the current filters.
          </div>
        ) : (
          <div className="divide-y">
            {filteredJobs.map((job) => (
              <div key={job.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          job.status
                        )}`}
                      >
                        {job.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        ID: {job.id}
                      </span>
                    </div>

                    <h3 className="font-medium text-gray-900 mb-1">
                      {job.name}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Created:</span>{" "}
                        {formatTimestamp(job.timestamp)}
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span>{" "}
                        {formatDuration(job.duration)}
                      </div>
                      <div>
                        <span className="font-medium">Progress:</span>{" "}
                        {job.progress}%
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {job.status === "active" && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gray-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${job.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Job Data */}
                    {job.data && Object.keys(job.data).length > 0 && (
                      <div className="mt-3">
                        <details className="text-sm">
                          <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                            Job Data
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                            {JSON.stringify(job.data, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}

                    {/* Job Result */}
                    {job.result && (
                      <div className="mt-3">
                        <details className="text-sm">
                          <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                            Job Result
                          </summary>
                          <pre className="mt-2 p-2 bg-green-50 rounded text-xs overflow-x-auto">
                            {JSON.stringify(job.result, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}

                    {/* Job Error */}
                    {job.error && (
                      <div className="mt-3">
                        <details className="text-sm">
                          <summary className="cursor-pointer font-medium text-red-700 hover:text-red-900">
                            Error Details
                          </summary>
                          <pre className="mt-2 p-2 bg-red-50 rounded text-xs overflow-x-auto text-red-800">
                            {job.error}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<
  QueueDetailPageProps
> = async ({ params }) => {
  try {
    const queueName = params?.name as string;

    if (!queueName) {
      return {
        notFound: true,
      };
    }

    const queue = await RedisManager.getExistingQueue(queueName);

    if (!queue) {
      return {
        props: {
          queueName,
          stats: {
            total: 0,
            completed: 0,
            failed: 0,
            delayed: 0,
            active: 0,
            waiting: 0,
          },
          jobs: [],
          error: "Queue not found",
        },
      };
    }

    const [stats, jobs] = await Promise.all([
      queue.getStats(),
      queue.getAllJobs(),
    ]);

    return {
      props: {
        queueName,
        stats,
        jobs,
      },
    };
  } catch (error) {
    console.error("Error fetching queue details:", error);
    return {
      props: {
        queueName: (params?.name as string) || "",
        stats: {
          total: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
          active: 0,
          waiting: 0,
        },
        jobs: [],
        error: "Failed to fetch queue details",
      },
    };
  }
};
