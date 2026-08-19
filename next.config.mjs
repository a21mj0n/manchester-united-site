/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Serverga deploy uchun: build natijasida .next/standalone ichida
  // o'zi yetarli (self-contained) server.js hosil bo'ladi.
  // Serverga node_modules ni to'liq ko'chirish shart emas.
  output: "standalone",
};

export default nextConfig;
