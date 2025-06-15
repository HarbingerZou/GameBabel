export interface Article {
  _id: string;
  title: string;
  author: string;
  url: string;
  summary: string;
  content: string;
  source: string;
  language: string;
  metadata: {
    crawledType: "manual" | "profile_auto" | "search_auto";
    crawledAt: Date;
    wordCount: number;
    hasImages: boolean;
    originalPubTime: Date;
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
  language: string;
  source: string;
  status: "pending" | "success" | "failed";
  metadata: {
    crawledType: "manual" | "profile_auto" | "search_auto";
    processedAt: Date;
    wordCount?: number;
    processingVersion: number;
  };
}

export interface Translation {
  _id: string;
  processedContentId: string;
  targetLanguage: string;
  summary: string;
  content: string;
  status: "pending" | "success" | "failed";
  metadata: {
    crawledType: "manual" | "profile_auto" | "search_auto";
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

export type Language =
  | "english"
  | "chinese"
  | "spanish"
  | "japanese"
  | "french"
  | "russian";
