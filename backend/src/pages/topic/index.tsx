import { useState } from "react";
import type { GetServerSideProps } from "next";
import Link from "next/link";
import axios from "axios";
import type { Topic } from "@/src/common.type";

interface TopicsPageProps {
  initialTopics: Topic[];
}

export default function Topics({ initialTopics }: TopicsPageProps) {
  const [topics, setTopics] = useState<Topic[]>(initialTopics);
  const [newTopic, setNewTopic] = useState("");

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch("/api/topic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTopic }),
    });
    if (response.ok) {
      const newTopicData = await response.json();
      setTopics([...topics, newTopicData]);
      setNewTopic("");
    }
  };

  const handleDeleteTopic = async (id: string) => {
    const response = await fetch(`/api/topic/${id}`, { method: "DELETE" });
    if (response.ok) {
      setTopics(topics.filter((topic) => topic._id !== id));
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Topic Management</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <form onSubmit={handleCreateTopic} className="flex gap-4">
          <input
            type="text"
            placeholder="New Topic"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            required
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
        {topics.map((topic) => (
          <div key={topic._id} className="flex items-center justify-between px-6 py-4">
            <Link href={`/topic/${topic._id}`} className="hover:opacity-75">
              <p className="text-gray-900 font-medium">{topic.name}</p>
              <p className="text-sm text-gray-500">
                {new Date(topic.createdAt).toLocaleDateString()}
              </p>
            </Link>
            <button
              onClick={() => handleDeleteTopic(topic._id)}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const DATA_PERSISTENCE_URL =
      process.env.NEXT_PUBLIC_DATA_PERSISTENCE_URL || "http://localhost:3000";
    const response = await axios.get(`${DATA_PERSISTENCE_URL}/api/topic`);

    return {
      props: {
        initialTopics: response.data,
      },
    };
  } catch (error) {
    console.error("Error fetching topics:", error);
    return {
      props: {
        initialTopics: [],
      },
    };
  }
};
