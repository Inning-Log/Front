export async function registerFirebaseServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    throw new Error(
      "현재 브라우저는 Service Worker를 지원하지 않습니다.",
    );
  }

  const params = new URLSearchParams({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:
      import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId:
      import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  });

  return navigator.serviceWorker.register(
    `/firebase-messaging-sw.js?${params.toString()}`,
    {
      scope: "/",
    },
  );
}