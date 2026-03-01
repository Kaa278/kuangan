import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
    amount: z.number().positive().optional(),
    type: z.enum(["income", "expense"]).optional(),
    categoryId: z.string().optional(),
    walletId: z.string().optional(),
    note: z.string().optional().nullable(),
    store: z.string().optional().nullable(),
    date: z.string().optional(),
});

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const tx = await prisma.transaction.findFirst({ where: { id, userId: session.user.id } });
    if (!tx) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

    // Revert the effect on balance (opposite of what was applied)
    const balanceDelta = tx.type === "income" ? -Number(tx.amount) : Number(tx.amount);

    await prisma.$transaction([
        prisma.transaction.delete({ where: { id } }),
        prisma.wallet.update({
            where: { id: tx.walletId },
            data: { balance: { increment: balanceDelta } },
        }),
    ]);

    return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const tx = await prisma.transaction.findFirst({ where: { id, userId: session.user.id } });
    if (!tx) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

    const { amount, type, walletId, ...rest } = parsed.data;

    // Revert old balance, apply new balance atomically (plain numbers)
    const oldDelta = tx.type === "income" ? -Number(tx.amount) : Number(tx.amount);
    const newAmount = amount ?? Number(tx.amount);
    const newType = type ?? tx.type;
    const newDelta = newType === "income" ? newAmount : -newAmount;
    const targetWalletId = walletId ?? tx.walletId;

    const [updated] = await prisma.$transaction([
        prisma.transaction.update({
            where: { id },
            data: {
                ...rest,
                ...(amount !== undefined && { amount }),
                ...(type !== undefined && { type }),
                ...(walletId !== undefined && { walletId }),
                ...(rest.date && { date: new Date(rest.date) }),
            },
            include: { category: true, wallet: true },
        }),
        // revert old
        prisma.wallet.update({ where: { id: tx.walletId }, data: { balance: { increment: oldDelta } } }),
        // apply new
        prisma.wallet.update({ where: { id: targetWalletId }, data: { balance: { increment: newDelta } } }),
    ]);

    return NextResponse.json(updated);
}
