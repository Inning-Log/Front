
import { useEffect, useRef, useState } from "react";

import { ApiError } from "../../../shared/api/apiClient";

import {
  createGameVideo,
  gameVideoError,
  getGameVideo,
  type GameVideo,
} from "../api/gameVideoApi";

const POLLING_INTERVAL = 3000;
const MAX_POLLING_COUNT = 100;

function waitForNextPoll(signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error("요청이 취소되었습니다."));
      return;
    }

    const cleanup = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
    };

    const onAbort = () => {
      cleanup();
      reject(new Error("요청이 취소되었습니다."));
    };

    const timer = window.setTimeout(() => {
      cleanup();
      resolve();
    }, POLLING_INTERVAL);

    signal.addEventListener("abort", onAbort, {
      once: true,
    });
  });
}

function validateGameVideo(
  video: GameVideo,
  gameId: number,
) {
  if (
    !video ||
    video.gameId !== gameId ||
    !Number.isSafeInteger(video.gameVideoId)
  ) {
    throw new Error(
      "경기 영상 API 응답 형식이 올바르지 않습니다.",
    );
  }

  if (
    video.status !== "RENDERING" &&
    video.status !== "MERGING" &&
    video.status !== "READY" &&
    video.status !== "FAILED"
  ) {
    throw new Error(
      "알 수 없는 영상 생성 상태입니다.",
    );
  }

  return video;
}

async function waitForReadyVideo(
  gameId: number,
  initialVideo: GameVideo,
  signal: AbortSignal,
) {
  let video = validateGameVideo(
    initialVideo,
    gameId,
  );

  let pollingCount = 0;

  while (
    video.status === "RENDERING" ||
    video.status === "MERGING"
  ) {
    if (pollingCount >= MAX_POLLING_COUNT) {
      throw new Error(
        "영상 생성 시간이 초과되었습니다. 잠시 후 다시 확인해 주세요.",
      );
    }

    await waitForNextPoll(signal);

    if (signal.aborted) {
      throw new Error("요청이 취소되었습니다.");
    }

    video = validateGameVideo(
      await getGameVideo(gameId, signal),
      gameId,
    );

    pollingCount += 1;
  }

  if (video.status === "FAILED") {
    throw new Error(
      video.failureReason
        ? `영상 생성에 실패했습니다. (${video.failureReason})`
        : "영상 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    );
  }

  return video;
}

async function downloadGameVideo(
  gameId: number,
  video: GameVideo,
  signal: AbortSignal,
) {
  if (!video.downloadUrl) {
    throw new Error(
      "영상 다운로드 주소가 없습니다.",
    );
  }

  if (
    video.expiresAt &&
    Date.parse(video.expiresAt) <= Date.now()
  ) {
    throw new Error(
      "영상 다운로드 주소가 만료되었습니다.",
    );
  }

  let response: Response;

  try {
    response = await fetch(video.downloadUrl, {
      method: "GET",
      mode: "cors",
      signal,
    });
  } catch (error) {
    if (signal.aborted) {
      throw error;
    }

    console.error("S3 영상 다운로드 실패:", error);

    throw new Error(
      "영상 파일을 가져오지 못했습니다. S3 CORS 설정 또는 네트워크 상태를 확인해 주세요.",
    );
  }

  if (!response.ok) {
    throw new Error(
      `영상 다운로드에 실패했습니다. (${response.status})`,
    );
  }

  const blob = await response.blob();

  if (signal.aborted) {
    throw new Error("요청이 취소되었습니다.");
  }

  if (blob.size === 0) {
    throw new Error(
      "다운로드한 영상 파일이 비어 있습니다.",
    );
  }

  const blobUrl = URL.createObjectURL(blob);

  try {
    const link = document.createElement("a");

    link.href = blobUrl;
    link.download = `inninglog-${gameId}.mp4`;
    link.style.display = "none";

    document.body.appendChild(link);

    try {
      link.click();
    } finally {
      link.remove();
    }
  } finally {
    // 브라우저가 다운로드를 시작할 시간을 확보한다.
    window.setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 60000);
  }
}

export function useGameVideoSave() {
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const active = useRef(false);
  const lock = useRef(false);

  const controller =
    useRef<AbortController | null>(null);

  useEffect(() => {
    active.current = true;

    return () => {
      active.current = false;
      controller.current?.abort();
    };
  }, []);

  async function save(
    gameId: number,
    friendIds: number[] = [],
  ) {
    if (lock.current) {
      return;
    }

    if (
      !Number.isSafeInteger(gameId) ||
      gameId <= 0
    ) {
      setMessage("올바르지 않은 경기 정보입니다.");
      return;
    }

    lock.current = true;

    const abort = new AbortController();
    controller.current = abort;

    setIsSaving(true);
    setMessage("");

    try {
      let video: GameVideo;

      try {
        video = await createGameVideo(
          gameId,
          friendIds,
        );
      } catch (error) {
        if (
          !(error instanceof ApiError) ||
          error.code !== "GAME_VIDEO_IN_PROGRESS"
        ) {
          throw error;
        }

        // 이미 생성 중이면 기존 작업 상태를 조회한다.
        video = await getGameVideo(
          gameId,
          abort.signal,
        );
      }

      video = await waitForReadyVideo(
        gameId,
        video,
        abort.signal,
      );

      if (
        abort.signal.aborted ||
        !active.current
      ) {
        return;
      }

      // READY 이후 새 서명 URL을 받아 다운로드한다.
      video = validateGameVideo(
        await getGameVideo(
          gameId,
          abort.signal,
        ),
        gameId,
      );

      if (video.status !== "READY") {
        throw new Error(
          "영상이 아직 준비되지 않았습니다. 다시 시도해 주세요.",
        );
      }

      await downloadGameVideo(
        gameId,
        video,
        abort.signal,
      );

      if (
        abort.signal.aborted ||
        !active.current
      ) {
        return;
      }

      setMessage("영상 다운로드를 시작합니다.");
    } catch (error) {
      if (
        active.current &&
        !abort.signal.aborted
      ) {
        console.error("영상 저장 실패:", error);

        setMessage(gameVideoError(error));
      }
    } finally {
      lock.current = false;

      if (controller.current === abort) {
        controller.current = null;
      }

      if (active.current) {
        setIsSaving(false);
      }
    }
  }

  return {
    isSaving,
    message,
    clearMessage: () => setMessage(""),
    save,
  };
}
