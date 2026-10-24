import type {
  ReactNode,
} from "react";

import defaultProfileIcon from "../../../assets/icons/defaultprofile.svg";

export type NotificationCategory =
  | "친구 알림"
  | "경기 알림"
  | "기록 알림";

type NotificationItemProps = {
  category: NotificationCategory;
  message: ReactNode;
  isRead?: boolean;
};

export function NotificationItem({
  category,
  message,
  isRead = false,
}: NotificationItemProps) {
  return (
    <article
      className={[
        "mx-auto flex h-[66px] w-[calc(100%_-_32px)] max-w-[398px] items-center rounded-[37.5px] px-[14px] text-left shadow-[0_2px_17.5px_-8px_rgba(0,0,0,0.18)]",
        isRead
          ? "bg-[#F7F7F7]"
          : "bg-white",
      ].join(" ")}
    >
      <img
        src={
          defaultProfileIcon
        }
        alt=""
        className={[
          "h-[44px] w-[44px] shrink-0 rounded-full object-cover",
          isRead
            ? "opacity-45"
            : "opacity-100",
        ].join(" ")}
      />

      <div
        className={[
          "ml-[14px] flex min-w-0 flex-1 flex-col justify-center text-left",
          isRead
            ? "opacity-45"
            : "opacity-100",
        ].join(" ")}
      >
        <p className="truncate text-left text-caption text-text-tertiary">
          {category}
        </p>

        <p className="mt-[3px] truncate text-left text-label-3 text-black">
          {message}
        </p>
      </div>
    </article>
  );
}