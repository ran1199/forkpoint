import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Forkpoint",
  description:
    "Find the interaction and flow decisions your PRD leaves open, decide them one at a time, and get a prompt for Claude Code.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      {/* D9: desktop-first, minimum width 1280 px. */}
      <body className="min-h-screen min-w-[1280px] bg-white text-zinc-900">{children}</body>
    </html>
  );
}
