import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_SERVER } from "next/constants";
import { requireJwtSecret } from "./lib/jwt-secret";

const nextConfig: NextConfig = {
  devIndicators: false,
  // @ts-expect-error - This is a valid property in Next.js, but TypeScript doesn't recognize it yet.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default function config(phase: string): NextConfig {
  if (phase === PHASE_DEVELOPMENT_SERVER || phase === PHASE_PRODUCTION_SERVER) {
    requireJwtSecret();
  }
  return nextConfig;
}
