import { useEffect } from "react";

import type { FriendRequestCompleteModalProps } from "../types/FriendRequestCompleteModal";

const FRIEND_REQUEST_COMPLETE_MODAL_MS = 1000;

export function FriendRequestCompleteModal({
  open,
  onClose,
}: FriendRequestCompleteModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const timerId = window.setTimeout(() => {
      onClose();
    }, FRIEND_REQUEST_COMPLETE_MODAL_MS);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed left-0 top-0 z-[120] flex h-[var(--app-height,100dvh)] w-full items-center justify-center bg-black/50 px-[16px]">
      <div
        role="status"
        aria-live="polite"
        className="flex h-[65px] w-full items-center justify-center rounded-[46.5px] bg-white text-subtitle text-black"
      >
        신청이 완료 되었습니다!
      </div>
    </div>
  );
}
