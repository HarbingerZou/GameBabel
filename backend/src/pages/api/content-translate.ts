import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import type {
  Article,
  Language,
  OCRResult,
  OCRResultData,
} from "../../common.type";
import { extractImageUrls } from "../../utils/image_processing";

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
    const { articleId, targetLanguage = "English" } = req.body;

    if (!articleId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const article = await getArticle(articleId);
    const imageUrls: string[] = extractImageUrls(article.content);
    console.log("Found image URLs:", imageUrls);

    // Convert relative URL to absolute URL if needed
    const absoluteImageUrls = imageUrls.map((imageUrl: string) =>
      imageUrl.startsWith("//") ? `https:${imageUrl}` : imageUrl
    );
    console.log("Absolute image URLs:", absoluteImageUrls);

    // Process images sequentially
    const ocrResults = [];
    for (let index = 0; index < absoluteImageUrls.length; index++) {
      const imageUrl = absoluteImageUrls[index];
      try {
        console.log(`Processing image: ${imageUrl}, index: ${index}`);

        const data = await getOcrResults(articleId, imageUrl);
        if (data === null) {
          continue;
        }
        ocrResults.push({
          imageUrl,
          data,
        });
        console.log(`Processed image: ${imageUrl}, index: ${index}`);
      } catch (error) {
        console.error(`Failed to process image ${imageUrl}:`, error);
      }
    }

    const combinedHtml =
      ocrResults.length > 0
        ? await getCombinedHtml(ocrResults, article.content)
        : article.content;

    const translatedHtml = await getTranslatedHtml(
      combinedHtml,
      targetLanguage
    );

    // Store the translation in the database
    await storeTranslation(articleId, targetLanguage, translatedHtml);

    // Return the translated content
    return res.status(200).json({
      translatedHtml: translatedHtml,
    });
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
): Promise<OCRResultData[] | null> {
  console.log("start get ocr results");
  // 1. Get OCR result from OCR service
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
  if (data.length === 0) {
    console.log(`Skipping image ${imageUrl} due to empty OCR result`);
    return null;
  }
  return data;
}
async function getCombinedHtml(
  ocrResults: { imageUrl: string; data: OCRResultData[] }[],
  originalHtml: string
): Promise<string> {
  console.log("start combine ocr html");
  // Combine OCR results with original HTML
  let combineResponse: any = await axios.post(
    `${DS_SERVICE_URL}/combine-ocr-html`,
    {
      originalHtml: originalHtml,
      ocrResults: ocrResults,
    }
  );

  const combinedHtml = combineResponse.data.combinedHtml;
  console.log("Combined HTML length:", combinedHtml.length);
  return combinedHtml;
}

async function getTranslatedHtml(
  html: string,
  language: Language
): Promise<string> {
  // Translate the combined content
  console.log("start translate html");
  const translateResponse = await axios.post(
    `${DS_SERVICE_URL}/translate-html`,
    {
      htmlContent: html,
      language: language,
    }
  );

  const translatedHtml = translateResponse.data.translatedHtml;
  console.log("Translated HTML length:", translatedHtml.length);
  return translatedHtml;
}

async function storeTranslation(
  contentId: string,
  targetLanguage: string,
  translatedContent: string
): Promise<void> {
  try {
    const response = await axios.post(
      `${DATA_PERSISTENCE_URL}/api/content/${contentId}/translations`,
      {
        contentId,
        targetLanguage,
        translatedContent,
        status: "pending",
        metadata: {
          translatedAt: new Date(),
          translationProvider: "DeepSeek",
        },
      }
    );

    if (response.status !== 201) {
      throw new Error(`Failed to store translation: ${response.statusText}`);
    }

    console.log("Translation stored successfully");
  } catch (error) {
    console.error("Error storing translation:", error);
    throw error;
  }
}
