import type { NextApiRequest, NextApiResponse } from "next";
import { translateContent } from "@/src/utils/content-translate";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { processedContentId, targetLanguage = "english" } = req.body;

    if (!processedContentId) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const translationResponse = await translateContent(
      processedContentId,
      targetLanguage
    );
    // Return the translated content
    return res.status(200).json(translationResponse);
  } catch (error) {
    console.error("Error translating content:", error);
    return res.status(500).json({
      error: "Failed to translate content",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
