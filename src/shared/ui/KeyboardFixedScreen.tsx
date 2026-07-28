import type { ComponentPropsWithoutRef } from "react";

import { useKeyboardViewportLock } from "../hooks/useKeyboardViewportLock";

type KeyboardFixedScreenProps = ComponentPropsWithoutRef<"div">;

export function KeyboardFixedScreen({
  children,
  className = "",
  ...props
}: KeyboardFixedScreenProps) {
  const screenRef = useKeyboardViewportLock<HTMLDivElement>();

  return (
    <div
      ref={screenRef}
      className={[
        "h-[var(--app-height,100dvh)] touch-none overflow-hidden overscroll-none bg-bg-primary",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
