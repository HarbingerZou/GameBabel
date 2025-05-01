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
import axios from 'axios';

interface Content {
  _id: string;
  url: string;
  status: string;
  originalContent: string;
  createdAt: string;
}

export default function Home() {
  const [contents, setContents] = useState<Content[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchContents = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_DATA_PERSISTENCE_URL}/api/content`);
      setContents(response.data.contents);
    } catch (err) {
      setError('Failed to fetch contents');
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;

    setLoading(true);
    setError('');

    try {
      // First create content entry
      const contentResponse = await axios.post(`${process.env.NEXT_PUBLIC_DATA_PERSISTENCE_URL}/api/content`, {
        url: newUrl,
        status: 'pending'
      });

      // Then trigger crawler
      await axios.post(`${process.env.NEXT_PUBLIC_CRAWLER_URL}/api/crawl`, {
        url: newUrl,
        contentId: contentResponse.data._id
      });

      setNewUrl('');
      fetchContents();
    } catch (err) {
      setError('Failed to process URL');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
    // Set up polling for content updates
    const interval = setInterval(fetchContents, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Content Management
        </Typography>

        <Paper sx={{ p: 2, mb: 2 }}>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="New URL"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="Enter URL to process"
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
                <TableCell>URL</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contents.map((content) => (
                <TableRow key={content._id}>
                  <TableCell>{content.url}</TableCell>
                  <TableCell>{content.status}</TableCell>
                  <TableCell>{new Date(content.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => window.open(content.url, '_blank')}
                    >
                      View
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