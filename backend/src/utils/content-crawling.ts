import axios from "axios";
import { Article, CrawledContent } from "../common.type";

const DATA_PERSISTENCE_URL =
  process.env.NEXT_PUBLIC_DATA_PERSISTENCE_URL ||
  "http://data-persistence:3000";
const CRAWLER_URL =
  process.env.NEXT_PUBLIC_CRAWLER_URL || "http://crawler:3000";
export const crawlContent = async (
  url: string,
  crawledType: string = "manual"
): Promise<Article | null> => {
  const shouldReject = await shouldRejectCrawlingContent(url);
  if (shouldReject) {
    return null;
  }
  const crawledContent = await crawl(url);
  // Transform the crawled content to match the data persistence model
  const storedContent = await storeContent(crawledContent, crawledType);
  return storedContent;
};

async function crawl(url: string): Promise<CrawledContent> {
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
  const crawledContent: CrawledContent = crawlerResult.content;
  if (!crawledContent) {
    throw new Error("No content found in crawler response");
  }
  return crawledContent;
}

async function shouldRejectCrawlingContent(url: string): Promise<boolean> {
  const existenceResponse = await axios.get(
    `${DATA_PERSISTENCE_URL}/api/content/by-url?url=${url}`
  );
  const existence = existenceResponse.data;
  if (existence.exists) {
    console.log("Content already exists for this URL");
    return true;
  }
  return false;
}

async function storeContent(
  crawledContent: CrawledContent,
  crawledType: string
): Promise<Article> {
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
      crawledType: crawledType,
      wordCount: crawledContent.metadata.wordCount,
      hasImages: crawledContent.metadata.hasImages,
      originalPubTime: crawledContent.metadata.originalPubTime
        ? new Date(crawledContent.metadata.originalPubTime)
        : null,
    },
  };

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

  const storedContent: Article = await storeResponse.json();
  return storedContent;
}
