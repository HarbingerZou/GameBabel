import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import type { OCRResult } from './ocr.type';

const OCR_SERVICE_URL = process.env.NEXT_PUBLIC_OCR_URL || 'http://localhost:3000';


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
    console.log("OCR_SERVICE_URL", OCR_SERVICE_URL);
    // Convert relative URL to absolute URL if needed
    const absoluteImageUrl = imageUrl.startsWith('//') 
      ? `https:${imageUrl}` 
      : imageUrl;
    console.log("absoluteImageUrl", absoluteImageUrl);
    // Forward the request to the image-ocr service using environment variable
    const response = await axios.post<OCRResult[]>(`${OCR_SERVICE_URL}/api/ocr`, {
      articleId,
      imageUrl: absoluteImageUrl
    });
    console.log("response", response);
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error processing image OCR:', error);
    return res.status(500).json({ error: 'Failed to process image OCR' });
  }
} 