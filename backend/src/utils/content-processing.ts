import type {
  Article,
  Category,
  ContentAnalysis,
  OcrHTML,
  OCRResult,
  OCRResultData,
  ProcessedContent,
  Prompt,
  Summary,
} from "../common.type";
import { extractImageUrls } from "./image_processing";
import axios from "axios";

const OCR_SERVICE_URL =
  process.env.NEXT_PUBLIC_OCR_URL || "http://localhost:8001";
const DS_SERVICE_URL =
  process.env.NEXT_PUBLIC_DS_URL || "http://localhost:3001";
const DATA_PERSISTENCE_URL =
  process.env.NEXT_PUBLIC_DATA_PERSISTENCE_URL ||
  "http://data-persistence:3000";

export const processContent = async (
  articleId: string,
): Promise<ProcessedContent | null> => {
  const article: Article = await getArticle(articleId);
  const shouldReject = await shouldRejectProcessingContent(article);
  if (shouldReject) {
    return null;
  }
  const [ocrHtmls, cleanedHtml] = await Promise.all([
    imageProcessingBranch(article),
    textProcessingBranch(article),
  ]);
  let processedContent: string | null = null;
  if (ocrHtmls.length > 0) {
    processedContent = await getMergedHtml(ocrHtmls, cleanedHtml);
  } else {
    processedContent = cleanedHtml;
  }

  const polishedContent = await getPolishedContent(
    article.title,
    processedContent,
  );

  const topicOptions = await getTopicNames();
  const contentAnalysis = await getContentAnalysis(
    polishedContent,
    topicOptions,
  );
  const { qualityScore, topic } = contentAnalysis;

  const summary = await getSummary(polishedContent, topic);

  const processedContentResponse = await storeProcessedContent(
    article,
    polishedContent,
    article.language,
    summary,
    topic,
    qualityScore,
  );

  //const processedContentResponse = directReturn(article, polishedContent);
  return processedContentResponse;
};

async function shouldRejectProcessingContent(
  article: Article,
): Promise<boolean> {
  const _id = article._id;
  const processedContentResponse = await axios.get(
    `${DATA_PERSISTENCE_URL}/api/processed-content/${_id}`,
  );
  const processedContent = processedContentResponse.data;
  if (processedContent !== null) {
    console.log("Processed content already exists for this article");
    return true;
  }
  return false;
}

async function imageProcessingBranch(article: Article): Promise<OcrHTML[]> {
  const imageUrls: string[] = extractImageUrls(article.content);
  console.log("Found image URLs:", imageUrls);
  if (imageUrls.length === 0) {
    return [];
  }
  // Convert relative URL to absolute URL if needed
  const absoluteImageUrls = imageUrls.map((imageUrl: string) =>
    imageUrl.startsWith("//") ? `https:${imageUrl}` : imageUrl,
  );
  const ocrHtmls: { imageUrl: string; htmlContent: string }[] =
    await Promise.all(
      absoluteImageUrls.map(async (imageUrl: string) => {
        const ocrHtml = await axios.post(
          `${DS_SERVICE_URL}/api/transform-image-ocr`,
          {
            imageUrl: imageUrl,
          },
        );
        return ocrHtml.data;
      }),
    );
  return ocrHtmls.map((ocrHtml) => ({
    imageUrl: ocrHtml.imageUrl,
    ocrHtml: ocrHtml.htmlContent,
  }));
}

async function textProcessingBranch(article: Article): Promise<string> {
  const cleanedHtml = await getCleanedHtml(article.content);
  return cleanedHtml;
}

async function getArticle(articleId: string): Promise<Article> {
  const articleResponse = await fetch(
    `${DATA_PERSISTENCE_URL}/api/content/${articleId}`,
    {
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!articleResponse.ok) {
    if (articleResponse.status === 404) {
      throw new Error("Article not found");
    }
    const errorText = await articleResponse.text();
    console.error("Error response:", errorText);
    throw new Error(
      `Failed to fetch article: ${articleResponse.status} ${errorText}`,
    );
  }
  const article = await articleResponse.json();
  return article;
}

async function getCleanedHtml(htmlContent: string): Promise<string> {
  console.log("start get cleaned HTML");

  try {
    const prompt = await getPrompt("Cleaning");
    const cleanedResponse = await axios.post(
      `${DS_SERVICE_URL}/api/remove-styling`,
      {
        htmlContent: htmlContent,
        prompt: prompt.content,
      },
    );

    const cleanedHtml = cleanedResponse.data.content;
    console.log("Cleaned HTML length:", cleanedHtml?.length || 0);
    return cleanedHtml;
  } catch (error) {
    console.error("Failed to clean HTML content:", error);
    // Return original content if cleaning fails
    return htmlContent;
  }
}

async function getMergedHtml(
  ocrHtmls: OcrHTML[],
  originalHtml: string,
): Promise<string> {
  console.log("start merge OCR HTML");
  const prompt = await getPrompt("Merging");
  // Then, merge the original HTML with the OCR HTML results
  const mergeResponse = await axios.post(
    `${DS_SERVICE_URL}/api/merge-ocr-html`,
    {
      content: originalHtml,
      ocrHtmls: ocrHtmls,
      prompt: prompt.content,
    },
  );

  const mergedHtml = mergeResponse.data.mergedHtml;
  console.log("Merged HTML length:", mergedHtml.length);
  return mergedHtml;
}

async function getPolishedContent(
  title: string,
  content: string,
): Promise<string> {
  console.log("start get polished content");
  const prompt = await getPrompt("Polishing");
  const polishedContentResponse = await axios.post(
    `${DS_SERVICE_URL}/api/polish`,
    {
      title,
      content,
      prompt: prompt.content,
    },
  );
  console.log("polishedContentResponse", polishedContentResponse.data);
  return polishedContentResponse.data.content;
}

async function getTopicNames(): Promise<string[]> {
  console.log("start get topic names");
  const topicsResponse = await axios.get(
    `${DATA_PERSISTENCE_URL}/api/topic/names`,
  );
  return topicsResponse.data.map((topic: any) => topic.name);
}

async function getPrompt(category: Category): Promise<Prompt> {
  const promptResponse = await axios.get(
    `${DATA_PERSISTENCE_URL}/api/prompt/category/${category}`,
  );
  return promptResponse.data;
}

async function getSEOKeywords(topicName: string): Promise<string[]> {
  const keywordsResponse = await axios.get(
    `${DATA_PERSISTENCE_URL}/api/topic/${topicName}/keywords`,
  );
  return keywordsResponse.data;
}
async function getSummary(
  content: string,
  topicName: string,
): Promise<Summary> {
  console.log("start get summary");
  const prompt = await getPrompt("Summary");
  const seoKeywords = await getSEOKeywords(topicName);
  const summaryResponse = await axios.post<Summary>(
    `${DS_SERVICE_URL}/api/summarize`,
    {
      content,
      prompt: prompt.content,
      seoKeywords: seoKeywords,
    },
  );
  console.log("summaryResponse", summaryResponse.data);
  return summaryResponse.data;
}

async function getContentAnalysis(
  content: string,
  topicOptions: string[],
): Promise<ContentAnalysis> {
  console.log("start get quality score");
  const prompt = await getPrompt("Analysis");
  const contentAnalysisResponse = await axios.post<ContentAnalysis>(
    `${DS_SERVICE_URL}/api/analyze`,
    { content, topicOptions, prompt: prompt.content },
  );
  return contentAnalysisResponse.data;
}
async function storeProcessedContent(
  article: Article,
  processedContent: string,
  language: string,
  summary: Summary,
  topic: string,
  qualityScore: number,
): Promise<ProcessedContent> {
  try {
    console.log("start store processed content");
    // Get the original article to get required fields

    const response = await axios.post(
      `${DATA_PERSISTENCE_URL}/api/processed-content/${article._id}`,
      {
        title: article.title,
        author: article.author,
        url: article.url,
        summary: summary.summary,
        seoTitle: summary.seoTitle,
        content: processedContent,
        language: language,
        source: article.source,
        status: "pending",
        metadata: {
          qualityScore: qualityScore,
          topic: topic,
          crawledType: article.metadata.crawledType,
          processedAt: new Date(),
          wordCount: processedContent.split(/\s+/).length,
          processingVersion: 1,
        },
      },
    );

    if (response.status !== 201) {
      throw new Error(
        `Failed to store processed content: ${response.statusText}`,
      );
    }
    const processedContentResponse = response.data;
    console.log("Processed content stored successfully");
    return processedContentResponse;
  } catch (error) {
    console.error("Error storing processed content:", error);
    throw error;
  }
}

function directReturn(article: Article, content: string): ProcessedContent {
  return {
    _id: "",
    originalContentId: article._id,
    title: article.title,
    author: article.author,
    url: article.url,
    summary: "",
    seoTitle: "",
    content: content,
    language: article.language,
    source: article.source,
    status: "pending",
    metadata: {
      qualityScore: 0,
      topic: "",
      crawledType: article.metadata.crawledType,
      processedAt: new Date(),
      wordCount: content.split(/\s+/).length,
      processingVersion: 1,
    },
  };
}
