import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcryptjs", "@prisma/client", "@prisma/adapter-pg", "pg"],
};

export default nextConfig;
