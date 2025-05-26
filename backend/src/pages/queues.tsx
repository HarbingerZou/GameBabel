import { useEffect, useState } from "react";
import axios from "axios";

interface QueueStats {
  total: number;
  completed: number;
  failed: number;
  delayed: number;
  active: number;
  waiting: number;
}

interface QueueInfo {
  name: string;
  stats: QueueStats;
}

export default function QueuesPage() {
  const [queues, setQueues] = useState<QueueInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQueues = async () => {
      try {
        const response = await axios.get("/api/queues");
        setQueues(response.data);
        setError(null);
      } catch (err) {
        setError("Failed to fetch queues");
        console.error("Error fetching queues:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQueues();
    // Refresh every 5 seconds
    const interval = setInterval(fetchQueues, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="p-4">Loading queues...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
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
