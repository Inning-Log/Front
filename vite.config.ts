import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",

      manifest: {
        name: "이닝로그",
        short_name: "이닝로그",
        description: "야구 관람 기록을 남기는 웹앱",
        lang: "ko-KR",

        start_url: "/",
        scope: "/",
        display: "standalone",

        theme_color: "#0E4824",
        background_color: "#0E4824",

        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },

      workbox: {
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});