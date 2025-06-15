import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const DATA_PERSISTENCE_URL =
  process.env.NEXT_PUBLIC_DATA_PERSISTENCE_URL || "http://localhost:3000";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const response = await axios({
      method: req.method,
      url: `${DATA_PERSISTENCE_URL}/api/topic`,
      data: req.method === "POST" ? req.body : undefined,
      headers: {
        "Content-Type": "application/json",
      },
    });

    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error("Topic API error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: "Failed to process topic request",
      details: error.response?.data || error.message,
    });
  }
}
