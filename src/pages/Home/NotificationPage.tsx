import { PageHeader } from "../../app/layouts/PageHeader";
import { NotificationItem } from "../../features/home/components/NotificationItem";

const notifications = [
  {
    id: 1,
    userId: "inning",
    userName: "이닝로그",
  }
];

export function NotificationPage() {
  return (
    <div className="min-h-dvh w-full pt-[45px]">
      <PageHeader
        title="알림"
        rightText="알림 설정"
        rightTo="/home/notifications/settings"
      />

      <main className="flex flex-col items-center gap-[12px] px-[16px] pt-[20px]">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            userId={notification.userId}
            userName={notification.userName}
            onDelete={() => {
              console.log(`${notification.userId} 알림 삭제`);
            }}
          />
        ))}
      </main>
    </div>
  );
}