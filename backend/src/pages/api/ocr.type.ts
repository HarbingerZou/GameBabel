export interface OCRResultText {
    boundingBox: [number, number][];
    text: string;
    confidence: number;
}

export interface OCRResult {
    articleId: string;
    text: OCRResultText[];
    success: boolean;
}

