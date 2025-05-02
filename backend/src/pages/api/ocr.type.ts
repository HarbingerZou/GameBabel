export interface OCRResult {
    boundingBox: [number, number][];
    text: string;
    confidence: number;
}