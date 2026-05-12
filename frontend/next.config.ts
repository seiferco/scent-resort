import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@scentresort/shared'],
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3002',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'scent-resort-backend.vercel.app',
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;
