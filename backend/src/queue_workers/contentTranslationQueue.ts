import { JobQueue, JobData, JobResult } from "./JobQueue";
import { translateContent } from "../utils/content-translate";
import { Language, Translation } from "../common.type";

export interface ContentTranslationData extends JobData {
  processedContentId: string;
  targetLanguage: Language;
}

export interface ContentTranslationResult extends JobResult {
  processedContentId: string;
  targetLanguage: Language;
  translatedAt: number;
  status: "success" | "failed";
  message: string;
  translation?: Translation;
}

export class ContentTranslationQueue {
  public static async createQueue(): Promise<
    JobQueue<ContentTranslationData, ContentTranslationResult>
  > {
    const output = await JobQueue.createQueue<
      ContentTranslationData,
      ContentTranslationResult
    >(
      "content-translation",
      async (data: ContentTranslationData, updateProgress) => {
        console.log(
          `Starting content translation for processed content ID: ${data.processedContentId} to ${data.targetLanguage}`
        );

        try {
          await updateProgress(10);
          console.log("Step 1: Validating input parameters...");

          // Validate input parameters
          if (
            !data.processedContentId ||
            typeof data.processedContentId !== "string"
          ) {
            throw new Error("Invalid processed content ID provided");
          }

          if (!data.targetLanguage || typeof data.targetLanguage !== "string") {
            throw new Error("Invalid target language provided");
          }

          await updateProgress(20);
          console.log("Step 2: Initiating content translation...");

          // Translate the content using the translateContent function
          const translation: Translation = await translateContent(
            data.processedContentId,
            data.targetLanguage
          );

          await updateProgress(80);
          console.log("Step 3: Content translated successfully");

          await updateProgress(100);
          console.log("Content translation completed successfully");

          return {
            processedContentId: data.processedContentId,
            targetLanguage: data.targetLanguage,
            translatedAt: Date.now(),
            status: "success",
            message: "Content translated successfully",
            translation: translation,
          };
        } catch (error) {
          console.error("Content translation failed:", error);
          return {
            processedContentId: data.processedContentId,
            targetLanguage: data.targetLanguage,
            translatedAt: Date.now(),
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
