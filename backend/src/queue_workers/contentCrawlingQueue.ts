import { JobQueue, JobData, JobResult } from "./JobQueue";
import { Article } from "../common.type";

export interface ContentCrawlingData extends JobData {
  url: string;
  crawledType?: string;
}

export interface ContentCrawlingResult extends JobResult {
  url: string;
  articleId: string;
  processedAt: number;
  status: "success" | "failed";
  message: string;
  article?: Article;
}

export class ContentCrawlingQueue {
  public static async createQueue(
    crawlContent: (url: string, crawledType?: string) => Promise<Article>,
    queueNameAffix?: string
  ): Promise<JobQueue<ContentCrawlingData, ContentCrawlingResult>> {
    const output = await JobQueue.createQueue<
      ContentCrawlingData,
      ContentCrawlingResult
    >(
      `content-crawling${queueNameAffix ? `-${queueNameAffix}` : ""}`,
      async (data: ContentCrawlingData, updateProgress) => {
        console.log(`Starting content crawling for URL: ${data.url}`);

        try {
          await updateProgress(10);
          console.log("Step 1: Validating URL...");

          // Validate URL
          if (!data.url || !data.url.startsWith("http")) {
            throw new Error("Invalid URL provided");
          }

          await updateProgress(20);
          console.log("Step 2: Initiating crawler service...");

          // Call the crawler service
          const article: Article = await crawlContent(
            data.url,
            data.crawledType
          );

          await updateProgress(80);
          console.log("Step 3: Content crawled and stored successfully");

          await updateProgress(100);
          console.log("Content crawling completed successfully");

          return {
            url: data.url,
            articleId: article._id,
            processedAt: Date.now(),
            status: "success",
            message: "Content crawled and stored successfully",
            article: article,
          };
        } catch (error) {
          console.error("Content crawling failed:", error);
          return {
            url: data.url,
            articleId: "",
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
