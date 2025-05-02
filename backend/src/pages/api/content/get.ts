import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    
    // Construct the URL for the data-persistence service
    const url = new URL(`${process.env.NEXT_PUBLIC_DATA_PERSISTENCE_URL}/api/content`);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('limit', limit.toString());
    if (search) url.searchParams.append('search', search.toString());
    if (status) url.searchParams.append('status', status.toString());

    // Forward the request to the data-persistence service
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Data persistence service responded with status: ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
} 