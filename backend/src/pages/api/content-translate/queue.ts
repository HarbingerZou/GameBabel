//This file is used to add a new content translation job to the content translation queue
//It is called when the user wants to translate an existing processed content
import { ContentTranslationQueue } from "@/src/queue_workers/contentTranslationQueue";
import { NextApiRequest, NextApiResponse } from "next";
import { translateContent } from "@/src/utils/content-translate";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { processedContentId, targetLanguage = "english" } = req.body;

      if (!processedContentId) {
        throw new Error("Processed content ID is required");
      }

      if (!targetLanguage) {
        throw new Error("Target language is required");
      }

      // Create the content translation queue
      const queue = await ContentTranslationQueue.createQueue(translateContent);

      // Add the job to the queue
      const job = await queue.addJob("translate-content", {
        processedContentId,
        targetLanguage,
      });

      return res.status(201).json({
        message: "Content translation job added to queue",
        jobId: job.id,
        processedContentId: processedContentId,
        targetLanguage: targetLanguage,
      });
    } catch (error) {
      console.error("Error adding content translation to queue:", error);
      return res.status(500).json({
        error: "Failed to add content translation to queue",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } else {
    return res.status(405).json({ message: "Method not allowed" });
  }
}
