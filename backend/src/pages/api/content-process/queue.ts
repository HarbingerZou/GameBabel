//This file is used to add a new article processing job to the content processing queue
//It is called when the user wants to process an existing article
import { ContentProcessingQueue } from "@/src/queue_workers/contentProcessingQueue";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { articleId } = req.body;
      if (!articleId) {
        throw new Error("Article ID is required");
      }

      // Create the content processing queue
      const queue = await ContentProcessingQueue.createQueue();

      // Add the job to the queue
      const job = await queue.addJob("process-content", {
        articleId,
      });

      return res.status(201).json({
        message: "Content processing job added to queue",
        jobId: job.id,
        articleId: articleId,
      });
    } catch (error) {
      console.error("Error adding content processing to queue:", error);
      return res.status(500).json({
        error: "Failed to add content processing to queue",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } else {
    return res.status(405).json({ message: "Method not allowed" });
  }
}
