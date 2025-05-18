import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import type { OCRResult, OCRResultData } from "../../common.type";
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
    const { articleId } = req.body;

    if (!articleId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

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
        return res.status(404).json({ message: "Article not found" });
      }
      const errorText = await articleResponse.text();
      console.error("Error response:", errorText);
      throw new Error(
        `Failed to fetch article: ${articleResponse.status} ${errorText}`
      );
    }
    const article = await articleResponse.json();

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

        let text: OCRResultData[] = ocrResult.data;
        if (text.length === 0) {
          console.log(`Skipping image ${imageUrl} due to empty OCR result`);
          continue;
        }

        ocrResults.push({
          imageUrl,
          text,
        });
        console.log(`Processed image: ${imageUrl}, index: ${index}`);
      } catch (error) {
        console.error(`Failed to process image ${imageUrl}:`, error);
      }
    }

    console.log("All images processed");
    console.log("OCR Results:", ocrResults);

    // Combine OCR results with original HTML
    const combineResponse = await axios.post(
      `${DS_SERVICE_URL}/combine-ocr-html`,
      {
        originalHtml: article.content,
        ocrResults,
      }
    );

    const combinedHtml = combineResponse.data.combinedHtml;
    console.log("Combined HTML length:", combinedHtml.length);

    // Translate the combined content
    const translateResponse = await axios.post(
      `${DS_SERVICE_URL}/translate-html`,
      {
        htmlContent: combinedHtml,
      }
    );

    const translatedHtml = translateResponse.data.translatedHtml;
    console.log("Translated HTML length:", translatedHtml.length);
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
