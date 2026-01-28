import { useEffect, useState } from "react";
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
import { Translation, Language, ProcessedContent } from "../../common.type";
import parse from "html-react-parser";
import React from "react";
import ContentDisplay from "@/src/components/ContentDisplay";

interface ProcessedArticlePageProps {
  processedContent: ProcessedContent;
  translations: Translation[];
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

function ProcessedContentHeader({
  processedContent,
  onTranslate,
}: {
  processedContent: ProcessedContent;
  onTranslate: (language: Language) => void;
}) {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("english");

  const handleLanguageChange = (event: any) => {
    setSelectedLanguage(event.target.value);
  };

  const handleTranslate = () => {
    onTranslate(selectedLanguage);
  };

  const handleQueueProcess = async () => {
    try {
      const response = await fetch("/api/content-translate/queue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          processedContentId: processedContent._id,
          targetLanguage: selectedLanguage,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(
          `Job added to queue with ID: ${data.jobId}. Queue name: content-translation`
        );
      } else {
        alert("Failed to add job to queue");
      }
    } catch (error) {
      console.error("Error queueing content process:", error);
      alert("Failed to add job to queue");
    }
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
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Processed Content
        </Typography>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
          <Chip
            label={`Status: ${processedContent.status}`}
            color={
              processedContent.status === "success"
                ? "success"
                : processedContent.status === "failed"
                ? "error"
                : "warning"
            }
          />
          <Typography variant="body2" color="text.secondary">
            Quality: {processedContent.metadata.qualityScore}/10
            {processedContent.metadata.topic && ` • Topic: ${processedContent.metadata.topic}`}
            {" • "}Processed at: {new Date(processedContent.metadata.processedAt).toLocaleString()}
          </Typography>
        </Box>
      </Box>
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
            <MenuItem value="english">English</MenuItem>
            <MenuItem value="chinese">Chinese</MenuItem>
            <MenuItem value="spanish">Spanish</MenuItem>
            <MenuItem value="japanese">Japanese</MenuItem>
            <MenuItem value="french">French</MenuItem>
            <MenuItem value="russian">Russian</MenuItem>
          </Select>
        </FormControl>
        <Button variant="outlined" onClick={handleQueueProcess}>
          Queue Process
        </Button>
        <Button variant="contained" onClick={handleTranslate}>
          Translate
        </Button>
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
      const response = await fetch(`/api/translation`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          translationId,
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
        <Typography variant="h6">Translations</Typography>
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
            <Box>{parse(trans.content)}</Box>
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

function Loading() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
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
          Loading... {seconds} seconds
        </Typography>
      </Box>
    </Container>
  );
}

export default function ProcessedArticlePage({
  processedContent: initialProcessedContent,
  translations: initialTranslations,
}: ProcessedArticlePageProps) {
  const router = useRouter();
  const [processedContent] = useState<ProcessedContent>(
    initialProcessedContent
  );
  const [translations, setTranslations] =
    useState<Translation[]>(initialTranslations);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteProcessedContent = async () => {
    if (!confirm("Are you sure you want to delete this processed article?")) {
      return;
    }
    try {
      const response = await fetch(`/api/processed-article`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          processedArticleId: processedContent._id,
        }),
      });
      if (response.ok) {
        router.push("/list");
      } else {
        alert("Failed to delete processed content");
      }
    } catch (error) {
      console.error("Error deleting processed content:", error);
      alert("Failed to delete processed content");
    }
  };

  const handleContentTranslate = async (targetLanguage: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/content-translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          processedContentId: processedContent._id,
          targetLanguage,
        }),
      });
      if (response.status === 200) {
        const newTranslation = await response.json();
        if (newTranslation !== null) {
          setTranslations((prev) => [...prev, newTranslation]);
        } else {
          setError("Translation already exists");
        }
      } else {
        setError("Failed to translate content");
      }
    } catch (err) {
      console.error("Error translating content:", err);
      setError("Failed to translate content");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (error || !processedContent) {
    return (
      <Container>
        <Box sx={{ mt: 4 }}>
          <Typography color="error">{error || "Content not found"}</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Paper elevation={3} sx={{ p: 4 }}>
        <ProcessedContentHeader
          processedContent={processedContent}
          onTranslate={handleContentTranslate}
        />
        <Divider sx={{ my: 3 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <ContentDisplay
              title="Processed Content"
              content={processedContent.content}
              onDelete={handleDeleteProcessedContent}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TranslatedContent
              translations={translations}
              onTranslationsUpdate={setTranslations}
            />
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

    // Fetch processed content
    const processedContentResponse = await fetch(
      `${DATA_PERSISTENCE_URL}/api/processed-content/id/${id}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!processedContentResponse.ok) {
      if (processedContentResponse.status === 404) {
        return {
          notFound: true,
        };
      }
      throw new Error(
        `Failed to fetch processed content: ${processedContentResponse.status}`
      );
    }

    const processedContent = await processedContentResponse.json();

    // Fetch translations
    const translationsResponse = await fetch(
      `${DATA_PERSISTENCE_URL}/api/translation/${processedContent._id}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    let translations = [];
    if (translationsResponse.ok) {
      const translationsData = await translationsResponse.json();
      translations = translationsData.translations || [];
    }

    return {
      props: {
        processedContent,
        translations,
      },
    };
  } catch (error) {
    console.error("Error fetching content:", error);
    return {
      notFound: true,
    };
  }
};
