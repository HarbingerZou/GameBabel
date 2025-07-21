import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { Article, ProcessedContent } from "../common.type";
import { GetServerSideProps } from "next";

interface HomeProps {
  initialArticles: Article[];
  processedContents: { [key: string]: ProcessedContent };
  currentPage: number;
  totalPages: number;
  totalArticles: number;
}

// Input Form Component
interface InputFormProps {
  onSubmit: (
    url: string,
    processingType: "default" | "queued"
  ) => Promise<void>;
  loading: boolean;
}

function InputForm({ onSubmit, loading }: InputFormProps) {
  const [newUrl, setNewUrl] = useState("");
  const [processingType, setProcessingType] = useState<"default" | "queued">(
    "default"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;

    await onSubmit(newUrl, processingType);
    setNewUrl("");
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
          <div>
            <label
              htmlFor="url"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Article URL
            </label>
            <input
              id="url"
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
            />
          </div>
          <div>
            <label
              htmlFor="processing-type"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Processing Type
            </label>
            <select
              id="processing-type"
              value={processingType}
              onChange={(e) =>
                setProcessingType(e.target.value as "default" | "queued")
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
            >
              <option value="default">Immediate Processing</option>
              <option value="queued">Queued Processing</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading || !newUrl}
            className="w-full lg:w-auto px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Process Article
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// Article Entry Component
interface ArticleEntryProps {
  article: Article;
  processedContent?: ProcessedContent;
  onViewArticle: (id: string) => void;
  onViewProcessedArticle: (id: string) => void;
}

function ArticleEntry({
  article,
  processedContent,
  onViewArticle,
  onViewProcessedArticle,
}: ArticleEntryProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "failed":
        return "bg-red-50 text-red-700 border-red-200";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <div className="text-sm font-medium text-gray-900 mb-1">
            {article.title || "Untitled"}
          </div>
          <div className="text-sm text-gray-500">
            {new Date(article.metadata.crawledAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-gray-600 hover:text-gray-900 transition-colors truncate block max-w-xs"
        >
          {article.url}
        </a>
      </td>
      <td className="px-6 py-4">
        {processedContent ? (
          <span
            className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
              processedContent.status
            )}`}
          >
            {processedContent.status}
          </span>
        ) : (
          <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 border border-gray-200">
            Not Processed
          </span>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="flex space-x-2">
          <button
            onClick={() => onViewArticle(article._id)}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-md hover:border-gray-400"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            View Article
          </button>
          {processedContent && (
            <button
              onClick={() => onViewProcessedArticle(processedContent._id)}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-md hover:border-gray-400"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              View Processed
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function EmptyArticleList() {
  return (
    <div className="text-center py-12">
      <svg
        className="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <h3 className="mt-2 text-sm font-medium text-gray-900">No articles</h3>
      <p className="mt-1 text-sm text-gray-500">
        Get started by processing your first article.
      </p>
    </div>
  );
}

// Article List Component
interface ArticleListProps {
  articles: Article[];
  processedContents: { [key: string]: ProcessedContent };
  totalArticles: number;
}

function ArticleList({
  articles,
  processedContents,
  totalArticles,
}: ArticleListProps) {
  const router = useRouter();

  const onViewArticle = (id: string) => {
    router.push(`/article/${id}`);
  };

  const onViewProcessedArticle = (id: string) => {
    router.push(`/processed-article/${id}`);
  };
  return (
    <div className="bg-white border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Articles ({totalArticles})
        </h2>
      </div>

      {articles.length === 0 ? (
        <EmptyArticleList />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    Article
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    Source
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {articles.map((article) => (
                  <ArticleEntry
                    key={article._id}
                    article={article}
                    processedContent={processedContents[article._id]}
                    onViewArticle={onViewArticle}
                    onViewProcessedArticle={onViewProcessedArticle}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// Pagination Component
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalArticles: number;
}

function Pagination({
  currentPage,
  totalPages,
  totalArticles,
}: PaginationProps) {
  const router = useRouter();
  const handlePageChange = (page: number) => {
    // Use window.location.href to trigger full page reload
    router.push(`/list?page=${page}`);
  };
  return (
    <div className="px-6 py-4 border-t border-gray-200">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Page {currentPage} of {totalPages} ({totalArticles} total articles)
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          <div className="flex items-center space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentPage === page
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function ErrorMessage({ error }: { error: string }) {
  if (!error) return null;

  return (
    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex">
        <svg
          className="w-5 h-5 text-red-400 mr-2 mt-0.5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
        <p className="text-red-800 font-medium">{error}</p>
      </div>
    </div>
  );
}

// Main Home Component
export default function Home({
  initialArticles,
  processedContents,
  currentPage,
  totalPages,
  totalArticles,
}: HomeProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (
    url: string,
    processingType: "default" | "queued"
  ) => {
    setLoading(true);
    setError("");

    try {
      if (processingType === "queued") {
        // Send to queue endpoint
        const queueResponse = await axios.post("/api/content-crawl/queue", {
          url: url,
        });
        // For queued processing, we don't add to articles list immediately
        // The article will appear when the queue processing completes
        console.log("Job added to queue:", queueResponse.data);
      } else {
        // Send to default endpoint for immediate processing
        const articleResponse = await axios.post("/api/content-crawl", {
          url: url,
        });
        if (articleResponse.data !== null) {
          // Refresh the page to show the new article
          window.location.reload();
        } else {
          setError("Article already exists");
        }
      }
    } catch (err) {
      setError("Failed to process article");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Article Management
          </h1>
          <p className="text-gray-600">
            Process and manage articles from various sources
          </p>
        </div>

        {/* Input Form */}
        <InputForm onSubmit={handleSubmit} loading={loading} />

        {/* Error Message */}
        <ErrorMessage error={error} />

        {/* Articles List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <ArticleList
            articles={initialArticles}
            processedContents={processedContents}
            totalArticles={totalArticles}
          />

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalArticles={totalArticles}
          />
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const DATA_PERSISTENCE_URL =
      process.env.NEXT_PUBLIC_DATA_PERSISTENCE_URL ||
      "http://data-persistence:3000";

    // Get page from query parameters, default to 1
    const page = parseInt(context.query.page as string) || 1;
    const limit = 20; // Articles per page

    const response = await fetch(
      `${DATA_PERSISTENCE_URL}/api/content?page=${page}&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch articles");
    }

    const data = await response.json();
    const articles = data.contents;
    const totalArticles = data.total;
    const totalPages = data.totalPages;
    const currentPage = data.page;

    // Fetch processed content for each article
    const processedContents: { [key: string]: ProcessedContent } = {};
    await Promise.all(
      articles.map(async (article: Article) => {
        try {
          const processedResponse = await fetch(
            `${DATA_PERSISTENCE_URL}/api/processed-content/${article._id}`
          );
          if (processedResponse.ok) {
            const processedContent = await processedResponse.json();
            processedContents[article._id] = processedContent;
          }
        } catch (error) {
          console.error(
            `Error fetching processed content for article ${article._id}:`,
            error
          );
        }
      })
    );

    return {
      props: {
        initialArticles: articles,
        processedContents,
        currentPage,
        totalPages,
        totalArticles,
      },
    };
  } catch (error) {
    console.error("Error fetching articles:", error);
    return {
      props: {
        initialArticles: [],
        processedContents: {},
        currentPage: 1,
        totalPages: 1,
        totalArticles: 0,
      },
    };
  }
};
