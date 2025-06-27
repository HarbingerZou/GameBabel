import type { NextApiRequest, NextApiResponse } from "next";
import { processContent } from "@/src/utils/content-processing";
import type { ProcessedContent } from "@/src/common.type";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const processedContent: ProcessedContent = await processContent(
      req.body.articleId
    );
    return res.status(200).json(processedContent);
  } catch (error) {
    console.error("Error processing content:", error);
    return res.status(500).json({
      error: "Failed to process content",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
