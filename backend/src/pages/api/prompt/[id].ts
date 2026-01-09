import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const DATA_PERSISTENCE_URL =
  process.env.NEXT_PUBLIC_DATA_PERSISTENCE_URL || "http://localhost:3000";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  try {
    const response = await axios({
      method: req.method,
      url: `${DATA_PERSISTENCE_URL}/api/prompt/${id}`,
      data: req.method === "PUT" ? req.body : undefined,
      headers: {
        "Content-Type": "application/json",
      },
    });

    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error("Prompt API error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: "Failed to process prompt request",
      details: error.response?.data || error.message,
    });
  }
}
