import {
  useEffect,
} from "react";

import {
  AUTH_SESSION_REFRESHED_EVENT,
} from "../api/apiClient";

import {
  registerPushInstallation,
} from "./pushRegistration";

import {
  getCurrentUserId,
} from "./pushUserStorage";

import {
  syncPushUserContext,
} from "./pushUserContext";

export function PushRegistrationInitializer() {
  useEffect(() => {
    let isRunning =
      false;

    const initializePush =
      async () => {
        if (
          isRunning
        ) {
          return;
        }

        if (
          !(
            "Notification" in
            window
          ) ||
          Notification.permission !==
            "granted"
        ) {
          return;
        }

        const accessToken =
          localStorage.getItem(
            "accessToken",
          );

        const accessTokenExpiresAt =
          localStorage.getItem(
            "accessTokenExpiresAt",
          );

        if (
          !accessToken ||
          !accessTokenExpiresAt
        ) {
          return;
        }

        const expiresAt =
          new Date(
            accessTokenExpiresAt,
          ).getTime();

        /*
         * 앱 시작 시 access token이 이미 만료됐다면
         * 여기서는 등록을 건너뛴다.
         *
         * 이후 API 요청으로 refresh가 성공하면
         * AUTH_SESSION_REFRESHED_EVENT가 발생하고
         * initializePush가 다시 실행된다.
         */
        if (
          Number.isNaN(
            expiresAt,
          ) ||
          expiresAt <=
            Date.now()
        ) {
          return;
        }

        try {
          isRunning =
            true;

          await registerPushInstallation();

          const currentUserId =
            getCurrentUserId();

          if (
            currentUserId
          ) {
            const parsedUserId =
              Number(
                currentUserId,
              );

            if (
              Number.isSafeInteger(
                parsedUserId,
              ) &&
              parsedUserId >
                0
            ) {
              await syncPushUserContext(
                parsedUserId,
              );
            }
          }
        } catch (
          error
        ) {
          console.error(
            "푸시 알림 초기 등록 실패:",
            error,
          );
        } finally {
          isRunning =
            false;
        }
      };

    const handleAuthSessionRefreshed =
      () => {
        void initializePush();
      };

    void initializePush();

    window.addEventListener(
      AUTH_SESSION_REFRESHED_EVENT,
      handleAuthSessionRefreshed,
    );

    return () => {
      window.removeEventListener(
        AUTH_SESSION_REFRESHED_EVENT,
        handleAuthSessionRefreshed,
      );
    };
  }, []);

  return null;
}