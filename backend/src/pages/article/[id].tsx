import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box, Container, Typography, CircularProgress, Paper, Divider, Chip } from '@mui/material';

interface Article {
  _id: string;
  title: string;
  author: string;
  url: string;
  content: string;
  source: string;
  language: string;
  status: string;
  metadata: {
    crawledAt: string;
    wordCount?: number;
    hasImages?: boolean;
    originalPubTime?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function ArticlePage() {
  const router = useRouter();
  const { id } = router.query;
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetch(`/api/articles?id=${id}`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Failed to fetch article');
          }
          return res.json();
        })
        .then(data => {
          console.log('Fetched article data:', data);
          setArticle(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching article:', err);
          setError('Failed to load article');
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !article) {
    return (
      <Container>
        <Box sx={{ mt: 4 }}>
          <Typography color="error">{error || 'Article not found'}</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {article.title}
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Chip 
              label={article.status} 
              color={article.status === 'completed' ? 'success' : 'warning'} 
              sx={{ mr: 1 }} 
            />
            <Chip 
              label={article.language} 
              color="info" 
              sx={{ mr: 1 }} 
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" gutterBottom>
              <strong>Author:</strong> {article.author}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Source:</strong> {article.source}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>URL:</strong> {article.url}
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Created:</strong> {new Date(article.createdAt).toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Last updated:</strong> {new Date(article.updatedAt).toLocaleString()}
            </Typography>
            {article.metadata.originalPubTime && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Original publication:</strong> {new Date(article.metadata.originalPubTime).toLocaleString()}
              </Typography>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>Content</Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {article.content}
            </Typography>
            {article.metadata.wordCount && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Word count: {article.metadata.wordCount}
              </Typography>
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
} 