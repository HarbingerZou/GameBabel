import { queueManager } from "./QueueManager";
import { JobData } from "./JobQueue";
import { processContent } from "../utils/content-processing";
import { ProcessedContent } from "../common.type";

export interface ContentProcessingData extends JobData {
  articleId: string;
}
// Initialize the content processing queue
export const contentProcessingQueue = queueManager.getQueue<
  ContentProcessingData,
  ProcessedContent
>("content-processing", async (data: ContentProcessingData, updateProgress) => {
  const { articleId } = data;
  const processedContent = await processContent(articleId);
  return processedContent;
});
