import type { ReactNode } from "react";

import defaultProfileIcon from "../../../assets/icons/defaultprofile.svg";

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
    <article className="mx-auto flex h-[66px] w-[calc(100%_-_32px)] max-w-[398px] items-center rounded-[37.5px] bg-white px-[14px] text-left shadow-[0_2px_17.5px_-8px_rgba(0,0,0,0.18)]">
      <img
        src={defaultProfileIcon}
        alt=""
        className="h-[44px] w-[44px] shrink-0 rounded-full object-cover"
      />

      <div className="ml-[14px] flex min-w-0 flex-1 flex-col justify-center text-left">
        <p className="text-caption truncate text-left text-text-tertiary">
          {category}
        </p>

        <p className="mt-[3px] text-label-3 truncate text-left text-black">
          {message}
        </p>
      </div>
    </article>
  );
}