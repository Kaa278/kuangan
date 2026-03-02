import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";



const globalForPrisma = global as unknown as {
    prisma: PrismaClient;
};

if (!globalForPrisma.prisma) {
    const pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL?.includes("supabase.com") || process.env.NODE_ENV === "production"
            ? { rejectUnauthorized: false }
            : false
    });
    const adapter = new PrismaPg(pool);
    globalForPrisma.prisma = new PrismaClient({
        adapter,
        log: ["error"],
    });
}

export const prisma = globalForPrisma.prisma;
