import { NextApiRequest, NextApiResponse } from "next";
import {
  TestProcessingQueue,
  TestProcessingData,
  TestProcessingResult,
} from "../../../queue_workers/testProcessingQueue";
import { JobQueue } from "@/src/queue_workers/JobQueue";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Create a new instance of the test processing queue
    const testProcessingQueue: JobQueue<
      TestProcessingData,
      TestProcessingResult
    > = await TestProcessingQueue.createQueue();

    // Generate a unique test ID
    const testId = `test-${Date.now()}`;

    // Add a job to the test processing queue
    const job = await testProcessingQueue.addJob("test-processing", {
      testId,
    });

    res.status(200).json({
      success: true,
      jobId: job.id,
      testId,
      message: "Test processing job added to queue",
    });
  } catch (error) {
    console.error("Error triggering test processing queue:", error);
    res.status(500).json({
      success: false,
      error: "Failed to trigger test processing queue",
    });
  }
}
