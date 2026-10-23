import {
  useEffect,
  useRef,
  useState,
} from "react";

import moreVerticalIcon from "../../../assets/icons/more_information.png";

import {
  getInningRecordVideo,
} from "../../record/api/inningRecordVideoApi";

export type InningRecord = {
  id: string;
  inning: number;
  recordedAt: string;
  homeScore: number;
  awayScore: number;
  text: string;

  videoStatus?: string;
};

type InningCardProps = {
  inning: number;
  record?: InningRecord;
  isAddCard?: boolean;
  showActions?: boolean;
  onAdd?: () => void;
  onOpen?: (
    record: InningRecord,
  ) => void;
  onEdit?: (
    record: InningRecord,
  ) => void;
  onDelete?: (
    record: InningRecord,
  ) => void;
};

export function InningCard({
  inning,
  record,
  isAddCard = false,
  showActions = false,
  onAdd,
  onOpen,
  onEdit,
  onDelete,
}: InningCardProps) {
  const [
    isMenuOpen,
    setIsMenuOpen,
  ] =
    useState(false);

  const [
    videoUrl,
    setVideoUrl,
  ] =
    useState<string | null>(
      null,
    );

  const [
    isVideoLoading,
    setIsVideoLoading,
  ] =
    useState(false);

  const menuRef =
    useRef<HTMLDivElement>(
      null,
    );

  /*
   * 영상이 READY인 기록만
   * downloadUrl 조회
   */
  useEffect(() => {
    if (
      !record ||
      record.videoStatus !==
        "READY"
    ) {
      setVideoUrl(
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
          }
        } catch (error) {
          /*
           * 영상 조회가 실패해도
           * 타임라인 카드 자체는 정상 표시
           */
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
      cancelled = true;
    };
  }, [
    record,
  ]);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handlePointerDown = (
      event:
        globalThis.PointerEvent,
    ) => {
      const target =
        event.target as Node;

      if (
        menuRef.current &&
        !menuRef.current.contains(
          target,
        )
      ) {
        setIsMenuOpen(
          false,
        );
      }
    };

    document.addEventListener(
      "pointerdown",
      handlePointerDown,
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown,
      );
    };
  }, [
    isMenuOpen,
  ]);

  /*
   * 기록 추가 카드
   */
  if (isAddCard) {
    return (
      <button
        type="button"
        onClick={
          onAdd
        }
        aria-label={`${inning}회 기록 추가`}
        className="relative h-[125px] w-[358px] shrink-0 snap-center rounded-[27.5px] bg-accent-primary"
      >
        <InningNumber
          inning={
            inning
          }
        />

        <span
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[40px] font-light leading-none text-white"
        >
          +
        </span>
      </button>
    );
  }

  if (!record) {
    return null;
  }

  return (
    <div className="relative h-[125px] w-[358px] shrink-0 snap-center overflow-visible">
      <button
        type="button"
        onClick={() =>
          onOpen?.(
            record,
          )
        }
        aria-label={`${inning}회 ${record.recordedAt} 기록 크게 보기`}
        className="relative z-0 h-full w-full overflow-hidden rounded-[27.5px] bg-[#626262] text-left text-white"
      >
        {/* 업로드된 영상 */}
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

            {/*
             * 시간 / 캡션이 영상 위에서도
             * 보이도록 어두운 오버레이
             */}
            <div className="absolute inset-0 bg-black/35" />
          </>
        )}

        {/*
         * READY인데 downloadUrl을
         * 조회 중인 동안 기존 회색 배경 유지
         */}
        {isVideoLoading &&
          !videoUrl && (
            <div className="absolute inset-0 bg-[#626262]" />
          )}

        <InningNumber
          inning={
            inning
          }
        />

        <div className="absolute left-1/2 top-[33px] z-10 flex w-[220px] -translate-x-1/2 flex-col items-center text-center">
          <time
            dateTime={
              record.recordedAt
            }
            className="text-title font-bold leading-[140%] text-white"
          >
            {
              record.recordedAt
            }
          </time>

          <p className="mt-[-2px] w-full truncate text-label-3 font-medium leading-[150%] text-white">
            {
              record.text
            }
          </p>
        </div>

        <p className="absolute right-[25px] top-1/2 z-10 w-[50px] -translate-y-1/2 text-center text-[14px] font-medium leading-[140%] tracking-[0.28px] text-white">
          {
            record.homeScore
          }
          :
          {
            record.awayScore
          }
        </p>
      </button>

      {showActions && (
        <div
          ref={
            menuRef
          }
          className="absolute right-[14px] top-[10px] z-[50]"
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
        >
          <button
            type="button"
            aria-label="기록 메뉴"
            aria-expanded={
              isMenuOpen
            }
            onClick={() =>
              setIsMenuOpen(
                (
                  previous,
                ) =>
                  !previous,
              )
            }
            className="flex size-[30px] items-center justify-center rounded-full"
          >
            <img
              src={
                moreVerticalIcon
              }
              alt=""
              aria-hidden="true"
              className="block size-[20px] object-contain"
            />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-[34px] z-[60] w-[145px] overflow-hidden rounded-[12px] bg-white py-[4px] shadow-[0_4px_16px_rgba(0,0,0,0.16)]">
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(
                    false,
                  );

                  onEdit?.(
                    record,
                  );
                }}
                className="flex h-[42px] w-full items-center px-[14px] text-left text-caption text-button-neutral active:bg-surface-secondary"
              >
                캡션 수정하기
              </button>

              <div className="mx-[12px] border-t border-surface-secondary" />

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(
                    false,
                  );

                  onDelete?.(
                    record,
                  );
                }}
                className="flex h-[42px] w-full items-center px-[14px] text-left text-caption text-danger active:bg-surface-secondary"
              >
                기록 삭제하기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InningNumber({
  inning,
}: {
  inning: number;
}) {
  return (
    <div className="absolute left-[21px] top-[15px] z-20 flex size-[19px] items-center justify-center rounded-full bg-white text-bg-dark">
      <span className="text-caption-number -translate-y-px">
        {
          inning
        }
      </span>
    </div>
  );
}