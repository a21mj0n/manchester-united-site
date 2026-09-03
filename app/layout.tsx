import type { Metadata, Viewport } from "next";
import { Anton, Inter } from "next/font/google";
import InstallPrompt from "@/components/InstallPrompt";
import VisitBeacon from "@/components/VisitBeacon";
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
  icons: {
    icon: "/assets/favicon.svg",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "Red Devils UZ",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "Red Devils Uzbekistan",
    description: "O'zbekistondagi Manchester United muxlislari jamoasi",
    locale: "uz_UZ",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#08080A",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz" className={`${inter.variable} ${anton.variable}`}>
      <body>
        {children}
        <InstallPrompt />
        <VisitBeacon />
      </body>
    </html>
  );
}
