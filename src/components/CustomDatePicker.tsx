"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function CustomDatePicker({
    value,
    onChange
}: {
    value: string,
    onChange: (val: string) => void
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Provide default to today if empty
    const initialDate = value ? new Date(value) : new Date();
    const [currentMonth, setCurrentMonth] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function prevMonth(e: React.MouseEvent) {
        e.stopPropagation();
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    }

    function nextMonth(e: React.MouseEvent) {
        e.stopPropagation();
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    }

    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayIndex = currentMonth.getDay();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
        days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    // formatting value for display: YYYY-MM-DD to DD MMM YYYY
    let displayValue = "";
    if (value) {
        const d = new Date(value);
        if (!isNaN(d.getTime())) {
            displayValue = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
        }
    }

    return (
        <div className="relative" ref={ref}>
            <div
                className="input-field flex items-center justify-between cursor-pointer"
                onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
                style={{ borderColor: open ? "var(--accent-primary)" : "var(--border-light)", minHeight: "42px" }}
            >
                <span className="truncate pr-2" style={{ color: displayValue ? "var(--text-main)" : "var(--text-muted)", fontWeight: 500 }}>
                    {displayValue || "Pilih tanggal"}
                </span>
                <CalendarIcon size={16} className="flex-shrink-0" style={{ color: "var(--text-muted)" }} />
            </div>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 right-0 z-50 mt-1 p-3 rounded-xl shadow-lg border border-slate-200"
                        style={{ background: "var(--bg-card)" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <button type="button" onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded-md transition-colors" style={{ color: "var(--text-main)" }}>
                                <ChevronLeft size={18} />
                            </button>
                            <div className="font-semibold text-sm" style={{ color: "var(--text-main)" }}>
                                {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                            </div>
                            <button type="button" onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded-md transition-colors" style={{ color: "var(--text-main)" }}>
                                <ChevronRight size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {DAYS.map(d => (
                                <div key={d} className="text-center text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>{d}</div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {days.map((d, i) => {
                                if (!d) return <div key={i} />;

                                const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                const isSelected = value === dateStr;
                                // Local date fix for 'today'
                                const todayDate = new Date();
                                const todayStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
                                const isToday = todayStr === dateStr;

                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); onChange(dateStr); setOpen(false); }}
                                        className="h-8 w-full flex items-center justify-center rounded-lg text-sm transition-colors hover:bg-indigo-50"
                                        style={{
                                            background: isSelected ? "var(--accent-primary)" : (isToday ? "#eff6ff" : "transparent"),
                                            color: isSelected ? "white" : (isToday ? "var(--accent-primary)" : "var(--text-main)"),
                                            fontWeight: isSelected || isToday ? 600 : 400
                                        }}
                                    >
                                        {d}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
