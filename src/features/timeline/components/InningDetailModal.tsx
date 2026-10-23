import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  createPortal,
} from "react-dom";

import commentIcon from "../../../assets/icons/comment.png";

import {
  getInningRecord,
  updateInningRecord,
} from "../../record/api/inningRecordApi";

import {
  getInningRecordVideo,
} from "../../record/api/inningRecordVideoApi";

import type {
  InningRecordResponse,
} from "../../record/types/inningRecord";

import type {
  InningRecord,
} from "./InningCard";

import {
  VideoCommentSheet,
} from "./VideoCommentSheet";

export type InningDetailMode =
  | "view"
  | "edit";

type InningDetailModalProps = {
  record:
    InningRecord | null;

  mode?:
    InningDetailMode;

  onClose:
    () => void;

  onUpdated?: (
    record:
      InningRecordResponse,
  ) => void;
};

function formatRecordedTime(
  recordedAt: string,
) {
  const date =
    new Date(
      recordedAt,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return recordedAt;
  }

  return date.toLocaleTimeString(
    "ko-KR",
    {
      hour:
        "2-digit",

      minute:
        "2-digit",

      hour12:
        false,

      timeZone:
        "Asia/Seoul",
    },
  );
}

export function InningDetailModal({
  record,
  mode = "view",
  onClose,
  onUpdated,
}: InningDetailModalProps) {
  const textareaRef =
    useRef<HTMLTextAreaElement>(
      null,
    );

  const [
    detail,
    setDetail,
  ] =
    useState<InningRecordResponse | null>(
      null,
    );

  const [
    editText,
    setEditText,
  ] =
    useState("");

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(false);

  const [
    isSaving,
    setIsSaving,
  ] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  /*
   * 영상
   */
  const [
    videoUrl,
    setVideoUrl,
  ] =
    useState<string | null>(
      null,
    );

  const [
    videoId,
    setVideoId,
  ] =
    useState<number | null>(
      null,
    );

  const [
    isVideoLoading,
    setIsVideoLoading,
  ] =
    useState(false);

  /*
   * 댓글
   */
  const [
    isCommentOpen,
    setIsCommentOpen,
  ] =
    useState(false);

  const isEditing =
    mode === "edit";

  /*
   * 기록 상세 조회
   */
  useEffect(() => {
    if (!record) {
      setDetail(
        null,
      );

      setEditText(
        "",
      );

      setErrorMessage(
        "",
      );

      setVideoUrl(
        null,
      );

      setVideoId(
        null,
      );

      setIsCommentOpen(
        false,
      );

      return;
    }

    setEditText(
      record.text,
    );

    const id =
      Number(
        record.id,
      );

    if (
      !Number.isSafeInteger(
        id,
      ) ||
      id <= 0
    ) {
      return;
    }

    let cancelled =
      false;

    const fetchDetail =
      async () => {
        try {
          setIsLoading(
            true,
          );

          setErrorMessage(
            "",
          );

          const response =
            await getInningRecord(
              id,
            );

          if (
            cancelled
          ) {
            return;
          }

          setDetail(
            response,
          );

          setEditText(
            response.text,
          );
        } catch (
          error
        ) {
          if (
            cancelled
          ) {
            return;
          }

          console.error(
            "이닝 기록 상세 조회 실패:",
            error,
          );

          setErrorMessage(
            error instanceof
                Error
              ? error.message
              : "이닝 기록을 불러오지 못했습니다.",
          );
        } finally {
          if (
            !cancelled
          ) {
            setIsLoading(
              false,
            );
          }
        }
      };

    void fetchDetail();

    return () => {
      cancelled =
        true;
    };
  }, [
    record,
  ]);

  /*
   * 영상 조회
   *
   * 상세 API 또는 timeline record에서
   * videoStatus가 READY이면 조회.
   */
  useEffect(() => {
    if (!record) {
      return;
    }

    const status =
      detail?.videoStatus ??
      record.videoStatus;

    if (
      status !==
      "READY"
    ) {
      setVideoUrl(
        null,
      );

      setVideoId(
        null,
      );

      return;
    }

    const recordId =
      Number(
        record.id,
      );

    if (
      !Number.isSafeInteger(
        recordId,
      ) ||
      recordId <= 0
    ) {
      return;
    }

    let cancelled =
      false;

    const loadVideo =
      async () => {
        try {
          setIsVideoLoading(
            true,
          );

          const response =
            await getInningRecordVideo(
              recordId,
            );

          if (
            cancelled
          ) {
            return;
          }

          if (
            response.status ===
              "READY" &&
            response.downloadUrl
          ) {
            setVideoUrl(
              response.downloadUrl,
            );

            setVideoId(
              response.videoId,
            );
          } else {
            setVideoUrl(
              null,
            );

            setVideoId(
              null,
            );
          }
        } catch (
          error
        ) {
          console.error(
            "이닝 기록 영상 조회 실패:",
            error,
          );

          if (
            !cancelled
          ) {
            setVideoUrl(
              null,
            );

            setVideoId(
              null,
            );
          }
        } finally {
          if (
            !cancelled
          ) {
            setIsVideoLoading(
              false,
            );
          }
        }
      };

    void loadVideo();

    return () => {
      cancelled =
        true;
    };
  }, [
    detail?.videoStatus,
    record,
  ]);

  /*
   * 수정 모드 자동 포커스
   */
  useEffect(() => {
    if (
      !record ||
      !isEditing ||
      isLoading
    ) {
      return;
    }

    const frame =
      requestAnimationFrame(
        () => {
          textareaRef.current?.focus();

          const length =
            textareaRef.current
              ?.value.length ??
            0;

          textareaRef.current?.setSelectionRange(
            length,
            length,
          );
        },
      );

    return () =>
      cancelAnimationFrame(
        frame,
      );
  }, [
    isEditing,
    isLoading,
    record,
  ]);

  /*
   * ESC / body scroll
   */
  useEffect(() => {
    if (!record) {
      return;
    }

    const handleKeyDown =
      (
        event:
          KeyboardEvent,
      ) => {
        if (
          event.key ===
            "Escape" &&
          !isSaving &&
          !isCommentOpen
        ) {
          onClose();
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

    return () => {
      document.body.style.overflow =
        originalOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    isCommentOpen,
    isSaving,
    onClose,
    record,
  ]);

  if (!record) {
    return null;
  }

  const recordId =
    Number(
      record.id,
    );

  const displayInning =
    detail?.inning ??
    record.inning;

  const displayHomeScore =
    detail?.homeScore ??
    record.homeScore;

  const displayAwayScore =
    detail?.awayScore ??
    record.awayScore;

  const displayText =
    detail?.text ??
    record.text;

  const displayRecordedAt =
    detail?.recordedAt
      ? formatRecordedTime(
          detail.recordedAt,
        )
      : record.recordedAt;

  const handleSave =
    async () => {
      if (
        !Number.isSafeInteger(
          recordId,
        ) ||
        recordId <= 0 ||
        isSaving
      ) {
        return;
      }

      try {
        setIsSaving(
          true,
        );

        setErrorMessage(
          "",
        );

        const updated =
          await updateInningRecord(
            recordId,
            {
              text:
                editText,
            },
          );

        setDetail(
          updated,
        );

        onUpdated?.(
          updated,
        );

        onClose();
      } catch (
        error
      ) {
        console.error(
          "이닝 기록 수정 실패:",
          error,
        );

        setErrorMessage(
          error instanceof
              Error
            ? error.message
            : "이닝 기록을 수정하지 못했습니다.",
        );
      } finally {
        setIsSaving(
          false,
        );
      }
    };

  return (
    <>
      {createPortal(
        <div
          role="presentation"
          onPointerDown={(
            event,
          ) => {
            event.stopPropagation();
          }}
          onPointerMove={(
            event,
          ) => {
            event.stopPropagation();
          }}
          onPointerUp={(
            event,
          ) => {
            event.stopPropagation();
          }}
          onClick={() => {
            if (
              !isSaving &&
              !isCommentOpen
            ) {
              onClose();
            }
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-[16px] py-[24px]"
        >
          <article
            role="dialog"
            aria-modal="true"
            aria-label={`${displayInning}회 기록 ${
              isEditing
                ? "수정"
                : "상세"
            }`}
            onPointerDown={(
              event,
            ) => {
              event.stopPropagation();
            }}
            onPointerMove={(
              event,
            ) => {
              event.stopPropagation();
            }}
            onPointerUp={(
              event,
            ) => {
              event.stopPropagation();
            }}
            onClick={(
              event,
            ) => {
              event.stopPropagation();
            }}
            className="relative h-[min(608px,calc(100dvh-48px))] w-full max-w-[358px] overflow-hidden rounded-[25px] bg-[#5A5A5A] text-white"
          >
            {/* 영상 배경 */}
            {videoUrl && (
              <>
                <video
                  src={
                    videoUrl
                  }
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 h-full w-full object-cover"
                />

                <div className="absolute inset-0 bg-black/35" />
              </>
            )}

            {isVideoLoading &&
              !videoUrl && (
                <div className="absolute inset-0 bg-[#5A5A5A]" />
              )}

            {/* 이닝 */}
            <div className="absolute left-[27px] top-[20px] z-20 flex size-[27px] items-center justify-center rounded-full bg-white text-bg-dark">
              <span className="font-akatab text-[18px] font-bold leading-none">
                {
                  displayInning
                }
              </span>
            </div>

            {/* 점수 */}
            <p className="absolute left-1/2 top-[28px] z-20 -translate-x-1/2 text-title-2 text-white">
              {
                displayHomeScore
              }
              :
              {
                displayAwayScore
              }
            </p>

            {isLoading ? (
              <div className="absolute inset-0 z-20 flex items-center justify-center">
                <div className="size-[36px] animate-spin rounded-full border-[4px] border-white/30 border-t-white" />
              </div>
            ) : isEditing ? (
              <div className="absolute left-1/2 top-1/2 z-20 flex w-[280px] -translate-x-1/2 -translate-y-1/2 flex-col items-center">
                <time
                  dateTime={
                    detail
                      ?.recordedAt ??
                    record.recordedAt
                  }
                  className="text-[36px] font-extrabold leading-[140%] tracking-[-0.36px]"
                >
                  {
                    displayRecordedAt
                  }
                </time>

                <textarea
                  ref={
                    textareaRef
                  }
                  value={
                    editText
                  }
                  onChange={(
                    event,
                  ) =>
                    setEditText(
                      event.target
                        .value,
                    )
                  }
                  placeholder="문구를 입력해주세요"
                  maxLength={
                    100
                  }
                  aria-label="캡션 수정"
                  className="mt-[18px] h-[130px] w-full resize-none rounded-[16px] bg-black/25 px-[16px] py-[14px] text-center text-title-2 text-white outline-none placeholder:text-white/50"
                />

                {errorMessage && (
                  <p
                    role="alert"
                    className="mt-[8px] text-center text-caption text-red-200"
                  >
                    {
                      errorMessage
                    }
                  </p>
                )}

                <div className="mt-[18px] flex w-full gap-[10px]">
                  <button
                    type="button"
                    onClick={
                      onClose
                    }
                    disabled={
                      isSaving
                    }
                    className="flex h-[46px] flex-1 items-center justify-center rounded-[23px] bg-white/15 text-label-3 text-white disabled:opacity-60"
                  >
                    취소
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void handleSave()
                    }
                    disabled={
                      isSaving
                    }
                    className="flex h-[46px] flex-1 items-center justify-center rounded-[23px] bg-accent-primary text-label-3 text-white disabled:opacity-60"
                  >
                    {isSaving
                      ? "수정 중..."
                      : "완료"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="absolute left-1/2 top-1/2 z-20 flex w-[280px] -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center">
                <time
                  dateTime={
                    detail
                      ?.recordedAt ??
                    record.recordedAt
                  }
                  className="text-[36px] font-extrabold leading-[140%] tracking-[-0.36px]"
                >
                  {
                    displayRecordedAt
                  }
                </time>

                <p className="mt-[-2px] whitespace-pre-wrap break-words text-title-2 text-white">
                  {
                    displayText
                  }
                </p>

                {errorMessage && (
                  <p
                    role="alert"
                    className="mt-[14px] text-caption text-red-200"
                  >
                    {
                      errorMessage
                    }
                  </p>
                )}
              </div>
            )}

            {/* 댓글 버튼 */}
            {!isEditing &&
              videoId !==
                null && (
                <button
                  type="button"
                  aria-label="영상 댓글 보기"
                  onPointerDown={(
                    event,
                  ) => {
                    event.stopPropagation();
                  }}
                  onClick={(
                    event,
                  ) => {
                    event.stopPropagation();

                    setIsCommentOpen(
                      true,
                    );
                  }}
                  className="absolute bottom-[22px] right-[22px] z-30 flex size-[38px] items-center justify-center rounded-full bg-white/90 shadow-[0_2px_8px_rgba(0,0,0,0.22)]"
                >
                  <img
                    src={
                      commentIcon
                    }
                    alt=""
                    aria-hidden="true"
                    className="size-[20px] object-contain"
                  />
                </button>
              )}
          </article>
        </div>,
        document.body,
      )}

      <VideoCommentSheet
        isOpen={
          isCommentOpen
        }
        videoId={
          videoId
        }
        onClose={() =>
          setIsCommentOpen(
            false,
          )
        }
      />
    </>
  );
}