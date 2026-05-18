import Link from "next/link";

export default function Header() {
  return (
    <div className="bg-gray-800 px-8 py-4">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-white text-2xl font-bold">
          Translayze
        </Link>
        <nav className="flex items-center space-x-6">
          <Link
            href="/topic"
            className="text-gray-300 hover:text-white transition-colors"
          >
            Topics
          </Link>
          <Link
            href="/prompts"
            className="text-gray-300 hover:text-white transition-colors"
          >
            Prompts
          </Link>
          <Link
            href="/queues"
            className="text-gray-300 hover:text-white transition-colors"
          >
            Queues
          </Link>
        </nav>
      </div>
    </div>
  );
}
