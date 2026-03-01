"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Landmark, ArrowRight, Mail, Lock } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        const res = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        setLoading(false);
        if (res?.error) {
            setError("Email atau password salah.");
        } else {
            router.push("/dashboard");
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden light-mesh">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-dot-pattern opacity-[0.4]" />

            {/* Soft Ambient Accents */}
            <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-indigo-100/40 blur-[100px] animate-pulse" />
            <div className="absolute bottom-[-5%] right-[-5%] w-[30vw] h-[30vw] rounded-full bg-purple-100/30 blur-[100px]" style={{ animationDelay: '2s' }} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10 w-full max-w-[440px] px-6"
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
                            KuAngan
                        </h1>
                        <p className="text-sm font-medium text-slate-500">
                            Kelola keuangan jadi lebih asik.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                    <Mail size={18} />
                                </span>
                                <input
                                    id="email"
                                    type="email"
                                    className="w-full h-12 pl-12 pr-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                                    placeholder="nama@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
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
                                    id="password"
                                    type="password"
                                    className="w-full h-12 pl-12 pr-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                                    placeholder="Minimal 6 karakter"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
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
                            id="btn-login"
                            type="submit"
                            className="w-full h-13 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Masuk Sekarang
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-slate-100 text-center">
                        <p className="text-sm text-slate-500 font-medium">
                            Baru di KuAngan?{" "}
                            <Link href="/register" className="text-indigo-600 font-bold hover:underline decoration-indigo-200 underline-offset-4">
                                Daftar Gratis
                            </Link>
                        </p>
                    </div>
                </div>


            </motion.div>
        </div>
    );
}
