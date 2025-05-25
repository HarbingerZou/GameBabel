import type { NextApiRequest, NextApiResponse } from "next";

const DATA_PERSISTENCE_URL =
  process.env.NEXT_PUBLIC_DATA_PERSISTENCE_URL ||
  "http://data-persistence:3000";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "DELETE") {
    try {
      const { processedContentId, targetLanguage } = req.body;

      if (!processedContentId || !targetLanguage) {
        return res.status(400).json({
          error: "Missing required fields",
          details: "contentId and targetLanguage are required",
        });
      }

      const deleteResponse = await fetch(
        `${DATA_PERSISTENCE_URL}/api/translation/${processedContentId}/${targetLanguage}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!deleteResponse.ok) {
        throw new Error(
          `Failed to delete translation: ${deleteResponse.statusText}`
        );
      }

      return res
        .status(200)
        .json({ message: "Translation deleted successfully" });
    } catch (error) {
      console.error("Error deleting translation:", error);
      return res.status(500).json({
        error: "Failed to delete translation",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
