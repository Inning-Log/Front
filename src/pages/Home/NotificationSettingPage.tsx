import { useState } from "react";

import { PageHeader } from "../../app/layouts/PageHeader";
import { NotificationSettingItem } from "../../features/home/components/NotificationSettingItem";

export function NotificationSettingPage() {
  const [gameNotification, setGameNotification] = useState(false);
  const [recordNotification, setRecordNotification] = useState(false);
  const [reactionNotification, setReactionNotification] = useState(false);

  return (
    <main className="min-h-dvh w-full bg-bg-primary pt-[45px]">
      <PageHeader title="알림 설정" />

      <section className="mx-auto mt-[25px] w-full max-w-[340px]">
        <NotificationSettingItem
          title="경기 진행 상황 알림"
          description="팀 득실점 및 이닝 시작 종료 알림"
          isEnabled={gameNotification}
          onToggle={() => setGameNotification((prev) => !prev)}
        />

        <NotificationSettingItem
          title="기록 독촉 알림"
          description="팀 득실점 및 이닝 시작 종료 알림"
          isEnabled={recordNotification}
          onToggle={() => setRecordNotification((prev) => !prev)}
        />

        <NotificationSettingItem
          title="댓글 또는 반응"
          description="타임라인에 남긴 친구 반응"
          isEnabled={reactionNotification}
          onToggle={() => setReactionNotification((prev) => !prev)}
        />
      </section>
    </main>
  );
}