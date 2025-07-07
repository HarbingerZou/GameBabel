import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { BatchedCrawlBase, SearchResponse } from "../../../common.type";
import { crawlContent } from "@/src/utils/content-crawling";

const CRAWLER_URL =
  process.env.NEXT_PUBLIC_CRAWLER_URL || "http://crawler:3000";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { keyword } = req.body;

    if (!keyword || typeof keyword !== "string") {
      return res.status(400).json({ error: "Keyword is required" });
    }

    // Call the crawler microservice's search API with keyword
    console.log(
      `Calling crawler microservice at: ${CRAWLER_URL}/bilibili/crawl/search`
    );
    console.log(`Searching for keyword: "${keyword}"`);

    const crawlerResponse = await axios.get(
      `${CRAWLER_URL}/bilibili/crawl/search`,
      {
        params: { keyword },
      }
    );

    if (crawlerResponse.status !== 200) {
      throw new Error(`Crawler API returned status ${crawlerResponse.status}`);
    }

    const searchResults: SearchResponse = crawlerResponse.data;

    // Process the search results and trigger article processing for each found article
    if (searchResults.articles && searchResults.articles.length > 0) {
      console.log(
        `Found ${searchResults.articles.length} articles for keyword: ${keyword}`
      );

      await processSearchedArticleLinks(
        searchResults.articles.map((article) => article.link)
      );

      return res.status(200).json({
        success: true,
        keyword,
        searchResults,
        message: `Found ${searchResults.articles.length} articles for keyword "${keyword}"`,
      });
    } else {
      return res.status(200).json({
        success: true,
        keyword,
        searchResults,
        message: `No articles found for keyword "${keyword}"`,
      });
    }
  } catch (error) {
    console.error("Error in search API:", error);

    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNREFUSED") {
        return res.status(503).json({
          error: "Crawler service is unavailable",
          details: "Unable to connect to crawler service",
        });
      }
      if (error.response) {
        return res.status(error.response.status).json({
          error: "Crawler API error",
          details: error.response.data,
        });
      }
    }

    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
async function processSearchedArticleLinks(links: string[]) {
  console.log("Processing searched article links", links);

  // Get the base URL for server-to-server API calls
  const baseUrl = `http://localhost:${process.env.PORT || 3000}`;
  links = links.slice(1, 2);
  for (const link of links) {
    try {
      const response = await fetch(`${baseUrl}/api/content-crawl/queue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: link, hasChainReaction: true }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add content to queue: ${response.status}`);
      }

      const result = await response.json();
      console.log(`Successfully queued job ${result.jobId} for URL: ${link}`);
    } catch (error) {
      console.error(`Failed to add content to queue for URL: ${link}`, error);
      throw new Error(
        `Failed to add content to queue for URL: ${link}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
