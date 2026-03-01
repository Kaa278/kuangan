"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { Landmark, ArrowRight, Mail, Lock, User } from "lucide-react";

export default function RegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });

        const data = await res.json();
        if (!res.ok) {
            setError(data.error ?? "Terjadi kesalahan.");
            setLoading(false);
            return;
        }

        // Auto login after register
        await signIn("credentials", { email: form.email, password: form.password, redirect: false });
        router.push("/dashboard");
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden light-mesh py-12">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-dot-pattern opacity-[0.4]" />

            {/* Soft Ambient Accents */}
            <div className="absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-indigo-100/40 blur-[100px] animate-pulse" />
            <div className="absolute bottom-[-5%] left-[-5%] w-[30vw] h-[30vw] rounded-full bg-emerald-50/30 blur-[100px]" style={{ animationDelay: '2s' }} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10 w-full max-w-[460px] px-6"
            >
                <div className="bg-white rounded-[2.5rem] p-10 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100">
                    {/* Logo & Header */}
                    <div className="text-center mb-10">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 100 }}
                            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 bg-indigo-50 text-indigo-600 shadow-sm"
                        >
                            <Landmark size={32} strokeWidth={2.5} />
                        </motion.div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
                            Buat Akun
                        </h1>
                        <p className="text-sm font-medium text-slate-500">
                            Mulai langkah cerdas atur keuanganmu.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                    <User size={18} />
                                </span>
                                <input
                                    name="name"
                                    id="name"
                                    type="text"
                                    className="w-full h-12 pl-12 pr-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                                    placeholder="Nama kamu"
                                    value={form.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Alamat Email</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                    <Mail size={18} />
                                </span>
                                <input
                                    name="email"
                                    id="email"
                                    type="email"
                                    className="w-full h-12 pl-12 pr-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                                    placeholder="nama@email.com"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Kata Sandi</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                    <Lock size={18} />
                                </span>
                                <input
                                    name="password"
                                    id="password"
                                    type="password"
                                    className="w-full h-12 pl-12 pr-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                                    placeholder="Minimal 6 karakter"
                                    value={form.password}
                                    onChange={handleChange}
                                    required
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="p-3 bg-red-50 border border-red-100 rounded-xl text-[13px] text-red-600 font-medium text-center"
                            >
                                {error}
                            </motion.div>
                        )}

                        <button
                            id="btn-register"
                            type="submit"
                            className="w-full h-13 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Daftar Sekarang
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-slate-100 text-center">
                        <p className="text-sm text-slate-500 font-medium">
                            Sudah punya akun?{" "}
                            <Link href="/login" className="text-indigo-600 font-bold hover:underline decoration-indigo-200 underline-offset-4">
                                Masuk
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="mt-8 text-center text-[11px] font-bold text-slate-400 uppercase tracking-[.2em] opacity-60">
                    Trusted by 10,000+ Smart Users
                </p>
            </motion.div>
        </div>
    );
}
