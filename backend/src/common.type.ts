export type Source = "bilibili" | "NGA";
export interface CrawledContent {
  title: string;
  author: string;
  url: string;
  content: string;
  source: Source;
  language: Language; // Default to Chinese as Bilibili is a Chinese platform
  status: "pending"; // Default status
  metadata: {
    crawledAt: Date;
    wordCount: number;
    hasImages: boolean;
    originalPubTime: string | null;
    engagement: {
      likes: number;
      coins: number;
      favorites: number;
      forwards: number;
      comments: number;
    };
  };
}
export interface Article {
  _id: string;
  title: string;
  author: string;
  url: string;
  content: string;
  source: Source;
  language: Language;
  metadata: {
    crawledType: "manual" | "profile_auto" | "search_auto";
    crawledAt: Date;
    wordCount: number;
    hasImages: boolean;
    originalPubTime: Date;
    engagement?: {
      likes: number;
      coins: number;
      favorites: number;
      forwards: number;
      comments: number;
    };
  };
}

export interface ProcessedContent {
  _id: string;
  originalContentId: string;
  title: string;
  author: string;
  url: string;
  summary: string;
  content: string;
  language: Language;
  source: Source;
  status: "pending" | "success" | "failed";
  metadata: {
    qualityScore: number;
    topic: string | null;
    crawledType: "manual" | "profile_auto" | "search_auto";
    processedAt: Date;
    wordCount?: number;
    processingVersion: number;
  };
}

export interface Translation {
  _id: string;
  processedContentId: string;
  targetLanguage: Language;
  title: string;
  author: string;
  url: string;
  summary: string;
  content: string;
  status: "pending" | "success" | "failed";
  metadata: {
    qualityScore: number;
    crawledType: "manual" | "profile_auto" | "search_auto";
    topic: string | null;
    wordCount?: number;
    translatedAt: Date;
    translationProvider: string;
  };
}

export interface OCRResultData {
  boundingBox: [number, number][];
  text: string;
  confidence: number;
}

export interface OCRResult {
  articleId: string;
  data: OCRResultData[];
  success: boolean;
}

export interface BatchedCrawlBase {
  title: string;
  link: string;
}

type SearchType = "search" | "user-articles";
export interface SearchResponse {
  message: string;
  results: SingleSearchResponse[];
}
export interface SingleSearchResponse {
  type: SearchType;
  articles: BatchedCrawlBase[];
  totalResults: number;
  searchUrl: string;
}
export interface OcrHTML {
  imageUrl: string;
  ocrHtml: string;
}

export interface Summary {
  summary: string;
}

export interface ContentAnalysis {
  qualityScore: number;
  topic: string;
}

export type Language =
  | "english"
  | "chinese"
  | "spanish"
  | "japanese"
  | "french"
  | "russian";
