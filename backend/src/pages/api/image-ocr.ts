import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import type { OCRResult } from './ocr.type';

const OCR_SERVICE_URL = process.env.NEXT_PUBLIC_OCR_URL || 'http://localhost:3000';
const DS_SERVICE_URL = process.env.NEXT_PUBLIC_DS_URL || 'http://localhost:3001';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { articleId, imageUrl } = req.body;

    if (!articleId || !imageUrl) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    // Convert relative URL to absolute URL if needed
    const absoluteImageUrl = imageUrl.startsWith('//') 
      ? `https:${imageUrl}` 
      : imageUrl;
    // 1. Get OCR result from OCR service
    const ocrResponse = await axios.post<OCRResult>(`${OCR_SERVICE_URL}/api/ocr`, {
      articleId,
      imageUrl: absoluteImageUrl
    });
    const ocrResult = ocrResponse.data;
    console.log("ocrResult", ocrResult);

    // 2. Transform OCR result using ds-service
    console.log("ocrResult.text", ocrResult.text);

    const dsResponse = await axios.post(`${DS_SERVICE_URL}/transform-ocr`, {
      ocrResult: ocrResult.text
    });
    console.log("dsResponse", dsResponse);

    // 3. Return both the original OCR result and the transformed HTML
    const dsResult = dsResponse.data;
    console.log("dsResult", dsResult);
    return res.status(200).json({
      ocrResult: ocrResponse.data,
      transformedHtml: dsResult.styledHtml
    });
  } catch (error) {
    //console.error('Error processing image OCR:', error);
    return res.status(500).json({ error: 'Failed to process image OCR' });
  }
} 