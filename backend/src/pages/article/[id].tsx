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
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { GetServerSideProps } from "next";
import { Article, OCRResult, Translation, Language } from "../../common.type";
import { extractImageUrls } from "../../utils/image_processing";
import parse from "html-react-parser";
import React from "react";
interface ArticlePageProps {
  article: Article;
  translation: Translation[];
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
  translation: Translation[];
  onTranslateClick: (language: string) => void;
  hasImages: boolean;
  onTranslationsUpdate: (translations: Translation[]) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`translation-tabpanel-${index}`}
      aria-labelledby={`translation-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
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

function ArticleHeader({
  article,
  onTranslate,
}: {
  article: Article;
  onTranslate: (language: Language) => void;
}) {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("English");

  const handleLanguageChange = (event: any) => {
    setSelectedLanguage(event.target.value);
  };

  const handleTranslate = () => {
    onTranslate(selectedLanguage);
  };

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
      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="language-select-label">Target Language</InputLabel>
          <Select
            labelId="language-select-label"
            id="language-select"
            value={selectedLanguage}
            label="Target Language"
            onChange={handleLanguageChange}
          >
            <MenuItem value="English">English</MenuItem>
            <MenuItem value="Chinese">Chinese</MenuItem>
            <MenuItem value="Spanish">Spanish</MenuItem>
            <MenuItem value="Japanese">Japanese</MenuItem>
            <MenuItem value="Franch">French</MenuItem>
            <MenuItem value="Russian">Russian</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" onClick={handleTranslate}>
          Translate
        </Button>
      </Box>
    </Box>
  );
}

function ArticleMetadata({ article }: { article: Article }) {
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

function OriginalContent({ article }: { article: Article }) {
  const [viewMode, setViewMode] = useState<"rendered" | "raw">("rendered");

  const formatContent = () => {
    if (viewMode === "rendered") {
      return <Box>{parse(article.content)}</Box>;
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
        {article.content}
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
          Original Content
        </Typography>
        <Box>
          <Button
            variant={viewMode === "rendered" ? "contained" : "outlined"}
            onClick={() => setViewMode("rendered")}
            size="small"
            sx={{ mr: 1 }}
          >
            Rendered
          </Button>
          <Button
            variant={viewMode === "raw" ? "contained" : "outlined"}
            onClick={() => setViewMode("raw")}
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
        {article.metadata.wordCount && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Word count: {article.metadata.wordCount}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

function TranslatedContent({
  translations: initialTranslations,
  onTranslationsUpdate,
}: {
  translations: Translation[];
  onTranslationsUpdate: (translations: Translation[]) => void;
}) {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [translations, setTranslations] = useState(initialTranslations);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDeleteTranslation = async (translationId: string) => {
    if (!confirm("Are you sure you want to delete this translation?")) {
      return;
    }

    setLoading(true);
    try {
      const translationToDelete = translations.find(
        (t) => t._id === translationId
      );
      if (!translationToDelete) {
        throw new Error("Translation not found");
      }

      const response = await fetch(`/api/translation`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contentId: translationToDelete.contentId,
          targetLanguage: translationToDelete.targetLanguage,
        }),
      });

      if (response.ok) {
        const updatedTranslations = translations.filter(
          (t) => t._id !== translationId
        );
        if (tabValue >= updatedTranslations.length) {
          setTabValue(Math.max(0, updatedTranslations.length - 1));
        }
        setTranslations(updatedTranslations);
        onTranslationsUpdate(updatedTranslations);
      } else {
        const error = await response.json();
        console.error("Failed to delete translation:", error);
      }
    } catch (error) {
      console.error("Error deleting translation:", error);
    } finally {
      setLoading(false);
    }
  };

  const allTranslations = translations.sort(
    (a, b) =>
      new Date(b.metadata.translatedAt).getTime() -
      new Date(a.metadata.translatedAt).getTime()
  );

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
        <Typography variant="h6">Translated Content</Typography>
        {allTranslations.length > 0 && (
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={() =>
              handleDeleteTranslation(allTranslations[tabValue]._id)
            }
            disabled={loading}
          >
            Delete Translation
          </Button>
        )}
      </Box>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="translation tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          {allTranslations.map((trans, index) => (
            <Tab
              key={trans._id}
              label={`${trans.targetLanguage}`}
              id={`translation-tab-${index}`}
            />
          ))}
        </Tabs>
      </Box>
      {allTranslations.map((trans, index) => (
        <TabPanel key={trans._id} value={tabValue} index={index}>
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
            <Box>{parse(trans.translatedContent)}</Box>
          </Box>
        </TabPanel>
      ))}
      {allTranslations.length === 0 && (
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
          <Typography variant="body1" color="text.secondary">
            No translations available. Click the translate button to translate.
          </Typography>
        </Box>
      )}
    </Box>
  );
}

const ArticleContent = ({
  article,
  translation,
  onTranslateClick,
  hasImages,
  onTranslationsUpdate,
}: ArticleContentProps) => {
  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <ArticleHeader article={article} onTranslate={onTranslateClick} />

      <ArticleMetadata article={article} />

      <Divider sx={{ my: 3 }} />

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <OriginalContent article={article} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TranslatedContent
            translations={translation}
            onTranslationsUpdate={onTranslationsUpdate}
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

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

export default function ArticlePage({
  article: initialArticle,
  translation: initialTranslation,
}: ArticlePageProps) {
  const [article, setArticle] = useState<Article>(initialArticle);
  const [translations, setTranslations] =
    useState<Translation[]>(initialTranslation);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    if (article?.content) {
      const urls = extractImageUrls(article.content);
      setImageUrls(urls);
    }
  }, [article]);

  const handleContentTranslate = async (targetLanguage: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/content-translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          articleId: article._id,
          targetLanguage,
        }),
      });
      if (response.status === 200) {
        const data = await response.json();
        const newTranslation: Translation = {
          _id: article._id,
          contentId: article._id,
          targetLanguage,
          translatedContent: data.translatedHtml,
          status: "completed",
          metadata: {
            translatedAt: new Date(),
            translationProvider: "DeepSeek",
          },
        };
        setTranslations((prev) => [...prev, newTranslation]);
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
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <ArticleContent
            article={article}
            translation={translations}
            onTranslateClick={handleContentTranslate}
            hasImages={imageUrls.length > 0}
            onTranslationsUpdate={setTranslations}
          />
        </Grid>
        <Grid item xs={12}>
          <ImageAnalysisContainer
            imageUrls={imageUrls}
            articleId={article._id}
          />
        </Grid>
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

    // Fetch all translations for this content
    const translationResponse = await fetch(
      `${DATA_PERSISTENCE_URL}/api/content/${id}/translations`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    let translations = [];
    if (translationResponse.ok) {
      const translationData = await translationResponse.json();
      translations = translationData.translations || [];
    }

    console.log("translations", translations);
    return {
      props: {
        article,
        translation: translations,
      },
    };
  } catch (error) {
    console.error("Error fetching article:", error);
    return {
      notFound: true,
    };
  }
};
