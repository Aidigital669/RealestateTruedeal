import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  output: "standalone",
  poweredByHeader: false,
  trailingSlash: false,
  compress: true,
  serverExternalPackages: ['pdf-parse', '@napi-rs/canvas', 'pg'],
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'lodash',
      'xlsx',
    ],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
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
  async headers() {
    if (process.env.NODE_ENV !== 'production') {
      return [];
    }
    return [
      {
        source: '/:all*(svg|jpg|png|webp|avif|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
