import { JobQueue, JobData, JobResult } from "./JobQueue";

export interface TestProcessingData extends JobData {
  testId: string;
  message?: string;
}

export interface TestProcessingResult extends JobResult {
  testId: string;
  processedAt: number;
  message: string;
}

export class TestProcessingQueue extends JobQueue<
  TestProcessingData,
  TestProcessingResult
> {
  constructor() {
    super("test-processing");

    // Set up the processor for this queue
    this.setProcessor(async (data: TestProcessingData, updateProgress) => {
      console.log(`Starting test processing for testId: ${data.testId}`);

      await updateProgress(0);
      console.log("Test step 1: Initializing...");

      // Simulate some processing time
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await updateProgress(25);
      console.log("Test step 2: Processing data...");

      await new Promise((resolve) => setTimeout(resolve, 1000));
      await updateProgress(50);
      console.log("Test step 3: Validating results...");

      await new Promise((resolve) => setTimeout(resolve, 1000));
      await updateProgress(75);
      console.log("Test step 4: Finalizing...");

      await new Promise((resolve) => setTimeout(resolve, 500));
      await updateProgress(100);
      console.log("Test processing completed successfully");

      return {
        testId: data.testId,
        processedAt: Date.now(),
        message: data.message || "Test processing completed successfully",
      };
    });
  }
}
