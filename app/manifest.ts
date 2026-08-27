import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Red Devils Uzbekistan",
    short_name: "Red Devils UZ",
    description:
      "O'zbekistondagi Manchester United muxlislari uchun jamoat sayti: jamoa tarkibi, o'yinlar, turnir jadvali, tarix va fan-klub.",
    lang: "uz",
    start_url: "/",
    display: "standalone",
    background_color: "#08080A",
    theme_color: "#08080A",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
