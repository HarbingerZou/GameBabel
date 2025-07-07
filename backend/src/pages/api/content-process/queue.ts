//This file is used to add a new article processing job to the content processing queue
//It is called when the user wants to process an existing article
import { ContentProcessingQueue } from "@/src/queue_workers/contentProcessingQueue";
import { NextApiRequest, NextApiResponse } from "next";
import { processContent } from "@/src/utils/content-processing";
import { Language, ProcessedContent } from "@/src/common.type";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      console.log("Content-process queue request body:", req.body);
      const { articleId, hasChainReaction } = req.body;
      console.log("Extracted articleId:", articleId);
      console.log("ArticleId type:", typeof articleId);
      if (!articleId) {
        throw new Error("Article ID is required");
      }

      // Create the content processing queue
      const processContentFunction = processContentAugmented(hasChainReaction);
      const queue = await ContentProcessingQueue.createQueue(
        processContentFunction
      );

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

function processContentAugmented(
  hasChainReaction: boolean
): (articleId: string) => Promise<ProcessedContent> {
  if (!hasChainReaction) {
    return processContent;
  }
  async function processContentWithChainReaction(articleId: string) {
    const baseUrl = `http://localhost:${process.env.PORT || 3000}`;
    const processedContent: ProcessedContent = await processContent(articleId);
    const id = processedContent._id;
    const targeLanguageList: Language[] = ["english"];
    for (const targetLanguage of targeLanguageList) {
      const requestBody = { processedContentId: id, targetLanguage };
      const response = await fetch(`${baseUrl}/api/content-translate/queue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        throw new Error("Failed to add content to queue");
      }
    }
    return processedContent;
  }
  return processContentWithChainReaction;
}
