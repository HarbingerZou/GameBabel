import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import type { OCRResult } from "../../common.type";

const OCR_SERVICE_URL =
  process.env.NEXT_PUBLIC_OCR_URL || "http://localhost:3000";
const DS_SERVICE_URL =
  process.env.NEXT_PUBLIC_DS_URL || "http://localhost:3001";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { articleId, imageUrl, parseWithDS = false } = req.body;

    if (!articleId || !imageUrl) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Convert relative URL to absolute URL if needed
    const absoluteImageUrl = imageUrl.startsWith("//")
      ? `https:${imageUrl}`
      : imageUrl;

    // Get OCR result from OCR service
    const ocrResponse = await axios.post<OCRResult>(
      `${OCR_SERVICE_URL}/api/ocr`,
      {
        articleId,
        imageUrl: absoluteImageUrl,
      }
    );
    const ocrResult: OCRResult = ocrResponse.data;

    // If parseWithDS is true, send to DS service for structured parsing
    if (parseWithDS) {
      const dsResponse = await axios.post(`${DS_SERVICE_URL}/transform-ocr`, {
        ocrResult: ocrResult.data,
      });
      console.log("dsResponse", dsResponse);
      return res.status(200).json({
        ...ocrResult,
        structuredHtml: dsResponse.data.styledHtml,
      });
    }

    // Return just the OCR result if no DS parsing requested
    return res.status(200).json(ocrResult);
  } catch (error) {
    return res.status(500).json({ error: "Failed to process image OCR" });
  }
}
