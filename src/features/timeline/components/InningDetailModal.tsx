import { useEffect } from "react";
import { createPortal } from "react-dom";

import type { InningRecord } from "./InningCard";

type InningDetailModalProps = {
  record: InningRecord | null;
  onClose: () => void;
};

export function InningDetailModal({
  record,
  onClose,
}: InningDetailModalProps) {
  useEffect(() => {
    if (!record) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [record, onClose]);

  if (!record) return null;

  return createPortal(
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-[16px] py-[24px]"
    >
      <article
        role="dialog"
        aria-modal="true"
        aria-label={`${record.inning}회 기록 상세`}
        onClick={(event) => event.stopPropagation()}
        className="relative h-[min(608px,calc(100dvh-48px))] w-full max-w-[358px] overflow-hidden rounded-[25px] bg-[#5A5A5A] text-white"
      >
        <div className="absolute left-[27px] top-[20px] flex size-[27px] items-center justify-center rounded-full bg-white text-bg-dark">
          <span className="font-akatab text-[18px] font-bold leading-none">
            {record.inning}
          </span>
        </div>

        <p className="absolute left-1/2 top-[28px] -translate-x-1/2 text-title-2 text-white">
          {record.homeScore}:{record.awayScore}
        </p>

        <div className="absolute left-1/2 top-1/2 flex w-[280px] -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center">
          <time
            dateTime={record.recordedAt}
            className="text-[36px] font-extrabold leading-[140%] tracking-[-0.36px]"
          >
            {record.recordedAt}
          </time>

          <p className="mt-[-2px] whitespace-pre-wrap break-words text-title-2 text-white">
            {record.text}
          </p>
        </div>
      </article>
    </div>,
    document.body,
  );
}