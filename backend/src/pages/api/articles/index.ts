import { NextApiRequest, NextApiResponse } from 'next';

const DATA_PERSISTENCE_URL = process.env.NEXT_PUBLIC_DATA_PERSISTENCE_URL || 'http://data-persistence:3000';
const CRAWLER_URL = process.env.NEXT_PUBLIC_CRAWLER_URL || 'http://crawler:3000';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  // If there's an ID in the query, handle single article request
  if (id) {
    try {
      console.log('Fetching article with ID:', id);
      const response = await fetch(`${DATA_PERSISTENCE_URL}/api/content/${id}`, {
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          return res.status(404).json({ message: 'Article not found' });
        }
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch article: ${response.status} ${errorText}`);
      }

      const data = await response.json();

      // Transform the data to match our frontend interface
      const article = {
        _id: data._id,
        title: data.title,
        author: data.author,
        url: data.url,
        content: data.content,
        source: data.source,
        language: data.language,
        status: data.status,
        metadata: {
          crawledAt: data.metadata?.crawledAt,
          wordCount: data.metadata?.wordCount,
          hasImages: data.metadata?.hasImages,
          originalPubTime: data.metadata?.originalPubTime
        },
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };

      return res.status(200).json(article);
    } catch (error) {
      console.error('Error fetching article:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Handle list/create requests
  if (req.method === 'GET') {
    try {
      const response = await fetch(`${DATA_PERSISTENCE_URL}/api/content`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }

      const data = await response.json();
      // Transform the data to match our frontend interface
      const articles = data.contents.map((content: any) => ({
        _id: content._id,
        title: content.title,
        author: content.author,
        url: content.url,
        source: content.source,
        language: content.language,
        status: content.status,
        metadata: {
          crawledAt: content.metadata?.crawledAt,
          wordCount: content.metadata?.wordCount,
          hasImages: content.metadata?.hasImages,
          originalPubTime: content.metadata?.originalPubTime
        },
        createdAt: content.createdAt,
        updatedAt: content.updatedAt
      }));
      return res.status(200).json(articles);
    } catch (error) {
      console.error('Error fetching articles:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  } else if (req.method === 'POST') {
    try {
      const { url } = req.body;
      if (!url) {
        throw new Error('URL is required');
      }

      console.log('Calling crawler service with URL:', url);
      // First, call the crawler service
      const crawlerResponse = await fetch(`${CRAWLER_URL}/bilibili/crawl/article?url=${url}`);

      if (!crawlerResponse.ok) {
        const contentType = crawlerResponse.headers.get('content-type');
        console.error('Crawler service error:', {
          status: crawlerResponse.status,
          statusText: crawlerResponse.statusText,
          contentType,
        });
        
        let errorMessage = 'Failed to crawl content';
        try {
          const errorText = await crawlerResponse.text();
          console.error('Crawler service error response:', errorText);
          errorMessage = `Crawler service error: ${errorText}`;
        } catch (e) {
          console.error('Failed to read crawler error response:', e);
        }
        
        throw new Error(errorMessage);
      }

      const crawlerResult = await crawlerResponse.json();

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
      return res.status(201).json(storedContent);
    } catch (error) {
      console.error('Error creating content:', error);
      return res.status(500).json({ 
        error: 'Failed to create content',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
} 