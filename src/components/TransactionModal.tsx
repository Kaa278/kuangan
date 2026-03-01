"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { X } from "lucide-react";
import CustomSelect from "@/components/CustomSelect";
import CustomDatePicker from "@/components/CustomDatePicker";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Props {
    onClose: () => void;
    onSuccess: () => void;
    prefill?: {
        amount?: number;
        store?: string;
        date?: string;
    };
}

export default function TransactionModal({ onClose, onSuccess, prefill }: Props) {
    const { data: cats } = useSWR("/api/categories", fetcher);
    const { data: wallets } = useSWR("/api/wallets", fetcher);

    // amountDisplay represents what the user sees (with separators)
    // amount is the actual integer string being saved
    const [amountDisplay, setAmountDisplay] = useState(prefill?.amount ? prefill.amount.toLocaleString('id-ID') : "");

    const [form, setForm] = useState({
        amount: prefill?.amount?.toString() ?? "",
        type: "expense" as "income" | "expense",
        categoryId: "",
        walletId: "",
        note: prefill?.store ?? "",
        store: prefill?.store ?? "",
        date: prefill?.date ?? new Date().toISOString().split("T")[0],
        source: prefill ? "ai_scan" : "manual",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Set default wallet + category when data loads
    useEffect(() => {
        if (wallets?.length && !form.walletId) setForm((f) => ({ ...f, walletId: wallets[0].id }));
    }, [wallets]);

    useEffect(() => {
        const filtered = (cats ?? []).filter((c: any) => c.type === form.type);
        if (filtered.length && !form.categoryId) setForm((f) => ({ ...f, categoryId: filtered[0].id }));
    }, [cats, form.type]);

    function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
        // Remove all non-digits
        const rawValue = e.target.value.replace(/\D/g, "");
        if (rawValue === "") {
            setAmountDisplay("");
            setForm(f => ({ ...f, amount: "" }));
            return;
        }

        const num = parseInt(rawValue, 10);
        if (!isNaN(num)) {
            setAmountDisplay(num.toLocaleString('id-ID'));
            setForm(f => ({ ...f, amount: num.toString() }));
        }
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: name === "type" ? value : value }));
        if (name === "type") setForm((f) => ({ ...f, [name]: value as any, categoryId: "" }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (!form.amount || parseFloat(form.amount) <= 0) {
            setError("Jumlah harus lebih besar dari 0");
            return;
        }

        setLoading(true);

        const res = await fetch("/api/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
        });

        const data = await res.json();
        setLoading(false);

        if (!res.ok) {
            setError(data.error ?? "Terjadi kesalahan.");
            return;
        }
        onSuccess();
    }

    const filteredCats = (cats ?? []).filter((c: any) => c.type === form.type);

    return (
        <AnimatePresence>
            <div className="absolute inset-0 modal-overlay" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="glass w-full max-w-md p-6 shadow-xl"
                    onClick={(e) => e.stopPropagation()}
                    style={{ background: "var(--bg-card)" }}
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold" style={{ color: "var(--text-main)" }}>Tambah Transaksi</h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Type toggle */}
                        <div className="flex bg-slate-100 rounded-xl p-1 mb-2">
                            {(["expense", "income"] as const).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setForm((f) => ({ ...f, type: t, categoryId: "" }))}
                                    className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all"
                                    style={{
                                        background: form.type === t ? "white" : "transparent",
                                        color: form.type === t
                                            ? t === "expense" ? "var(--accent-red)" : "var(--accent-green)"
                                            : "var(--text-muted)",
                                        boxShadow: form.type === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                                    }}
                                >
                                    {t === "expense" ? "Pengeluaran" : "Pemasukan"}
                                </button>
                            ))}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-main)" }}>Jumlah (IDR)</label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold" style={{ color: "var(--text-muted)" }}>Rp</span>
                                <input name="amountDisplay" id="tx-amount" type="text" inputMode="numeric" className="input-field"
                                    style={{ paddingLeft: "3rem", fontSize: "1.125rem", fontWeight: "700", color: form.type === "expense" ? "var(--accent-red)" : "var(--accent-green)" }}
                                    placeholder="0" value={amountDisplay} onChange={handleAmountChange} required />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-main)" }}>Kategori</label>
                                <CustomSelect
                                    value={form.categoryId}
                                    onChange={(val) => setForm(f => ({ ...f, categoryId: val }))}
                                    options={filteredCats}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-main)" }}>Dompet</label>
                                <CustomSelect
                                    value={form.walletId}
                                    onChange={(val) => setForm(f => ({ ...f, walletId: val }))}
                                    options={wallets ?? []}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-main)" }}>Tanggal</label>
                            <CustomDatePicker
                                value={form.date}
                                onChange={(val) => setForm(f => ({ ...f, date: val }))}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-main)" }}>Toko / Merchant (opsional)</label>
                            <input name="store" id="tx-store" type="text" className="input-field" placeholder="Nama toko" value={form.store} onChange={handleChange} />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-main)" }}>Catatan (opsional)</label>
                            <textarea name="note" id="tx-note" className="input-field" placeholder="Catatan opsional..." rows={2}
                                value={form.note} onChange={handleChange} style={{ resize: "none" }} />
                        </div>

                        {error && (
                            <div className="p-3 rounded-xl text-xs font-medium" style={{ background: "#fef2f2", border: "1px solid #fee2e2", color: "#ef4444" }}>
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Batal</button>
                            <button id="btn-save-tx" type="submit" className="btn-primary flex-1 shadow-sm" disabled={loading || !form.amount}>
                                {loading ? <span className="spinner" /> : null}
                                {loading ? "Menyimpan" : "Simpan Transaksi"}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
