import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcryptjs", "@prisma/client", "@prisma/adapter-pg", "pg", "sharp"],
  outputFileTracingIncludes: {
    "**/*": []
  },
  experimental: {
    outputFileTracingExcludes: {
      "**/*": ["android/**/*", "out/**/*", "android", "out"]
    }
  }
};

export default nextConfig;
