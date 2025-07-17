import axios from "axios";
import type { Language, ProcessedContent, Translation } from "../common.type";

const DS_SERVICE_URL =
  process.env.NEXT_PUBLIC_DS_URL || "http://localhost:3001";
const DATA_PERSISTENCE_URL =
  process.env.NEXT_PUBLIC_DATA_PERSISTENCE_URL ||
  "http://data-persistence:3000";

export const translateContent = async (
  processedContentId: string,
  targetLanguage: Language
): Promise<Translation | null> => {
  // Get the processed content
  const processedContent = await getProcessedContent(processedContentId);
  if (!processedContent) {
    throw new Error("Processed content not found");
  }
  const shouldReject = await shouldRejectTranslation(
    processedContent,
    targetLanguage
  );
  if (shouldReject) {
    return null;
  }
  // Translate the processed content
  const { translatedContent, translatedTitle, translatedSummary } =
    await getTranslatedHtml(
      processedContent.content,
      targetLanguage,
      processedContent.title,
      processedContent.summary
    );

  // Store the translation
  const translationResponse: Translation = await storeTranslation(
    processedContent,
    targetLanguage,
    translatedContent,
    translatedTitle,
    translatedSummary
  );

  return translationResponse;
};

async function shouldRejectTranslation(
  processedContent: ProcessedContent,
  targetLanguage: Language
): Promise<boolean> {
  const _id = processedContent._id;
  const translationResponse = await axios.get(
    `${DATA_PERSISTENCE_URL}/api/translation/${_id}/${targetLanguage}`
  );
  const translation = translationResponse.data;
  if (translation !== null) {
    console.log("Translation already exists for this article");
    return true;
  }
  return false;
}

async function getTranslation(
  processedContentId: string,
  targetLanguage: string
) {
  const response = await axios.get(
    `${DATA_PERSISTENCE_URL}/api/translation/${processedContentId}/${targetLanguage}`
  );
  return response.data;
}

async function getProcessedContent(
  contentId: string
): Promise<ProcessedContent> {
  try {
    const response = await axios.get(
      `${DATA_PERSISTENCE_URL}/api/processed-content/id/${contentId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching processed content:", error);
    throw error;
  }
}

async function getTranslatedHtml(
  html: string,
  language: Language,
  title: string,
  summary: string
): Promise<{
  translatedContent: string;
  translatedTitle: string;
  translatedSummary: string;
}> {
  console.log("start translate html");
  const translateResponse = await axios.post(
    `${DS_SERVICE_URL}/api/translate-html`,
    {
      htmlContent: html,
      language: language,
      title: title,
      summary: summary,
    }
  );

  const {
    translatedHtml: translatedContent,
    title: translatedTitle,
    summary: translatedSummary,
  } = translateResponse.data;

  console.log("Translated HTML length:", translatedContent.length);
  return { translatedContent, translatedTitle, translatedSummary };
}

async function storeTranslation(
  processedContent: ProcessedContent,
  targetLanguage: string,
  translatedContent: string,
  title: string,
  summary: string
): Promise<Translation> {
  const { _id } = processedContent;
  try {
    const response = await axios.post(
      `${DATA_PERSISTENCE_URL}/api/translation/${_id}`,
      {
        targetLanguage,
        content: translatedContent,
        status: "pending",
        metadata: {
          qualityScore: processedContent.metadata.qualityScore,
          crawledType: processedContent.metadata.crawledType,
          topic: processedContent.metadata.topic,
          wordCount: processedContent.metadata.wordCount,
          translatedAt: new Date(),
          translationProvider: "DeepSeek",
        },
        title: title,
        author: processedContent.author,
        url: processedContent.url,
        summary: summary,
      }
    );

    if (response.status !== 201) {
      throw new Error(`Failed to store translation: ${response.statusText}`);
    }
    const translationResponse = response.data;
    console.log("Translation stored successfully");
    return translationResponse;
  } catch (error) {
    console.error("Error storing translation:", error);
    throw error;
  }
}
