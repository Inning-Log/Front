import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

type TimelineViewingSettingsModalProps = {
  open: boolean;
  isLoading: boolean;
  canUseActions: boolean;
  errorMessage: string;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function TimelineViewingSettingsModal({
  open,
  isLoading,
  canUseActions,
  errorMessage,
  onClose,
  onEdit,
  onDelete,
}: TimelineViewingSettingsModalProps) {
  const titleId = useId();
  const editButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoading) {
        onClose();
      }
    };
    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    editButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLoading, onClose, open]);

  if (!open) return null;

  return createPortal(
    <div
      role="presentation"
      onClick={() => {
        if (!isLoading) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-[24px]"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={isLoading}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-[328px] rounded-[25px] bg-white px-[20px] pb-[20px] pt-[28px] shadow-[0_6px_16px_rgba(0,0,0,0.12)]"
      >
        <h2
          id={titleId}
          className="text-center text-label-2 text-button-neutral"
        >
          기록 설정
        </h2>

        {errorMessage && (
          <p
            role="alert"
            className="mt-[10px] text-center text-caption text-danger"
          >
            {errorMessage}
          </p>
        )}

        <div className="mt-[24px] flex flex-col gap-[10px]">
          <button
            ref={editButtonRef}
            type="button"
            onClick={onEdit}
            disabled={!canUseActions || isLoading}
            className="flex h-[50px] w-full items-center justify-center rounded-[25px] bg-accent-primary text-label-3 text-white active:bg-accent-pressed disabled:cursor-not-allowed disabled:opacity-50"
          >
            관람방식 수정하기
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={!canUseActions || isLoading}
            className="flex h-[50px] w-full items-center justify-center rounded-[25px] bg-accent-primary text-label-3 text-white active:bg-accent-pressed disabled:cursor-not-allowed disabled:opacity-50"
          >
            타임라인 삭제하기
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
