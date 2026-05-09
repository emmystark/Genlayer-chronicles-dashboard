import type { NextConfig } from 'next';

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3001';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Proxy all /api/stories* and /api/stats to Express
      // Must be listed BEFORE any Next.js /api/* routes you own
      {
        source: '/api/stories/:path*',
        destination: `${BACKEND}/api/stories/:path*`,
      },
      {
        source: '/api/stats',
        destination: `${BACKEND}/api/stats`,
      },
    ];
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};

export default nextConfig;