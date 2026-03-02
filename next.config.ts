import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcryptjs", "@prisma/client", "pg", "@prisma/adapter-pg"],
  output: "standalone",
};

export default nextConfig;
