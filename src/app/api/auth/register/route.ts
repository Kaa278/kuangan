import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
});

const DEFAULT_CATEGORIES = [
    { name: "Makanan & Minuman", type: "expense", icon: "🍜", color: "#ef4444" },
    { name: "Transportasi", type: "expense", icon: "🚗", color: "#f97316" },
    { name: "Belanja", type: "expense", icon: "🛍️", color: "#a855f7" },
    { name: "Hiburan", type: "expense", icon: "🎮", color: "#ec4899" },
    { name: "Tagihan", type: "expense", icon: "💡", color: "#eab308" },
    { name: "Kesehatan", type: "expense", icon: "💊", color: "#14b8a6" },
    { name: "Pendidikan", type: "expense", icon: "📚", color: "#3b82f6" },
    { name: "Lainnya", type: "expense", icon: "📦", color: "#6b7280" },
    { name: "Gaji", type: "income", icon: "💰", color: "#22c55e" },
    { name: "Freelance", type: "income", icon: "💻", color: "#10b981" },
    { name: "Investasi", type: "income", icon: "📈", color: "#06b6d4" },
    { name: "Lainnya", type: "income", icon: "🎁", color: "#84cc16" },
];

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = registerSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Data tidak valid", details: parsed.error.format() },
                { status: 400 }
            );
        }

        const { name, email, password } = parsed.data;

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json(
                { error: "Email sudah terdaftar" },
                { status: 409 }
            );
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                wallets: {
                    create: [
                        { name: "Dompet Utama", balance: 0, icon: "wallet", color: "#6366f1" },
                        { name: "Tabungan", balance: 0, icon: "piggy-bank", color: "#10b981" },
                    ],
                },
                categories: {
                    create: DEFAULT_CATEGORIES.map((c) => ({
                        name: c.name,
                        type: c.type as "income" | "expense",
                        icon: c.icon,
                        color: c.color,
                    })),
                },
            },
            select: { id: true, name: true, email: true },
        });

        return NextResponse.json({ user }, { status: 201 });
    } catch (err) {
        console.error("[REGISTER]", err);
        return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
    }
}
