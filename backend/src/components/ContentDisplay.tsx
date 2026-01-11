import { Box, Typography } from "@mui/material";
import { useState } from "react";
import DeleteButton from "./DeleteButton";
import Toggle from "./Toggle";
import parse from "html-react-parser";

interface ContentDisplayProps {
  title: string;
  content: string;
  onDelete: () => void;
}

export default function ContentDisplay({
  title,
  content,
  onDelete,
}: ContentDisplayProps) {
  const [viewMode, setViewMode] = useState<"rendered" | "raw">("rendered");

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

        <div className="flex items-center gap-2">
          <Toggle
            value={viewMode}
            onChange={setViewMode}
            leftValue="rendered"
            rightValue="raw"
            leftLabel="Rendered"
            rightLabel="Raw HTML"
          />
          <DeleteButton onDelete={onDelete} />
        </div>
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
        <FormatContent content={content} viewMode={viewMode} />
      </Box>
    </Box>
  );
}

interface FormatContentProps {
  content: string;
  viewMode: "rendered" | "raw";
}

function FormatContent({ content, viewMode }: FormatContentProps) {
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
}
