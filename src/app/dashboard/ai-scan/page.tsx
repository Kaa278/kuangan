"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import TransactionModal from "@/components/TransactionModal";
import { mutate as globalMutate } from "swr";
import { Camera, Bot, CheckCircle2, Images, Camera as CameraIcon } from "lucide-react";
import { Camera as CapCamera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";

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

    // Separate refs for camera (main) and gallery (secondary action)
    const cameraRef = useRef<HTMLInputElement>(null);
    const galleryRef = useRef<HTMLInputElement>(null);

    const triggerCamera = async () => {
        if (Capacitor.isNativePlatform()) {
            try {
                const photo = await CapCamera.getPhoto({
                    quality: 90,
                    allowEditing: false,
                    resultType: CameraResultType.Uri,
                    source: CameraSource.Camera
                });
                if (photo.webPath) {
                    const response = await fetch(photo.webPath);
                    const blob = await response.blob();
                    const file = new File([blob], "struk.jpg", { type: "image/jpeg" });
                    handleFile(file);
                }
            } catch (e) {
                console.log("Camera cancelled or failed", e);
            }
        } else {
            cameraRef.current?.click();
        }
    };

    const triggerGallery = async () => {
        if (Capacitor.isNativePlatform()) {
            try {
                const photo = await CapCamera.getPhoto({
                    quality: 90,
                    allowEditing: false,
                    resultType: CameraResultType.Uri,
                    source: CameraSource.Photos
                });
                if (photo.webPath) {
                    const response = await fetch(photo.webPath);
                    const blob = await response.blob();
                    const file = new File([blob], "struk.jpg", { type: "image/jpeg" });
                    handleFile(file);
                }
            } catch (e) {
                console.log("Gallery cancelled or failed", e);
            }
        } else {
            galleryRef.current?.click();
        }
    };

    // Auto-trigger camera on mount if native (as requested)
    useState(() => {
        if (Capacitor.isNativePlatform() && !image) {
            triggerCamera();
        }
    });

    const handleFile = useCallback((file: File) => {
        if (!file.type.startsWith("image/")) { setError("File harus berupa gambar."); return; }
        setImage(file);
        setPreview(URL.createObjectURL(file));
        setResult(null);
        setError("");
    }, []);

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }

    async function handleScan() {
        if (!image) return;
        setLoading(true);
        setError("");
        setResult(null);

        const fd = new FormData();
        fd.append("image", image);

        const res = await fetch("/api/ai-scan", { method: "POST", body: fd });
        const data = await res.json();
        setLoading(false);

        if (!res.ok) {
            setError(data.error ?? "Gagal scan.");
            return;
        }
        setResult(data.data);
        setScansInfo({ today: data.scansToday, limit: data.scansLimit });
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto relative">
            <AnimatePresence>
                {successMsg && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, y: -20, x: "-50%" }}
                        className="fixed top-24 left-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-full font-medium shadow-lg flex items-center gap-2"
                    >
                        <CheckCircle2 size={18} />
                        {successMsg}
                    </motion.div>
                )}
            </AnimatePresence>

            <div>
                <h1 className="text-2xl font-bold" style={{ color: "var(--text-main)" }}>Scan Struk</h1>
                <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                    Foto struk → baca otomatis → simpan transaksi
                </p>
            </div>

            {scansInfo && (
                <div className="p-3 rounded-xl text-sm flex items-center justify-between"
                    style={{ background: "#e0e7ff", border: "1px solid #c7d2fe" }}>
                    <span style={{ color: "var(--accent-primary-hover)" }}>Scan hari ini:</span>
                    <span style={{ color: "var(--accent-primary)", fontWeight: 700 }}>{scansInfo.today} / {scansInfo.limit}</span>
                </div>
            )}

            {/* Drop zone / Camera zone */}
            <div
                className="glass glass-hover relative flex flex-col items-center justify-center gap-3 shadow-sm transition-all overflow-hidden"
                style={{ minHeight: 200, borderStyle: "dashed", borderColor: "var(--accent-secondary)", background: "var(--bg-card)" }}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
            >
                <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                <input ref={galleryRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

                {preview ? (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={preview} alt="Preview struk" className="max-h-64 max-w-full rounded-xl object-contain shadow-sm p-2 cursor-pointer" onClick={() => triggerCamera()} />
                        <button onClick={(e) => { e.stopPropagation(); triggerGallery(); }}
                            className="md:hidden absolute bottom-3 right-3 p-2.5 bg-white rounded-full shadow-lg text-indigo-600 hover:bg-indigo-50 transition-colors border border-slate-200 z-10 hover:scale-105 active:scale-95"
                            title="Pilih dari Galeri">
                            <Images size={20} strokeWidth={2} />
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full cursor-pointer absolute inset-0" onClick={() => triggerCamera()}>
                        <div className="text-indigo-400 mb-2 p-4 rounded-full bg-indigo-50">
                            <CameraIcon size={40} strokeWidth={1.5} className="text-indigo-500" />
                        </div>
                        <p className="font-bold text-base text-center px-4" style={{ color: "var(--text-main)" }}>Buka Kamera</p>
                        <p className="text-xs mt-1 text-center font-medium" style={{ color: "var(--text-muted)" }}>atau klik untuk foto langsung</p>

                        <button onClick={(e) => { e.stopPropagation(); triggerGallery(); }}
                            className="md:hidden absolute bottom-3 right-3 p-2.5 bg-white rounded-full shadow-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors border border-slate-200 z-10 hover:scale-105 active:scale-95"
                            title="Pilih dari Galeri">
                            <Images size={20} strokeWidth={2} />
                        </button>
                    </div>
                )}
            </div>

            {error && (
                <div className="p-3 rounded-xl text-sm font-medium" style={{ background: "#fef2f2", border: "1px solid #fee2e2", color: "#ef4444" }}>
                    {error}
                </div>
            )}

            <button id="btn-scan" className="btn-primary w-full shadow-md text-base py-3.5 mb-2" disabled={!image || loading} onClick={handleScan}>
                {loading ? (
                    <><span className="spinner" /> Membaca struk...</>
                ) : (
                    <><Bot size={22} className="mr-1.5" /> Scan</>
                )}
            </button>

            {/* Result */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass p-5 space-y-4 shadow-sm"
                        style={{ background: "var(--bg-card)" }}
                    >
                        <div className="flex items-center justify-between pb-2" style={{ borderBottom: "1px solid var(--border-light)" }}>
                            <h3 className="font-bold" style={{ color: "var(--text-main)" }}>Hasil Scan</h3>
                            <span className="badge badge-income bg-green-50 text-green-600 border border-green-200">
                                <CheckCircle2 size={12} className="mr-1 inline" /> Berhasil
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm pt-2">
                            <div className="stat-card shadow-sm border border-slate-100 flex flex-col justify-center gap-1 p-3 rounded-xl bg-white/50">
                                <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Total</span>
                                <span className="text-lg font-bold" style={{ color: "var(--text-main)" }}>
                                    {result.total ? formatCurrency(result.total) : "—"}
                                </span>
                            </div>
                            <div className="stat-card shadow-sm border border-slate-100 flex flex-col justify-center gap-1 p-3 rounded-xl bg-white/50 overflow-hidden">
                                <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Toko</span>
                                <span className="font-bold truncate" style={{ color: "var(--text-main)" }}>{result.store ?? "—"}</span>
                            </div>
                            <div className="stat-card col-span-2 shadow-sm border border-slate-100 flex justify-between items-center p-3 rounded-xl bg-white/50">
                                <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Tanggal</span>
                                <span className="font-bold" style={{ color: "var(--text-main)" }}>{result.date ?? "—"}</span>
                            </div>
                        </div>

                        {result.items && result.items.length > 0 && (
                            <div className="pt-2">
                                <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>ITEM</p>
                                <div className="space-y-1 max-h-40 overflow-y-auto pr-2">
                                    {result.items.map((item, i) => (
                                        <div key={i} className="flex justify-between text-sm py-1.5"
                                            style={{ borderBottom: "1px solid var(--border-light)" }}>
                                            <span style={{ color: "var(--text-main)" }} className="font-medium truncate pr-4">{item.name}</span>
                                            <span className="font-semibold flex-shrink-0" style={{ color: "var(--text-main)" }}>{formatCurrency(item.price)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 pt-3">
                            <button className="btn-secondary flex-1 border-slate-200" onClick={() => setResult(null)}>
                                Scan Ulang
                            </button>
                            <button
                                id="btn-save-from-scan"
                                className="btn-primary flex-1 shadow-sm"
                                onClick={() => setShowConfirm(true)}
                                disabled={!result.total}
                            >
                                Simpan Transaksi
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                        setSuccessMsg("Transaksi berhasil disimpan!");
                        setTimeout(() => setSuccessMsg(""), 3500);
                        globalMutate("/api/dashboard");
                    }}
                />
            )}
        </div>
    );
}
