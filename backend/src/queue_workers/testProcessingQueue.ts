import { queueManager } from "./QueueManager";
import { JobData, JobResult } from "./JobQueue";

export interface TestProcessingData extends JobData {
  testId: string;
}
export interface TestProcessingResult extends JobResult {
  testId: string;
}
// Initialize the content processing queue
export const testProcessingQueue = queueManager.getQueue<
  TestProcessingData,
  TestProcessingResult
>("test-processing", async (data: TestProcessingData, updateProgress) => {
  await updateProgress(0);
  console.log("test 1");
  await updateProgress(50);
  console.log("test 2");
  await updateProgress(100);
  console.log("test 3");
  return {
    testId: data.testId,
  };
});
