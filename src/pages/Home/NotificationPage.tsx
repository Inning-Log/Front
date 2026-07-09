import { PageHeader } from "../../app/layouts/PageHeader";

export function NotificationPage() {
  return (
    <div className="min-h-dvh w-full">
      <PageHeader
        title="알림"
        rightText="알림 설정"
        rightTo="/home/notifications/settings"
      />

      <main>NotificationPage</main>
    </div>
  );
}
