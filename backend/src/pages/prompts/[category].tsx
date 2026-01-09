import { useState, useEffect } from "react";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import axios from "axios";
import { Category, Prompt } from "../../common.type";
interface CategoryPageProps {
  category: Category;
  prompt?: Prompt;
}

export default function CategoryPromptPage({
  category,
  prompt,
}: CategoryPageProps) {
  const router = useRouter();
  const [content, setContent] = useState(prompt?.content || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
        router.push("/prompts");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (prompt) {
        // Update existing prompt
        const response = await fetch(`/api/prompt/${prompt._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.details?.message || "Failed to update prompt"
          );
        }

        setSuccess("Prompt updated successfully");
      } else {
        // Create new prompt
        const response = await fetch("/api/prompt", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content,
            category,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.details?.message || "Failed to create prompt"
          );
        }

        setSuccess("Prompt created successfully");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to save prompt";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl mt-8 mb-8 px-4">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 mb-4"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold">
          {prompt ? "Edit" : "Create"} Prompt - {category}
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
      >
        <div className="mb-6">
          <label
            htmlFor="content"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Content <span className="text-red-500">*</span>
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter the prompt content"
            required
            rows={15}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading || !content.trim()}
            className="bg-gray-900 hover:bg-gray-800 text-white font-medium py-2 px-6 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Saving..." : prompt ? "Update" : "Create"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 font-medium py-2 px-6 rounded-md transition-colors bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-4 text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg">
          <div className="flex justify-between items-center">
            <span>{success}</span>
            <button
              onClick={() => setSuccess(null)}
              className="ml-4 text-green-700 hover:text-green-900"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<{
  category: Category;
  prompt: Prompt | null;
}> = async ({ params }) => {
  const categoryParam = params?.category;

  if (!categoryParam || Array.isArray(categoryParam)) {
    return {
      notFound: true,
    };
  }

  const category = categoryParam as Category;

  try {
    const DATA_PERSISTENCE_URL =
      process.env.NEXT_PUBLIC_DATA_PERSISTENCE_URL || "http://localhost:3000";
    const response = await axios.get(
      `${DATA_PERSISTENCE_URL}/api/prompt/category/${category}`
    );

    const prompt: Prompt = response.data;

    return {
      props: {
        prompt: prompt || null,
        category,
      },
    };
  } catch (error: any) {
    // If 404, prompt doesn't exist (which is fine for create mode)
    if (error.response?.status === 404) {
      return {
        props: {
          category,
          prompt: null,
        },
      };
    }

    console.error("Error fetching prompt:", error);
    return {
      props: {
        category,
        prompt: null,
      },
    };
  }
};
