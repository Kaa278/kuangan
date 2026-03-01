"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";

interface Option {
    id: string;
    name: string;
}

export default function CustomSelect({
    value,
    onChange,
    options,
    placeholder = "Pilih..."
}: {
    value: string,
    onChange: (val: string) => void,
    options: Option[],
    placeholder?: string
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selected = options.find((o) => o.id === value);

    const formatName = (name: string) => {
        // Strip emojis if they exist so it matches the clean theme concept, but keep spaces
        return name.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '') || name;
    }

    return (
        <div className="relative" ref={ref}>
            <div
                className="input-field flex items-center justify-between cursor-pointer"
                onClick={() => setOpen(!open)}
                style={{ borderColor: open ? "var(--accent-primary)" : "var(--border-light)", minHeight: "42px" }}
            >
                <span className="truncate pr-2" style={{ color: selected ? "var(--text-main)" : "var(--text-muted)", fontWeight: selected ? 500 : 400 }}>
                    {selected ? formatName(selected.name) : placeholder}
                </span>
                <ChevronDown size={16} className={`transition-transform duration-200 flex-shrink-0 ${open ? "rotate-180" : ""}`} style={{ color: "var(--text-muted)" }} />
            </div>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-xl shadow-lg border border-slate-200"
                        style={{ background: "var(--bg-card)" }}
                    >
                        {options.map((opt) => (
                            <div
                                key={opt.id}
                                className="px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => { onChange(opt.id); setOpen(false); }}
                            >
                                <span className="truncate pr-2" style={{ color: "var(--text-main)", fontWeight: value === opt.id ? 600 : 400 }}>
                                    {formatName(opt.name)}
                                </span>
                                {value === opt.id && <Check size={16} className="flex-shrink-0" style={{ color: "var(--accent-primary)" }} />}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
