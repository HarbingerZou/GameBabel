import { useState, useEffect } from "react";
import type { GetServerSideProps } from "next";
import axios from "axios";
import { useRouter } from "next/router";
import { Category, Prompt } from "../../common.type";
import DeleteButton from "@/src/components/DeleteButton";

const categories: Category[] = [
  "OCR",
  "Cleaning",
  "Merging",
  "Polishing",
  "Analysis",
  "Summary",
  "Translation",
];

interface PromptsPageProps {
  initialPrompts: Prompt[];
}

export default function Prompts({ initialPrompts }: PromptsPageProps) {
  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts);
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
      const timer = setTimeout(() => setSuccess(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <div className="container mx-auto max-w-6xl mt-8 mb-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Prompt Management</h1>

      <div className="space-y-4">
        {categories.map((category) => (
          <PromptRow
            key={category}
            prompt={prompts.find(
              (prompt: Prompt) => prompt.category === category
            )}
            category={category}
            setPrompts={setPrompts}
            setSuccess={setSuccess}
            setError={setError}
          />
        ))}
      </div>

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

function PromptRow({
  prompt,
  category,
  setPrompts,
  setSuccess,
  setError,
}: {
  prompt: Prompt | undefined;
  category: Category;
  setPrompts: React.Dispatch<React.SetStateAction<Prompt[]>>;
  setSuccess: React.Dispatch<React.SetStateAction<string | null>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const router = useRouter();

  const handleDeletePrompt = async (id: string) => {
    try {
      const response = await fetch(`/api/prompt/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete prompt");

      setPrompts((prevPrompts: Prompt[]) =>
        prevPrompts.filter((p: Prompt) => p._id !== id)
      );
      setSuccess("Prompt deleted successfully");
    } catch (err) {
      setError("Error deleting prompt");
    }
  };

  if (!prompt) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold mb-2">{category}</h2>
            <p className="text-sm text-gray-500">
              No prompt found for this category
            </p>
          </div>
          <button
            onClick={() => {
              router.push(`/prompts/${category}`);
            }}
            className="border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 font-medium py-2 px-4 rounded-md transition-colors bg-white hover:bg-gray-50"
          >
            Add Prompt
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xl font-semibold">{prompt.category}</h2>
          </div>
          <div className="mt-2">
            <p className="text-xs text-gray-500">Content preview:</p>
            <p className="text-sm text-gray-700 mt-1 line-clamp-2">
              {prompt.content.substring(0, 150)}
              {prompt.content.length > 150 ? "..." : ""}
            </p>
          </div>
        </div>
        <div className="ml-4 flex gap-2">
          <button
            onClick={() => {
              router.push(`/prompts/${category}`);
            }}
            className="border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 font-medium py-2 px-4 rounded-md transition-colors bg-white hover:bg-gray-50"
          >
            Edit
          </button>
          <DeleteButton onDelete={() => handleDeletePrompt(prompt._id)} />
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const DATA_PERSISTENCE_URL =
      process.env.NEXT_PUBLIC_DATA_PERSISTENCE_URL || "http://localhost:3000";
    const response = await axios.get(`${DATA_PERSISTENCE_URL}/api/prompt`);

    return {
      props: {
        initialPrompts: response.data,
      },
    };
  } catch (error) {
    console.error("Error fetching prompts:", error);
    return {
      props: {
        initialPrompts: [],
      },
    };
  }
};
