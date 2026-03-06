import { NextApiRequest, NextApiResponse } from "next";
import { RedisManager } from "../../../queue_workers/RedisManager";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { cleared, errors } = await RedisManager.clearAllQueues();

    if (errors.length > 0) {
      return res.status(207).json({
        success: true,
        message: `Cleared ${cleared.length} queue(s). Some errors occurred.`,
        cleared,
        errors,
      });
    }

    res.status(200).json({
      success: true,
      message:
        cleared.length > 0
          ? `Cleared ${cleared.length} queue(s): ${cleared.join(", ")}`
          : "No queues to clear",
      cleared,
    });
  } catch (error) {
    console.error("Error clearing queues:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to clear queues",
    });
  }
}
