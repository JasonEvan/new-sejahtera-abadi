import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // @ts-expect-error - This is a valid property in Next.js, but TypeScript doesn't recognize it yet.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
