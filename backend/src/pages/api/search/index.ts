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
    const { keyword, pageLimit } = req.body;

    if (!keyword || typeof keyword !== "string") {
      return res.status(400).json({ error: "Keyword is required" });
    }
    if (!pageLimit || typeof pageLimit !== "number") {
      return res.status(400).json({ error: "Page limit is required" });
    }

    // Call the crawler microservice's search API with keyword
    console.log(
      `Calling crawler microservice at: ${CRAWLER_URL}/bilibili/crawl/search`
    );
    console.log(`Searching for keyword: "${keyword}"`);

    const crawlerResponse = await axios.get(
      `${CRAWLER_URL}/bilibili/crawl/search`,
      {
        params: { keyword, limit: pageLimit },
      }
    );

    if (crawlerResponse.status !== 200) {
      throw new Error(`Crawler API returned status ${crawlerResponse.status}`);
    }

    const searchResults: SearchResponse = crawlerResponse.data;

    // Process the search results and trigger article processing for each found article
    if (searchResults.results && searchResults.results.length > 0) {
      console.log(
        `Found ${searchResults.results.length} pages for keyword: ${keyword}`
      );
      for (const result of searchResults.results) {
        if (result.articles && result.articles.length > 0) {
          console.log(
            `Found ${result.articles.length} articles for page ${result.searchUrl}`
          );
        } else {
          console.log(`No articles found for page ${result.searchUrl}`);
        }

        await processSearchedArticleLinks(
          result.articles.map((article) => article.link)
        );
      }

      return res.status(200).json({
        success: true,
        keyword,
        searchResults,
        message: `Found ${searchResults.results.length} pages for keyword "${keyword}"`,
      });
    } else {
      return res.status(200).json({
        success: true,
        keyword,
        searchResults,
        message: `No pages found for keyword "${keyword}"`,
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
  links = links.slice(0, 20);
  for (const link of links) {
    try {
      const response = await fetch(`${baseUrl}/api/content-crawl/queue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: link,
          hasChainReaction: true,
          crawledType: "search_auto",
        }),
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
