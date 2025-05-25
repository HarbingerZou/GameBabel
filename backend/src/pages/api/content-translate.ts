import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import type { Language } from "../../common.type";

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

    // Get the processed content
    const processedContent = await getProcessedContent(articleId);
    if (!processedContent) {
      return res.status(404).json({ error: "Processed content not found" });
    }

    // Translate the processed content
    const translatedHtml = await getTranslatedHtml(
      processedContent.content,
      targetLanguage
    );

    // Store the translation
    await storeTranslation(
      processedContent._id,
      targetLanguage,
      translatedHtml
    );

    // Return the translated content
    return res.status(200).json({
      translatedHtml,
    });
  } catch (error) {
    console.error("Error translating content:", error);
    return res.status(500).json({
      error: "Failed to translate content",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

async function getProcessedContent(contentId: string) {
  try {
    const response = await axios.get(
      `${DATA_PERSISTENCE_URL}/api/processed-content/${contentId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching processed content:", error);
    throw error;
  }
}

async function getTranslatedHtml(
  html: string,
  language: Language
): Promise<string> {
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
  processedContentId: string,
  targetLanguage: string,
  translatedContent: string
): Promise<void> {
  try {
    const response = await axios.post(
      `${DATA_PERSISTENCE_URL}/api/translations/${processedContentId}`,
      {
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
