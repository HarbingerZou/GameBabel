import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Paper,
  Divider,
  Chip,
  Button,
  Grid,
} from "@mui/material";
import { GetServerSideProps } from "next";

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

interface ArticlePageProps {
  article: Article;
}

interface ImageDisplayProps {
  url: string;
  index: number;
  onOcrClick: (url: string) => void;
}

interface ImagesContainerProps {
  imageUrls: string[];
  onOcrClick: (url: string) => void;
}

interface ArticleContentProps {
  article: Article;
  onTranslateClick: () => void;
  hasImages: boolean;
}

interface TranslatedContentProps {
  styledHtml: string | null;
}

const ImageDisplay = ({ url, index, onOcrClick }: ImageDisplayProps) => {
  const imageUrl = url.startsWith("//") ? `https:${url}` : url;

  return (
    <Box
      sx={{
        position: "relative",
        width: "200px",
        height: "200px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
        p: 1,
        border: "1px solid #eee",
        borderRadius: 1,
        backgroundColor: "#fafafa",
      }}
    >
      <Box
        sx={{
          flex: 1,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <img
          src={`/api/proxy-image?url=${encodeURIComponent(imageUrl)}`}
          alt={`Article image ${index + 1}`}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
          }}
        />
      </Box>
      <Button
        variant="outlined"
        size="small"
        onClick={() => onOcrClick(imageUrl)}
        fullWidth
      >
        OCR
      </Button>
    </Box>
  );
};

const ImagesContainer = ({ imageUrls, onOcrClick }: ImagesContainerProps) => {
  if (imageUrls.length === 0) return null;

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Found Images
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 2,
          p: 2,
          backgroundColor: "#f5f5f5",
          borderRadius: 1,
        }}
      >
        {imageUrls.map((url, index) => (
          <ImageDisplay
            key={index}
            url={url}
            index={index}
            onOcrClick={onOcrClick}
          />
        ))}
      </Box>
    </Box>
  );
};

const ArticleContent = ({
  article,
  onTranslateClick,
  hasImages,
}: ArticleContentProps) => {
  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h4" component="h1">
          {article.title}
        </Typography>
        {hasImages && (
          <Button variant="contained" onClick={onTranslateClick}>
            Translate Content
          </Button>
        )}
      </Box>

      <Box sx={{ mb: 2 }}>
        <Chip
          label={article.status}
          color={article.status === "completed" ? "success" : "warning"}
          sx={{ mr: 1 }}
        />
        <Chip label={article.language} color="info" sx={{ mr: 1 }} />
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
          <strong>Created:</strong>{" "}
          {new Date(article.createdAt).toLocaleString()}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          <strong>Last updated:</strong>{" "}
          {new Date(article.updatedAt).toLocaleString()}
        </Typography>
        {article.metadata.originalPubTime && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Original publication:</strong>{" "}
            {new Date(article.metadata.originalPubTime).toLocaleString()}
          </Typography>
        )}
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Content
        </Typography>
        <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
          {article.content}
        </Typography>
        {article.metadata.wordCount && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Word count: {article.metadata.wordCount}
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

const TranslatedContent = ({ styledHtml }: TranslatedContentProps) => {
  if (!styledHtml) return null;

  return (
    <Paper elevation={3} sx={{ p: 4, height: "100%" }}>
      <Typography variant="h6" gutterBottom>
        OCR Result
      </Typography>
      <Box
        sx={{
          p: 2,
          border: "1px solid #ddd",
          borderRadius: 1,
          backgroundColor: "#f8f9fa",
          height: "calc(100% - 40px)",
          overflow: "auto",
        }}
        dangerouslySetInnerHTML={{ __html: styledHtml }}
      />
    </Paper>
  );
};

export default function ArticlePage({
  article: initialArticle,
}: ArticlePageProps) {
  const router = useRouter();
  const [article, setArticle] = useState<Article>(initialArticle);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [styledHtml, setStyledHtml] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const extractImageUrls = (content: string): string[] => {
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

  const handleImageOcr = async (imageUrl: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/image-ocr`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          articleId: article._id,
          imageUrl: imageUrl,
        }),
      });
      if (response.status === 200) {
        const data = await response.json();
        setStyledHtml(data.transformedHtml);
      } else {
        setError("Failed to process image");
      }
    } catch (err) {
      console.error("Error processing image:", err);
      setError("Failed to process image");
    } finally {
      setLoading(false);
    }
  };

  const handleContentTranslate = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/content-translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          articleId: article._id,
        }),
      });
      if (response.status === 200) {
        const data = await response.json();
        setStyledHtml(data.translatedHtml);
      } else {
        setError("Failed to process content");
      }
    } catch (err) {
      console.error("Error processing content:", err);
      setError("Failed to process content");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !article) {
    return (
      <Container>
        <Box sx={{ mt: 4 }}>
          <Typography color="error">{error || "Article not found"}</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Grid container spacing={3}>
        <Grid item xs={12} md={styledHtml ? 8 : 12}>
          <ArticleContent
            article={article}
            onTranslateClick={handleContentTranslate}
            hasImages={imageUrls.length > 0}
          />
          <ImagesContainer imageUrls={imageUrls} onOcrClick={handleImageOcr} />
        </Grid>
        {styledHtml && (
          <Grid item xs={12} md={4}>
            <TranslatedContent styledHtml={styledHtml} />
          </Grid>
        )}
      </Grid>
    </Container>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params || {};

  if (!id) {
    return {
      notFound: true,
    };
  }

  try {
    const DATA_PERSISTENCE_URL =
      process.env.NEXT_PUBLIC_DATA_PERSISTENCE_URL ||
      "http://data-persistence:3000";
    const response = await fetch(`${DATA_PERSISTENCE_URL}/api/content/${id}`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          notFound: true,
        };
      }
      throw new Error(`Failed to fetch article: ${response.status}`);
    }

    const article = await response.json();

    return {
      props: {
        article,
      },
    };
  } catch (error) {
    console.error("Error fetching article:", error);
    return {
      notFound: true,
    };
  }
};
