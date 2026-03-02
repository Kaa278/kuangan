import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcryptjs", "@prisma/client", "@prisma/adapter-pg", "pg"],
  outputFileTracingIncludes: {
    "**/*": []
  },
  outputFileTracingExcludes: {
    "**/*": ["android/**/*", "out/**/*", "android", "out", "node_modules/@prisma/engines/**/*"]
  }
};

export default nextConfig;
