import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
// The Ladle prototype's fonts, used only by the demo's mockups (components/Mockup.tsx).
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], weight: ["600"], preload: false });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], preload: false });

export const metadata: Metadata = {
  title: "Forkpoint",
  description:
    "Find the interaction and flow decisions your PRD leaves open, decide them one at a time, and get a prompt for Claude Code.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} ${inter.variable} antialiased`}>
      {/* D9: desktop-first, minimum width 1280 px. */}
      <body className="min-h-screen min-w-[1280px] bg-white text-zinc-900">{children}</body>
    </html>
  );
}
