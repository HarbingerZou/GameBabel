import Link from "next/link";

export default function Header() {
  return (
    <div className="bg-gray-800 px-8 py-4">
      <Link href="/" className="text-white text-2xl font-bold">
        translayze
      </Link>
    </div>
  );
}
