import type { NextApiRequest, NextApiResponse } from "next";

const DATA_PERSISTENCE_URL =
  process.env.NEXT_PUBLIC_DATA_PERSISTENCE_URL ||
  "http://data-persistence:3000";

interface DeleteProcessedArticleRequest {
  articleId?: string;
  processedArticleId?: string;
}
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "DELETE") {
    try {
      const { articleId, processedArticleId }: DeleteProcessedArticleRequest =
        req.body;

      if (!articleId && !processedArticleId) {
        return res.status(400).json({
          error: "Missing required fields",
          details: "Either articleId or processedArticleId is required",
        });
      }

      let deleteUrl: string;
      if (articleId) {
        // Delete by contentId (articleId)
        deleteUrl = `${DATA_PERSISTENCE_URL}/api/processed-content/${articleId}`;
      } else {
        // Delete by processed content id
        deleteUrl = `${DATA_PERSISTENCE_URL}/api/processed-content/id/${processedArticleId}`;
      }

      const deleteResponse = await fetch(deleteUrl, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
        },
      });

      if (!deleteResponse.ok) {
        throw new Error(
          `Failed to delete processed article: ${deleteResponse.statusText}`
        );
      }

      return res
        .status(200)
        .json({ message: "Processed article deleted successfully" });
    } catch (error) {
      console.error("Error deleting processed article:", error);
      return res.status(500).json({
        error: "Failed to delete processed article",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
