import type { Metadata } from "next";
import { Anton, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Red Devils Uzbekistan — Manchester United muxlislari klubi",
  description:
    "O'zbekistondagi Manchester United muxlislari uchun jamoat sayti: jamoa tarkibi, o'yinlar, turnir jadvali, tarix va fan-klub.",
  icons: { icon: "/assets/favicon.svg" },
  openGraph: {
    title: "Red Devils Uzbekistan",
    description: "O'zbekistondagi Manchester United muxlislari jamoasi",
    locale: "uz_UZ",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz" className={`${inter.variable} ${anton.variable}`}>
      <body>{children}</body>
    </html>
  );
}
