//This file is used to add a new article URL to the content crawling queue
//It is called when the user submits a new URL in the frontend
import { ContentCrawlingQueue } from "@/src/queue_workers/contentCrawlingQueue";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { url } = req.body;
      if (!url) {
        throw new Error("URL is required");
      }

      // Create the content crawling queue
      const queue = await ContentCrawlingQueue.createQueue();

      // Add the job to the queue
      const job = await queue.addJob("crawl-content", {
        url,
      });

      return res.status(201).json({
        message: "Content crawling job added to queue",
        jobId: job.id,
        url: url,
      });
    } catch (error) {
      console.error("Error adding content to queue:", error);
      return res.status(500).json({
        error: "Failed to add content to queue",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } else {
    return res.status(405).json({ message: "Method not allowed" });
  }
}
