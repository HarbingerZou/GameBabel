import { useState } from "react";
import { useRouter } from "next/router";

// Header Component
const Intro = () => (
  <div className="text-center mb-12">
    <h1 className="text-4xl font-bold text-gray-900 mb-4">Translayze</h1>
    <p className="text-lg text-gray-600 max-w-md mx-auto">
      Crawl, process, and translate articles from various sources with
      intelligent analysis
    </p>
  </div>
);

// Search Form Component
interface SearchFormProps {
  keyword: string;
  setKeyword: (value: string) => void;
  pageLimit: string;
  setPageLimit: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const SearchForm = ({
  keyword,
  setKeyword,
  pageLimit,
  setPageLimit,
  onSubmit,
}: SearchFormProps) => (
  <form onSubmit={onSubmit} className="mb-8">
    <div className="mb-6">
      <label
        htmlFor="keyword"
        className="block text-sm font-medium text-gray-700 mb-3"
      >
        Crawl & Process Articles
      </label>
      <div className="flex gap-3">
        <div className="relative flex-1">
          <input
            id="keyword"
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Enter keywords to crawl and process articles..."
            className="w-full px-4 py-4 pl-12 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors text-gray-900 placeholder-gray-500"
          />
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
        <div className="relative">
          <select
            id="pageLimit"
            value={pageLimit}
            onChange={(e) => setPageLimit(e.target.value)}
            className="px-4 py-4 pr-10 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors text-gray-900 bg-white appearance-none cursor-pointer min-w-[140px]"
          >
            <option value="1">1 Page</option>
            <option value="2">2 Pages</option>
            <option value="3">3 Pages</option>
            <option value="4">4 Pages</option>
            <option value="5">5 Pages</option>
            <option value="6">6 Pages</option>
            <option value="7">7 Pages</option>
            <option value="8">8 Pages</option>
            <option value="9">9 Pages</option>
            <option value="10">10 Pages</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <button
      type="submit"
      className="w-full bg-gray-900 text-white font-medium py-4 px-6 rounded-xl hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-3"
    >
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
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      Crawl & Process
    </button>
  </form>
);

// Divider Component
const Divider = () => (
  <div className="relative mb-8">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-gray-200"></div>
    </div>
    <div className="relative flex justify-center text-sm">
      <span className="px-4 bg-white text-gray-500">or</span>
    </div>
  </div>
);

// View All Button Component
interface ViewAllButtonProps {
  onClick: () => void;
}

const ViewAllButton = ({ onClick }: ViewAllButtonProps) => (
  <button
    onClick={onClick}
    className="w-full bg-white text-gray-900 font-medium py-4 px-6 rounded-xl border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-3"
  >
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
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
    View All Articles
  </button>
);

// Feature Card Component
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
  <div className="text-center">
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <h3 className="text-sm font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  </div>
);

// Features Section Component
const FeaturesSection = () => {
  const features = [
    {
      icon: (
        <svg
          className="w-6 h-6 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"
          />
        </svg>
      ),
      title: "Multi-Source Crawling",
      description: "Extract content from various platforms and sources",
    },
    {
      icon: (
        <svg
          className="w-6 h-6 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
          />
        </svg>
      ),
      title: "Intelligent Translation",
      description: "AI-powered translation with context preservation",
    },
    {
      icon: (
        <svg
          className="w-6 h-6 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      title: "Content Analysis",
      description: "Summarize and analyze content automatically",
    },
  ];

  return (
    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
      {features.map((feature, index) => (
        <FeatureCard
          key={index}
          icon={feature.icon}
          title={feature.title}
          description={feature.description}
        />
      ))}
    </div>
  );
};

// Search Popup Component
interface SearchPopupProps {
  show: boolean;
  message: string;
}

const SearchPopup = ({ show, message }: SearchPopupProps) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md mx-4 shadow-2xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Search in Progress
          </h3>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex justify-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Content Card Component
interface MainContentCardProps {
  keyword: string;
  setKeyword: (value: string) => void;
  pageLimit: string;
  setPageLimit: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onViewAll: () => void;
}

const MainContentCard = ({
  keyword,
  setKeyword,
  pageLimit,
  setPageLimit,
  onSubmit,
  onViewAll,
}: MainContentCardProps) => (
  <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
    <SearchForm
      keyword={keyword}
      setKeyword={setKeyword}
      pageLimit={pageLimit}
      setPageLimit={setPageLimit}
      onSubmit={onSubmit}
    />
    <Divider />
    <ViewAllButton onClick={onViewAll} />
  </div>
);

// Main Home Component
export default function Home() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [pageLimit, setPageLimit] = useState("1");
  const [showPopup, setShowPopup] = useState(false);
  const [searchMessage, setSearchMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      setShowPopup(true);
      setSearchMessage(
        `Searching for articles with keyword: "${keyword.trim()}" for ${pageLimit} pages`
      );

      try {
        // Call the search API to trigger crawl and process
        const response = await fetch("/api/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            keyword: keyword.trim(),
            pageLimit: parseInt(pageLimit),
          }),
        });

        if (response.ok) {
          const result = await response.json();
          setSearchMessage(`Search completed! ${result.message}`);
          // Navigate to list page after a short delay
          setTimeout(() => {
            setShowPopup(false);
          }, 2000);
        } else {
          setSearchMessage("Search failed. Please try again.");
        }
      } catch (error) {
        console.error("Error performing search:", error);
        setSearchMessage("Search failed. Please try again.");
      }
    } else {
      router.push("/list");
    }
  };

  const handleViewAll = () => {
    router.push("/list");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Intro />
        <MainContentCard
          keyword={keyword}
          setKeyword={setKeyword}
          pageLimit={pageLimit}
          setPageLimit={setPageLimit}
          onSubmit={handleSubmit}
          onViewAll={handleViewAll}
        />
        <FeaturesSection />
      </div>
      <SearchPopup show={showPopup} message={searchMessage} />
    </div>
  );
}
