import { useEffect } from "react";
import {
  onMessage,
  type MessagePayload,
} from "firebase/messaging";

import { getFirebaseMessaging } from "./firebase";
import { markNotificationAsHandled } from "./notificationDedup";
import { getCurrentUserId } from "./pushUserStorage";

function getSafeLink(link?: string) {
  if (!link) {
    return null;
  }

  try {
    const url = new URL(link);

    if (url.protocol !== "https:") {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function handleForegroundMessage(
  payload: MessagePayload,
) {
  const data = payload.data;

  if (!data) {
    return;
  }

  const currentUserId = getCurrentUserId();

  if (
    !currentUserId ||
    !data.audienceUserId ||
    data.audienceUserId !== currentUserId
  ) {
    return;
  }

  const notificationId =
    data.notificationId;

  if (!notificationId) {
    return;
  }

  if (
    !markNotificationAsHandled(
      notificationId,
    )
  ) {
    return;
  }

  const title =
    payload.notification?.title ??
    data.title ??
    "이닝로그";

  const body =
    payload.notification?.body ??
    data.body ??
    "";

  const link = getSafeLink(data.link);

  if (
    Notification.permission !== "granted"
  ) {
    return;
  }

  const notification = new Notification(
    title,
    {
      body,
      tag: notificationId,
    },
  );

  notification.onclick = () => {
    window.focus();

    if (link) {
      window.location.assign(link);
    }

    notification.close();
  };
}

export function ForegroundNotificationInitializer() {
  useEffect(() => {
    let unsubscribe:
      | (() => void)
      | undefined;

    const initialize = async () => {
      const messaging =
        await getFirebaseMessaging();

      if (!messaging) {
        return;
      }

      unsubscribe = onMessage(
        messaging,
        handleForegroundMessage,
      );
    };

    void initialize();

    return () => {
      unsubscribe?.();
    };
  }, []);

  return null;
}