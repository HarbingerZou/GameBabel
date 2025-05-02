import { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Button,
  TextField,
  CircularProgress
} from '@mui/material';
import { useRouter } from 'next/router';
import axios from 'axios';

interface Article {
  _id: string;
  url: string;
  title: string;
  status: string;
  timestamp: string;
}

export default function Home() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchArticles = async () => {
    try {
      const response = await axios.get(`/api/articles`);
      setArticles(response.data);
    } catch (err) {
      setError('Failed to fetch articles');
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/articles', {
        url: newUrl
      });
      setArticles(prevArticles => [response.data, ...prevArticles]);
      setNewUrl('');
    } catch (err) {
      setError('Failed to process article');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewArticle = (id: string) => {
    router.push(`/article/${id}`);
  };

  useEffect(() => {
    fetchArticles();
    // Set up polling for article updates
    const interval = setInterval(fetchArticles, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Article Management
        </Typography>

        <Paper sx={{ p: 2, mb: 2 }}>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Article URL"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="Enter article URL to process"
              />
              <Button 
                type="submit" 
                variant="contained" 
                disabled={loading || !newUrl}
              >
                {loading ? <CircularProgress size={24} /> : 'Process'}
              </Button>
            </Box>
          </form>
        </Paper>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>URL</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {articles.map((article) => (
                <TableRow key={article._id}>
                  <TableCell>{article.title || 'Untitled'}</TableCell>
                  <TableCell>{article.url}</TableCell>
                  <TableCell>{article.status}</TableCell>
                  <TableCell>{new Date(article.timestamp).toLocaleString()}</TableCell>
                  <TableCell>
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => handleViewArticle(article._id)}
                    >
                      View Article
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
} 