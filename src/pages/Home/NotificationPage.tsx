import { useState } from "react";

import { PageHeader } from "../../app/layouts/PageHeader";
import { FriendRequestNotificationItem } from "../../features/home/components/FriendRequestNotificationItem";
import {
  NotificationItem,
  type NotificationCategory,
} from "../../features/home/components/NotificationItem";
import { Toast } from "../../shared/ui/Toast";

type NotificationTab = "request" | "game";

type RequestNotification = {
  id: number;
  userId: string;
  userName: string;
};

type GeneralNotification = {
  id: number;
  category: NotificationCategory;
  message: string;
};

type ToastState = {
  open: boolean;
  message: string;
};

const initialRequestNotifications: RequestNotification[] = [
  {
    id: 1,
    userId: "inning",
    userName: "이닝로그",
  },
];

const gameNotifications: GeneralNotification[] = [
  {
    id: 1,
    category: "친구 알림",
    message: "@inning님이 댓글을 달았습니다.",
  },
  {
    id: 2,
    category: "친구 알림",
    message: "@inning님이 친구신청을 수락했습니다.",
  },
  {
    id: 3,
    category: "경기 알림",
    message: "1회가 시작되었습니다!",
  },
  {
    id: 4,
    category: "기록 알림",
    message: "9회가 끝나기 전에 기록해주세요.",
  },
];

export function NotificationPage() {
  const [activeTab, setActiveTab] =
    useState<NotificationTab>("request");

  const [requestNotifications, setRequestNotifications] = useState(
    initialRequestNotifications,
  );

  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: "",
  });

  const hasNotifications =
    activeTab === "request"
      ? requestNotifications.length > 0
      : gameNotifications.length > 0;

  const removeRequestNotification = (notificationId: number) => {
    setRequestNotifications((previousNotifications) =>
      previousNotifications.filter(
        (notification) => notification.id !== notificationId,
      ),
    );
  };

  const handleAcceptRequest = (
    notification: RequestNotification,
  ) => {
    console.log(`${notification.userId} 친구 신청 수락`);

    removeRequestNotification(notification.id);

    setToast({
      open: true,
      message: "친구 신청을 수락했습니다!",
    });
  };

  const handleRejectRequest = (
    notification: RequestNotification,
  ) => {
    console.log(`${notification.userId} 친구 신청 거절`);

    removeRequestNotification(notification.id);

    setToast({
      open: true,
      message: "친구 신청을 거절했습니다.",
    });
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
                userId={notification.userId}
                userName={notification.userName}
                onAccept={() =>
                  handleAcceptRequest(notification)
                }
                onDelete={() =>
                  handleRejectRequest(notification)
                }
              />
            ))
          ) : (
            gameNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                category={notification.category}
                message={notification.message}
              />
            ))
          )
        ) : (
          <p className="pt-[40px] text-label-4 text-text-tertiary">
            {activeTab === "request"
              ? "대기 중인 신청이 없습니다."
              : "경기 알림이 없습니다."}
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