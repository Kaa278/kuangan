"use client";

import useSWR from "swr";
import { formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    PieChart, Pie, Cell
} from "recharts";
import { useState } from "react";
import TransactionModal from "@/components/TransactionModal";
import { Wallet } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function formatMonth(dateStr: string) {
    const d = new Date(dateStr);
    return MONTH_LABELS[d.getMonth()];
}

const CARD_COLORS = ["#6366f1", "#10b981", "#f97316", "#ec4899", "#06b6d4"];

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
    return (
        <div className="stat-card flex flex-col gap-1">
            <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{label}</span>
            <span className="text-xl font-bold" style={{ color: color ?? "var(--text-main)" }}>{value}</span>
            {sub && <span className="text-xs" style={{ color: "var(--text-muted)" }}>{sub}</span>}
        </div>
    );
}

const CustomTooltipBar = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="glass p-3 text-xs" style={{ minWidth: 140 }}>
            <p className="font-semibold mb-2 text-slate-900">{label}</p>
            {payload.map((p: any) => (
                <p key={p.name} style={{ color: p.color }}>
                    {p.name === "income" ? "Pemasukan" : "Pengeluaran"}: {formatCurrency(p.value)}
                </p>
            ))}
        </div>
    );
};

export default function DashboardPage() {
    const { data, isLoading, mutate } = useSWR("/api/dashboard", fetcher, { refreshInterval: 30000 });
    const [showTxModal, setShowTxModal] = useState(false);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="spinner" style={{ width: 36, height: 36 }} />
            </div>
        );
    }

    const monthly = data?.monthly ?? {};
    const wallets = data?.wallets ?? [];
    const last6 = (data?.last6Months ?? []).map((m: any) => ({
        ...m,
        label: formatMonth(m.month),
    }));
    const topCats = data?.topCategories ?? [];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-wrap items-center justify-between gap-4"
            >
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: "var(--text-main)" }}>Dashboard</h1>
                    <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                        Ringkasan keuangan bulan ini
                    </p>
                </div>
                <button id="btn-add-tx" className="btn-primary shadow-sm" onClick={() => setShowTxModal(true)}>
                    <span className="text-lg font-normal mb-0.5">+</span> Tambah Transaksi
                </button>
            </motion.div>

            {/* Total balance */}
            <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="p-6 rounded-2xl relative overflow-hidden shadow-sm"
                style={{
                    background: "var(--accent-primary)",
                }}
            >
                <div className="relative z-10">
                    <p className="text-sm mb-1 text-indigo-100">Total Saldo</p>
                    <p className="text-4xl font-extrabold text-white">{formatCurrency(data?.totalBalance ?? 0)}</p>
                    <div className="flex flex-wrap gap-4 mt-6 bg-white/10 p-4 rounded-xl backdrop-blur-sm w-fit">
                        <div>
                            <p className="text-xs text-indigo-100">Pemasukan Bulan Ini</p>
                            <p className="text-lg font-bold text-white">+{formatCurrency(monthly.income ?? 0)}</p>
                        </div>
                        <div className="w-px bg-white/20 mx-2" />
                        <div>
                            <p className="text-xs text-indigo-100">Pengeluaran Bulan Ini</p>
                            <p className="text-lg font-bold text-white">-{formatCurrency(monthly.expense ?? 0)}</p>
                        </div>
                    </div>
                </div>
                {/* Clean decorative circle instead of blur blob */}
                <div className="absolute right-0 top-0 opacity-10 pointer-events-none"
                    style={{ width: "250px", height: "250px", transform: "translate(30%, -30%)" }}>
                    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="100" cy="100" r="100" fill="white" />
                    </svg>
                </div>
            </motion.div>

            {/* Wallet cards */}
            <div>
                <h2 className="text-xs font-bold mb-3 tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>Dompet</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {wallets.map((w: any, i: number) => (
                        <motion.div
                            key={w.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + i * 0.05 }}
                            className="glass glass-hover p-4 flex items-center gap-4"
                        >
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: w.color + "15", color: w.color }}>
                                <Wallet size={20} strokeWidth={2.5} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold truncate" style={{ color: "var(--text-main)" }}>{w.name}</p>
                                <p className="text-base font-bold" style={{ color: w.color }}>{formatCurrency(Number(w.balance))}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                    label="Rata-rata/hari"
                    value={formatCurrency(monthly.avgDailyExpense ?? 0)}
                    sub="pengeluaran harian"
                    color="var(--accent-red)"
                />
                <StatCard
                    label="Hari Terboros"
                    value={monthly.highestSpendingDay ? formatCurrency(monthly.highestSpendingDay.amount) : "—"}
                    sub={monthly.highestSpendingDay?.date ?? "Tidak ada data"}
                    color="#f59e0b" // amber-500
                />
                <StatCard
                    label="Prediksi Akhir Bulan"
                    value={formatCurrency(monthly.prediction ?? 0)}
                    sub={`${monthly.remainingDays ?? 0} hari tersisa`}
                    color="var(--accent-secondary)"
                />
                <StatCard
                    label="Net Bulan Ini"
                    value={formatCurrency(monthly.net ?? 0)}
                    sub={(monthly.net ?? 0) >= 0 ? "Surplus " : "Deficit "}
                    color={(monthly.net ?? 0) >= 0 ? "var(--accent-green)" : "var(--accent-red)"}
                />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 6-month bar chart */}
                <div className="lg:col-span-2 glass p-5">
                    <h3 className="font-semibold mb-5" style={{ color: "var(--text-main)" }}>Arus Kas 6 Bulan</h3>
                    {last6.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={last6} barCategoryGap="30%">
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                                <XAxis dataKey="label" tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                                <YAxis tickFormatter={(v) => `${v / 1000}k`} tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} dx={-10} />
                                <Tooltip content={<CustomTooltipBar />} cursor={{ fill: "var(--bg-main)" }} />
                                <Legend
                                    formatter={(v) => v === "income" ? "Pemasukan" : "Pengeluaran"}
                                    wrapperStyle={{ fontSize: 12, color: "var(--text-muted)", paddingTop: 20 }}
                                />
                                <Bar dataKey="income" fill="var(--accent-green)" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="expense" fill="var(--accent-red)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-48 text-sm" style={{ color: "var(--text-muted)" }}>
                            Belum ada data transaksi
                        </div>
                    )}
                </div>

                {/* Top categories donut */}
                <div className="glass p-5 flex flex-col">
                    <h3 className="font-semibold mb-4" style={{ color: "var(--text-main)" }}>Top Pengeluaran</h3>
                    {topCats.length > 0 ? (
                        <>
                            <div className="flex-1 min-h-[160px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={topCats}
                                            dataKey="total"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={75}
                                            paddingAngle={2}
                                            stroke="none"
                                        >
                                            {topCats.map((cat: any, i: number) => (
                                                <Cell key={cat.categoryId} fill={cat.color ?? CARD_COLORS[i % CARD_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(v: any) => formatCurrency(v)}
                                            contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 12, fontSize: 12, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
                                            itemStyle={{ color: "var(--text-main)" }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-2.5 mt-4">
                                {topCats.slice(0, 4).map((cat: any, i: number) => (
                                    <div key={cat.categoryId} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cat.color ?? CARD_COLORS[i] }} />
                                            <span style={{ color: "var(--text-main)" }} className="font-medium">
                                                {cat.name.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|\s/gu, '')}
                                            </span>
                                        </div>
                                        <span className="font-semibold" style={{ color: "var(--text-main)" }}>{formatCurrency(cat.total)}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center flex-1 h-48 text-sm" style={{ color: "var(--text-muted)" }}>
                            Belum ada pengeluaran
                        </div>
                    )}
                </div>
            </div>

            {/* Transaction add modal */}
            {showTxModal && (
                <TransactionModal
                    onClose={() => setShowTxModal(false)}
                    onSuccess={() => { setShowTxModal(false); mutate(); }}
                />
            )}
        </div>
    );
}
