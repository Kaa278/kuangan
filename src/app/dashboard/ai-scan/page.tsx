"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import TransactionModal from "@/components/TransactionModal";
import { mutate as globalMutate } from "swr";
import { Camera, Bot, CheckCircle2, Images, Camera as CameraIcon, X, Zap, RefreshCw, Sparkles, ReceiptText } from "lucide-react";

type ScanResult = {
    store: string | null;
    total: number | null;
    date: string | null;
    items?: { name: string; price: number }[];
    currency?: string;
};

export default function AIScanPage() {
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState<ScanResult | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [scansInfo, setScansInfo] = useState<{ today: number; limit: number } | null>(null);

    // Live Camera States
    const [isLive, setIsLive] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const galleryRef = useRef<HTMLInputElement>(null);

    const startCamera = async () => {
        setIsLive(true);
        setError("");
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "environment",
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Error accessing camera", err);
            setError("Gagal mengakses kamera. Pastikan izin diberikan.");
            setIsLive(false);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsLive(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            // Set dimensions match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], "receipt_capture.jpg", { type: "image/jpeg" });
                    handleLocalFile(file);
                    stopCamera();
                }
            }, "image/jpeg", 0.9);
        }
    };

    useEffect(() => {
        // Auto-start camera if no result and no image
        if (!image && !result && !loading) {
            startCamera();
        }
        return () => stopCamera();
    }, []);

    const handleLocalFile = useCallback((file: File) => {
        if (!file.type.startsWith("image/")) { setError("File harus berupa gambar."); return; }
        setImage(file);
        setPreview(URL.createObjectURL(file));
        setResult(null);
        setError("");
    }, []);

    const triggerGallery = () => {
        galleryRef.current?.click();
    };

    async function handleScan() {
        if (!image) return;
        setLoading(true);
        setError("");
        setResult(null);

        const fd = new FormData();
        fd.append("image", image);

        try {
            const res = await fetch("/api/ai-scan", { method: "POST", body: fd });
            const data = await res.json();
            setLoading(false);

            if (!res.ok) {
                setError(data.error ?? "Gagal scan struk.");
                return;
            }
            setResult(data.data);
            setScansInfo({ today: data.scansToday, limit: data.scansLimit });
        } catch (e) {
            setLoading(false);
            setError("Terjadi kesalahan koneksi.");
        }
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto relative pb-10">
            {/* hidden canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />
            <input ref={galleryRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        handleLocalFile(file);
                        stopCamera();
                    }
                }} />

            <AnimatePresence>
                {successMsg && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, y: -20, x: "-50%" }}
                        className="fixed top-12 left-1/2 z-[150] bg-emerald-500 text-white px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2"
                    >
                        <CheckCircle2 size={18} strokeWidth={3} />
                        {successMsg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* LIVE CAMERA FULLSCREEN OVERLAY */}
            <AnimatePresence>
                {isLive && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black flex flex-col"
                    >
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="absolute inset-0 w-full h-full object-cover"
                        />

                        {/* Interactive UI Overlays */}
                        <div className="absolute inset-0 flex flex-col items-center justify-between p-6 pointer-events-none">
                            {/* Top row */}
                            <div className="w-full flex justify-between items-center pointer-events-auto">
                                <button onClick={stopCamera} className="p-3 bg-black/30 rounded-full backdrop-blur-md text-white border border-white/10 shadow-lg active:scale-90 transition-transform">
                                    <X size={24} />
                                </button>
                                <button onClick={triggerGallery} className="p-3 bg-black/30 rounded-full backdrop-blur-md text-white border border-white/10 shadow-lg active:scale-90 transition-transform">
                                    <Images size={24} />
                                </button>
                            </div>

                            {/* Center Frame */}
                            <div className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px] border-[2px] border-white/40 rounded-[2.5rem] shadow-[0_0_0_100vmax_rgba(0,0,0,0.5)]">
                                {/* Corners Accent */}
                                <div className="absolute top-0 left-0 w-10 h-10 border-t-[4px] border-l-[4px] border-indigo-500 rounded-tl-[2rem]" />
                                <div className="absolute top-0 right-0 w-10 h-10 border-t-[4px] border-r-[4px] border-indigo-500 rounded-tr-[2rem]" />
                                <div className="absolute bottom-0 left-0 w-10 h-10 border-b-[4px] border-l-[4px] border-indigo-500 rounded-bl-[2rem]" />
                                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-[4px] border-r-[4px] border-indigo-500 rounded-br-[2rem]" />

                                {/* Scan line animation */}
                                <div className="absolute inset-x-0 flex items-center justify-center top-0">
                                    <div className="w-full h-[3px] bg-indigo-500 animate-scan-line shadow-[0_0_20px_rgba(99,102,241,1)]" />
                                </div>
                            </div>

                            {/* Bottom Area */}
                            <div className="w-full space-y-8 text-center pointer-events-auto pb-8">
                                <p className="text-sm font-semibold text-white tracking-wide uppercase drop-shadow-lg">
                                    Simpan struk di tengah kotak
                                </p>
                                <div className="flex justify-center items-center gap-10">
                                    <div className="w-12 h-12" /> {/* spacer */}
                                    <button
                                        onClick={capturePhoto}
                                        className="w-22 h-22 bg-white rounded-full flex items-center justify-center p-1.5 shadow-2xl active:scale-95 transition-transform"
                                    >
                                        <div className="w-full h-full border-[3px] border-slate-100 rounded-full" />
                                    </button>
                                    <button onClick={triggerGallery} className="flex flex-col items-center gap-1 text-white/80 active:scale-95 transition-transform translate-y-2">
                                        <Images size={20} />
                                        <span className="text-[10px] uppercase font-bold tracking-tighter">Galeri</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MAIN WEB UI */}
            <div className="space-y-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-main)" }}>Scan Struk</h1>
                        <p className="text-sm mt-1 font-medium" style={{ color: "var(--text-muted)" }}>
                            Arahkan kamera & biarkan AI Kathlyn membaca strukmu
                        </p>
                    </div>
                    {scansInfo && (
                        <div className="px-4 py-2 rounded-2xl text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm"
                            style={{ background: "white", border: "1px solid var(--border-light)", color: "var(--text-muted)" }}>
                            <Sparkles size={12} className="text-amber-500" />
                            Quota: {scansInfo.today}/{scansInfo.limit}
                        </div>
                    )}
                </div>

                {!image && !result && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass border-2 border-dashed flex flex-col items-center justify-center py-16 gap-4 cursor-pointer hover:border-indigo-400 active:scale-[0.99] transition-all bg-white"
                        style={{ borderColor: "var(--border-light)" }}
                        onClick={startCamera}
                    >
                        <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-100">
                            <Camera size={36} strokeWidth={1.5} />
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-lg" style={{ color: "var(--text-main)" }}>Mulai Memindai</p>
                            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Klik di sini untuk membuka kamera</p>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); triggerGallery(); }}
                            className="mt-2 text-xs font-bold text-indigo-600 hover:underline uppercase tracking-widest px-4 py-2 rounded-xl bg-indigo-50/50"
                        >
                            Atau Pilih dari Galeri
                        </button>
                    </motion.div>
                )}

                {image && !result && !loading && (
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-4">
                        <div className="relative glass p-2 bg-white shadow-xl rounded-2xl border border-slate-100 overflow-hidden">
                            {preview && (
                                <img src={preview} alt="Struk" className="w-full max-h-[400px] object-contain rounded-xl" />
                            )}
                            <button
                                onClick={() => { setImage(null); setPreview(null); startCamera(); }}
                                className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full backdrop-blur-md shadow-lg"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <button
                            id="btn-scan"
                            onClick={handleScan}
                            className="btn-primary w-full py-5 text-lg font-bold shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-95 transition-all"
                        >
                            <Bot size={24} />
                            Proses data sekarang
                        </button>
                    </motion.div>
                )}

                {loading && (
                    <div className="glass p-12 flex flex-col items-center justify-center gap-5 text-center bg-white border border-slate-100 shadow-lg">
                        <div className="relative">
                            <div className="w-20 h-20 border-4 border-indigo-100 rounded-full" />
                            <div className="absolute top-0 left-0 w-20 h-20 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin" />
                            <Bot className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500" size={32} />
                        </div>
                        <div>
                            <p className="font-bold text-lg" style={{ color: "var(--text-main)" }}>Kathlyn sedang membaca struk...</p>
                            <p className="text-sm opacity-70" style={{ color: "var(--text-muted)" }}>Mohon tunggu sebentar, data sedang diproses.</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 flex items-start gap-3 shadow-sm">
                        <X size={20} className="mt-0.5 flex-shrink-0" />
                        <div className="text-sm font-semibold">{error}</div>
                    </div>
                )}

                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass p-6 space-y-5 shadow-2xl bg-white border border-slate-100 rounded-3xl"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                                    <ReceiptText size={20} />
                                </div>
                                <h3 className="font-extrabold text-lg" style={{ color: "var(--text-main)" }}>Hasil Pembacaan</h3>
                            </div>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase rounded-full border border-emerald-100">
                                Selesai
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">TOTAL</p>
                                <p className="text-xl font-black text-indigo-600">{result.total ? formatCurrency(result.total) : "—"}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">TOKO</p>
                                <p className="text-lg font-black text-slate-800 truncate">{result.store ?? "—"}</p>
                            </div>
                            <div className="col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TANGGAL STRUK</p>
                                <p className="text-sm font-bold text-slate-800">{result.date ?? "—"}</p>
                            </div>
                        </div>

                        {result.items && result.items.length > 0 && (
                            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">RINCIAN BARANG</p>
                                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {result.items.map((item, i) => (
                                        <div key={i} className="flex justify-between items-center text-sm">
                                            <span className="text-slate-700 font-medium truncate pr-4">{item.name}</span>
                                            <span className="text-slate-900 font-black flex-shrink-0">{formatCurrency(item.price)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4 pt-4">
                            <button
                                className="flex-1 px-6 py-4 rounded-2xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors active:scale-95"
                                onClick={() => { setResult(null); setImage(null); startCamera(); }}
                            >
                                Ulangi
                            </button>
                            <button
                                onClick={() => setShowConfirm(true)}
                                className="flex-[2] btn-primary py-4 font-black shadow-lg active:scale-95 transition-all"
                                disabled={!result.total}
                            >
                                Simpan ke Dompet
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Confirm Modal */}
            {showConfirm && result && result.total && (
                <TransactionModal
                    prefill={{
                        amount: result.total,
                        store: result.store ?? undefined,
                        date: result.date ?? undefined,
                    }}
                    onClose={() => setShowConfirm(false)}
                    onSuccess={() => {
                        setShowConfirm(false);
                        setResult(null);
                        setPreview(null);
                        setImage(null);
                        setSuccessMsg("Tersimpan!");
                        setTimeout(() => setSuccessMsg(""), 3500);
                        globalMutate("/api/dashboard");
                    }}
                />
            )}
        </div>
    );
}
