import { useState } from "react";
import type { GetServerSideProps } from "next";
import axios from "axios";
import type { Topic } from "@/src/common.type";

interface TopicPageProps {
  initialTopic: Topic | null;
}

export default function TopicPage({ initialTopic }: TopicPageProps) {
  const [topic, setTopic] = useState<Topic | null>(initialTopic);
  const [newKeywordString, setNewKeywordString] = useState("");

  if (!topic) {
    return <div className="max-w-3xl mx-auto mt-8 px-4">Topic not found</div>;
  }

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeywordString.trim()) return;

    const keywords = newKeywordString.split(",").map((k) => k.trim());
    const updatedKeywords = [...(topic.seoKeywords || []), ...keywords];
    const response = await fetch(`/api/topic/${topic._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seoKeywords: updatedKeywords }),
    });

    if (response.ok) {
      setTopic({ ...topic, seoKeywords: updatedKeywords });
      setNewKeywordString("");
    }
  };

  const handleDeleteKeyword = async (keywordToDelete: string) => {
    const updatedKeywords = topic.seoKeywords.filter((k) => k !== keywordToDelete);
    const response = await fetch(`/api/topic/${topic._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seoKeywords: updatedKeywords }),
    });

    if (response.ok) {
      setTopic({ ...topic, seoKeywords: updatedKeywords });
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{topic.name}</h1>
      <p className="text-sm text-gray-500 mb-6">
        Created: {new Date(topic.createdAt).toLocaleDateString()}
      </p>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">SEO Keywords</h2>

        <form onSubmit={handleAddKeyword} className="flex gap-4 mb-2">
          <input
            type="text"
            placeholder="Add keyword"
            value={newKeywordString}
            onChange={(e) => setNewKeywordString(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add
          </button>
        </form>
        <p className="text-xs text-gray-500 mb-4">Separate multiple keywords with commas (,)</p>

        <div className="flex flex-wrap gap-2">
          {(topic.seoKeywords || []).map((keyword) => (
            <span
              key={keyword}
              className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full"
            >
              {keyword}
              <button
                onClick={() => handleDeleteKeyword(keyword)}
                className="ml-1 text-gray-400 hover:text-red-600"
              >
                ×
              </button>
            </span>
          ))}
          {(!topic.seoKeywords || topic.seoKeywords.length === 0) && (
            <p className="text-gray-500 text-sm">No keywords added yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  try {
    const DATA_PERSISTENCE_URL =
      process.env.NEXT_PUBLIC_DATA_PERSISTENCE_URL || "http://localhost:3000";
    const response = await axios.get(`${DATA_PERSISTENCE_URL}/api/topic/${params?.id}`);
    return { props: { initialTopic: response.data } };
  } catch {
    return { props: { initialTopic: null } };
  }
};
