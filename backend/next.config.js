/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_CRAWLER_URL: process.env.NEXT_PUBLIC_CRAWLER_URL,
    NEXT_PUBLIC_DATA_PERSISTENCE_URL: process.env.NEXT_PUBLIC_DATA_PERSISTENCE_URL,
    NEXT_PUBLIC_OCR_URL: process.env.NEXT_PUBLIC_OCR_URL,
    NEXT_PUBLIC_TRANSLATION_URL: process.env.NEXT_PUBLIC_TRANSLATION_URL,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_DATA_PERSISTENCE_URL}/api/:path*`,
      },
    ];
  },
}

module.exports = nextConfig 