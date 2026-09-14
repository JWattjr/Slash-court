import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {},
  env: {
    NEXT_PUBLIC_SLASHCOURT_SOURCE_REVISION:
      process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_SLASHCOURT_SOURCE_REVISION || "local-candidate",
  },
};

export default nextConfig;
