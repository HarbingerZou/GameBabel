import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Paper,
  Divider,
  Button,
  Grid,
} from "@mui/material";
import { GetServerSideProps } from "next";
import { Article, ProcessedContent } from "../../common.type";
import parse from "html-react-parser";
import React from "react";
import { OCRResult } from "../../common.type";
import { extractImageUrls } from "@/src/utils/image_processing";

interface ImageDisplayProps {
  url: string;
  index: number;
  onOcrClick: (url: string) => void;
}

interface ProcessedArticlePageProps {
  article: Article;
  processedContent: ProcessedContent | null;
}

interface ArticleHeaderProps {
  article: Article;
  onProcess: () => void;
}

interface ArticleMetadataProps {
  article: Article;
}

interface ContentDisplayProps {
  title: string;
  content: string;
  viewMode: "rendered" | "raw";
  onViewModeChange: (mode: "rendered" | "raw") => void;
}

interface ImagesContainerProps {
  imageUrls: string[];
  onOcrClick: (url: string) => void;
}

function ImageDisplay({ url, index, onOcrClick }: ImageDisplayProps) {
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
          cursor: "pointer",
        }}
        onClick={() =>
          window.open(
            `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`,
            "_blank"
          )
        }
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
}

function ImagesContainer({ imageUrls, onOcrClick }: ImagesContainerProps) {
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
}

interface ImageAnalysisContainerProps {
  imageUrls: string[];
  articleId: string;
}

const ImageAnalysisContainer = React.memo(
  ({ imageUrls, articleId }: ImageAnalysisContainerProps) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [styledHtml, setStyledHtml] = useState<string | null>(null);

    const handleImageOcr = async (imageUrl: string) => {
      setLoading(true);
      try {
        const parseWithDS = true;
        const response = await fetch(`/api/image-ocr`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            articleId: articleId,
            imageUrl: imageUrl,
            parseWithDS: parseWithDS,
          }),
        });
        if (response.status === 200) {
          const ocrResult: OCRResult & { structuredHtml?: string } =
            await response.json();
          if (parseWithDS) {
            setStyledHtml(ocrResult.structuredHtml || "");
          } else {
            setStyledHtml(ocrResult.data.map((t) => t.text).join("\n"));
          }
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

    if (loading) {
      return <Loading />;
    }

    if (error) {
      return (
        <Box sx={{ mt: 4 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <ImagesContainer imageUrls={imageUrls} onOcrClick={handleImageOcr} />
        </Grid>
        {styledHtml && (
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 4 }}>
              <Typography variant="h6" gutterBottom>
                OCR Result
              </Typography>
              <Box
                sx={{
                  p: 2,
                  border: "1px solid #ddd",
                  borderRadius: 1,
                  backgroundColor: "#f8f9fa",
                }}
              >
                {parse(styledHtml)}
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    );
  }
);

function ArticleHeader({ article, onProcess }: ArticleHeaderProps) {
  return (
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
      <Button variant="contained" onClick={onProcess}>
        Process Content
      </Button>
    </Box>
  );
}

function ArticleMetadata({ article }: ArticleMetadataProps) {
  const formatDate = (date: Date | string) => {
    return new Date(date).toString();
  };

  return (
    <>
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
          <strong>Created:</strong> {formatDate(article.metadata.crawledAt)}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          <strong>Original publication Time:</strong>{" "}
          {formatDate(article.metadata.originalPubTime)}
        </Typography>
      </Box>
    </>
  );
}

function ContentDisplay({
  title,
  content,
  viewMode,
  onViewModeChange,
}: ContentDisplayProps) {
  const formatContent = () => {
    if (viewMode === "rendered") {
      return <Box>{parse(content)}</Box>;
    }
    return (
      <Typography
        variant="body1"
        component="pre"
        sx={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          fontFamily: "monospace",
          fontSize: "0.875rem",
        }}
      >
        {content}
      </Typography>
    );
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box>
          <Button
            variant={viewMode === "rendered" ? "contained" : "outlined"}
            onClick={() => onViewModeChange("rendered")}
            size="small"
            sx={{ mr: 1 }}
          >
            Rendered
          </Button>
          <Button
            variant={viewMode === "raw" ? "contained" : "outlined"}
            onClick={() => onViewModeChange("raw")}
            size="small"
          >
            Raw HTML
          </Button>
        </Box>
      </Box>
      <Box
        sx={{
          p: 2,
          border: "1px solid #ddd",
          borderRadius: 1,
          backgroundColor: "#f8f9fa",
          height: "600px",
          overflow: "auto",
        }}
      >
        {formatContent()}
      </Box>
    </Box>
  );
}

function Loading() {
  const [seconds, setSeconds] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setSeconds((seconds) => seconds + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Container>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mt: 4,
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading... {mounted ? seconds : 0} seconds
        </Typography>
      </Box>
    </Container>
  );
}

export default function ProcessedArticlePage({
  article: initialArticle,
  processedContent: initialProcessedContent,
}: ProcessedArticlePageProps) {
  const [article] = useState<Article>(initialArticle);
  const [processedContent, setProcessedContent] =
    useState<ProcessedContent | null>(initialProcessedContent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawViewMode, setRawViewMode] = useState<"rendered" | "raw">(
    "rendered"
  );
  const [processedViewMode, setProcessedViewMode] = useState<
    "rendered" | "raw"
  >("rendered");
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    if (article?.content) {
      const urls = extractImageUrls(article.content);
      setImageUrls(urls);
    }
  }, [article]);

  const handleProcessContent = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/content-process`, {
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
        console.log("data", data);
        setProcessedContent(data);
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
    return <Loading />;
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
    <Container maxWidth="xl">
      <Paper elevation={3} sx={{ p: 4 }}>
        <ArticleHeader article={article} onProcess={handleProcessContent} />
        <ArticleMetadata article={article} />
        <Divider sx={{ my: 3 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <ContentDisplay
              title="Original Content"
              content={article.content}
              viewMode={rawViewMode}
              onViewModeChange={setRawViewMode}
            />
            <ImageAnalysisContainer
              imageUrls={imageUrls}
              articleId={article._id}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            {processedContent ? (
              <ContentDisplay
                title="Processed Content"
                content={processedContent.content}
                viewMode={processedViewMode}
                onViewModeChange={setProcessedViewMode}
              />
            ) : (
              <Box
                sx={{
                  p: 2,
                  border: "1px solid #ddd",
                  borderRadius: 1,
                  backgroundColor: "#f8f9fa",
                  height: "600px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  No processed content available. Click the process button to
                  process the content.
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>
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

    // Fetch article
    const articleResponse = await fetch(
      `${DATA_PERSISTENCE_URL}/api/content/${id}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!articleResponse.ok) {
      if (articleResponse.status === 404) {
        return {
          notFound: true,
        };
      }
      throw new Error(`Failed to fetch article: ${articleResponse.status}`);
    }

    const article = await articleResponse.json();

    // Fetch processed content
    const processedContentResponse = await fetch(
      `${DATA_PERSISTENCE_URL}/api/processed-content/${id}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    let processedContent = null;
    if (processedContentResponse.ok) {
      processedContent = await processedContentResponse.json();
    }

    return {
      props: {
        article,
        processedContent,
      },
    };
  } catch (error) {
    console.error("Error fetching article:", error);
    return {
      notFound: true,
    };
  }
};
