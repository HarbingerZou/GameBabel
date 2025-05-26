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
    const { jobId, queueName } = req.query;

    if (!jobId || !queueName) {
      return res.status(400).json({
        error: "Missing required parameters",
        details: "Both jobId and queueName are required",
      });
    }

    const jobInfo = await queueManager.getJobInfo(
      queueName as string,
      jobId as string
    );

    if (!jobInfo) {
      return res.status(404).json({
        error: "Job not found",
        details: `No job found with ID ${jobId} in queue ${queueName}`,
      });
    }

    return res.status(200).json(jobInfo);
  } catch (error) {
    console.error("Error getting job status:", error);
    return res.status(500).json({
      error: "Failed to get job status",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
