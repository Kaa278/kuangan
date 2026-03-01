export const runtime = "nodejs";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    return (
        <div className="flex min-h-screen" style={{ background: "var(--bg-main)" }}>
            <Sidebar user={{ name: session.user.name ?? "User", email: session.user.email ?? "" }} />

            <main className="flex-1 overflow-auto relative z-10 p-6 pb-28 lg:pb-6">
                {children}
            </main>
        </div>
    );
}
