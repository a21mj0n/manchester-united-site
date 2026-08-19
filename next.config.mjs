/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Serverga deploy uchun: build natijasida .next/standalone ichida
  // o'zi yetarli (self-contained) server.js hosil bo'ladi.
  output: "standalone",

  // better-sqlite3 — native modul (.node binar). Uni bundlega qo'shib
  // bo'lmaydi, shuning uchun tashqi paket sifatida qoldiriladi va
  // ishlash paytida require() orqali yuklanadi.
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3"],
};

export default nextConfig;
