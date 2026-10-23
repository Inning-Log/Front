export async function syncPushUserContext(
  userId: number | null,
) {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  const registration =
    await navigator.serviceWorker.getRegistration();

  if (!registration) {
    return;
  }

  const message = {
    type: "SET_CURRENT_USER_ID",
    userId:
      userId === null ? null : String(userId),
  };

  registration.active?.postMessage(message);
  registration.waiting?.postMessage(message);
  registration.installing?.postMessage(message);

  navigator.serviceWorker.controller?.postMessage(
    message,
  );
}