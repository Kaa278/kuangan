import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const categorySchema = z.object({
    name: z.string().min(1).max(50),
    type: z.enum(["income", "expense"]),
    color: z.string().default("#6366f1"),
    icon: z.string().default("tag"),
});

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const categories = await prisma.category.findMany({
        where: { userId: session.user.id },
        orderBy: [{ type: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

    const category = await prisma.category.create({
        data: { ...parsed.data, userId: session.user.id },
    });
    return NextResponse.json(category, { status: 201 });
}
