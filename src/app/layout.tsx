import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AirBoard - AI-Powered Virtual Canvas",
  description: "Draw in the air using your hand movements captured in real-time.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full dark bg-slate-950 text-slate-100 antialiased">
      <body className={`${geistSans.variable} ${geistMono.variable} h-full overflow-hidden`}>
        {children}
      </body>
    </html>
  );
}

