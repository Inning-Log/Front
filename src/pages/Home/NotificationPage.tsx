import { useState } from "react";

import { PageHeader } from "../../app/layouts/PageHeader";
import { NotificationItem } from "../../features/home/components/NotificationItem";

type NotificationTab = "request" | "game";

const requestNotifications = [
  {
    id: 1,
    userId: "inning",
    userName: "이닝로그",
  },
];

const gameNotifications = [
  //아직 경기알림 컴포넌트가 없어서 나중에 제대로 추가해야함 이건 임시
  {
    id: 2,
    userId: "inning",
    userName: "이닝로그",
  },
];

export function NotificationPage() {
  const [activeTab, setActiveTab] =
    useState<NotificationTab>("request");

  const notifications =
    activeTab === "request"
      ? requestNotifications
      : gameNotifications;

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
              : "text-[#8A908B]",
          ].join(" ")}
        >
          신청 대기

          {activeTab === "request" && (
            <span className="absolute bottom-0 left-1/2 h-[3px] w-[180px] -translate-x-1/2 rounded-full bg-[#1FBF5A]" />
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
              : "text-[#8A908B]",
          ].join(" ")}
        >
          경기 알림

          {activeTab === "game" && (
            <span className="absolute bottom-0 left-1/2 h-[3px] w-[180px] -translate-x-1/2 rounded-full bg-[#1FBF5A]" />
          )}
        </button>
      </div>

      <main className="flex min-h-[calc(100dvh-151px)] flex-col items-center gap-[12px] bg-[#F5F5F5] pt-[20px]">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              userId={notification.userId}
              userName={notification.userName}
              onDelete={() => {
                console.log(`${notification.userId} 알림 삭제`);
              }}
            />
          ))
        ) : (
          <p className="pt-[40px] font-pretendard text-[14px] text-[#8A908B]">
            {activeTab === "request"
              ? "대기 중인 신청이 없습니다."
              : "경기 알림이 없습니다."}
          </p>
        )}
      </main>
    </div>
  );
}