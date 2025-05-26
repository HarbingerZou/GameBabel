import type { NextApiRequest, NextApiResponse } from "next";
import { queueManager } from "../../lib/queue/QueueManager";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const queueNames = queueManager.getQueueNames();
    const queueStats = await Promise.all(
      queueNames.map(async (name) => {
        const stats = await queueManager.getQueueStats(name);
        return {
          name,
          stats,
        };
      })
    );

    return res.status(200).json(queueStats);
  } catch (error) {
    console.error("Error getting queues:", error);
    return res.status(500).json({
      error: "Failed to get queues",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
