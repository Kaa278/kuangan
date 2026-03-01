"use client";

import useSWR from "swr";
import { formatCurrency, formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Flame, PieChart } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
function formatMonth(dateStr: string) {
    const d = new Date(dateStr);
    return MONTH_LABELS[d.getMonth()];
}

export default function ReportsPage() {
    const { data, isLoading } = useSWR("/api/dashboard", fetcher);

    if (isLoading) return (
        <div className="flex items-center justify-center h-64"><div className="spinner" style={{ width: 32, height: 32, color: "var(--accent-primary)" }} /></div>
    );

    const monthly = data?.monthly ?? {};
    const last6 = (data?.last6Months ?? []).map((m: any) => ({
        ...m, label: formatMonth(m.month), net: m.income - m.expense,
    }));
    const topCats = data?.topCategories ?? [];

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold" style={{ color: "var(--text-main)" }}>Laporan</h1>
                <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Ringkasan dan analisis pengeluaran</p>
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                    { label: "Total Pemasukan Bulan Ini", value: formatCurrency(monthly.income ?? 0), color: "var(--accent-green)" },
                    { label: "Total Pengeluaran Bulan Ini", value: formatCurrency(monthly.expense ?? 0), color: "var(--accent-red)" },
                    { label: "Net Bulan Ini", value: formatCurrency(monthly.net ?? 0), color: (monthly.net ?? 0) >= 0 ? "var(--accent-green)" : "var(--accent-red)" },
                    { label: "Rata-rata Pengeluaran/Hari", value: formatCurrency(monthly.avgDailyExpense ?? 0), color: "#f97316" },
                    { label: "Prediksi Total Pengeluaran", value: formatCurrency(monthly.prediction ?? 0), color: "#8b5cf6" },
                    { label: "Sisa Hari Bulan Ini", value: `${monthly.remainingDays ?? 0} hari`, color: "#3b82f6" },
                ].map((m, i) => (
                    <motion.div
                        key={m.label}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="stat-card shadow-sm border border-slate-100"
                    >
                        <span className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-muted)" }}>{m.label}</span>
                        <span className="text-xl font-bold" style={{ color: m.color }}>{m.value}</span>
                    </motion.div>
                ))}
            </div>

            {/* Highest spending day */}
            {monthly.highestSpendingDay && (
                <div className="glass p-5 flex items-center gap-4 border border-slate-100 shadow-sm" style={{ background: "var(--bg-card)" }}>
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                        <Flame size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-bold" style={{ color: "var(--text-main)" }}>Hari Pengeluaran Terbesar</p>
                        <p className="text-xs font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {formatDate(monthly.highestSpendingDay.date)} — {" "}
                            <span style={{ color: "var(--accent-red)", fontWeight: 700 }}>{formatCurrency(monthly.highestSpendingDay.amount)}</span>
                        </p>
                    </div>
                </div>
            )}

            {/* Net flow area chart */}
            <div className="glass p-5 shadow-sm border border-slate-100" style={{ background: "var(--bg-card)" }}>
                <h3 className="font-bold mb-4" style={{ color: "var(--text-main)" }}>Net Arus Kas 6 Bulan</h3>
                {last6.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={last6}>
                            <defs>
                                <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                            <XAxis dataKey="label" tick={{ fill: "var(--text-muted)", fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
                            <YAxis tickFormatter={(v) => `${v / 1000}k`} tick={{ fill: "var(--text-muted)", fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} dx={-10} />
                            <Tooltip
                                formatter={(v: any) => formatCurrency(v)}
                                contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 12, fontSize: 12, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}
                                itemStyle={{ color: "var(--text-main)", fontWeight: 600 }}
                                labelStyle={{ color: "var(--text-muted)", marginBottom: "4px" }}
                            />
                            <Area type="monotone" dataKey="net" stroke="var(--accent-primary)" fill="url(#netGrad)" strokeWidth={3} dot={{ fill: "var(--bg-card)", stroke: "var(--accent-primary)", strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: "var(--accent-primary)", stroke: "var(--bg-card)", strokeWidth: 2 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-48 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                        Belum ada data
                    </div>
                )}
            </div>

            {/* Top categories */}
            {topCats.length > 0 && (
                <div className="glass p-5 shadow-sm border border-slate-100" style={{ background: "var(--bg-card)" }}>
                    <h3 className="font-bold mb-5" style={{ color: "var(--text-main)" }}>Top Kategori Pengeluaran Bulan Ini</h3>
                    <div className="space-y-4">
                        {topCats.map((cat: any, i: number) => {
                            const maxVal = topCats[0]?.total ?? 1;
                            const pct = ((cat.total / maxVal) * 100).toFixed(0);
                            return (
                                <div key={cat.categoryId}>
                                    <div className="flex justify-between text-sm mb-1.5 align-middle">
                                        <span style={{ color: "var(--text-main)" }} className="font-medium flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: cat.color + "15", color: cat.color }}>
                                                <PieChart size={14} />
                                            </div>
                                            {cat.name.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|\s/gu, '') || cat.name}
                                        </span>
                                        <span style={{ color: "var(--text-main)", fontWeight: 600 }}>{formatCurrency(cat.total)}</span>
                                    </div>
                                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border-light)" }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            transition={{ delay: i * 0.05, duration: 0.5 }}
                                            className="h-full rounded-full"
                                            style={{ background: cat.color ?? "var(--accent-primary)" }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
