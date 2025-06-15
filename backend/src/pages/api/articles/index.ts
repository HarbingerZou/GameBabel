//This file is used to create a new article through the crawler service
//It is called when the user submits a new URL in the frontend
import { NextApiRequest, NextApiResponse } from "next";
const DATA_PERSISTENCE_URL =
  process.env.NEXT_PUBLIC_DATA_PERSISTENCE_URL ||
  "http://data-persistence:3000";
const CRAWLER_URL =
  process.env.NEXT_PUBLIC_CRAWLER_URL || "http://crawler:3000";

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

      console.log("Calling crawler service with URL:", url);
      // First, call the crawler service
      const crawlerResponse = await fetch(
        `${CRAWLER_URL}/bilibili/crawl/article?url=${url}`
      );

      if (!crawlerResponse.ok) {
        const contentType = crawlerResponse.headers.get("content-type");
        console.error("Crawler service error:", {
          status: crawlerResponse.status,
          statusText: crawlerResponse.statusText,
          contentType,
        });

        let errorMessage = "Failed to crawl content";
        try {
          const errorText = await crawlerResponse.text();
          console.error("Crawler service error response:", errorText);
          errorMessage = `Crawler service error: ${errorText}`;
        } catch (e) {
          console.error("Failed to read crawler error response:", e);
        }

        throw new Error(errorMessage);
      }

      const crawlerResult = await crawlerResponse.json();

      // Extract the content from the nested structure
      const crawledContent = crawlerResult.content;
      if (!crawledContent) {
        throw new Error("No content found in crawler response");
      }

      // Transform the crawled content to match the data persistence model
      const contentToStore = {
        title: crawledContent.title,
        author: crawledContent.author,
        url: crawledContent.url,
        content: crawledContent.content,
        source: crawledContent.source,
        language: crawledContent.language,
        status: crawledContent.status,
        metadata: {
          crawledAt: new Date(crawledContent.metadata.crawledAt),
          crawledType: "manual",
          wordCount: crawledContent.metadata.wordCount,
          hasImages: crawledContent.metadata.hasImages,
          originalPubTime: crawledContent.metadata.originalPubTime
            ? new Date(crawledContent.metadata.originalPubTime)
            : null,
        },
      };

      console.log("Content to store:", JSON.stringify(contentToStore, null, 2));

      // Store the crawled content in data-persistence
      const storeResponse = await fetch(`${DATA_PERSISTENCE_URL}/api/content`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contentToStore),
      });

      if (!storeResponse.ok) {
        const error = await storeResponse.json();
        throw new Error(error.error || "Failed to store content");
      }

      const storedContent = await storeResponse.json();
      return res.status(201).json(storedContent);
    } catch (error) {
      console.error("Error creating content:", error);
      return res.status(500).json({
        error: "Failed to create content",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } else {
    return res.status(405).json({ message: "Method not allowed" });
  }
}
