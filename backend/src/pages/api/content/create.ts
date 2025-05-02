import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate required fields
    const { title, author, url, content, source, language } = req.body;
    if (!title || !author || !url || !content || !source || !language) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['title', 'author', 'url', 'content', 'source', 'language']
      });
    }

    // Forward the request to the data-persistence service
    const response = await fetch('http://data-persistence:3000/api/content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        author,
        url,
        content,
        source,
        language,
        status: 'pending',
        metadata: {
          wordCount: content.split(/\s+/).length,
          hasImages: content.includes('<img')
        }
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create content');
    }

    const data = await response.json();
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating content:', error);
    res.status(500).json({ error: 'Failed to create content' });
  }
} 