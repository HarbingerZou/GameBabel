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

    return res.status(200).json(queueNames);
  } catch (error) {
    console.error("Error getting queues:", error);
    return res.status(500).json({
      error: "Failed to get queues",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
