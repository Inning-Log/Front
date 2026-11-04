import { useEffect, useRef, useState } from "react";
import { ApiError } from "../../../shared/api/apiClient";
import { createGameVideo, gameVideoError, getGameVideo } from "../api/gameVideoApi";

export function useGameVideoSave() {
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const active = useRef(false);
  const lock = useRef(false);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    active.current = true;
    return () => { active.current = false; controller.current?.abort(); };
  }, []);

  async function save(gameId: number, friendIds: number[] = []) {
    if (lock.current) return;
    lock.current = true;
    const abort = new AbortController();
    controller.current = abort;
    setIsSaving(true);
    setMessage("");
    try {
      let video;
      try {
        video = await createGameVideo(gameId, friendIds);
      } catch (error) {
        if (!(error instanceof ApiError) || error.code !== "GAME_VIDEO_IN_PROGRESS") throw error;
        video = await getGameVideo(gameId, abort.signal);
      }
      while (!abort.signal.aborted && (video.status === "RENDERING" || video.status === "MERGING")) {
        await new Promise<void>((resolve, reject) => {
          function cancel() { clearTimeout(timer); reject(new Error("cancelled")); }
          const timer = setTimeout(() => {
            abort.signal.removeEventListener("abort", cancel);
            resolve();
          }, 3000);
          abort.signal.addEventListener("abort", cancel, { once: true });
          if (abort.signal.aborted) cancel();
        });
        video = await getGameVideo(gameId, abort.signal);
      }
      if (abort.signal.aborted || !active.current) return;
      if (video.status === "FAILED") throw new Error("영상 생성에 실패했어요. 잠시 후 다시 시도해 주세요.");
      // Fetch a fresh signed URL immediately before starting the download.
      video = await getGameVideo(gameId, abort.signal);
      if (abort.signal.aborted || !active.current) return;
      if (video.status !== "READY" || !video.downloadUrl) throw new Error("완료된 영상을 확인하지 못했어요. 다시 시도해 주세요.");
      const link = document.createElement("a");
      link.href = video.downloadUrl;
      link.download = `inninglog-${gameId}.mp4`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setMessage("영상 다운로드를 시작합니다.");
    } catch (error) {
      if (active.current && !abort.signal.aborted) setMessage(gameVideoError(error));
    } finally {
      lock.current = false;
      if (active.current) setIsSaving(false);
    }
  }
  return { isSaving, message, clearMessage: () => setMessage(""), save };
}
