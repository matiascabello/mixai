import type { Metadata } from "next";
import { Anton, Archivo } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const displayFont = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
});

const bodyFont = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-archivo",
});

export const metadata: Metadata = {
  title: "MixAI",
  description: "Describe the vibe. It builds the set. MixAI is an AI DJ that builds a real Spotify playlist for your party.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
