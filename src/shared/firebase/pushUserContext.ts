export async function syncPushUserContext(
  userId: number | null,
) {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  const registration =
    await navigator.serviceWorker.ready;

  const message = {
    type: "SET_CURRENT_USER_ID",
    userId:
      userId === null ? null : String(userId),
  };

  registration.active?.postMessage(message);

  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(
      message,
    );
  }
}