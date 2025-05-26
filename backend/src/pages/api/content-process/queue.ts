import type { NextApiRequest, NextApiResponse } from "next";
import { contentProcessingQueue } from "../../../lib/queue/contentProcessingQueue";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { articleId } = req.body;
    console.log("articleId", articleId);

    if (!articleId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Add the job to the queue
    const job = await contentProcessingQueue.addJob("process-content", {
      articleId,
    });

    // Return the job information
    return res.status(200).json({
      success: true,
      jobId: job.id,
      message: "Content processing job added to queue",
    });
  } catch (error) {
    console.error("Error adding content processing job:", error);
    return res.status(500).json({
      error: "Failed to add content processing job",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
