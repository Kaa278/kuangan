import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { telegramId: true }
    });

    return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { telegramId } = await req.json();

    const user = await prisma.user.update({
        where: { id: session.user.id },
        data: { telegramId: telegramId || null }
    });

    return NextResponse.json({ success: true, telegramId: user.telegramId });
}
