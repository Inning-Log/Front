import {
  useEffect,
  useState,
} from "react";

import {
  PageHeader,
} from "../../app/layouts/PageHeader";

import {
  getNotificationSettings,
  updateNotificationSettings,
} from "../../features/home/api/notificationApi";

import {
  NotificationSettingItem,
} from "../../features/home/components/NotificationSettingItem";

import {
  registerPushInstallation,
} from "../../shared/firebase/pushRegistration";

import {
  requestNotificationPermission,
} from "../../shared/firebase/requestNotificationPermission";

import {
  Toast,
} from "../../shared/ui/Toast";

export function NotificationSettingPage() {
  const [
    gameNotification,
    setGameNotification,
  ] =
    useState(false);

  const [
    recordNotification,
    setRecordNotification,
  ] =
    useState(false);

  const [
    reactionNotification,
    setReactionNotification,
  ] =
    useState(false);

  const [
    toastMessage,
    setToastMessage,
  ] =
    useState("");

  const registerPush =
    async () => {
      try {
        await registerPushInstallation();
      } catch (error) {
        console.error(
          "푸시 알림 등록 실패:",
          error,
        );
      }
    };

  /*
   * 알림 설정 화면 진입 시
   * 브라우저 알림 권한 확인.
   */
  useEffect(() => {
    let cancelled =
      false;

    const initializeNotificationPermission =
      async () => {
        if (
          !(
            "Notification" in
            window
          )
        ) {
          if (
            !cancelled
          ) {
            setToastMessage(
              "현재 브라우저에서는 알림 기능을 지원하지 않습니다.",
            );
          }

          return;
        }

        /*
         * 이미 허용된 경우
         * 별도 팝업 없이 푸시 등록만 확인.
         */
        if (
          Notification.permission ===
          "granted"
        ) {
          await registerPush();

          return;
        }

        /*
         * 사용자가 이전에 차단한 경우
         * 브라우저 정책상 requestPermission으로
         * 다시 팝업을 띄울 수 없다.
         */
        if (
          Notification.permission ===
          "denied"
        ) {
          if (
            !cancelled
          ) {
            setToastMessage(
              "알림 권한이 차단되어 있습니다. 브라우저 설정에서 알림 권한을 허용해주세요.",
            );
          }

          return;
        }

        /*
         * 아직 선택하지 않은 상태(default)라면
         * 설정 화면 진입 시 권한 요청.
         */
        try {
          const permissionGranted =
            await requestNotificationPermission();

          if (
            cancelled
          ) {
            return;
          }

          if (
            permissionGranted
          ) {
            await registerPush();

            return;
          }

          setToastMessage(
            "알림을 받으려면 알림 권한을 허용해주세요.",
          );
        } catch (error) {
          console.error(
            "알림 권한 요청 실패:",
            error,
          );

          if (
            !cancelled
          ) {
            setToastMessage(
              "알림 권한을 요청하지 못했습니다. 브라우저 설정을 확인해주세요.",
            );
          }
        }
      };

    void initializeNotificationPermission();

    return () => {
      cancelled =
        true;
    };
  }, []);

  useEffect(() => {
    let cancelled =
      false;

    const fetchNotificationSettings =
      async () => {
        try {
          const data =
            await getNotificationSettings();

          if (
            cancelled
          ) {
            return;
          }

          setGameNotification(
            data.gameProgressEnabled,
          );

          setRecordNotification(
            data.recordReminderEnabled,
          );

          setReactionNotification(
            data.socialReactionEnabled,
          );
        } catch (error) {
          console.error(
            "알림 설정 조회 실패:",
            error,
          );
        }
      };

    void fetchNotificationSettings();

    return () => {
      cancelled =
        true;
    };
  }, []);

  const checkNotificationPermission =
    async () => {
      if (
        !(
          "Notification" in
          window
        )
      ) {
        setToastMessage(
          "현재 브라우저에서는 알림 기능을 지원하지 않습니다.",
        );

        return false;
      }

      if (
        Notification.permission ===
        "granted"
      ) {
        return true;
      }

      if (
        Notification.permission ===
        "denied"
      ) {
        setToastMessage(
          "알림 권한이 차단되어 있습니다. 브라우저 설정에서 알림 권한을 허용해주세요.",
        );

        return false;
      }

      try {
        const permissionGranted =
          await requestNotificationPermission();

        if (
          !permissionGranted
        ) {
          setToastMessage(
            "알림을 받으려면 알림 권한을 허용해주세요.",
          );

          return false;
        }

        await registerPush();

        return true;
      } catch (error) {
        console.error(
          "알림 권한 요청 실패:",
          error,
        );

        setToastMessage(
          "알림 권한을 요청하지 못했습니다. 브라우저 설정을 확인해주세요.",
        );

        return false;
      }
    };

  const handleGameNotificationToggle =
    async () => {
      const nextValue =
        !gameNotification;

      if (nextValue) {
        const permissionGranted =
          await checkNotificationPermission();

        if (
          !permissionGranted
        ) {
          return;
        }
      }

      try {
        const data =
          await updateNotificationSettings(
            {
              gameProgressEnabled:
                nextValue,
            },
          );

        setGameNotification(
          data.gameProgressEnabled,
        );
      } catch (error) {
        console.error(
          "경기 진행 상황 알림 설정 변경 실패:",
          error,
        );
      }
    };

  const handleRecordNotificationToggle =
    async () => {
      const nextValue =
        !recordNotification;

      if (nextValue) {
        const permissionGranted =
          await checkNotificationPermission();

        if (
          !permissionGranted
        ) {
          return;
        }
      }

      try {
        const data =
          await updateNotificationSettings(
            {
              recordReminderEnabled:
                nextValue,
            },
          );

        setRecordNotification(
          data.recordReminderEnabled,
        );
      } catch (error) {
        console.error(
          "기록 독촉 알림 설정 변경 실패:",
          error,
        );
      }
    };

  const handleReactionNotificationToggle =
    async () => {
      const nextValue =
        !reactionNotification;

      if (nextValue) {
        const permissionGranted =
          await checkNotificationPermission();

        if (
          !permissionGranted
        ) {
          return;
        }
      }

      try {
        const data =
          await updateNotificationSettings(
            {
              socialReactionEnabled:
                nextValue,
            },
          );

        setReactionNotification(
          data.socialReactionEnabled,
        );
      } catch (error) {
        console.error(
          "댓글 또는 반응 알림 설정 변경 실패:",
          error,
        );
      }
    };

  return (
    <main className="min-h-dvh w-full bg-bg-primary pt-[45px]">
      <PageHeader
        title="알림 설정"
      />

      <section className="mx-auto mt-[25px] w-full max-w-[340px]">
        <NotificationSettingItem
          title="경기 진행 상황 알림"
          description="팀 득실점 및 이닝 시작 종료 알림"
          isEnabled={
            gameNotification
          }
          onToggle={
            handleGameNotificationToggle
          }
        />

        <NotificationSettingItem
          title="기록 독촉 알림"
          description="기록이 올라가지 않은 이닝 알림"
          isEnabled={
            recordNotification
          }
          onToggle={
            handleRecordNotificationToggle
          }
        />

        <NotificationSettingItem
          title="댓글 또는 반응"
          description="타임라인에 남긴 친구 반응"
          isEnabled={
            reactionNotification
          }
          onToggle={
            handleReactionNotificationToggle
          }
        />
      </section>

      <Toast
        open={
          Boolean(
            toastMessage,
          )
        }
        message={
          toastMessage
        }
        onClose={() =>
          setToastMessage(
            "",
          )
        }
      />
    </main>
  );
}