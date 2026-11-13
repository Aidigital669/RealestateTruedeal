import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  output: "standalone",
  serverExternalPackages: ['pdf-parse', '@napi-rs/canvas', 'pg'],
  experimental: {
    turbopackPluginRuntimeStrategy: 'workerThreads',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'b2bbricksblob.azureedge.net',
      },
      {
        protocol: 'https',
        hostname: '*.azureedge.net',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '*.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
