import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const transactionSchema = z.object({
    amount: z.number().positive(),
    type: z.enum(["income", "expense"]),
    categoryId: z.string(),
    walletId: z.string(),
    note: z.string().optional(),
    store: z.string().optional(),
    date: z.string().optional(),
    source: z.enum(["manual", "ai_scan"]).default("manual"),
});

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const type = searchParams.get("type") as "income" | "expense" | null;
    const walletId = searchParams.get("walletId");
    const categoryId = searchParams.get("categoryId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {
        userId: session.user.id,
        ...(type && { type }),
        ...(walletId && { walletId }),
        ...(categoryId && { categoryId }),
    };

    if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate);
        if (endDate) where.date.lte = new Date(endDate);
    }

    const [transactions, total, totals] = await Promise.all([
        prisma.transaction.findMany({
            where,
            include: { category: true, wallet: true },
            orderBy: { date: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.transaction.count({ where }),
        prisma.transaction.groupBy({
            where,
            by: ["type"],
            _sum: { amount: true },
        }),
    ]);

    const income = totals.find(t => t.type === "income")?._sum.amount ?? 0;
    const expense = totals.find(t => t.type === "expense")?._sum.amount ?? 0;

    return NextResponse.json({ transactions, total, page, limit, income, expense });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = transactionSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Data tidak valid", details: parsed.error.format() }, { status: 400 });

    const { amount, type, categoryId, walletId, note, store, date, source } = parsed.data;

    // Verify ownership
    const [category, wallet] = await Promise.all([
        prisma.category.findFirst({ where: { id: categoryId, userId: session.user.id } }),
        prisma.wallet.findFirst({ where: { id: walletId, userId: session.user.id } }),
    ]);

    if (!category) return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
    if (!wallet) return NextResponse.json({ error: "Wallet tidak ditemukan" }, { status: 404 });

    // Atomic transaction: insert + update balance
    const balanceDelta = type === "income" ? amount : -amount;

    const [transaction] = await prisma.$transaction([
        prisma.transaction.create({
            data: {
                amount,
                type,
                categoryId,
                walletId,
                note,
                store,
                date: date ? new Date(date) : new Date(),
                source,
                userId: session.user.id,
            },
            include: { category: true, wallet: true },
        }),
        prisma.wallet.update({
            where: { id: walletId },
            data: { balance: { increment: balanceDelta } },
        }),
    ]);

    return NextResponse.json(transaction, { status: 201 });
}
