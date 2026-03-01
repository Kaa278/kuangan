import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const walletSchema = z.object({
    name: z.string().min(1).max(50),
    balance: z.number().default(0),
    icon: z.string().default("wallet"),
    color: z.string().default("#6366f1"),
});

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const wallets = await prisma.wallet.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(wallets);
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = walletSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

    const wallet = await prisma.wallet.create({
        data: { ...parsed.data, userId: session.user.id },
    });

    return NextResponse.json(wallet, { status: 201 });
}
