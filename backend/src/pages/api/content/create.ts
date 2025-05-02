import type { NextApiRequest, NextApiResponse } from 'next';

const CRAWLER_URL = process.env.NEXT_PUBLIC_CRAWLER_URL || 'http://crawler:3000';
const DATA_PERSISTENCE_URL = process.env.NEXT_PUBLIC_DATA_PERSISTENCE_URL || 'http://data-persistence:3000';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;
    
    // Validate required fields
    if (!url) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['url']
      });
    }
    console.log('url', url);
    console.log('CRAWLER_URL', CRAWLER_URL);
    
    // Trigger crawler for Bilibili article
    const crawlerResponse = await fetch(`${CRAWLER_URL}/bilibili/crawl/article?url=${encodeURIComponent(url)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log('crawlerResponse', crawlerResponse);
    if (!crawlerResponse.ok) {
      const error = await crawlerResponse.json();
      throw new Error(error.error || 'Failed to crawl content');
    }

    const crawlerResult = await crawlerResponse.json();
    console.log('Crawler result:', JSON.stringify(crawlerResult, null, 2));

    // Extract the content from the nested structure
    const crawledContent = crawlerResult.content;
    if (!crawledContent) {
      throw new Error('No content found in crawler response');
    }

    // Transform the crawled content to match the data persistence model
    const contentToStore = {
      title: crawledContent.title,
      author: crawledContent.author,
      url: crawledContent.url,
      content: crawledContent.content,
      source: crawledContent.source,
      language: crawledContent.language,
      status: crawledContent.status,
      metadata: {
        crawledAt: new Date(crawledContent.metadata.crawledAt),
        wordCount: crawledContent.metadata.wordCount,
        hasImages: crawledContent.metadata.hasImages,
        originalPubTime: crawledContent.metadata.originalPubTime ? new Date(crawledContent.metadata.originalPubTime) : null
      }
    };

    console.log('Content to store:', JSON.stringify(contentToStore, null, 2));

    // Store the crawled content in data-persistence
    const storeResponse = await fetch(`${DATA_PERSISTENCE_URL}/api/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contentToStore),
    });

    if (!storeResponse.ok) {
      const error = await storeResponse.json();
      throw new Error(error.error || 'Failed to store content');
    }

    const storedContent = await storeResponse.json();

    // Return the stored content
    res.status(201).json(storedContent);
  } catch (error) {
    console.error('Error creating content:', error);
    res.status(500).json({ error: 'Failed to create content' });
  }
} 