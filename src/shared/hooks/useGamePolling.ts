import { useEffect, useRef } from "react";

type UseGamePollingOptions = {
  enabled: boolean;
  onPoll: () => Promise<void>;
  interval?: number;
};

export function useGamePolling({
  enabled,
  onPoll,
  interval = 15000,
}: UseGamePollingOptions) {
  const onPollRef = useRef(onPoll);

  useEffect(() => {
    onPollRef.current = onPoll;
  }, [onPoll]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let disposed = false;
    let isFetching = false;
    let timerId: number | null = null;

    const clearTimer = () => {
      if (timerId !== null) {
        window.clearTimeout(timerId);
        timerId = null;
      }
    };

    const scheduleNextPoll = () => {
      clearTimer();

      if (
        disposed ||
        document.visibilityState !== "visible"
      ) {
        return;
      }

      timerId = window.setTimeout(() => {
        void poll();
      }, interval);
    };

    const poll = async () => {
      if (
        disposed ||
        isFetching ||
        document.visibilityState !== "visible"
      ) {
        return;
      }

      isFetching = true;

      try {
        await onPollRef.current();
      } catch (error) {
        console.error("경기 정보 자동 갱신 실패:", error);
      } finally {
        isFetching = false;

        if (!disposed) {
          scheduleNextPoll();
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        clearTimer();
        void poll();
      } else {
        clearTimer();
      }
    };

    scheduleNextPoll();

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      disposed = true;
      clearTimer();

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, [enabled, interval]);
}