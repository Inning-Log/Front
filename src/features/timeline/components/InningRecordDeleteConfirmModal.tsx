import {
  useEffect,
  useRef,
} from "react";

import {
  createPortal,
} from "react-dom";

type InningRecordDeleteConfirmModalProps = {
  isOpen: boolean;
  isDeleting: boolean;
  errorMessage: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function InningRecordDeleteConfirmModal({
  isOpen,
  isDeleting,
  errorMessage,
  onCancel,
  onConfirm,
}: InningRecordDeleteConfirmModalProps) {
  const cancelButtonRef =
    useRef<HTMLButtonElement>(
      null,
    );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key ===
          "Escape" &&
        !isDeleting
      ) {
        onCancel();
      }
    };

    const originalOverflow =
      document.body.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    cancelButtonRef.current?.focus();

    return () => {
      document.body.style.overflow =
        originalOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    isDeleting,
    isOpen,
    onCancel,
  ]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      role="presentation"
      onClick={() => {
        if (!isDeleting) {
          onCancel();
        }
      }}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 px-[24px]"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="inning-record-delete-modal-title"
        onClick={(event) =>
          event.stopPropagation()
        }
        className="w-full max-w-[328px] rounded-[25px] bg-white px-[20px] pb-[20px] pt-[28px] shadow-[0_6px_16px_rgba(0,0,0,0.12)]"
      >
        <h2
          id="inning-record-delete-modal-title"
          className="text-center text-label-2 text-button-neutral"
        >
          기록을 삭제하시겠습니까?
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
            ref={
              cancelButtonRef
            }
            type="button"
            onClick={
              onCancel
            }
            disabled={
              isDeleting
            }
            className="flex h-[50px] flex-1 items-center justify-center rounded-[25px] bg-surface-secondary text-label-3 text-button-neutral disabled:cursor-not-allowed disabled:opacity-60"
          >
            취소
          </button>

          <button
            type="button"
            onClick={
              onConfirm
            }
            disabled={
              isDeleting
            }
            className="flex h-[50px] flex-1 items-center justify-center rounded-[25px] bg-accent-primary text-label-3 text-white active:bg-accent-pressed disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting
              ? "삭제 중..."
              : "확인"}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}