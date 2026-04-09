import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Energika ERP - Centre d'Orthophonie",
  description:
    "Système de gestion pour le centre d'orthophonie Energika. Gestion des patients, planning, comptabilité et suivi des forfaits mensuels.",
  keywords: "orthophonie, gestion, ERP, patients, comptabilité, Energika",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="min-h-screen bg-[var(--color-bg-primary)] antialiased">
        {children}
      </body>
    </html>
  );
}
