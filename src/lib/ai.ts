import { z } from "zod";

export const aiResponseSchema = z.object({
    store: z.string().nullable().optional(),
    total: z.number().nullable(),
    date: z.string().nullable().optional(),
    items: z.array(z.object({ name: z.string(), price: z.number() })).optional(),
    currency: z.string().optional(),
    type: z.enum(["income", "expense"]).optional(),
    note: z.string().nullable().optional(),
}).nullable();

export type AIResponse = z.infer<typeof aiResponseSchema>;

export async function parseReceiptImage(base64Image: string): Promise<AIResponse> {
    const openrouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.NEXTAUTH_URL ?? "http://localhost:3000",
            "X-Title": "KuAngan Finance",
        },
        body: JSON.stringify({
            model: process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `You are a receipt scanner. Extract transaction data from this receipt image.
Return ONLY valid JSON. Do not include explanation or markdown.
If unsure about a field, set it to null.
Currency assumed IDR.

Required JSON format:
{
  "store": "store name or null",
  "total": total_amount_as_number_or_null,
  "date": "YYYY-MM-DD or null",
  "items": [{"name": "item name", "price": price_number}],
  "currency": "IDR",
  "type": "expense",
  "note": "brief summary of items"
}`,
                        },
                        {
                            type: "image_url",
                            image_url: { url: `data:image/jpeg;base64,${base64Image}` },
                        },
                    ],
                },
            ],
            max_tokens: 512,
        }),
    });

    const data = await openrouterRes.json();
    const content = data?.choices?.[0]?.message?.content ?? "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        const parsed = aiResponseSchema.safeParse(JSON.parse(jsonMatch[0]));
        if (parsed.success) {
            return parsed.data;
        }
    }
    return null;
}

export async function parseTransactionText(text: string): Promise<AIResponse> {
    const openrouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.NEXTAUTH_URL ?? "http://localhost:3000",
            "X-Title": "KuAngan Finance",
        },
        body: JSON.stringify({
            model: process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash",
            messages: [
                {
                    role: "system",
                    content: `You are a finance assistant. Extract transaction data from the user's text.
Return ONLY valid JSON. Do not include explanation or markdown.
Determine if it's an 'income' or 'expense' (default to 'expense' if unclear).
If amount contains 'rb' or 'k', multiply by 1000. 'jt' multiply by 1,000,000.
Try to guess the category/store and date (default to today if not mentioned).

Required JSON format:
{
  "store": "store/source name or null",
  "total": total_amount_as_number_or_null,
  "date": "YYYY-MM-DD (today is ${new Date().toISOString().split("T")[0]})",
  "type": "income|expense",
  "note": "original text or summary",
  "currency": "IDR"
}`,
                },
                {
                    role: "user",
                    content: text,
                },
            ],
            max_tokens: 256,
        }),
    });

    const data = await openrouterRes.json();
    const content = data?.choices?.[0]?.message?.content ?? "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        const parsed = aiResponseSchema.safeParse(JSON.parse(jsonMatch[0]));
        if (parsed.success) {
            return parsed.data;
        }
    }
    return null;
}
