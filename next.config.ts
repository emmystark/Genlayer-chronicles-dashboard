import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Disable Turbopack — use stable Webpack bundler instead.
  // Next.js 16 Turbopack panics on certain dependency graphs.
  turbopack: undefined,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};

export default nextConfig;