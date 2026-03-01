"use client";

import { useState } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { formatCurrency } from "@/lib/utils";
import { Wallet, Tag, Plus, Trash2, Send, ExternalLink, MessageSquare } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const PRESET_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#14b8a6"];

export default function SettingsPage() {
    const { data: wallets, mutate: reloadWallets } = useSWR("/api/wallets", fetcher);
    const { data: cats, mutate: reloadCats } = useSWR("/api/categories", fetcher);
    const { data: profile, mutate: reloadProfile } = useSWR("/api/profile", fetcher);

    const [walletForm, setWalletForm] = useState({ name: "", balance: "0", color: "#6366f1" });
    const [catForm, setCatForm] = useState({ name: "", type: "expense" as "income" | "expense", color: "#6366f1" });
    const [savingW, setSavingW] = useState(false);
    const [savingC, setSavingC] = useState(false);
    const [tgId, setTgId] = useState("");
    const [savingTg, setSavingTg] = useState(false);

    // Sync telegramId from profile
    useState(() => {
        if (profile?.telegramId) setTgId(profile.telegramId);
    });

    // Better sync using a reaction or conditional update
    if (profile?.telegramId && !tgId && !savingTg) {
        setTgId(profile.telegramId);
    }

    async function addWallet(e: React.FormEvent) {
        e.preventDefault();
        setSavingW(true);
        await fetch("/api/wallets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: walletForm.name, balance: parseFloat(walletForm.balance), color: walletForm.color }),
        });
        setSavingW(false);
        setWalletForm({ name: "", balance: "0", color: "#6366f1" });
        reloadWallets();
        globalMutate("/api/dashboard");
    }

    async function deleteWallet(id: string) {
        await fetch(`/api/wallets/${id}`, { method: "DELETE" });
        reloadWallets();
        globalMutate("/api/dashboard");
    }

    async function addCategory(e: React.FormEvent) {
        e.preventDefault();
        setSavingC(true);
        await fetch("/api/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...catForm, icon: "" }), // Icon removed entirely
        });
        setSavingC(false);
        setCatForm({ name: "", type: "expense", color: "#6366f1" });
        reloadCats();
    }

    async function deleteCategory(id: string) {
        await fetch(`/api/categories/${id}`, { method: "DELETE" });
        reloadCats();
    }

    async function updateTelegram(e: React.FormEvent) {
        e.preventDefault();
        setSavingTg(true);
        await fetch("/api/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ telegramId: tgId }),
        });
        setSavingTg(false);
        reloadProfile();
    }

    const incomeCats = (cats ?? []).filter((c: any) => c.type === "income");
    const expenseCats = (cats ?? []).filter((c: any) => c.type === "expense");

    return (
        <div className="space-y-8 max-w-3xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold" style={{ color: "var(--text-main)" }}>Pengaturan</h1>
                <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Kelola dompet dan kategori</p>
            </div>

            {/* ============ WALLETS ============ */}
            <section className="glass p-6 space-y-5 shadow-sm border border-slate-100" style={{ background: "var(--bg-card)" }}>
                <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: "var(--text-main)" }}>
                    <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                        <Wallet size={18} />
                    </div>
                    Dompet
                </h2>

                {/* Existing wallets */}
                <div className="space-y-3">
                    {(wallets ?? []).map((w: any) => (
                        <div key={w.id} className="flex items-center justify-between py-3 px-4 rounded-xl border border-slate-100 shadow-sm bg-white"
                            style={{ transition: "all 0.2s" }}>
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded-full border border-slate-200" style={{ background: w.color }} />
                                <span className="text-sm font-semibold" style={{ color: "var(--text-main)" }}>{w.name}</span>
                                <span className="text-sm font-bold ml-2 opacity-80" style={{ color: w.color }}>{formatCurrency(Number(w.balance))}</span>
                            </div>
                            <button onClick={() => deleteWallet(w.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Hapus dompet">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Add wallet form */}
                <form onSubmit={addWallet} className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <input className="input-field" placeholder="Nama dompet" value={walletForm.name}
                        onChange={(e) => setWalletForm((f) => ({ ...f, name: e.target.value }))} required />
                    <input className="input-field" type="number" placeholder="Saldo awal" value={walletForm.balance}
                        onChange={(e) => setWalletForm((f) => ({ ...f, balance: e.target.value }))} min="0" />
                    <div className="flex gap-2">
                        <input type="color" value={walletForm.color}
                            onChange={(e) => setWalletForm((f) => ({ ...f, color: e.target.value }))}
                            className="h-10 w-12 rounded-lg cursor-pointer flex-shrink-0" style={{ background: "transparent", border: "1px solid var(--border-light)", padding: 2 }} />
                        <button id="btn-add-wallet" type="submit" className="btn-primary flex-1 shadow-sm px-0" disabled={savingW}>
                            {savingW ? <span className="spinner" /> : <><Plus size={16} className="inline mr-1 mb-0.5" /> Tambah</>}
                        </button>
                    </div>
                </form>
            </section>

            {/* ============ CATEGORIES ============ */}
            <section className="glass p-6 space-y-5 shadow-sm border border-slate-100" style={{ background: "var(--bg-card)" }}>
                <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: "var(--text-main)" }}>
                    <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                        <Tag size={18} />
                    </div>
                    Kategori
                </h2>

                {/* Expense */}
                <div>
                    <p className="text-xs font-bold mb-3" style={{ color: "var(--accent-red)", letterSpacing: "0.05em" }}>PENGELUARAN</p>
                    <div className="flex flex-wrap gap-2.5">
                        {expenseCats.map((c: any) => (
                            <div key={c.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border"
                                style={{ background: c.color + "10", border: `1px solid ${c.color}30`, color: "var(--text-main)" }}>
                                <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                                <span>{c.name.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|\s/gu, '') || c.name}</span>
                                <button onClick={() => deleteCategory(c.id)} className="text-slate-400 hover:text-red-500 ml-1 transition-colors">
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Income */}
                <div className="pt-2">
                    <p className="text-xs font-bold mb-3" style={{ color: "var(--accent-green)", letterSpacing: "0.05em" }}>PEMASUKAN</p>
                    <div className="flex flex-wrap gap-2.5">
                        {incomeCats.map((c: any) => (
                            <div key={c.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border"
                                style={{ background: c.color + "10", border: `1px solid ${c.color}30`, color: "var(--text-main)" }}>
                                <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                                <span>{c.name.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|\s/gu, '') || c.name}</span>
                                <button onClick={() => deleteCategory(c.id)} className="text-slate-400 hover:text-red-500 ml-1 transition-colors">
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Add category form */}
                <form onSubmit={addCategory} className="space-y-4 pt-4 border-t border-slate-100 mt-2">
                    <p className="text-sm font-semibold" style={{ color: "var(--text-main)" }}>Tambah Kategori Baru</p>
                    <div className="grid grid-cols-2 gap-3">
                        <input className="input-field" placeholder="Nama kategori" value={catForm.name}
                            onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))} required />
                        <select className="input-field cursor-pointer" value={catForm.type}
                            onChange={(e) => setCatForm((f) => ({ ...f, type: e.target.value as any }))}>
                            <option value="expense">Pengeluaran</option>
                            <option value="income">Pemasukan</option>
                        </select>
                    </div>

                    {/* Color picker */}
                    <div>
                        <p className="text-xs mb-2.5 font-medium" style={{ color: "var(--text-muted)" }}>Pilih warna utama:</p>
                        <div className="flex flex-wrap gap-2">
                            {PRESET_COLORS.map((color) => (
                                <button key={color} type="button"
                                    onClick={() => setCatForm((f) => ({ ...f, color }))}
                                    className="w-8 h-8 rounded-full transition-all shadow-sm"
                                    style={{
                                        background: color,
                                        transform: catForm.color === color ? "scale(1.15)" : "scale(1)",
                                        outline: catForm.color === color ? `2px solid var(--accent-primary)` : "none",
                                        outlineOffset: 2,
                                    }} />
                            ))}
                        </div>
                    </div>

                    <button id="btn-add-category" type="submit" className="btn-primary shadow-sm mt-2" disabled={savingC}>
                        {savingC ? <span className="spinner" /> : <><Plus size={16} className="inline mr-1 mb-0.5" /> Tambah Kategori</>}
                    </button>
                </form>
            </section>

            {/* ============ TELEGRAM BOT ============ */}
            <section className="glass p-6 space-y-5 shadow-sm border border-slate-100" style={{ background: "var(--bg-card)" }}>
                <div className="flex items-center justify-between">
                    <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: "var(--text-main)" }}>
                        <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
                            <Send size={18} />
                        </div>
                        Integrasi Telegram Bot
                    </h2>
                    <a href="https://t.me/kuanganbobot" target="_blank" rel="noopener noreferrer"
                        className="text-xs flex items-center gap-1 text-sky-600 hover:underline font-medium">
                        Buka Bot <ExternalLink size={12} />
                    </a>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-main)" }}>
                        Record transaksi lebih cepat lewat Telegram! Cukup chat atau kirim foto struk ke bot Kami.
                    </p>
                    <div className="space-y-2">
                        <div className="flex items-start gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                            <div className="w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 font-bold">1</div>
                            <p>Cari bot <b>@kuanganbobot</b> di Telegram dan ketik <code>/start</code></p>
                        </div>
                        <div className="flex items-start gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                            <div className="w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 font-bold">2</div>
                            <p>Salin <b>Telegram ID</b> yang diberikan bot ke kolom di bawah ini.</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={updateTelegram} className="space-y-3">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <MessageSquare size={16} />
                            </div>
                            <input className="input-field pl-10" placeholder="Masukkan Telegram ID Anda" value={tgId}
                                onChange={(e) => setTgId(e.target.value)} />
                        </div>
                        <button type="submit" className="btn-primary min-w-[100px]" disabled={savingTg}>
                            {savingTg ? <span className="spinner" /> : "Simpan"}
                        </button>
                    </div>
                </form>

                {profile?.telegramId && (
                    <div className="flex items-center gap-2 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Bot aktif untuk ID: {profile.telegramId}
                    </div>
                )}
            </section>
        </div>
    );
}
