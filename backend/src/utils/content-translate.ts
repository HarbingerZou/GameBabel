import axios from "axios";
import type {
  Category,
  GlossaryEntry,
  Language,
  ProcessedContent,
  Prompt,
  Topic,
  Translation,
} from "../common.type";

const DS_SERVICE_URL =
  process.env.NEXT_PUBLIC_DS_URL || "http://localhost:3001";
const DATA_PERSISTENCE_URL =
  process.env.NEXT_PUBLIC_DATA_PERSISTENCE_URL ||
  "http://data-persistence:3000";

export const translateContent = async (
  processedContentId: string,
  targetLanguage: Language,
): Promise<Translation | null> => {
  // Get the processed content
  const processedContent = await getProcessedContent(processedContentId);
  if (!processedContent) {
    throw new Error("Processed content not found");
  }
  const shouldReject = await shouldRejectTranslation(
    processedContent,
    targetLanguage,
  );
  if (shouldReject) {
    return null;
  }
  // Translate the processed content
  const {
    translatedContent,
    translatedTitle,
    translatedSeoTitle,
    translatedSummary,
  } = await getTranslatedHtml(
    processedContent.content,
    targetLanguage,
    processedContent.title,
    processedContent.seoTitle,
    processedContent.summary,
    processedContent.metadata.topic ?? undefined,
  );

  // Store the translation
  const translationResponse: Translation = await storeTranslation(
    processedContent,
    targetLanguage,
    translatedContent,
    translatedTitle,
    translatedSeoTitle,
    translatedSummary,
  );

  return translationResponse;
};

async function shouldRejectTranslation(
  processedContent: ProcessedContent,
  targetLanguage: Language,
): Promise<boolean> {
  const _id = processedContent._id;
  const translationResponse = await axios.get(
    `${DATA_PERSISTENCE_URL}/api/translation/${_id}/${targetLanguage}`,
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
  targetLanguage: string,
) {
  const response = await axios.get(
    `${DATA_PERSISTENCE_URL}/api/translation/${processedContentId}/${targetLanguage}`,
  );
  return response.data;
}

async function getProcessedContent(
  contentId: string,
): Promise<ProcessedContent> {
  try {
    const response = await axios.get(
      `${DATA_PERSISTENCE_URL}/api/processed-content/id/${contentId}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching processed content:", error);
    throw error;
  }
}

async function buildGlossarySection(
  topicCode: string,
  language: Language,
): Promise<string> {
  try {
    const response = await axios.get(
      `${DATA_PERSISTENCE_URL}/api/topic/by-name/${topicCode}`,
    );
    const topic: Topic = response.data;
    const entries: GlossaryEntry[] = topic.glossary ?? [];
    type TranslationKey = keyof GlossaryEntry["translations"];
    const langKey = language as TranslationKey;
    const relevant = entries.filter(
      (e) => e.sourceTerm && e.translations[langKey],
    );
    if (relevant.length === 0) return "";
    const rows = relevant
      .map((e) => `${e.sourceTerm} → ${e.translations[langKey]}`)
      .join("\n");
    return `\n\n[GLOSSARY: Always use these exact translations for the following terms]\nChinese → ${language}\n${rows}`;
  } catch {
    return "";
  }
}

async function getTranslatedHtml(
  html: string,
  language: Language,
  title: string,
  seoTitle: string,
  summary: string,
  topicCode?: string,
): Promise<{
  translatedContent: string;
  translatedTitle: string;
  translatedSeoTitle: string;
  translatedSummary: string;
}> {
  console.log("start translate html");
  try {
    const [prompt, glossarySection] = await Promise.all([
      getPrompt("Translation"),
      topicCode ? buildGlossarySection(topicCode, language) : Promise.resolve(""),
    ]);
    const promptWithGlossary = prompt.content + glossarySection;
    if (glossarySection) {
      console.log(`Injected glossary for topic "${topicCode}" (${language})`);
    }
    const translateResponse = await axios.post(
      `${DS_SERVICE_URL}/api/translate-html`,
      {
        htmlContent: html,
        language: language,
        title: title,
        seoTitle: seoTitle,
        summary: summary,
        prompt: promptWithGlossary,
      },
    );

    const {
      translatedHtml: translatedContent,
      title: translatedTitle,
      seoTitle: translatedSeoTitle,
      summary: translatedSummary,
    } = translateResponse.data;

    console.log("Translated HTML length:", translatedContent.length);
    return {
      translatedContent,
      translatedTitle,
      translatedSeoTitle,
      translatedSummary,
    };
  } catch (error) {
    console.error("Failed to translate HTML:", error);
    throw error;
  }
}

async function storeTranslation(
  processedContent: ProcessedContent,
  targetLanguage: string,
  translatedContent: string,
  title: string,
  seoTitle: string | null,
  summary: string,
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
        seoTitle: seoTitle,
        author: processedContent.author,
        url: processedContent.url,
        summary: summary,
      },
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

async function getPrompt(category: Category): Promise<Prompt> {
  const promptResponse = await axios.get(
    `${DATA_PERSISTENCE_URL}/api/prompt/category/${category}`,
  );
  return promptResponse.data;
}
