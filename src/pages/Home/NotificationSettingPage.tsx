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
  getCurrentUserId,
} from "../../shared/firebase/pushUserStorage";

import {
  syncPushUserContext,
} from "../../shared/firebase/pushUserContext";

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

  /*
   * FCM 설치 등록 후
   * 현재 로그인한 사용자 ID를
   * 서비스워커에도 동기화한다.
   */
  const registerPush =
    async () => {
      await registerPushInstallation();

      const currentUserId =
        getCurrentUserId();

      if (
        !currentUserId
      ) {
        return;
      }

      const parsedUserId =
        Number(
          currentUserId,
        );

      if (
        !Number.isSafeInteger(
          parsedUserId,
        ) ||
        parsedUserId <=
          0
      ) {
        return;
      }

      await syncPushUserContext(
        parsedUserId,
      );
    };

  /*
   * 설정 화면 진입만으로
   * 알림 권한 팝업을 띄우지 않는다.
   *
   * 이미 권한이 허용된 경우에만
   * FCM 설치 등록을 갱신한다.
   */
  useEffect(() => {
    let cancelled =
      false;

    const initializePush =
      async () => {
        if (
          !(
            "Notification" in
            window
          )
        ) {
          return;
        }

        if (
          Notification.permission !==
          "granted"
        ) {
          return;
        }

        try {
          await registerPush();
        } catch (
          error
        ) {
          console.error(
            "푸시 알림 등록 실패:",
            error,
          );

          if (
            !cancelled
          ) {
            setToastMessage(
              "푸시 알림을 등록하지 못했습니다.",
            );
          }
        }
      };

    void initializePush();

    return () => {
      cancelled =
        true;
    };
  }, []);

  /*
   * 서버에 저장된 알림 설정 조회.
   */
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
        } catch (
          error
        ) {
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

  /*
   * 사용자가 알림 토글을 ON 했을 때
   * 브라우저 권한을 확인하고 필요하면 요청한다.
   */
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

      /*
       * 이미 권한이 허용된 경우에도
       * FCM 등록을 다시 확인한다.
       */
      if (
        Notification.permission ===
        "granted"
      ) {
        try {
          await registerPush();

          return true;
        } catch (
          error
        ) {
          console.error(
            "푸시 알림 등록 실패:",
            error,
          );

          setToastMessage(
            "푸시 알림을 등록하지 못했습니다.",
          );

          return false;
        }
      }

      /*
       * 사용자가 과거에 차단했다면
       * requestPermission으로 다시 요청할 수 없다.
       */
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
      } catch (
        error
      ) {
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

      if (
        nextValue
      ) {
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
      } catch (
        error
      ) {
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

      if (
        nextValue
      ) {
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
      } catch (
        error
      ) {
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

      if (
        nextValue
      ) {
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
      } catch (
        error
      ) {
        console.error(
          "댓글 또는 반응 알림 설정 변경 실패:",
          error,
        );
      }
    };

  return (
    <main className="min-h-dvh w-full bg-bg-primary pt-[20px]">
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