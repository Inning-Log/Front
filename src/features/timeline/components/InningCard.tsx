import {
  useEffect,
  useRef,
  useState,
} from "react";

import moreVerticalIcon from "../../../assets/icons/more_information.png";

export type InningRecord = {
  id: string;
  inning: number;
  recordedAt: string;
  homeScore: number;
  awayScore: number;
  text: string;
};

type InningCardProps = {
  inning: number;
  record?: InningRecord;
  isAddCard?: boolean;
  showActions?: boolean;
  onAdd?: () => void;
  onOpen?: (record: InningRecord) => void;
  onEdit?: (record: InningRecord) => void;
  onDelete?: (record: InningRecord) => void;
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
  const [isMenuOpen, setIsMenuOpen] =
    useState(false);

  const menuRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handlePointerDown = (
      event: globalThis.PointerEvent,
    ) => {
      const target =
        event.target as Node;

      if (
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsMenuOpen(false);
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
  }, [isMenuOpen]);

  /*
   * 기록 추가 카드
   */
  if (isAddCard) {
    return (
      <button
        type="button"
        onClick={onAdd}
        aria-label={`${inning}회 기록 추가`}
        className="relative h-[125px] w-[358px] shrink-0 snap-center rounded-[27.5px] bg-accent-primary"
      >
        <InningNumber
          inning={inning}
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
      {/* 실제 기록 카드 */}
      <button
        type="button"
        onClick={() =>
          onOpen?.(record)
        }
        aria-label={`${inning}회 ${record.recordedAt} 기록 크게 보기`}
        className="relative z-0 h-full w-full rounded-[27.5px] bg-[#626262] text-left text-white"
      >
        <InningNumber
          inning={inning}
        />

        <div className="absolute left-1/2 top-[33px] flex w-[220px] -translate-x-1/2 flex-col items-center text-center">
          <time
            dateTime={
              record.recordedAt
            }
            className="text-title font-bold leading-[140%] text-white"
          >
            {record.recordedAt}
          </time>

          <p className="mt-[-2px] w-full truncate text-label-3 font-medium leading-[150%] text-white">
            {record.text}
          </p>
        </div>

        <p className="absolute right-[25px] top-1/2 w-[50px] -translate-y-1/2 text-center text-[14px] font-medium leading-[140%] tracking-[0.28px] text-white">
          {record.homeScore}:
          {record.awayScore}
        </p>
      </button>

      {/* 내 기록에서만 표시 */}
      {showActions && (
        <div
          ref={menuRef}
          className="absolute right-[14px] top-[10px] z-[50]"
          onPointerDown={(event) => {
            /*
             * 부모 section의 drag 이벤트 방지
             */
            event.stopPropagation();
          }}
          onPointerMove={(event) => {
            event.stopPropagation();
          }}
          onPointerUp={(event) => {
            event.stopPropagation();
          }}
          onClick={(event) => {
            /*
             * 카드 상세보기 클릭 방지
             */
            event.stopPropagation();
          }}
        >
          <button
            type="button"
            aria-label="기록 메뉴"
            aria-expanded={isMenuOpen}
            onClick={() =>
              setIsMenuOpen(
                (previous) =>
                  !previous,
              )
            }
            className="flex size-[30px] items-center justify-center rounded-full"
          >
            <img
              src={moreVerticalIcon}
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
                  setIsMenuOpen(false);

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
                  setIsMenuOpen(false);

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
    <div className="absolute left-[21px] top-[15px] flex size-[19px] items-center justify-center rounded-full bg-white text-bg-dark">
      <span className="text-caption-number -translate-y-px">
        {inning}
      </span>
    </div>
  );
}