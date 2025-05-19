export interface Article {
  _id: string;
  title: string;
  author: string;
  url: string;
  content: string;
  source: string;
  language: string;
  metadata: {
    crawledAt: Date;
    wordCount: number;
    hasImages: boolean;
    originalPubTime: Date;
  };
}

export interface Translation {
  _id: string;
  contentId: string;
  targetLanguage: string;
  translatedContent: string;
  status: string;
  metadata: {
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
  | "English"
  | "Chinese"
  | "Spanish"
  | "Japanese"
  | "Franch"
  | "Russian";
