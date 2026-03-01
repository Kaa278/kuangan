import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const remainingDays = daysInMonth - now.getDate();

    // Parallel queries
    const [wallets, monthlyTx, last6Months, topCategories] = await Promise.all([
        // All wallets with total balance
        prisma.wallet.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),

        // This month's transactions
        prisma.transaction.findMany({
            where: { userId, date: { gte: startOfMonth } },
            include: { category: true },
        }),

        // Last 6 months flow (raw SQL-like with Prisma)
        prisma.$queryRaw<Array<{ month: Date; income: number; expense: number }>>`
      SELECT
        DATE_TRUNC('month', date) as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END)::float as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END)::float as expense
      FROM transactions
      WHERE user_id = ${userId}
        AND date >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY month ASC
    `,

        // Top 5 expense categories this month
        prisma.$queryRaw<Array<{ categoryId: string; name: string; color: string; icon: string; total: number }>>`
      SELECT
        t.category_id as "categoryId",
        c.name,
        c.color,
        c.icon,
        SUM(t.amount)::float as total
      FROM transactions t
      JOIN categories c ON c.id = t.category_id
      WHERE t.user_id = ${userId}
        AND t.type = 'expense'
        AND t.date >= ${startOfMonth}
      GROUP BY t.category_id, c.name, c.color, c.icon
      ORDER BY total DESC
      LIMIT 5
    `,
    ]);

    // This month summary
    const totalIncome = monthlyTx
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpense = monthlyTx
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0);

    // Average daily expense this month
    const daysPassed = now.getDate();
    const avgDailyExpense = daysPassed > 0 ? totalExpense / daysPassed : 0;

    // Highest spending day this month
    const expenseDayMap: Record<string, number> = {};
    monthlyTx
        .filter((t) => t.type === "expense")
        .forEach((t) => {
            const day = t.date.toISOString().split("T")[0];
            expenseDayMap[day] = (expenseDayMap[day] ?? 0) + Number(t.amount);
        });

    const highestDayEntry = Object.entries(expenseDayMap).sort(([, a], [, b]) => b - a)[0];
    const highestSpendingDay = highestDayEntry
        ? { date: highestDayEntry[0], amount: highestDayEntry[1] }
        : null;

    // Prediction
    const predictedEndOfMonth = totalExpense + avgDailyExpense * remainingDays;

    return NextResponse.json({
        totalBalance,
        wallets,
        monthly: {
            income: totalIncome,
            expense: totalExpense,
            net: totalIncome - totalExpense,
            avgDailyExpense,
            highestSpendingDay,
            prediction: predictedEndOfMonth,
            remainingDays,
        },
        last6Months,
        topCategories,
    });
}
