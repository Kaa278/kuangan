import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import sharp from "sharp";
import { parseReceiptImage, AIResponse } from "@/lib/ai";

const AI_SCAN_LIMIT = 50; // per day per user

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;

    // Rate limit: 10 scans/day
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayScanCount = await prisma.aILog.count({
        where: { userId, createdAt: { gte: todayStart } },
    });

    if (todayScanCount >= AI_SCAN_LIMIT) {
        return NextResponse.json(
            { error: `Batas scan harian (${AI_SCAN_LIMIT}x) sudah tercapai. Reset besok.` },
            { status: 429 }
        );
    }

    // Parse multipart form
    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    if (!file) return NextResponse.json({ error: "Tidak ada file gambar" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Compress image: resize to max 1000px width, convert to jpeg 70%
    const compressed = await sharp(buffer)
        .resize({ width: 1000, withoutEnlargement: true })
        .jpeg({ quality: 70 })
        .toBuffer();

    const base64 = compressed.toString("base64");
    const imageSize = compressed.length;

    // Call AI Utility
    let rawResponse = "";
    let parsedSuccess = false;
    let result: AIResponse = null;

    try {
        result = await parseReceiptImage(base64);
        if (result && result.total !== null) {
            parsedSuccess = true;
        }
    } catch (err) {
        rawResponse = String(err);
    }

    // Log to DB
    await prisma.aILog.create({
        data: { userId, rawResponse, parsedSuccess, imageSize },
    });

    if (!parsedSuccess || !result) {
        return NextResponse.json(
            { error: "Gagal membaca struk. Coba foto yang lebih jelas.", raw: rawResponse },
            { status: 422 }
        );
    }

    return NextResponse.json({
        success: true,
        data: result,
        scansToday: todayScanCount + 1,
        scansLimit: AI_SCAN_LIMIT,
    });
}
