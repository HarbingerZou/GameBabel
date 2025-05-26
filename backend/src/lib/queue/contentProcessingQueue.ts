import { queueManager } from "./QueueManager";
import { JobData, JobResult } from "./JobQueue";
import axios from "axios";
import type { Article, OCRResult, OCRResultData } from "../../common.type";
import { extractImageUrls } from "../../utils/image_processing";

const OCR_SERVICE_URL =
  process.env.NEXT_PUBLIC_OCR_URL || "http://localhost:8001";
const DS_SERVICE_URL =
  process.env.NEXT_PUBLIC_DS_URL || "http://localhost:3001";
const DATA_PERSISTENCE_URL =
  process.env.NEXT_PUBLIC_DATA_PERSISTENCE_URL ||
  "http://data-persistence:3000";

export interface ContentProcessingData extends JobData {
  articleId: string;
}

export interface ContentProcessingResult extends JobResult {
  processedContent: string;
  articleId: string;
}

// Helper functions
async function getArticle(articleId: string): Promise<Article> {
  const response = await fetch(
    `${DATA_PERSISTENCE_URL}/api/content/${articleId}`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch article: ${response.statusText}`);
  }
  return response.json();
}

async function processImages(
  articleId: string,
  imageUrls: string[]
): Promise<{ imageUrl: string; data: OCRResultData[] }[]> {
  const results = [];
  for (const imageUrl of imageUrls) {
    try {
      const response = await axios.post<OCRResult>(
        `${OCR_SERVICE_URL}/api/ocr`,
        {
          articleId,
          imageUrl,
        }
      );
      results.push({
        imageUrl,
        data: response.data.data,
      });
    } catch (error) {
      console.error(`Failed to process image ${imageUrl}:`, error);
    }
  }
  console.log(results);
  return results;
}

async function combineResults(
  ocrResults: { imageUrl: string; data: OCRResultData[] }[],
  originalHtml: string
): Promise<string> {
  const response = await axios.post(`${DS_SERVICE_URL}/combine-ocr-html`, {
    originalHtml,
    ocrResults,
  });
  return response.data.combinedHtml;
}

async function storeProcessedContent(
  contentId: string,
  processedContent: string,
  language: string
): Promise<void> {
  const article = await getArticle(contentId);
  await axios.post(
    `${DATA_PERSISTENCE_URL}/api/processed-content/${contentId}`,
    {
      title: article.title,
      author: article.author,
      url: article.url,
      content: processedContent,
      language,
      source: article.source,
      status: "pending",
      metadata: {
        processedAt: new Date(),
        wordCount: processedContent.split(/\s+/).length,
        processingVersion: 1,
      },
    }
  );
}

// Initialize the content processing queue
export const contentProcessingQueue = queueManager.getQueue<
  ContentProcessingData,
  ContentProcessingResult
>("content-processing", async (data, updateProgress) => {
  const { articleId } = data;

  // Get article
  await updateProgress(10);
  const article = await getArticle(articleId);
  console.log("article");
  // Extract and process images
  await updateProgress(20);
  const imageUrls = extractImageUrls(article.content);
  const absoluteImageUrls = imageUrls.map((url: string) =>
    url.startsWith("//") ? `https:${url}` : url
  );

  // Process images
  await updateProgress(30);
  const ocrResults = await processImages(articleId, absoluteImageUrls);

  // Combine results
  await updateProgress(60);
  const processedContent = await combineResults(ocrResults, article.content);

  // Store results
  await updateProgress(80);

  await storeProcessedContent(articleId, processedContent, article.language);

  await updateProgress(100);
  return {
    processedContent,
    articleId,
  };
});
