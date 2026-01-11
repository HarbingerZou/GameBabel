import type { NextApiRequest, NextApiResponse } from "next";

const DATA_PERSISTENCE_URL =
  process.env.NEXT_PUBLIC_DATA_PERSISTENCE_URL ||
  "http://data-persistence:3000";

interface DeleteArticleRequest {
  articleId?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "DELETE") {
    try {
      const { articleId }: DeleteArticleRequest = req.body;

      if (!articleId) {
        return res.status(400).json({
          error: "Missing required fields",
          details: "articleId is required",
        });
      }

      const deleteResponse = await fetch(
        `${DATA_PERSISTENCE_URL}/api/content/${articleId}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!deleteResponse.ok) {
        throw new Error(
          `Failed to delete article: ${deleteResponse.statusText}`
        );
      }

      return res.status(200).json({ message: "Article deleted successfully" });
    } catch (error) {
      console.error("Error deleting article:", error);
      return res.status(500).json({
        error: "Failed to delete article",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
