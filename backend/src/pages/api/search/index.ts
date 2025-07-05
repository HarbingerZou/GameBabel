import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

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

    const searchResults = crawlerResponse.data;

    // Process the search results and trigger article processing for each found article
    if (searchResults.articles && searchResults.articles.length > 0) {
      console.log(
        `Found ${searchResults.articles.length} articles for keyword: ${keyword}`
      );

      // For now, we'll return the search results
      // In the future, you might want to trigger processing for each article
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
