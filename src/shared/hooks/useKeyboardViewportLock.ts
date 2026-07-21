import { useEffect, useRef } from "react";

export function useKeyboardViewportLock<T extends HTMLElement>() {
  const lockTargetRef = useRef<T>(null);

  useEffect(() => {
    const updateAppHeight = () => {
      const height = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty("--app-height", `${height}px`);
    };

    updateAppHeight();

    window.visualViewport?.addEventListener("resize", updateAppHeight);
    window.visualViewport?.addEventListener("scroll", updateAppHeight);
    window.addEventListener("resize", updateAppHeight);

    return () => {
      window.visualViewport?.removeEventListener("resize", updateAppHeight);
      window.visualViewport?.removeEventListener("scroll", updateAppHeight);
      window.removeEventListener("resize", updateAppHeight);
      document.documentElement.style.removeProperty("--app-height");
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
