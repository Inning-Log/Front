import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://54.116.214.217",
        changeOrigin: true,
      },
    },
  },

  plugins: [
    react(),
    tailwindcss(),

    VitePWA({
      registerType: "autoUpdate",

      strategies: "injectManifest",
      srcDir: "src",
      filename: "firebase-messaging-sw.ts",

      // Service Worker는 registerServiceWorker.ts에서 직접 등록
      injectRegister: false,

      devOptions: {
        enabled: true,
        type: "module",
      },

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

      injectManifest: {
        globPatterns: [
          "**/*.{js,css,html,ico,png,svg,webp}",
        ],
      },
    }),
  ],
});