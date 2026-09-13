import { useEffect } from "react";

import { registerPushInstallation } from "./pushRegistration";
import { getCurrentUserId } from "./pushUserStorage";
import { syncPushUserContext } from "./pushUserContext";

export function PushRegistrationInitializer() {
  useEffect(() => {
    const initializePush = async () => {
      const accessToken =
        localStorage.getItem("accessToken");

      const accessTokenExpiresAt =
        localStorage.getItem(
          "accessTokenExpiresAt",
        );

      if (!accessToken || !accessTokenExpiresAt) {
        return;
      }

      const expiresAt = new Date(
        accessTokenExpiresAt,
      ).getTime();

      if (
        Number.isNaN(expiresAt) ||
        expiresAt <= Date.now()
      ) {
        return;
      }

      const currentUserId = getCurrentUserId();

      if (currentUserId) {
        await syncPushUserContext(
          Number(currentUserId),
        );
      }

      if (
        !("Notification" in window) ||
        Notification.permission !== "granted"
      ) {
        return;
      }

      try {
        await registerPushInstallation();
      } catch (error) {
        console.error(
          "푸시 알림 초기 등록 실패:",
          error,
        );
      }
    };

    void initializePush();
  }, []);

  return null;
}