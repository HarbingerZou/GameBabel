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
      const {
        url,
        hasChainReaction,
        crawledType,
      }: {
        url: string;
        hasChainReaction: boolean;
        crawledType: string | undefined;
      } = req.body;
      if (!url) {
        throw new Error("URL is required");
      }

      const crawlContentFunction = crawlContentAugmented(hasChainReaction);
      const queueNameAffix = hasChainReaction ? "chain-reaction" : "";
      // Create the content crawling queue
      const queue = await ContentCrawlingQueue.createQueue(
        crawlContentFunction,
        queueNameAffix
      );

      // Add the job to the queue
      const job = await queue.addJob("crawl-content", {
        url,
        crawledType,
      });

      return res.status(201).json({
        message: "Content crawling job added to queue",
        jobId: job.id,
        url: url,
      });
    } catch (error) {
      console.error("Error processing content in queue:", error);
      return res.status(500).json({
        error: "Failed to process content in queue",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } else {
    return res.status(405).json({ message: "Method not allowed" });
  }
}

function crawlContentAugmented(
  hasChainReaction: boolean
): (url: string, crawledType?: string) => Promise<Article | null> {
  if (!hasChainReaction) {
    return crawlContent;
  }
  async function crawlContentWithChainReaction(
    url: string,
    crawledType?: string
  ) {
    const baseUrl = `http://localhost:${process.env.PORT || 3000}`;
    const article: Article | null = await crawlContent(url, crawledType);
    if (article === null) {
      return null;
    }
    const id = article._id;
    const requestBody = { articleId: id, hasChainReaction: true };
    const response = await fetch(`${baseUrl}/api/content-process/queue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      throw new Error("Failed to add content to queue");
    }
    return article;
  }
  return crawlContentWithChainReaction;
}
