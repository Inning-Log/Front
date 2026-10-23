import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  createPortal,
} from "react-dom";

import {
  getInningRecord,
  updateInningRecord,
} from "../../record/api/inningRecordApi";

import type {
  InningRecordResponse,
} from "../../record/types/inningRecord";

import type {
  InningRecord,
} from "./InningCard";

export type InningDetailMode =
  | "view"
  | "edit";

type InningDetailModalProps = {
  record: InningRecord | null;
  mode?: InningDetailMode;
  onClose: () => void;
  onUpdated?: (
    record:
      InningRecordResponse,
  ) => void;
};

function formatRecordedTime(
  recordedAt: string,
) {
  const date =
    new Date(recordedAt);

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
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
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

  const isEditing =
    mode === "edit";

  useEffect(() => {
    if (!record) {
      setDetail(null);
      setEditText("");
      setErrorMessage("");
      return;
    }

    setEditText(
      record.text,
    );

    const id =
      Number(record.id);

    if (
      !Number.isSafeInteger(
        id,
      ) ||
      id <= 0
    ) {
      return;
    }

    let cancelled = false;

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

          if (cancelled) {
            return;
          }

          setDetail(
            response,
          );

          setEditText(
            response.text,
          );
        } catch (error) {
          if (cancelled) {
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
          if (!cancelled) {
            setIsLoading(
              false,
            );
          }
        }
      };

    void fetchDetail();

    return () => {
      cancelled = true;
    };
  }, [record]);

  /*
   * 캡션 수정하기를 눌러 모달이 열린 경우
   * textarea에 자동 포커스.
   *
   * 모바일 브라우저에서는 이 focus에 의해
   * 소프트 키보드가 함께 열린다.
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

  useEffect(() => {
    if (!record) {
      return;
    }

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key ===
          "Escape" &&
        !isSaving
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
    isSaving,
    onClose,
    record,
  ]);

  if (!record) {
    return null;
  }

  const recordId =
    Number(record.id);

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
      } catch (error) {
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

  return createPortal(
    <div
      role="presentation"
      onClick={() => {
        if (
          !isSaving
        ) {
          onClose();
        }
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-[16px] py-[24px]"
    >
      <article
        role="dialog"
        aria-modal="true"
        aria-label={`${displayInning}회 기록 ${isEditing ? "수정" : "상세"}`}
        onClick={(event) =>
          event.stopPropagation()
        }
        className="relative h-[min(608px,calc(100dvh-48px))] w-full max-w-[358px] overflow-hidden rounded-[25px] bg-[#5A5A5A] text-white"
      >
        <div className="absolute left-[27px] top-[20px] flex size-[27px] items-center justify-center rounded-full bg-white text-bg-dark">
          <span className="font-akatab text-[18px] font-bold leading-none">
            {displayInning}
          </span>
        </div>

        <p className="absolute left-1/2 top-[28px] -translate-x-1/2 text-title-2 text-white">
          {displayHomeScore}:
          {displayAwayScore}
        </p>

        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="size-[36px] animate-spin rounded-full border-[4px] border-white/30 border-t-white" />
          </div>
        ) : isEditing ? (
          <div className="absolute left-1/2 top-1/2 flex w-[280px] -translate-x-1/2 -translate-y-1/2 flex-col items-center">
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
              className="mt-[18px] h-[130px] w-full resize-none rounded-[16px] bg-white/10 px-[16px] py-[14px] text-center text-title-2 text-white outline-none placeholder:text-white/50"
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
          <div className="absolute left-1/2 top-1/2 flex w-[280px] -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center">
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
              {displayText}
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
      </article>
    </div>,
    document.body,
  );
}