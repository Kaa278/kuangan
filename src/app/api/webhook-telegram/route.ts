import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseReceiptImage, parseTransactionText, AIResponse } from "@/lib/ai";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Handle incoming webhook from Telegram
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log("📥 Incoming Telegram Webhook:", JSON.stringify(body, null, 2));

        // Ensure this is a message from a chat
        if (!body.message || !body.message.chat) {
            console.log("⚠️ Not a chat message, skipping.");
            return NextResponse.json({ success: true, message: "Not a chat message" });
        }

        const chatId = String(body.message.chat.id);
        const text = body.message.text;
        const photo = body.message.photo;
        const caption = body.message.caption;

        // Find user by Telegram ID
        console.log(`🔍 Finding user with chatId: ${chatId}`);
        const user = await prisma.user.findFirst({
            where: { telegramId: chatId },
            include: { wallets: true, categories: true }
        });

        // If user hasn't linked their account yet
        if (!user) {
            console.log(`❌ User not found for chatId: ${chatId}`);
            await sendTelegramMessage(chatId, `❌ Akun Anda belum tertaut dengan KuAngan.\n\nSilakan buka menu **Pengaturan** di aplikasi KuAngan, lalu masukkan **Telegram ID** Anda: \`${chatId}\``);
            return NextResponse.json({ success: true, message: "Unregistered user" });
        }
        console.log(`✅ User found: ${user.name} (id: ${user.id})`);

        // --- Logic Branching ---
        if (photo && photo.length > 0) {
            await sendTelegramMessage(chatId, "📸 Memproses gambar struk Anda...");
            const fileId = photo[photo.length - 1].file_id;

            // Get file path from Telegram
            const fileRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`);
            const fileData = await fileRes.json();

            if (fileData.ok) {
                const filePath = fileData.result.file_path;
                const url = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;

                // Download and convert to base64
                const imgRes = await fetch(url);
                const arrayBuffer = await imgRes.arrayBuffer();
                const base64 = Buffer.from(arrayBuffer).toString("base64");

                const result = await parseReceiptImage(base64);
                await handleAIResult(chatId, user, result);
            } else {
                await sendTelegramMessage(chatId, "❌ Gagal mengunduh gambar. Silakan coba lagi.");
            }

        } else if (text) {
            if (text.startsWith("/start")) {
                await sendTelegramMessage(chatId, `✅ Berhasil terhubung, ${user.name || "User"}!\n\nKirim pengeluaran Anda dalam teks (contoh: "Beli kopi 25rb") atau kirim foto struk belanja untuk diproses oleh Kathlyn.`);
                return NextResponse.json({ success: true });
            }

            console.log(`📝 Processing text: "${text}"`);
            await sendTelegramMessage(chatId, "📝 Memproses transaksi Anda...");
            const result = await parseTransactionText(text);
            console.log("🤖 AI Result (Text):", JSON.stringify(result, null, 2));
            await handleAIResult(chatId, user, result);
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("Telegram Webhook Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

async function handleAIResult(chatId: string, user: any, result: AIResponse) {
    if (!result || !result.total) {
        await sendTelegramMessage(chatId, "❌ Maaf, Kathlyn tidak dapat mengenali transaksi tersebut. Pastikan teks atau foto cukup jelas.");
        return;
    }

    // Default Wallet (first one)
    const wallet = user.wallets[0];
    if (!wallet) {
        await sendTelegramMessage(chatId, "❌ Anda belum memiliki Wallet. Silakan buat di aplikasi.");
        return;
    }

    // Try to match category
    let category = user.categories.find((c: any) =>
        c.name.toLowerCase().includes(result.store?.toLowerCase() || "") ||
        c.name.toLowerCase().includes(result.note?.toLowerCase() || "")
    );

    // If no match, pick first of same type, or first available
    if (!category) {
        category = user.categories.find((c: any) => c.type === (result.type || "expense")) || user.categories[0];
    }

    if (!category) {
        await sendTelegramMessage(chatId, "❌ Anda belum memiliki Kategori. Silakan buat di aplikasi.");
        return;
    }

    // Save Transaction
    const amount = result.total;
    const type = result.type || "expense";
    const balanceDelta = type === "income" ? amount : -amount;

    await prisma.$transaction([
        prisma.transaction.create({
            data: {
                amount,
                type: type as any,
                categoryId: category.id,
                walletId: wallet.id,
                note: result.note || result.store,
                store: result.store,
                date: result.date ? new Date(result.date) : new Date(),
                source: "ai_scan",
                userId: user.id,
            }
        }),
        prisma.wallet.update({
            where: { id: wallet.id },
            data: { balance: { increment: balanceDelta } },
        }),
    ]);

    const formattedAmount = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(amount);
    await sendTelegramMessage(chatId, `✅ **Transaksi Berhasil Dicatat!**\n\n💰 Jumlah: ${formattedAmount}\n📝 Hub: ${result.note || result.store || "-"}\n📂 Kat: ${category.name}\n💳 Wallet: ${wallet.name}\n\n_Data diproses otomatis oleh Kathlyn._`);
}

// Helper to reply back to the Telegram chat
async function sendTelegramMessage(chatId: string, text: string) {
    if (!TELEGRAM_BOT_TOKEN) return;

    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: "Markdown"
        }),
    });

    if (!res.ok) {
        const errData = await res.json();
        console.error("❌ Failed to send Telegram message:", errData);
    }
}
