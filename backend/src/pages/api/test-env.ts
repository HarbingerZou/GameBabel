import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  // Return all environment variables
  res.status(200).json({
    env: process.env,
  });
}
