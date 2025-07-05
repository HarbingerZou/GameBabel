//This file is used to create a new article through the crawler service
//It is called when the user submits a new URL in the frontend
import { crawlContent } from "@/src/utils/content-crawling";
import { Article } from "@/src/common.type";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { url } = req.body;
      if (!url) {
        throw new Error("URL is required");
      }

      const storedContent: Article = await crawlContent(url);
      return res.status(201).json(storedContent);
    } catch (error) {
      console.error("Error creating content:", error);
      return res.status(500).json({
        error: "Failed to create content",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } else {
    return res.status(405).json({ message: "Method not allowed" });
  }
}
