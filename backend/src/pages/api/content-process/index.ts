import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import type { Article, OCRResult, OCRResultData } from "../../../common.type";
import { extractImageUrls } from "../../../utils/image_processing";

const OCR_SERVICE_URL =
  process.env.NEXT_PUBLIC_OCR_URL || "http://localhost:8001";
const DS_SERVICE_URL =
  process.env.NEXT_PUBLIC_DS_URL || "http://localhost:3001";
const DATA_PERSISTENCE_URL =
  process.env.NEXT_PUBLIC_DATA_PERSISTENCE_URL ||
  "http://data-persistence:3000";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { articleId }: { articleId: string } = req.body;

    if (!articleId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const article: Article = await getArticle(articleId);
    const imageUrls: string[] = extractImageUrls(article.content);
    console.log("Found image URLs:", imageUrls);

    // Convert relative URL to absolute URL if needed
    const absoluteImageUrls = imageUrls.map((imageUrl: string) =>
      imageUrl.startsWith("//") ? `https:${imageUrl}` : imageUrl
    );
    console.log("Absolute image URLs:", absoluteImageUrls);

    // Process images sequentially
    const ocrResults: { imageUrl: string; data: OCRResultData[] }[] = [];
    console.log("start get ocr results");
    for (let index = 0; index < absoluteImageUrls.length; index++) {
      const imageUrl = absoluteImageUrls[index];
      try {
        console.log(`Processing image: ${imageUrl}, index: ${index}`);

        const data = await getOcrResults(articleId, imageUrl);
        ocrResults.push({
          imageUrl,
          data,
        });
        console.log(`Processed image: ${imageUrl}, index: ${index}`);
      } catch (error) {
        console.error(`Failed to process image ${imageUrl}:`, error);
      }
    }

    const noTextInPicture = ocrResults.every(
      (ocrResult) => ocrResult.data.length === 0
    );

    let processedContent = null;
    if (noTextInPicture) {
      processedContent = article.content;
    } else {
      processedContent = await getCombinedHtml(ocrResults, article.content);
    }

    const polishedContent = await getPolishedContent(processedContent);

    const topicOptions = await getTopicNames();
    const { summary, topic, isHighQuality } = await getSummary(
      polishedContent,
      topicOptions
    );
    await storeProcessedContent(
      article,
      polishedContent,
      article.language,
      summary,
      topic,
      isHighQuality
    );

    // Return the processed content
    const processedContentResponse = await getProcessedContent(articleId);
    return res.status(200).json(processedContentResponse);
  } catch (error) {
    console.error("Error processing content:", error);
    return res.status(500).json({
      error: "Failed to process content",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

async function getArticle(articleId: string): Promise<Article> {
  const articleResponse = await fetch(
    `${DATA_PERSISTENCE_URL}/api/content/${articleId}`,
    {
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!articleResponse.ok) {
    if (articleResponse.status === 404) {
      throw new Error("Article not found");
    }
    const errorText = await articleResponse.text();
    console.error("Error response:", errorText);
    throw new Error(
      `Failed to fetch article: ${articleResponse.status} ${errorText}`
    );
  }
  const article = await articleResponse.json();
  return article;
}

async function getOcrResults(
  articleId: string,
  imageUrl: string
): Promise<OCRResultData[]> {
  const ocrResponse = await axios.post<OCRResult>(
    `${OCR_SERVICE_URL}/api/ocr`,
    {
      articleId,
      imageUrl: imageUrl,
    }
  );
  const ocrResult: OCRResult = ocrResponse.data;
  console.log(`OCR result for ${imageUrl}:`, ocrResult);

  let data: OCRResultData[] = ocrResult.data;
  /*if (data.length === 0) {
    console.log(`Skipping image ${imageUrl} due to empty OCR result`);
    return null;
  }*/
  return data;
}

async function getCombinedHtml(
  ocrResults: { imageUrl: string; data: OCRResultData[] }[],
  originalHtml: string
): Promise<string> {
  console.log("start combine ocr html");
  const trimmedOcrResults = ocrResults.map((ocrResult) => {
    return {
      imageUrl: ocrResult.imageUrl,
      data: ocrResult.data.map((data) => {
        return {
          boundingBox: data.boundingBox,
          text: data.text,
        };
      }),
    };
  });
  let combineResponse: any = await axios.post(
    `${DS_SERVICE_URL}/combine-ocr-html`,
    {
      originalHtml: originalHtml,
      ocrResults: trimmedOcrResults,
    }
  );

  const combinedHtml = combineResponse.data.combinedHtml;
  console.log("Combined HTML length:", combinedHtml.length);
  return combinedHtml;
}

async function getPolishedContent(content: string): Promise<string> {
  console.log("start get polished content");
  const polishedContentResponse = await axios.post(`${DS_SERVICE_URL}/polish`, {
    content,
  });
  console.log("polishedContentResponse", polishedContentResponse.data);
  return polishedContentResponse.data.content;
}

async function getTopicNames(): Promise<string[]> {
  console.log("start get topic names");
  const topicsResponse = await axios.get(
    `${DATA_PERSISTENCE_URL}/api/topic/names`
  );
  return topicsResponse.data.map((topic: any) => topic.name);
}

async function getSummary(
  content: string,
  topicOptions: string[]
): Promise<{ isHighQuality: boolean; summary: string; topic: string }> {
  console.log("start get summary");
  const summaryResponse = await axios.post(`${DS_SERVICE_URL}/summarize`, {
    content,
    topicOptions,
  });
  console.log("summaryResponse", summaryResponse.data);
  return {
    isHighQuality: summaryResponse.data.isHighQuality,
    summary: summaryResponse.data.summary,
    topic: summaryResponse.data.topic,
  };
}

async function storeProcessedContent(
  article: Article,
  processedContent: string,
  language: string,
  summary: string,
  topic: string,
  isHighQuality: boolean
): Promise<void> {
  try {
    console.log("start store processed content");
    // Get the original article to get required fields

    const response = await axios.post(
      `${DATA_PERSISTENCE_URL}/api/processed-content/${article._id}`,
      {
        title: article.title,
        author: article.author,
        url: article.url,
        summary: summary,
        content: processedContent,
        language: language,
        source: article.source,
        status: "pending",
        metadata: {
          isHighQuality: isHighQuality,
          topic: topic,
          crawledType: article.metadata.crawledType,
          processedAt: new Date(),
          wordCount: processedContent.split(/\s+/).length,
          processingVersion: 1,
        },
      }
    );

    if (response.status !== 201) {
      throw new Error(
        `Failed to store processed content: ${response.statusText}`
      );
    }

    console.log("Processed content stored successfully");
  } catch (error) {
    console.error("Error storing processed content:", error);
    throw error;
  }
}

async function getProcessedContent(articleId: string) {
  const response = await axios.get(
    `${DATA_PERSISTENCE_URL}/api/processed-content/${articleId}`
  );
  return response.data;
}
