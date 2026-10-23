import { GoogleOAuthProvider } from "@react-oauth/google";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.tsx";
import "./styles/globals.css";

import { registerFirebaseServiceWorker } from "./shared/firebase/registerServiceWorker";

// 앱 시작 시 PWA 서비스워커 등록 및 업데이트 확인
if ("serviceWorker" in navigator) {
  void registerFirebaseServiceWorker().catch((error) => {
    console.error("서비스워커 등록 실패:", error);
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
);