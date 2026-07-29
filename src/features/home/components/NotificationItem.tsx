import type { ReactNode } from "react";

export type NotificationCategory =
  | "친구 알림"
  | "경기 알림"
  | "기록 알림";

type NotificationItemProps = {
  category: NotificationCategory;
  message: ReactNode;
};

export function NotificationItem({
  category,
  message,
}: NotificationItemProps) {
  return (
    <article className="flex h-[66px] w-[calc(100%_-_32px)] max-w-[398px] flex-col justify-center rounded-[37.5px] bg-white px-[36px] shadow-[0_2px_17.5px_-8px_rgba(0,0,0,0.18)]">
      <p className="text-caption truncate text-text-tertiary">
        {category}
      </p>

      <p className="text-label-3 truncate text-black mt-[3px]">
        {message}
      </p>
    </article>
  );
}