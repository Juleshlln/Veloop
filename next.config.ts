import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Inspection photos are compressed client-side (~300 KB) but need
      // headroom above the 1 MB default.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
