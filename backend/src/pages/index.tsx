import { useState, useEffect } from "react";
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
  CircularProgress,
  Chip,
} from "@mui/material";
import { useRouter } from "next/router";
import axios from "axios";
import { Article, ProcessedContent } from "../common.type";
import { GetServerSideProps } from "next";

interface HomeProps {
  initialArticles: Article[];
  processedContents: { [key: string]: ProcessedContent };
}

export default function Home({
  initialArticles,
  processedContents,
}: HomeProps) {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [newUrl, setNewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;

    setLoading(true);
    setError("");

    try {
      const response = await axios.post("/api/articles", {
        url: newUrl,
      });
      setArticles((prevArticles) => [response.data, ...prevArticles]);
      setNewUrl("");
    } catch (err) {
      setError("Failed to process article");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewArticle = (id: string) => {
    router.push(`/article/${id}`);
  };

  const handleViewProcessedArticle = (id: string) => {
    router.push(`/processed-article/${id}`);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Article Management
        </Typography>

        <Paper sx={{ p: 2, mb: 2 }}>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: "flex", gap: 2 }}>
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
                {loading ? <CircularProgress size={24} /> : "Process"}
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
                <TableCell>Created At</TableCell>
                <TableCell>Processed Status</TableCell>
                <TableCell>View Article</TableCell>
                <TableCell>View Processed</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {articles.map((article) => (
                <TableRow key={article._id}>
                  <TableCell>{article.title || "Untitled"}</TableCell>
                  <TableCell>{article.url}</TableCell>
                  <TableCell>
                    {new Date(article.metadata.crawledAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {processedContents[article._id] ? (
                      <Chip
                        label={processedContents[article._id].status}
                        color={
                          processedContents[article._id].status === "success"
                            ? "success"
                            : processedContents[article._id].status === "failed"
                            ? "error"
                            : "warning"
                        }
                      />
                    ) : (
                      <Chip label="Not Processed" color="default" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleViewArticle(article._id)}
                    >
                      View Article
                    </Button>
                  </TableCell>
                  <TableCell>
                    {processedContents[article._id] && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() =>
                          handleViewProcessedArticle(
                            processedContents[article._id]._id
                          )
                        }
                      >
                        View Processed
                      </Button>
                    )}
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

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const DATA_PERSISTENCE_URL =
      process.env.NEXT_PUBLIC_DATA_PERSISTENCE_URL ||
      "http://data-persistence:3000";
    const response = await fetch(`${DATA_PERSISTENCE_URL}/api/content`);

    if (!response.ok) {
      throw new Error("Failed to fetch articles");
    }

    const data = await response.json();
    const articles = data.contents;

    // Fetch processed content for each article
    const processedContents: { [key: string]: ProcessedContent } = {};
    await Promise.all(
      articles.map(async (article: Article) => {
        try {
          const processedResponse = await fetch(
            `${DATA_PERSISTENCE_URL}/api/processed-content/${article._id}`
          );
          if (processedResponse.ok) {
            const processedContent = await processedResponse.json();
            processedContents[article._id] = processedContent;
          }
        } catch (error) {
          console.error(
            `Error fetching processed content for article ${article._id}:`,
            error
          );
        }
      })
    );

    return {
      props: {
        initialArticles: articles,
        processedContents,
      },
    };
  } catch (error) {
    console.error("Error fetching articles:", error);
    return {
      props: {
        initialArticles: [],
        processedContents: {},
      },
    };
  }
};
