import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  isPending?: boolean;
  errorMessage?: string;
  cancelText?: string;
  confirmText?: string;
  pendingText?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmModal({
  open,
  title,
  isPending = false,
  errorMessage = "",
  cancelText = "취소",
  confirmText = "확인",
  pendingText = "처리 중...",
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  const titleId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isPending) {
        onCancel();
      }
    };
    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    cancelButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPending, onCancel, open]);

  if (!open) return null;

  return createPortal(
    <div
      role="presentation"
      onClick={() => {
        if (!isPending) onCancel();
      }}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 px-[24px]"
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-[328px] rounded-[25px] bg-white px-[20px] pb-[20px] pt-[28px] shadow-[0_6px_16px_rgba(0,0,0,0.12)]"
      >
        <h2
          id={titleId}
          className="text-center text-label-2 text-button-neutral"
        >
          {title}
        </h2>

        {errorMessage && (
          <p
            role="alert"
            className="mt-[10px] text-center text-caption text-danger"
          >
            {errorMessage}
          </p>
        )}

        <div className="mt-[24px] flex gap-[10px]">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="flex h-[50px] flex-1 items-center justify-center rounded-[25px] bg-surface-secondary text-label-3 text-button-neutral disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="flex h-[50px] flex-1 items-center justify-center rounded-[25px] bg-accent-primary text-label-3 text-white active:bg-accent-pressed disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? pendingText : confirmText}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
