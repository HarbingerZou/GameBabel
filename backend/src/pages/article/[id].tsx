import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box, Container, Typography, CircularProgress, Paper, Divider, Chip, Button, Grid } from '@mui/material';
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
  const [styledHtml, setStyledHtml] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const extractImageUrls = (content: string):string[] => {
    const imgRegex = /<img[^>]+src="([^">]+)"/g;
    const urls: string[] = [];
    let match;
    while ((match = imgRegex.exec(content)) !== null) {
      urls.push(match[1]);
    }
    return urls;
  };

  useEffect(() => {
    if (article?.content) {
      const urls = extractImageUrls(article.content);
      setImageUrls(urls);
    }
  }, [article]);
  console.log(imageUrls);
  const handleImageOcr = async (imageUrl: string) => {
    try {
      const response = await fetch(`/api/image-ocr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articleId: id,
          imageUrl: imageUrl
        }),
      });
      if(response.status === 200) {
        const data = await response.json();
        console.log("data", data);
        setStyledHtml(data.transformedHtml);
      } else {
        setError('Failed to process image');
      }

    } catch (err) {
      console.error('Error processing image:', err);
      setError('Failed to process image');
    }
  };

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
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4" component="h1">
                {article.title}
              </Typography>
              {imageUrls.length > 0 && (
                <Button
                  variant="contained"
                  startIcon={<></>}
                  onClick={() => handleImageOcr(imageUrls[1])}
                >
                  Process First Image
                </Button>
              )}
            </Box>
            
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

            {imageUrls.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>Found Images</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  {imageUrls.map((url, index) => (
                    <Box key={index} sx={{ position: 'relative' }}>
                      <img 
                        src={url} 
                        alt={`Article image ${index + 1}`} 
                        style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain' }}
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleImageOcr(url)}
                        sx={{ position: 'absolute', bottom: 8, right: 8 }}
                      >
                        OCR
                      </Button>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {styledHtml && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>OCR Result</Typography>
                <Box 
                  sx={{ 
                    p: 2, 
                    border: '1px solid #ddd', 
                    borderRadius: 1,
                    backgroundColor: '#f8f9fa'
                  }}
                  dangerouslySetInnerHTML={{ __html: styledHtml }}
                />
              </Box>
            )}

          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
} 