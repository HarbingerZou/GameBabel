//This file is used to add a new article URL to the content crawling queue
//It is called when the user submits a new URL in the frontend
import { ContentCrawlingQueue } from "@/src/queue_workers/contentCrawlingQueue";
import { NextApiRequest, NextApiResponse } from "next";
import { crawlContent } from "@/src/utils/content-crawling";
import { Article } from "@/src/common.type";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { url, hasChainReaction } = req.body;
      if (!url) {
        throw new Error("URL is required");
      }

      const crawlContentFunction = crawlContentAugmented(hasChainReaction);
      // Create the content crawling queue
      const queue = await ContentCrawlingQueue.createQueue(
        crawlContentFunction
      );

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

function crawlContentAugmented(
  hasChainReaction: boolean
): (url: string) => Promise<Article> {
  if (!hasChainReaction) {
    return crawlContent;
  }
  async function crawlContentWithChainReaction(url: string) {
    const baseUrl = `http://localhost:${process.env.PORT || 3000}`;
    const article: Article = await crawlContent(url);
    const id = article._id;
    const response = await fetch(`${baseUrl}/api/content-process/queue`, {
      method: "POST",
      body: JSON.stringify({ articleId: id, hasChainReaction: true }),
    });
    if (!response.ok) {
      throw new Error("Failed to add content to queue");
    }
    return article;
  }
  return crawlContentWithChainReaction;
}
