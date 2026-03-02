"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, CreditCard, ScanLine, PieChart, Settings, LogOut, Wallet } from "lucide-react";

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/transactions", label: "Transaksi", icon: CreditCard },
    { href: "/dashboard/ai-scan", label: "Scan", icon: ScanLine, isCenter: true },
    { href: "/dashboard/reports", label: "Laporan", icon: PieChart },
    { href: "/dashboard/settings", label: "Pengaturan", icon: Settings },
];

export default function Sidebar({ user }: { user: { name: string; email: string } }) {
    const pathname = usePathname();

    const isActive = (href: string) =>
        href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

    return (
        <>
            {/* Desktop Sidebar (hidden on mobile) */}
            <aside
                className="hidden lg:flex flex-col h-screen sticky top-0 sidebar-desktop"
                style={{
                    width: 240,
                    padding: "1.5rem 1rem",
                }}
            >
                {/* Logo - Minimal & Clean */}
                <div className="flex items-center gap-3 mb-8 px-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
                        style={{ background: "var(--accent-primary)", color: "white" }}>
                        <Wallet size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                        <div className="font-bold text-base leading-tight" style={{ color: "var(--text-main)", letterSpacing: "-0.02em" }}>
                            Ku<span style={{ color: "var(--accent-primary)" }}>Angan</span>
                        </div>
                        <div className="text-[11px] font-medium tracking-wide uppercase mt-0.5" style={{ color: "var(--text-muted)" }}>
                            Smart Budget
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex flex-col gap-1 flex-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`nav-item${isActive(item.href) ? " active" : ""}`}
                            >
                                <Icon size={20} className={isActive(item.href) ? "" : "opacity-70"} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User info + logout */}
                <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border-light)" }}>
                    <div className="flex items-center justify-between mb-3 px-2">
                        <div className="flex-1 min-w-0 pr-2">
                            <div className="font-semibold text-sm truncate" style={{ color: "var(--text-main)" }}>{user.name}</div>
                            <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{user.email}</div>
                        </div>
                    </div>
                    <button
                        id="btn-logout"
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="nav-item w-full text-left transition-colors"
                        style={{ color: "var(--accent-red)" }}
                    >
                        <LogOut size={20} className="opacity-80" />
                        <span className="font-medium">Keluar</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Bottom Navigation (hidden on lg) */}
            <nav
                className="fixed bottom-0 left-0 right-0 z-50 lg:hidden flex justify-around items-center sidebar-mobile"
                style={{
                    paddingBottom: "env(safe-area-inset-bottom)",
                    height: "64px",
                }}
            >
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    if (item.isCenter) {
                        return (
                            <div key={item.href} className="relative flex-1 flex justify-center">
                                <Link
                                    href={item.href}
                                    className="absolute flex items-center justify-center rounded-full transition-transform active:scale-95 shadow-sm"
                                    style={{
                                        top: "-28px", // Protrudes upwards
                                        width: "56px",
                                        height: "56px",
                                        background: "var(--accent-primary)",
                                        border: "4px solid var(--bg-main)", // Match body background to blend seamlessly
                                        color: "white"
                                    }}
                                >
                                    <Icon size={24} strokeWidth={2.5} />
                                </Link>
                                {/* Invisible spacer for flex layout to align properly */}
                                <div className="h-full w-full opacity-0 pointer-events-none" />
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col flex-1 items-center justify-center gap-1 h-full pt-1"
                            style={{ color: active ? "var(--accent-primary)" : "var(--text-muted)" }}
                        >
                            <Icon size={22} strokeWidth={active ? 2.5 : 2} className={active ? "" : "opacity-80"} />
                            <span style={{ fontSize: "0.65rem", fontWeight: active ? 600 : 500 }}>
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
            </nav>
        </>
    );
}
