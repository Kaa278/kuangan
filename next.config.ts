import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcryptjs", "@prisma/client"],
  outputFileTracingIncludes: {
    "**/*": []
  },
  outputFileTracingExcludes: {
    "**/*": ["android/**/*", "out/**/*", "android", "out", "node_modules/@prisma/engines/**/*"]
  },
  output: "standalone",
};

export default nextConfig;
