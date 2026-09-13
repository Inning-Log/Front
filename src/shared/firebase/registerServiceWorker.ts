export async function registerFirebaseServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    throw new Error(
      "현재 브라우저는 Service Worker를 지원하지 않습니다.",
    );
  }

  const existingRegistration =
    await navigator.serviceWorker.getRegistration("/");

  if (existingRegistration) {
    return existingRegistration;
  }

  const isProduction =
    import.meta.env.MODE === "production";

  const registration =
    await navigator.serviceWorker.register(
      isProduction
        ? "/firebase-messaging-sw.js"
        : "/dev-sw.js?dev-sw",
      {
        scope: "/",
        type: isProduction
          ? "classic"
          : "module",
      },
    );

  return registration;
}