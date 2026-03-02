import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";



const globalForPrisma = global as unknown as {
    prisma: PrismaClient;
};

let prismaInstance: PrismaClient;

if (globalForPrisma.prisma) {
    prismaInstance = globalForPrisma.prisma;
} else {
    const pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
    });
    const adapter = new PrismaPg(pool);
    prismaInstance = new PrismaClient({
        adapter,
        log: ["error"],
    });

    if (process.env.NODE_ENV !== "production") {
        globalForPrisma.prisma = prismaInstance;
    }
}

export const prisma = prismaInstance;
