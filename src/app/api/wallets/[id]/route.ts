import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
    name: z.string().min(1).max(50).optional(),
    icon: z.string().optional(),
    color: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const wallet = await prisma.wallet.findFirst({ where: { id, userId: session.user.id } });
    if (!wallet) return NextResponse.json({ error: "Wallet tidak ditemukan" }, { status: 404 });

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

    const updated = await prisma.wallet.update({ where: { id }, data: parsed.data });
    return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const wallet = await prisma.wallet.findFirst({ where: { id, userId: session.user.id } });
    if (!wallet) return NextResponse.json({ error: "Wallet tidak ditemukan" }, { status: 404 });

    await prisma.wallet.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
