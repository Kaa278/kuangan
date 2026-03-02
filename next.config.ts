import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcryptjs", "@prisma/client", "@prisma/adapter-pg", "pg"],
  outputFileTracingIncludes: {
    "**/*": []
  },
  outputFileTracingExcludes: {
    "**/*": ["android/**/*", "out/**/*", "android", "out"]
  }
};

export default nextConfig;
