import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable Turbopack (IMPORTANT)
  // turbo: {
  //   enabled: false
  // },

  // environment variables
  env: {
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    UPSTASH_REDIS_URL: process.env.UPSTASH_REDIS_URL,
  },

  // Webpack fallback fixes
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        path: false,
        os: false,
        stream: false,
      };
    }
    return config;
  },

  // pnpm workspace packages to transpile
  transpilePackages: [
    '@workspace/database',
    '@workspace/lib',
    '@workspace/ui'
  ],
};

export default nextConfig;


