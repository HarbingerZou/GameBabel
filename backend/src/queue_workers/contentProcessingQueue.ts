import { JobQueue, JobData, JobResult } from "./JobQueue";
import { processContent } from "../utils/content-processing";
import { ProcessedContent } from "../common.type";

export interface ContentProcessingData extends JobData {
  articleId: string;
}

export interface ContentProcessingResult extends JobResult {
  articleId: string;
  processedAt: number;
  status: "success" | "failed";
  message: string;
  processedContent?: ProcessedContent;
}

export class ContentProcessingQueue {
  public static async createQueue(): Promise<
    JobQueue<ContentProcessingData, ContentProcessingResult>
  > {
    const output = await JobQueue.createQueue<
      ContentProcessingData,
      ContentProcessingResult
    >(
      "content-processing",
      async (data: ContentProcessingData, updateProgress) => {
        console.log(
          `Starting content processing for article ID: ${data.articleId}`
        );

        try {
          await updateProgress(10);
          console.log("Step 1: Validating article ID...");

          // Validate article ID
          if (!data.articleId || typeof data.articleId !== "string") {
            throw new Error("Invalid article ID provided");
          }

          await updateProgress(20);
          console.log("Step 2: Initiating content processing...");

          // Process the content
          const processedContent: ProcessedContent = await processContent(
            data.articleId
          );

          await updateProgress(80);
          console.log("Step 3: Content processed successfully");

          await updateProgress(100);
          console.log("Content processing completed successfully");

          return {
            articleId: data.articleId,
            processedAt: Date.now(),
            status: "success",
            message: "Content processed successfully",
            processedContent: processedContent,
          };
        } catch (error) {
          console.error("Content processing failed:", error);
          return {
            articleId: data.articleId,
            processedAt: Date.now(),
            status: "failed",
            message:
              error instanceof Error ? error.message : "Unknown error occurred",
          };
        }
      }
    );
    return output;
  }
}
