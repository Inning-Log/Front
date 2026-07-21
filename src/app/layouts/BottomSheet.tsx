import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent, ReactNode } from "react";

import { useKeyboardViewportLock } from "../../shared/hooks/useKeyboardViewportLock";

type BottomSheetProps = {
  title: string;
  children: ReactNode;
  onClose: () => void;
  closeLabel?: string;
  dragLabel?: string;
};

const CLOSE_DRAG_DISTANCE = 80;
const CLOSE_TRANSITION_MS = 180;

export function BottomSheet({
  title,
  children,
  onClose,
  closeLabel = "닫기",
  dragLabel = "아래로 끌어서 닫기",
}: BottomSheetProps) {
  const sheetRootRef = useKeyboardViewportLock<HTMLDivElement>();
  const dragStartYRef = useRef(0);
  const closeTimerRef = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isEntered, setIsEntered] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(() => {
      setIsEntered(true);
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);

      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const closeSheet = () => {
    if (isClosing) {
      return;
    }

    setIsClosing(true);

    closeTimerRef.current = window.setTimeout(() => {
      onClose();
    }, CLOSE_TRANSITION_MS);
  };

  const handleDragStart = (event: PointerEvent<HTMLDivElement>) => {
    dragStartYRef.current = event.clientY;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleDragMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging) {
      return;
    }

    setDragY(Math.max(event.clientY - dragStartYRef.current, 0));
  };

  const handleDragEnd = () => {
    setIsDragging(false);

    if (dragY >= CLOSE_DRAG_DISTANCE) {
      closeSheet();
      return;
    }

    setDragY(0);
  };

  const handleDragKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      closeSheet();
    }
  };

  const sheetTranslateY = isClosing
    ? "100%"
    : isEntered
      ? `${dragY}px`
      : "100%";

  return (
    <div
      ref={sheetRootRef}
      className="fixed left-0 top-[var(--app-top,0px)] z-[100] h-[var(--app-height,100dvh)] w-full overflow-hidden overscroll-none bg-surface-placeholder"
    >
      <button
        type="button"
        aria-label={closeLabel}
        onClick={closeSheet}
        className="absolute inset-0"
      />

      <main
        className="absolute bottom-0 left-0 right-0 top-[52px] flex flex-col overflow-hidden rounded-t-[18px] bg-white px-[11px] pt-[8px]"
        style={{
          transform: `translateY(${sheetTranslateY})`,
          transition: isDragging ? "none" : "transform 180ms ease-out",
        }}
      >
        <div
          role="button"
          tabIndex={0}
          aria-label={dragLabel}
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
          onKeyDown={handleDragKeyDown}
          className="mx-auto flex h-[18px] w-[72px] touch-none items-start justify-center"
        >
          <span className="h-[4px] w-[42px] rounded-full bg-text-tertiary" />
        </div>

        <h1 className="mt-[-1px] text-center text-label-2 text-black">
          {title}
        </h1>

        {children}
      </main>
    </div>
  );
}
