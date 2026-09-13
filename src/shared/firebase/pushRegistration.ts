import {
  onRegistered,
  register,
  type Messaging,
} from "firebase/messaging";

import { registerPushNotification } from "../../features/home/api/notificationApi";
import { getFirebaseMessaging } from "./firebase";
import { registerFirebaseServiceWorker } from "./registerServiceWorker";
import { savePushInstallationId } from "./pushInstallationStorage";

let registeredMessaging: Messaging | null = null;

function subscribeToRegistered(
  messaging: Messaging,
) {
  if (registeredMessaging === messaging) {
    return;
  }

  registeredMessaging = messaging;

  onRegistered(messaging, (installationId) => {
    savePushInstallationId(installationId);

    void registerPushNotification({
      platform: "WEB",
      installationId,
    }).catch((error) => {
      console.error(
        "푸시 알림 서버 등록 실패:",
        error,
      );
    });
  });
}

export async function registerPushInstallation() {
  if (!("Notification" in window)) {
    return;
  }

  if (Notification.permission !== "granted") {
    return;
  }

  const messaging = await getFirebaseMessaging();

  if (!messaging) {
    return;
  }

  const serviceWorkerRegistration =
    await registerFirebaseServiceWorker();

  subscribeToRegistered(messaging);

  await register(messaging, {
    vapidKey:
      import.meta.env.VITE_FIREBASE_VAPID_PUBLIC_KEY,
    serviceWorkerRegistration,
  });
}