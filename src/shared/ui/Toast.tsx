import { useEffect } from "react";

type ToastProps = {
  open: boolean;
  message: string;
  onClose: () => void;
  duration?: number;
};

const DEFAULT_TOAST_DURATION_MS = 1000;

export function Toast({
  open,
  message,
  onClose,
  duration = DEFAULT_TOAST_DURATION_MS,
}: ToastProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const timerId = window.setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [open, onClose, duration]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed left-0 top-0 z-[120] flex h-[var(--app-height,100dvh)] w-full items-center justify-center bg-black/50 px-[16px]">
      <div
        role="status"
        aria-live="polite"
        className="flex h-[65px] w-full max-w-[398px] items-center justify-center rounded-[46.5px] bg-white text-subtitle text-black"
      >
        {message}
      </div>
    </div>
  );
}