import {
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { useNavigate, useParams } from "react-router-dom";

import { BottomBar } from "../../app/layouts/BottomBar";
import { PageHeader } from "../../app/layouts/PageHeader";
import doosanBearsMascot from "../../assets/icons/teammascot/doosanbears.svg";
import lgTwinsMascot from "../../assets/icons/teammascot/lgtwins.svg";
import {
  InningCard,
  type InningRecord,
} from "../../features/timeline/components/InningCard";
import { InningDetailModal } from "../../features/timeline/components/InningDetailModal";
import { TimelineGameScore } from "../../features/timeline/components/TimelineGameScore";
import { TimelineProfileList } from "../../features/timeline/components/TimelineProfileList";

//현재 5회
const currentInning = 5;

// API 연동 전 임시 데이터
const inningRecords: InningRecord[] = [
  {
    id: "record-1",
    inning: 1,
    recordedAt: "18:43",
    homeScore: 0,
    awayScore: 0,
    text: "야호~~~~",
  },
  {
    id: "record-2",
    inning: 1,
    recordedAt: "18:51",
    homeScore: 1,
    awayScore: 0,
    text: "첫 번째 안타!",
  },
  {
    id: "record-3",
    inning: 1,
    recordedAt: "19:02",
    homeScore: 1,
    awayScore: 0,
    text: "분위기 너무 좋다!",
  },
  {
    id: "record-4",
    inning: 3,
    recordedAt: "19:42",
    homeScore: 1,
    awayScore: 0,
    text: "야르",
  },
];

type TimelineParams = {
  userId?: string;
  gameId?: string;
};

type DragState = {
  inning: number | null;
  isDragging: boolean;
  startX: number;
  scrollLeft: number;
};

export function TimelinePage() {
  const navigate = useNavigate();
  const { userId, gameId } = useParams<TimelineParams>();

  const isPastTimeline = Boolean(gameId);
  const isFriendTimeline = Boolean(userId);
  const canAddRecord = !isPastTimeline && !isFriendTimeline;

  const [selectedRecord, setSelectedRecord] =
    useState<InningRecord | null>(null);

  const scrollRefs = useRef<Record<number, HTMLElement | null>>({});

  const dragState = useRef<DragState>({
    inning: null,
    isDragging: false,
    startX: 0,
    scrollLeft: 0,
  });

  const animationFrameRef = useRef<number | null>(null);
  const preventClickRef = useRef(false);

  const recordsByInning = inningRecords.reduce<
    Partial<Record<number, InningRecord[]>>
  >((result, record) => {
    result[record.inning] = [
      ...(result[record.inning] ?? []),
      record,
    ];

    return result;
  }, {});

  const uploadedInnings = Object.keys(recordsByInning).map(Number);

  const visibleInnings = Array.from(
    new Set([
      ...uploadedInnings,
      ...(canAddRecord && !recordsByInning[currentInning]
        ? [currentInning]
        : []),
    ]),
  ).sort((a, b) => a - b);

  const handleAddRecord = (inning: number) => {
    navigate("/home/record", {
      state: {
        inning,
      },
    });
  };

  const handleOpenRecord = (record: InningRecord) => {
    if (preventClickRef.current) {
      return;
    }

    setSelectedRecord(record);
  };

  const handlePointerDown = (
    event: PointerEvent<HTMLElement>,
    inning: number,
  ) => {
    if (event.pointerType !== "mouse") {
      return;
    }

    const container = scrollRefs.current[inning];

    preventClickRef.current = false;

    if (!container || container.scrollWidth <= container.clientWidth) {
      return;
    }

    dragState.current = {
      inning,
      isDragging: true,
      startX: event.clientX,
      scrollLeft: container.scrollLeft,
    };

    container.style.scrollSnapType = "none";
    container.style.cursor = "grabbing";
  };

  const handlePointerMove = (
    event: PointerEvent<HTMLElement>,
    inning: number,
  ) => {
    if (event.pointerType !== "mouse") {
      return;
    }

    const container = scrollRefs.current[inning];
    const currentDrag = dragState.current;

    if (
      !container ||
      !currentDrag.isDragging ||
      currentDrag.inning !== inning
    ) {
      return;
    }

    event.preventDefault();

    const movedDistance = event.clientX - currentDrag.startX;

    if (Math.abs(movedDistance) > 5) {
      preventClickRef.current = true;
    }

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      container.scrollLeft =
        currentDrag.scrollLeft - movedDistance * 0.9;
    });
  };

  const handlePointerEnd = (
    event: PointerEvent<HTMLElement>,
    inning: number,
  ) => {
    if (event.pointerType !== "mouse") {
      return;
    }

    const container = scrollRefs.current[inning];

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    dragState.current = {
      inning: null,
      isDragging: false,
      startX: 0,
      scrollLeft: 0,
    };

    if (!container) {
      return;
    }

    container.style.scrollSnapType = "x proximity";
    container.style.cursor = "grab";
  };

  const handleClickCapture = (event: MouseEvent<HTMLElement>) => {
    if (!preventClickRef.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    preventClickRef.current = false;
  };

  return (
    <div className="min-h-dvh w-full pt-[45px]">
      <PageHeader title="타임라인" />

      {!isPastTimeline && <TimelineProfileList />}

      <TimelineGameScore
        homeTeamName="두산 베어스"
        homeTeamLogo={doosanBearsMascot}
        awayTeamName="LG 트윈스"
        awayTeamLogo={lgTwinsMascot}
        homeScore={1}
        awayScore={0}
        gameDateTime="07.29 18:30"
        stadium="잠실 야구장"
      />

      <main className="flex flex-col gap-[12px] pb-[110px] pt-[20px]">
        {visibleInnings.map((inning) => {
          const records = recordsByInning[inning] ?? [];

          const shouldShowAddCard =
            canAddRecord &&
            inning === currentInning &&
            records.length === 0;

          return (
            <section
              key={inning}
              ref={(element) => {
                scrollRefs.current[inning] = element;
              }}
              aria-label={`${inning}회 기록`}
              onPointerDown={(event) =>
                handlePointerDown(event, inning)
              }
              onPointerMove={(event) =>
                handlePointerMove(event, inning)
              }
              onPointerUp={(event) =>
                handlePointerEnd(event, inning)
              }
              onPointerCancel={(event) =>
                handlePointerEnd(event, inning)
              }
              onPointerLeave={(event) => {
                if (dragState.current.isDragging) {
                  handlePointerEnd(event, inning);
                }
              }}
              onClickCapture={handleClickCapture}
              className="scrollbar-hide flex w-full min-w-0 cursor-grab snap-x snap-proximity gap-[12px] overflow-x-auto overscroll-x-contain px-[16px] select-none [touch-action:pan-x]"
            >
              {records.map((record) => (
                <InningCard
                  key={record.id}
                  inning={inning}
                  record={record}
                  onOpen={handleOpenRecord}
                />
              ))}

              {shouldShowAddCard && (
                <InningCard
                  inning={inning}
                  isAddCard
                  onAdd={() => handleAddRecord(inning)}
                />
              )}
            </section>
          );
        })}
      </main>

      <BottomBar />

      <InningDetailModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  );
}