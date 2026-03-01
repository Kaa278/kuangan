"use client";

import useSWR, { mutate as globalMutate } from "swr";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency, formatDate } from "@/lib/utils";
import TransactionModal from "@/components/TransactionModal";
import CustomSelect from "@/components/CustomSelect";
import { Receipt, Trash2, CreditCard, Filter, TrendingUp, TrendingDown, Wallet as WalletIcon, PieChart, ChevronDown, ChevronUp } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function TransactionsPage() {
    const [page, setPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [typeFilter, setTypeFilter] = useState<"" | "income" | "expense">("");
    const [walletFilter, setWalletFilter] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [dateFilter, setDateFilter] = useState("all");
    const [showFilters, setShowFilters] = useState(false); // For mobile

    const { data: walletsData } = useSWR("/api/wallets", fetcher);
    const { data: catsData } = useSWR("/api/categories", fetcher);

    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (typeFilter) params.set("type", typeFilter);
    if (walletFilter) params.set("walletId", walletFilter);
    if (categoryFilter) params.set("categoryId", categoryFilter);

    // Date filtering logic
    const now = new Date();
    if (dateFilter === "today") {
        const d = new Date(now); d.setHours(0, 0, 0, 0);
        params.set("startDate", d.toISOString());
        const e = new Date(now); e.setHours(23, 59, 59, 999);
        params.set("endDate", e.toISOString());
    } else if (dateFilter === "week") {
        const d = new Date(now);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff); d.setHours(0, 0, 0, 0);
        params.set("startDate", d.toISOString());
    } else if (dateFilter === "month") {
        const d = new Date(now.getFullYear(), now.getMonth(), 1); d.setHours(0, 0, 0, 0);
        params.set("startDate", d.toISOString());
    }

    const { data, isLoading, mutate } = useSWR(`/api/transactions?${params}`, fetcher);

    async function handleDelete(id: string) {
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
            if (res.ok) {
                mutate();
                globalMutate("/api/dashboard");
                setDeleteId(null);
                setToast({ message: "Transaksi berhasil dihapus", type: "success" });
                setTimeout(() => setToast(null), 3000);
            } else {
                setToast({ message: "Gagal menghapus transaksi", type: "error" });
            }
        } catch (error) {
            setToast({ message: "Terjadi kesalahan koneksi", type: "error" });
        } finally {
            setIsDeleting(false);
        }
    }

    const transactions = data?.transactions ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.ceil(total / 20);
    const incomeTotal = data?.income ?? 0;
    const expenseTotal = data?.expense ?? 0;
    const netTotal = incomeTotal - expenseTotal;

    return (
        <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-0">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: "var(--text-main)" }}>Transaksi</h1>
                    <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {total} transaksi ditemukan
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        className="btn-secondary px-3 py-2"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter size={18} className={showFilters ? "text-indigo-600" : ""} />
                    </button>
                    <button id="btn-add-tx" className="btn-primary shadow-sm" onClick={() => setShowModal(true)}>
                        <span className="text-lg font-normal mb-0.5">+</span> Tambah
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* Main content - 70% */}
                <div className="flex-1 w-full space-y-6">
                    {/* Filter - Collapsible for all screens */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                                animate={{ height: "auto", opacity: 1, marginBottom: 24 }}
                                exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                                className="flex gap-4 flex-wrap items-end bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative z-20 overflow-visible"
                            >
                                <div className="space-y-2 flex-none w-[200px]">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Jenis Transaksi</label>
                                    <div className="flex gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-100">
                                        {(["", "expense", "income"] as const).map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => { setTypeFilter(t); setPage(1); }}
                                                className={`flex-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${t === typeFilter ? "bg-white shadow-sm text-indigo-600 border border-slate-100" : "text-slate-500 hover:text-slate-700"}`}
                                            >
                                                {t === "" ? "Semua" : t === "expense" ? "Keluar" : "Masuk"}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2 flex-1 min-w-[160px] max-w-[220px]">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Waktu</label>
                                    <CustomSelect
                                        value={dateFilter}
                                        onChange={(val) => { setDateFilter(val); setPage(1); }}
                                        placeholder="Pilih Waktu"
                                        options={[
                                            { id: "all", name: "Semua Waktu" },
                                            { id: "today", name: "Hari Ini" },
                                            { id: "week", name: "Minggu Ini" },
                                            { id: "month", name: "Bulan Ini" },
                                        ]}
                                    />
                                </div>

                                <div className="space-y-2 flex-1 min-w-[160px] max-w-[220px]">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Dompet</label>
                                    <CustomSelect
                                        value={walletFilter}
                                        onChange={(val) => { setWalletFilter(val); setPage(1); }}
                                        placeholder="Semua Dompet"
                                        options={[{ id: "", name: "Semua Dompet" }, ...(walletsData ?? [])]}
                                    />
                                </div>

                                <div className="space-y-2 flex-1 min-w-[160px] max-w-[220px]">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Kategori</label>
                                    <CustomSelect
                                        value={categoryFilter}
                                        onChange={(val) => { setCategoryFilter(val); setPage(1); }}
                                        placeholder="Semua Kategori"
                                        options={[
                                            { id: "", name: "Semua Kategori" },
                                            ...(catsData ?? []).filter((c: any) => !typeFilter || c.type === typeFilter)
                                        ]}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* List */}
                    {isLoading ? (
                        <div className="flex justify-center py-16"><div className="spinner" style={{ width: 32, height: 32, color: "var(--accent-primary)" }} /></div>
                    ) : transactions.length === 0 ? (
                        <div className="glass p-12 text-center" style={{ color: "var(--text-muted)" }}>
                            <div className="flex justify-center mb-4 text-slate-300">
                                <Receipt size={48} strokeWidth={1} />
                            </div>
                            <p className="text-sm font-medium">Belum ada transaksi</p>
                        </div>
                    ) : (
                        <div className="glass overflow-hidden shadow-sm border border-slate-200" style={{ background: "var(--bg-card)" }}>
                            <div className="divide-y" style={{ borderColor: "var(--border-light)" }}>
                                {transactions.map((tx: any) => (
                                    <motion.div
                                        key={tx.id}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex items-center gap-4 px-4 py-4 hover:bg-slate-50/50 transition-colors group"
                                    >
                                        {/* Category icon */}
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                                            style={{ background: tx.category?.color + "15", color: tx.category?.color }}>
                                            <Receipt size={22} />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold truncate" style={{ color: "var(--text-main)" }}>
                                                {tx.store ?? (tx.category?.name ? tx.category.name.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|\s/gu, '') : "Transaksi")}
                                            </p>
                                            <p className="text-xs truncate font-medium mt-1" style={{ color: "var(--text-muted)" }}>
                                                {formatDate(tx.date)} · <span className="opacity-80"><WalletIcon size={10} className="inline mr-1 mb-0.5" />{tx.wallet?.name}</span>
                                                {tx.source === "ai_scan" && " · ✨ Kathlyn"}
                                            </p>
                                        </div>

                                        {/* Amount */}
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-sm font-extrabold" style={{ color: tx.type === "income" ? "var(--accent-green)" : "var(--accent-red)" }}>
                                                {tx.type === "income" ? "+" : "-"}{formatCurrency(Number(tx.amount))}
                                            </p>
                                            <span className={`badge badge-${tx.type} text-[9px] mt-1.5 font-bold uppercase tracking-wider px-2 py-0.5`}>
                                                {tx.category?.name ? tx.category.name.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|\s/gu, '') : "Uncategorized"}
                                            </span>
                                        </div>

                                        {/* Delete */}
                                        <button
                                            onClick={() => setDeleteId(tx.id)}
                                            className="lg:opacity-0 group-hover:opacity-100 ml-1 flex-shrink-0 transition-all hover:bg-red-50 text-red-400 hover:text-red-500 rounded-xl p-2.5"
                                            title="Hapus"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-6">
                            <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
                            <span className="btn-secondary font-medium" style={{ cursor: "default", background: "var(--bg-main)" }}>{page} / {totalPages}</span>
                            <button className="btn-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
                        </div>
                    )}
                </div>

                {/* Sidebar Summary - 30% */}
                <div className="w-full lg:w-80 space-y-4">
                    <div className="glass p-5 border-slate-200">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <PieChart size={14} className="text-indigo-500" /> Ringkasan Filter
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-slate-600">Pemasukan</span>
                                <span className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                                    <TrendingUp size={14} /> {formatCurrency(incomeTotal)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-slate-600">Pengeluaran</span>
                                <span className="text-sm font-bold text-red-500 flex items-center gap-1">
                                    <TrendingDown size={14} /> {formatCurrency(expenseTotal)}
                                </span>
                            </div>
                            <div className="h-px bg-slate-100 my-4" />
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-900 uppercase">Bersih (Net)</span>
                                <span className={`text-base font-black ${netTotal >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                    {netTotal >= 0 ? "+" : ""}{formatCurrency(netTotal)}
                                </span>
                            </div>
                        </div>

                        <div className="mt-8 p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 leading-relaxed font-medium">
                            ✨ Ringkasan di atas otomatis menyesuaikan dengan filter yang Anda gunakan (Jenis, Waktu, Dompet, dan Kategori).
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-100/30">
                        <h3 className="text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5 ring-offset-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Tips Kathlyn
                        </h3>
                        <p className="text-[13px] leading-relaxed font-medium">
                            "Pakai bot Telegram buat catat belanjaan secara cepat. Tinggal foto struk, langsung muncul di sini!"
                        </p>
                    </div>
                </div>
            </div>

            {/* Confirm delete dialog */}
            <AnimatePresence>
                {deleteId && (
                    <div className="modal-overlay" onClick={() => setDeleteId(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="glass p-6 max-w-sm w-full shadow-lg"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-center mb-4 text-red-500 bg-red-50 w-12 h-12 rounded-full items-center mx-auto">
                                <Trash2 size={24} />
                            </div>
                            <h3 className="text-center text-lg font-bold mb-1" style={{ color: "var(--text-main)" }}>Hapus Transaksi?</h3>
                            <p className="text-center text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                                Saldo dompet akan dikembalikan secara otomatis.
                            </p>
                            <div className="flex gap-3">
                                <button className="btn-secondary flex-1 border-slate-200" onClick={() => setDeleteId(null)} disabled={isDeleting}>Batal</button>
                                <button id="btn-confirm-delete" className="btn-primary flex-1 bg-red-500 hover:bg-red-600 border-none shadow-sm"
                                    onClick={() => handleDelete(deleteId)} disabled={isDeleting}>
                                    {isDeleting ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "Hapus"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {showModal && (
                <TransactionModal
                    onClose={() => setShowModal(false)}
                    onSuccess={() => { setShowModal(false); mutate(); globalMutate("/api/dashboard"); }}
                />
            )}

            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 border text-sm font-medium"
                        style={{
                            background: toast.type === "success" ? "#ecfdf5" : "#fef2f2",
                            borderColor: toast.type === "success" ? "#10b98140" : "#ef444440",
                            color: toast.type === "success" ? "#065f46" : "#991b1b"
                        }}
                    >
                        <div className={`w-2 h-2 rounded-full ${toast.type === "success" ? "bg-emerald-500" : "bg-red-500"}`} />
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
