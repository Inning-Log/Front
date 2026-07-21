import { useEffect, useLayoutEffect, useRef } from "react";

export function useKeyboardViewportLock<T extends HTMLElement>() {
  const lockTargetRef = useRef<T>(null);

  useLayoutEffect(() => {
    const isEditableFocused = () => {
      const activeElement = document.activeElement;

      if (!(activeElement instanceof HTMLElement)) {
        return false;
      }

      return (
        activeElement.isContentEditable ||
        activeElement.tagName === "INPUT" ||
        activeElement.tagName === "TEXTAREA" ||
        activeElement.tagName === "SELECT"
      );
    };

    const updateAppHeight = () => {
      const viewport = window.visualViewport;
      const keyboardHeight = viewport
        ? window.innerHeight - viewport.height - viewport.offsetTop
        : 0;
      const shouldUseKeyboardHeight = keyboardHeight > 120 && isEditableFocused();
      const height = shouldUseKeyboardHeight
        ? viewport?.height ?? window.innerHeight
        : window.innerHeight;
      const top = shouldUseKeyboardHeight ? viewport?.offsetTop ?? 0 : 0;

      document.documentElement.style.setProperty("--app-height", `${height}px`);
      document.documentElement.style.setProperty("--app-top", `${top}px`);
    };

    const scheduleAppHeightUpdate = () => {
      updateAppHeight();
      window.requestAnimationFrame(updateAppHeight);
    };

    scheduleAppHeightUpdate();

    window.visualViewport?.addEventListener("resize", scheduleAppHeightUpdate);
    window.visualViewport?.addEventListener("scroll", scheduleAppHeightUpdate);
    window.addEventListener("resize", scheduleAppHeightUpdate);
    window.addEventListener("focusin", scheduleAppHeightUpdate);
    window.addEventListener("focusout", scheduleAppHeightUpdate);

    return () => {
      window.visualViewport?.removeEventListener(
        "resize",
        scheduleAppHeightUpdate,
      );
      window.visualViewport?.removeEventListener(
        "scroll",
        scheduleAppHeightUpdate,
      );
      window.removeEventListener("resize", scheduleAppHeightUpdate);
      window.removeEventListener("focusin", scheduleAppHeightUpdate);
      window.removeEventListener("focusout", scheduleAppHeightUpdate);
      document.documentElement.style.removeProperty("--app-height");
      document.documentElement.style.removeProperty("--app-top");
    };
  }, []);

  useEffect(() => {
    const lockTarget = lockTargetRef.current;
    const scrollY = window.scrollY;
    const { style: htmlStyle } = document.documentElement;
    const { style: bodyStyle } = document.body;

    const previousHtmlOverflow = htmlStyle.overflow;
    const previousBodyOverflow = bodyStyle.overflow;
    const previousBodyPosition = bodyStyle.position;
    const previousBodyTop = bodyStyle.top;
    const previousBodyWidth = bodyStyle.width;

    const keepScrollLocked = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    const preventTouchScroll = (event: TouchEvent) => {
      if (
        event.target instanceof HTMLElement &&
        event.target.closest("[data-scroll-lock-allow]")
      ) {
        return;
      }

      event.preventDefault();
    };

    htmlStyle.overflow = "hidden";
    bodyStyle.overflow = "hidden";
    bodyStyle.position = "fixed";
    bodyStyle.top = `-${scrollY}px`;
    bodyStyle.width = "100%";

    keepScrollLocked();
    lockTarget?.addEventListener("touchmove", preventTouchScroll, {
      passive: false,
    });
    window.addEventListener("scroll", keepScrollLocked);
    window.visualViewport?.addEventListener("resize", keepScrollLocked);
    window.visualViewport?.addEventListener("scroll", keepScrollLocked);

    return () => {
      lockTarget?.removeEventListener("touchmove", preventTouchScroll);
      window.removeEventListener("scroll", keepScrollLocked);
      window.visualViewport?.removeEventListener("resize", keepScrollLocked);
      window.visualViewport?.removeEventListener("scroll", keepScrollLocked);

      htmlStyle.overflow = previousHtmlOverflow;
      bodyStyle.overflow = previousBodyOverflow;
      bodyStyle.position = previousBodyPosition;
      bodyStyle.top = previousBodyTop;
      bodyStyle.width = previousBodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, []);

  return lockTargetRef;
}
