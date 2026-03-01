import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KuAngan – Catat Keuangan & Scan Struk",
  description: "Aplikasi pencatat keuangan pribadi dengan AI scan struk, analisis pengeluaran, dan prediksi akhir bulan.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
