import { useEffect, useState } from "react";

import { PageHeader } from "../../app/layouts/PageHeader";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "../../features/home/api/notificationApi";
import { NotificationSettingItem } from "../../features/home/components/NotificationSettingItem";
import { registerPushInstallation } from "../../shared/firebase/pushRegistration";
import { requestNotificationPermission } from "../../shared/firebase/requestNotificationPermission";

export function NotificationSettingPage() {
  const [gameNotification, setGameNotification] =
    useState(false);

  const [recordNotification, setRecordNotification] =
    useState(false);

  const [
    reactionNotification,
    setReactionNotification,
  ] = useState(false);

  useEffect(() => {
    const fetchNotificationSettings = async () => {
      try {
        const data =
          await getNotificationSettings();

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
  }, []);

  const checkNotificationPermission =
    async () => {
      if (!("Notification" in window)) {
        return false;
      }

      if (
        Notification.permission === "granted"
      ) {
        return true;
      }

      if (
        Notification.permission === "denied"
      ) {
        return false;
      }

      const permissionGranted =
        await requestNotificationPermission();

      if (!permissionGranted) {
        return false;
      }

      try {
        await registerPushInstallation();
      } catch (error) {
        console.error(
          "푸시 알림 등록 실패:",
          error,
        );
      }

      return true;
    };

  const handleGameNotificationToggle =
    async () => {
      const nextValue = !gameNotification;

      if (nextValue) {
        const permissionGranted =
          await checkNotificationPermission();

        if (!permissionGranted) {
          return;
        }
      }

      try {
        const data =
          await updateNotificationSettings({
            gameProgressEnabled: nextValue,
          });

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
      const nextValue = !recordNotification;

      if (nextValue) {
        const permissionGranted =
          await checkNotificationPermission();

        if (!permissionGranted) {
          return;
        }
      }

      try {
        const data =
          await updateNotificationSettings({
            recordReminderEnabled: nextValue,
          });

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
      const nextValue = !reactionNotification;

      if (nextValue) {
        const permissionGranted =
          await checkNotificationPermission();

        if (!permissionGranted) {
          return;
        }
      }

      try {
        const data =
          await updateNotificationSettings({
            socialReactionEnabled: nextValue,
          });

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
      <PageHeader title="알림 설정" />

      <section className="mx-auto mt-[25px] w-full max-w-[340px]">
        <NotificationSettingItem
          title="경기 진행 상황 알림"
          description="팀 득실점 및 이닝 시작 종료 알림"
          isEnabled={gameNotification}
          onToggle={
            handleGameNotificationToggle
          }
        />

        <NotificationSettingItem
          title="기록 독촉 알림"
          description="기록이 올라가지 않은 이닝 알림"
          isEnabled={recordNotification}
          onToggle={
            handleRecordNotificationToggle
          }
        />

        <NotificationSettingItem
          title="댓글 또는 반응"
          description="타임라인에 남긴 친구 반응"
          isEnabled={reactionNotification}
          onToggle={
            handleReactionNotificationToggle
          }
        />
      </section>
    </main>
  );
}