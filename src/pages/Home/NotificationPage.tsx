import { useEffect, useState } from "react";

import { PageHeader } from "../../app/layouts/PageHeader";
import {
  getNotifications,
  readNotification,
} from "../../features/home/api/notificationApi";
import { FriendRequestNotificationItem } from "../../features/home/components/FriendRequestNotificationItem";
import {
  NotificationItem,
  type NotificationCategory,
} from "../../features/home/components/NotificationItem";
import type { NotificationResponse } from "../../features/home/types/notification";
import { Toast } from "../../shared/ui/Toast";

type NotificationTab = "request" | "game";

type ToastState = {
  open: boolean;
  message: string;
};

const getNotificationCategory = (
  notification: NotificationResponse,
): NotificationCategory => {
  if (notification.type.includes("GAME")) {
    return "경기 알림";
  }

  if (notification.type.includes("RECORD")) {
    return "기록 알림";
  }

  return "친구 알림";
};

export function NotificationPage() {
  const [activeTab, setActiveTab] =
    useState<NotificationTab>("request");

  const [notifications, setNotifications] = useState<
    NotificationResponse[]
  >([]);

  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: "",
  });

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await getNotifications();

        setNotifications(data.items);
      } catch (error) {
        console.error("알림 목록 조회 실패:", error);
      }
    };

    void fetchNotifications();
  }, []);

  const requestNotifications = notifications.filter(
    (notification) => notification.type === "FRIEND_REQUEST",
  );

  const generalNotifications = notifications.filter(
    (notification) => notification.type !== "FRIEND_REQUEST",
  );

  const hasNotifications =
    activeTab === "request"
      ? requestNotifications.length > 0
      : generalNotifications.length > 0;

  const removeNotification = (notificationId: number) => {
    setNotifications((previousNotifications) =>
      previousNotifications.filter(
        (notification) => notification.id !== notificationId,
      ),
    );
  };

  const handleAcceptRequest = (
    notification: NotificationResponse,
  ) => {
    /*
     * TODO:
     * 친구 신청 수락 API 연동 필요
     */

    removeNotification(notification.id);

    setToast({
      open: true,
      message: "친구 신청을 수락했습니다!",
    });
  };

  const handleRejectRequest = (
    notification: NotificationResponse,
  ) => {
    /*
     * TODO:
     * 친구 신청 거절 API 연동 필요
     */

    removeNotification(notification.id);

    setToast({
      open: true,
      message: "친구 신청을 거절했습니다.",
    });
  };

  const handleNotificationClick = async (
    notification: NotificationResponse,
  ) => {
    if (notification.readAt) {
      return;
    }

    try {
      await readNotification(notification.id);

      setNotifications((previousNotifications) =>
        previousNotifications.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                readAt: new Date().toISOString(),
              }
            : item,
        ),
      );
    } catch (error) {
      console.error("알림 읽음 처리 실패:", error);
    }
  };

  const handleCloseToast = () => {
    setToast((previousToast) => ({
      ...previousToast,
      open: false,
    }));
  };

  return (
    <div className="min-h-dvh w-full bg-white pt-[45px]">
      <PageHeader
        title="알림"
        rightText="알림 설정"
        rightTo="/home/notifications/settings"
      />

      <div
        role="tablist"
        aria-label="알림 유형"
        className="grid h-[53px] w-full grid-cols-2"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "request"}
          onClick={() => setActiveTab("request")}
          className={[
            "relative flex items-center justify-center",
            "font-pretendard text-[16px] font-medium leading-6 tracking-[0.32px]",
            activeTab === "request"
              ? "text-black"
              : "text-text-tertiary",
          ].join(" ")}
        >
          신청 대기

          {activeTab === "request" && (
            <span className="absolute bottom-0 left-1/2 h-[3px] w-[180px] -translate-x-1/2 rounded-full bg-accent-primary" />
          )}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "game"}
          onClick={() => setActiveTab("game")}
          className={[
            "relative flex items-center justify-center",
            "font-pretendard text-[16px] font-medium leading-6 tracking-[0.32px]",
            activeTab === "game"
              ? "text-black"
              : "text-text-tertiary",
          ].join(" ")}
        >
          알림

          {activeTab === "game" && (
            <span className="absolute bottom-0 left-1/2 h-[3px] w-[180px] -translate-x-1/2 rounded-full bg-accent-primary" />
          )}
        </button>
      </div>

      <main className="flex min-h-[calc(100dvh-151px)] flex-col items-center gap-[8px] bg-[#F5F5F5] pt-[20px]">
        {hasNotifications ? (
          activeTab === "request" ? (
            requestNotifications.map((notification) => (
              <FriendRequestNotificationItem
                key={notification.id}
                userId={notification.data.userId ?? ""}
                userName={
                  notification.data.userName ??
                  notification.title
                }
                onAccept={() =>
                  handleAcceptRequest(notification)
                }
                onDelete={() =>
                  handleRejectRequest(notification)
                }
              />
            ))
          ) : (
            generalNotifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() =>
                  void handleNotificationClick(notification)
                }
                className="w-full"
              >
                <NotificationItem
                  category={getNotificationCategory(notification)}
                  message={notification.body}
                />
              </button>
            ))
          )
        ) : (
          <p className="pt-[40px] text-label-4 text-text-tertiary">
            {activeTab === "request"
              ? "대기 중인 신청이 없습니다."
              : "알림이 없습니다."}
          </p>
        )}
      </main>

      <Toast
        open={toast.open}
        message={toast.message}
        onClose={handleCloseToast}
      />
    </div>
  );
}