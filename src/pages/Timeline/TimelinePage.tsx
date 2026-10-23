import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";

import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";



import { BottomBar } from "../../app/layouts/BottomBar";
import { PageHeader } from "../../app/layouts/PageHeader";

import shareIcon from "../../assets/icons/share.svg";
import settingIcon from "../../assets/icons/setting.png";

import { getHomeCalendar } from "../../features/home/api/homeApi";

import type {
  HomeCalendarGame,
} from "../../features/home/types/home";

import {
  getFriendTimeline,
  getMyTimeline,
  getTimelineProfiles,
} from "../../features/timeline/api/timelineApi";

import {
  InningCard,
  type InningRecord,
} from "../../features/timeline/components/InningCard";

import {
  deleteInningRecord,
} from "../../features/record/api/inningRecordApi";

import type {
  InningRecordResponse,
} from "../../features/record/types/inningRecord";

import {
  InningDetailModal,
  type InningDetailMode,
} from "../../features/timeline/components/InningDetailModal";

import { TimelineGameScore } from "../../features/timeline/components/TimelineGameScore";
import { TimelineProfileList } from "../../features/timeline/components/TimelineProfileList";
import { TimelineShareModal } from "../../features/timeline/components/TimelineShareModal";
import { ConfirmModal } from "../../shared/ui/ConfirmModal";

import type {
  TimelineRecord,
  TimelineResponse,
} from "../../features/timeline/types/timeline";

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

/**
 * 서버 record → 화면용 record 변환
 */
function mapTimelineRecord(
  record: TimelineRecord,
): InningRecord {
  const recordedDate =
    new Date(record.recordedAt);

  const recordedAt =
    Number.isNaN(
      recordedDate.getTime(),
    )
      ? record.recordedAt
      : recordedDate.toLocaleTimeString(
          "ko-KR",
          {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "Asia/Seoul",
          },
        );

  return {
    id: String(record.id),
    inning: record.inning,
    recordedAt,
    homeScore: record.homeScore,
    awayScore: record.awayScore,
    text: record.text,
  };
}

/**
 * 경기 시작 시간 표시
 */
function formatGameDateTime(
  scheduledAt: string,
) {
  if (!scheduledAt) {
    return "";
  }

  const date =
    new Date(scheduledAt);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return scheduledAt;
  }

  const parts =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone: "Asia/Seoul",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      },
    ).formatToParts(date);

  const getPart = (
    type: string,
  ) =>
    parts.find(
      (part) =>
        part.type === type,
    )?.value ?? "";

  return `${getPart("month")}.${getPart("day")} ${getPart("hour")}:${getPart("minute")}`;
}

/**
 * 내 오늘 경기 ID 조회
 *
 * 1. timeline profiles의 내 경기 확인
 * 2. 없으면 Home Calendar의 오늘 경기 확인
 */
async function getMyTodayGameId() {
  const profiles =
    await getTimelineProfiles({
      afterUserId: 0,
      limit: 50,
    });

  const timelineGame =
    profiles.me.games[0];

  if (timelineGame) {
    return timelineGame.gameId;
  }

  const [
    yearString,
    monthString,
  ] =
    profiles.today.split("-");

  const year =
    Number(yearString);

  const month =
    Number(monthString);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month)
  ) {
    return null;
  }

  const calendar =
    await getHomeCalendar(
      year,
      month,
    );

  const todaySchedule =
    calendar.days.find(
      (day) =>
        day.date ===
        calendar.today,
    );

  const todayGame =
    todaySchedule?.games[0];

  return (
    todayGame?.gameId ??
    null
  );
}

/**
 * 친구 오늘 경기 ID 조회
 */
async function getFriendTodayGameId(
  userId: number,
) {
  let afterUserId = 0;

  const visitedCursors =
    new Set<number>();

  while (true) {
    const response =
      await getTimelineProfiles({
        afterUserId,
        limit: 50,
      });

    const friend =
      response.friends.find(
        (item) =>
          item.userId ===
          userId,
      );

    if (friend) {
      return (
        friend.games[0]
          ?.gameId ?? null
      );
    }

    const nextAfterUserId =
      response.nextAfterUserId;

    if (
      nextAfterUserId ===
        null ||
      nextAfterUserId ===
        undefined
    ) {
      return null;
    }

    if (
      nextAfterUserId ===
        afterUserId ||
      visitedCursors.has(
        nextAfterUserId,
      )
    ) {
      return null;
    }

    visitedCursors.add(
      nextAfterUserId,
    );

    afterUserId =
      nextAfterUserId;
  }
}

/**
 * Home Calendar에서
 * 특정 과거 경기 조회
 *
 * 점수 fallback 용도
 */
async function getHistoryGame(
  gameId: number,
  gameDate: string,
): Promise<HomeCalendarGame | null> {
  const [
    yearString,
    monthString,
  ] =
    gameDate.split("-");

  const year =
    Number(yearString);

  const month =
    Number(monthString);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month)
  ) {
    return null;
  }

  const calendar =
    await getHomeCalendar(
      year,
      month,
    );

  for (
    const day of
    calendar.days
  ) {
    const game =
      day.games.find(
        (item) =>
          item.gameId ===
          gameId,
      );

    if (game) {
      return game;
    }
  }

  return null;
}

export function TimelinePage() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    userId: pathUserId,
    gameId: pathGameId,
  } =
    useParams<TimelineParams>();

  const [searchParams] =
    useSearchParams();

  const queryUserId =
    searchParams.get(
      "userId",
    );

  const queryGameId =
    searchParams.get(
      "gameId",
    );

  const userId =
    queryUserId ??
    pathUserId ??
    null;

  const gameId =
    queryGameId ??
    pathGameId ??
    null;

  const parsedUserId =
    userId !== null &&
    userId !== ""
      ? Number(userId)
      : null;

  const parsedGameId =
    gameId !== null &&
    gameId !== ""
      ? Number(gameId)
      : null;

  const isFriendTimeline =
    parsedUserId !== null;

  const isPastTimeline =
    location.pathname.startsWith(
      "/timeline/history/",
    );

  const [
    timeline,
    setTimeline,
  ] =
    useState<TimelineResponse | null>(
      null,
    );

  const [
    historyGame,
    setHistoryGame,
  ] =
    useState<HomeCalendarGame | null>(
      null,
    );

  const [
    records,
    setRecords,
  ] =
    useState<
      TimelineRecord[]
    >([]);

  const [
    nextCursor,
    setNextCursor,
  ] =
    useState<string | null>(
      null,
    );

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true);

  const [
    isLoadingMore,
    setIsLoadingMore,
  ] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<string | null>(
      null,
    );

  const [
    selectedRecord,
    setSelectedRecord,
  ] =
    useState<InningRecord | null>(
      null,
    );

  const [
    isShareModalOpen,
    setIsShareModalOpen,
  ] =
    useState(false);

  const scrollRefs =
    useRef<
      Record<
        number,
        HTMLElement | null
      >
    >({});

  const dragState =
    useRef<DragState>({
      inning: null,
      isDragging: false,
      startX: 0,
      scrollLeft: 0,
    });

  const animationFrameRef =
    useRef<number | null>(
      null,
    );

  const preventClickRef =
    useRef(false);

    const [
      selectedRecordMode,
      setSelectedRecordMode,
    ] =
      useState<InningDetailMode>(
        "view",
      );

    const [
      pendingDeleteRecord,
      setPendingDeleteRecord,
    ] =
      useState<InningRecord | null>(
        null,
      );

    const [
      isDeletingRecord,
      setIsDeletingRecord,
    ] =
      useState(false);

    const [
      deleteRecordError,
      setDeleteRecordError,
    ] =
      useState("");

  /**
   * 최초 타임라인 조회
   */
  useEffect(() => {
    let cancelled = false;

    const fetchTimeline =
      async () => {
        try {
          setIsLoading(true);

          setErrorMessage(
            null,
          );

          setHistoryGame(
            null,
          );

          let targetGameId =
            parsedGameId;

          /**
           * gameId가 URL에 없으면
           * 오늘 경기 ID 조회
           */
          if (
            targetGameId ===
            null
          ) {
            if (
              isFriendTimeline
            ) {
              if (
                parsedUserId ===
                  null ||
                !Number.isSafeInteger(
                  parsedUserId,
                ) ||
                parsedUserId <= 0
              ) {
                throw new Error(
                  "올바르지 않은 사용자 ID입니다.",
                );
              }

              targetGameId =
                await getFriendTodayGameId(
                  parsedUserId,
                );

              if (
                cancelled
              ) {
                return;
              }

              if (
                targetGameId ===
                null
              ) {
                setTimeline(
                  null,
                );

                setRecords(
                  [],
                );

                setNextCursor(
                  null,
                );

                return;
              }
            } else {
              targetGameId =
                await getMyTodayGameId();

              if (
                cancelled
              ) {
                return;
              }

              if (
                targetGameId ===
                null
              ) {
                setTimeline(
                  null,
                );

                setRecords(
                  [],
                );

                setNextCursor(
                  null,
                );

                return;
              }
            }
          }

          if (
            !Number.isSafeInteger(
              targetGameId,
            ) ||
            targetGameId <= 0
          ) {
            throw new Error(
              "올바르지 않은 경기 ID입니다.",
            );
          }

          let response:
            TimelineResponse;

          /**
           * 친구 타임라인
           */
          if (
            isFriendTimeline
          ) {
            if (
              parsedUserId ===
                null ||
              !Number.isSafeInteger(
                parsedUserId,
              ) ||
              parsedUserId <= 0
            ) {
              throw new Error(
                "올바르지 않은 사용자 ID입니다.",
              );
            }

            response =
              await getFriendTimeline(
                {
                  userId:
                    parsedUserId,

                  gameId:
                    targetGameId,

                  limit: 50,
                },
              );
          } else {
            /**
             * 내 타임라인
             * +
             * 지난 경기
             */
            response =
              await getMyTimeline(
                {
                  gameId:
                    targetGameId,

                  limit: 50,
                },
              );
          }

          if (
            cancelled
          ) {
            return;
          }

          setTimeline(
            response,
          );

          setRecords(
            response.records ??
              [],
          );

          setNextCursor(
            response.nextCursor ??
              null,
          );

          /**
           * 지난 경기인 경우
           * Home Calendar에서
           * 동일 gameId 경기 조회
           *
           * 실제 점수 fallback
           */
          if (
            isPastTimeline
          ) {
            try {
              const pastGame =
                await getHistoryGame(
                  response.game
                    .gameId,

                  response.game
                    .date,
                );

              if (
                cancelled
              ) {
                return;
              }

              setHistoryGame(
                pastGame,
              );
            } catch (
              error
            ) {
              console.error(
                "지난 경기 정보 조회 실패:",
                error,
              );

              setHistoryGame(
                null,
              );
            }
          }
        } catch (error) {
          if (
            cancelled
          ) {
            return;
          }

          console.error(
            "타임라인 조회 실패:",
            error,
          );

          setTimeline(
            null,
          );

          setRecords([]);

          setHistoryGame(
            null,
          );

          setErrorMessage(
            error instanceof
              Error
              ? error.message
              : "타임라인을 불러오지 못했습니다.",
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

    void fetchTimeline();

    return () => {
      cancelled = true;
    };
  }, [
    parsedGameId,
    parsedUserId,
    isFriendTimeline,
    isPastTimeline,
  ]);

  /**
   * 다음 기록 조회
   */
  const handleLoadMore =
    async () => {
      if (
        !timeline ||
        !nextCursor ||
        isLoadingMore
      ) {
        return;
      }

      try {
        setIsLoadingMore(
          true,
        );

        const params = {
          gameId:
            timeline.game
              .gameId,

          cursor:
            nextCursor,

          limit: 50,
        };

        const response =
          isFriendTimeline
            ? await getFriendTimeline(
                {
                  ...params,

                  userId:
                    parsedUserId ??
                    timeline
                      .owner
                      .userId,
                },
              )
            : await getMyTimeline(
                params,
              );

        setRecords(
          (previous) => {
            const existingIds =
              new Set(
                previous.map(
                  (
                    record,
                  ) =>
                    record.id,
                ),
              );

            const newRecords =
              response.records.filter(
                (
                  record,
                ) =>
                  !existingIds.has(
                    record.id,
                  ),
              );

            return [
              ...previous,
              ...newRecords,
            ];
          },
        );

        setNextCursor(
          response.nextCursor ??
            null,
        );
      } catch (error) {
        console.error(
          "타임라인 추가 조회 실패:",
          error,
        );

        setErrorMessage(
          "이전 기록을 불러오지 못했습니다.",
        );
      } finally {
        setIsLoadingMore(
          false,
        );
      }
    };

  /**
   * 기록 변환
   */
  const inningRecords =
    records.map(
      mapTimelineRecord,
    );

  /**
   * 이닝별 기록 그룹
   */
  const recordsByInning =
    inningRecords.reduce<
      Partial<
        Record<
          number,
          InningRecord[]
        >
      >
    >(
      (
        result,
        record,
      ) => {
        result[
          record.inning
        ] = [
          ...(result[
            record.inning
          ] ?? []),

          record,
        ];

        return result;
      },
      {},
    );

  const uploadedInnings =
    Object.keys(
      recordsByInning,
    ).map(Number);

  const currentInning =
    timeline
      ?.currentInning ?? 0;

  /**
   * 기록 추가 가능
   */
  const canAddRecord =
    !isFriendTimeline &&
    !isPastTimeline &&
    timeline
      ?.canCreateRecord ===
      true &&
    timeline
      .requiresViewingRegistration ===
      false;

  /**
   * 현재 이닝은
   * 기록이 있어도 + 카드 표시
   */
  const visibleInnings =
    Array.from(
      new Set([
        ...uploadedInnings,

        ...(canAddRecord &&
        currentInning > 0
          ? [
              currentInning,
            ]
          : []),
      ]),
    ).sort(
      (a, b) =>
        a - b,
    );

  const handleAddRecord =
    (
      inning: number,
    ) => {
      if (
        !timeline ||
        !canAddRecord
      ) {
        return;
      }

      navigate(
        "/home/record",
        {
          state: {
            inning,

            gameId:
              timeline.game
                .gameId,
          },
        },
      );
    };

  const handleOpenRecord = (
    record: InningRecord,
  ) => {
    if (
      preventClickRef.current
    ) {
      return;
    }

    setSelectedRecordMode(
      "view",
    );

    setSelectedRecord(
      record,
    );
  };

  const handleEditRecord = (
    record: InningRecord,
  ) => {
    setSelectedRecordMode(
      "edit",
    );

    setSelectedRecord(
      record,
    );
  };

  const handleRequestDeleteRecord = (
    record: InningRecord,
  ) => {
    setDeleteRecordError(
      "",
    );

    setPendingDeleteRecord(
      record,
    );
  };

  const handleDeleteRecord =
    async () => {
      if (
        !pendingDeleteRecord ||
        isDeletingRecord
      ) {
        return;
      }

      const recordId =
        Number(
          pendingDeleteRecord.id,
        );

      if (
        !Number.isSafeInteger(
          recordId,
        ) ||
        recordId <= 0
      ) {
        setDeleteRecordError(
          "올바르지 않은 기록입니다.",
        );

        return;
      }

      try {
        setIsDeletingRecord(
          true,
        );

        setDeleteRecordError(
          "",
        );

        await deleteInningRecord(
          recordId,
        );

        /*
        * 서버 삭제 성공 후
        * 현재 타임라인 state에서도 즉시 제거.
        *
        * 페이지 새로고침 필요 없음.
        */
        setRecords(
          (
            previousRecords,
          ) =>
            previousRecords.filter(
              (record) =>
                record.id !==
                recordId,
            ),
        );

        if (
          selectedRecord?.id ===
          String(recordId)
        ) {
          setSelectedRecord(
            null,
          );
        }

        setPendingDeleteRecord(
          null,
        );
      } catch (error) {
        console.error(
          "이닝 기록 삭제 실패:",
          error,
        );

        setDeleteRecordError(
          error instanceof
            Error
            ? error.message
            : "이닝 기록을 삭제하지 못했습니다.",
        );
      } finally {
        setIsDeletingRecord(
          false,
        );
      }
    };

    const handleRecordUpdated = (
      updated:
        InningRecordResponse,
    ) => {
      /*
      * 서버 PATCH 응답을
      * 현재 records state에 바로 반영한다.
      */
      setRecords(
        (
          previousRecords,
        ) =>
          previousRecords.map(
            (record) =>
              record.id ===
              updated.id
                ? {
                    ...record,

                    text:
                      updated.text,

                    updatedAt:
                      updated.updatedAt,
                  }
                : record,
          ),
      );

      /*
      * 현재 선택된 카드가
      * 수정한 카드라면 상세 데이터도 갱신.
      */
      setSelectedRecord(
        (previous) => {
          if (
            !previous ||
            previous.id !==
              String(
                updated.id,
              )
          ) {
            return previous;
          }

          return {
            ...previous,
            text:
              updated.text,
          };
        },
      );
    };

  const handleSaveMyVideo =
    () => {
      setIsShareModalOpen(
        false,
      );

      console.log(
        "내 영상 저장",
      );
    };

  const handleSaveWithFriend =
    () => {
      setIsShareModalOpen(
        false,
      );

      navigate(
        "/timeline/save/friend",
      );
    };

  /**
   * 드래그
   */
  const handlePointerDown =
    (
      event:
        PointerEvent<HTMLElement>,
      inning: number,
    ) => {
      if (
        event.pointerType !==
        "mouse"
      ) {
        return;
      }

      const container =
        scrollRefs.current[
          inning
        ];

      preventClickRef.current =
        false;

      if (
        !container ||
        container.scrollWidth <=
          container.clientWidth
      ) {
        return;
      }

      dragState.current = {
        inning,

        isDragging:
          true,

        startX:
          event.clientX,

        scrollLeft:
          container.scrollLeft,
      };

      container.style.scrollSnapType =
        "none";

      container.style.cursor =
        "grabbing";
    };

  const handlePointerMove =
    (
      event:
        PointerEvent<HTMLElement>,

      inning: number,
    ) => {
      if (
        event.pointerType !==
        "mouse"
      ) {
        return;
      }

      const container =
        scrollRefs.current[
          inning
        ];

      const currentDrag =
        dragState.current;

      if (
        !container ||
        !currentDrag.isDragging ||
        currentDrag.inning !==
          inning
      ) {
        return;
      }

      event.preventDefault();

      const movedDistance =
        event.clientX -
        currentDrag.startX;

      if (
        Math.abs(
          movedDistance,
        ) > 5
      ) {
        preventClickRef.current =
          true;
      }

      if (
        animationFrameRef.current !==
        null
      ) {
        cancelAnimationFrame(
          animationFrameRef.current,
        );
      }

      animationFrameRef.current =
        requestAnimationFrame(
          () => {
            container.scrollLeft =
              currentDrag.scrollLeft -
              movedDistance *
                0.9;
          },
        );
    };

  const handlePointerEnd =
    (
      event:
        PointerEvent<HTMLElement>,

      inning: number,
    ) => {
      if (
        event.pointerType !==
        "mouse"
      ) {
        return;
      }

      const container =
        scrollRefs.current[
          inning
        ];

      if (
        animationFrameRef.current !==
        null
      ) {
        cancelAnimationFrame(
          animationFrameRef.current,
        );

        animationFrameRef.current =
          null;
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

      container.style.scrollSnapType =
        "x proximity";

      container.style.cursor =
        "grab";
    };

  const handleClickCapture =
    (
      event:
        MouseEvent<HTMLElement>,
    ) => {
      if (
        !preventClickRef.current
      ) {
        return;
      }

      event.preventDefault();

      event.stopPropagation();

      preventClickRef.current =
        false;
    };

  useEffect(() => {
    return () => {
      if (
        animationFrameRef.current !==
        null
      ) {
        cancelAnimationFrame(
          animationFrameRef.current,
        );
      }
    };
  }, []);

  /**
   * 로딩
   */
  if (isLoading) {
    return (
      <div className="flex min-h-dvh w-full flex-col pt-[45px]">
        <PageHeader title="타임라인" />

        {!isPastTimeline && (
          <TimelineProfileList />
        )}

        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="size-[36px] animate-spin rounded-full border-[4px] border-surface-secondary border-t-accent-primary" />

            <p className="mt-[16px] text-label-3 text-black">
              타임라인을
              불러오는 중...
            </p>
          </div>
        </main>

        <BottomBar />
      </div>
    );
  }

  /**
   * 에러
   */
  if (
    errorMessage &&
    !timeline
  ) {
    return (
      <div className="flex min-h-dvh w-full flex-col pt-[45px]">
        <PageHeader title="타임라인" />

        {!isPastTimeline && (
          <TimelineProfileList />
        )}

        <main className="flex flex-1 flex-col items-center justify-center px-[16px]">
          <p className="text-label-3 text-black">
            {
              errorMessage
            }
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="mt-[16px] rounded-full bg-accent-primary px-[24px] py-[12px] text-white"
          >
            다시 시도
          </button>
        </main>

        <BottomBar />
      </div>
    );
  }

  /**
   * 오늘 경기 자체가 없는 경우
   */
  if (!timeline) {
    return (
      <div className="flex min-h-dvh w-full flex-col pt-[45px]">
        <PageHeader title="타임라인" />

        {!isPastTimeline && (
          <TimelineProfileList />
        )}

        <main className="flex flex-1 items-center justify-center">
          <p className="text-label-3 text-text-tertiary">
            오늘 경기가 없습니다.
          </p>
        </main>

        <BottomBar />
      </div>
    );
  }

  const game =
    timeline.game;

  /**
   * 지난 경기라면
   * Home Calendar의 경기 데이터 우선
   */
  const displayHomeTeamName =
    historyGame
      ?.homeTeam.name ??
    game.homeTeam.name;

  const displayAwayTeamName =
    historyGame
      ?.awayTeam.name ??
    game.awayTeam.name;

  const displayHomeScore =
    historyGame
      ?.score?.home ??
    game.score.home;

  const displayAwayScore =
    historyGame
      ?.score?.away ??
    game.score.away;

  const displayScheduledAt =
    historyGame
      ?.scheduledAt ??
    game.scheduledAt;

  const displayStadium =
    historyGame
      ?.stadiumName ??
    game.stadiumName ??
    "";

  return (
    <div className="min-h-dvh w-full pt-[45px]">
      <div className="relative">
        <PageHeader title="타임라인" />

        {!isPastTimeline && (
          <div className="absolute right-[22px] top-1/2 flex -translate-y-1/2 items-center gap-[16px]">
            <button
              type="button"
              aria-label="영상 저장하기"
              onClick={() =>
                setIsShareModalOpen(
                  true,
                )
              }
              className="flex size-[24px] items-center justify-center"
            >
              <img
                src={
                  shareIcon
                }
                alt=""
                className="size-[15px]"
              />
            </button>

            {!isFriendTimeline && (
              <button
                type="button"
                aria-label="관람 정보 설정"
                className="flex size-[24px] items-center justify-center"
              >
                <img
                  src={
                    settingIcon
                  }
                  alt=""
                  className="size-[18px] object-contain"
                />
              </button>
            )}
          </div>
        )}
      </div>

      {!isPastTimeline && (
        <TimelineProfileList />
      )}

      <TimelineGameScore
        homeTeamName={
          displayHomeTeamName
        }
        awayTeamName={
          displayAwayTeamName
        }
        homeScore={
          displayHomeScore
        }
        awayScore={
          displayAwayScore
        }
        gameDateTime={formatGameDateTime(
          displayScheduledAt,
        )}
        stadium={
          displayStadium
        }
      />

      <main className="flex flex-col gap-[12px] pb-[110px] pt-[20px]">
        {visibleInnings.length ===
        0 ? (
          <p className="py-[40px] text-center text-label-3 text-text-tertiary">
            기록이 없습니다.
          </p>
        ) : (
          visibleInnings.map(
            (inning) => {
              const inningRecords =
                recordsByInning[
                  inning
                ] ?? [];

              const shouldShowAddCard =
                canAddRecord &&
                inning ===
                  currentInning;

              return (
                <section
                  key={
                    inning
                  }
                  ref={(
                    element,
                  ) => {
                    scrollRefs.current[
                      inning
                    ] =
                      element;
                  }}
                  aria-label={`${inning}회 기록`}
                  onPointerDown={(
                    event,
                  ) =>
                    handlePointerDown(
                      event,
                      inning,
                    )
                  }
                  onPointerMove={(
                    event,
                  ) =>
                    handlePointerMove(
                      event,
                      inning,
                    )
                  }
                  onPointerUp={(
                    event,
                  ) =>
                    handlePointerEnd(
                      event,
                      inning,
                    )
                  }
                  onPointerCancel={(
                    event,
                  ) =>
                    handlePointerEnd(
                      event,
                      inning,
                    )
                  }
                  onPointerLeave={(
                    event,
                  ) => {
                    if (
                      dragState
                        .current
                        .isDragging
                    ) {
                      handlePointerEnd(
                        event,
                        inning,
                      );
                    }
                  }}
                  onClickCapture={
                    handleClickCapture
                  }
                  className="scrollbar-hide flex w-full min-w-0 cursor-grab snap-x snap-proximity gap-[12px] overflow-x-auto overscroll-x-contain px-[16px] select-none [touch-action:pan-x]"
                >
                  {inningRecords.map(
                    (record) => (
                      <InningCard
                        key={record.id}
                        inning={inning}
                        record={record}
                        showActions={
                          !isFriendTimeline
                        }
                        onOpen={
                          handleOpenRecord
                        }
                        onEdit={
                          handleEditRecord
                        }
                        onDelete={
                          handleRequestDeleteRecord
                        }
                      />
                    ),
                  )}

                  {shouldShowAddCard && (
                    <InningCard
                      inning={
                        inning
                      }
                      isAddCard
                      onAdd={() =>
                        handleAddRecord(
                          inning,
                        )
                      }
                    />
                  )}
                </section>
              );
            },
          )
        )}

        {nextCursor && (
          <button
            type="button"
            onClick={() =>
              void handleLoadMore()
            }
            disabled={
              isLoadingMore
            }
            className="mx-[16px] mt-[12px] rounded-full border border-surface-secondary py-[12px] text-label-3 text-black disabled:opacity-50"
          >
            {isLoadingMore
              ? "기록을 불러오는 중..."
              : "이전 기록 더보기"}
          </button>
        )}

        {errorMessage && (
          <p className="text-center text-caption text-red-500">
            {
              errorMessage
            }
          </p>
        )}
      </main>

      <BottomBar />

      <InningDetailModal
        record={
          selectedRecord
        }
        mode={
          selectedRecordMode
        }
        onClose={() => {
          setSelectedRecord(
            null,
          );

          setSelectedRecordMode(
            "view",
          );
        }}
        onUpdated={
          handleRecordUpdated
        }
      />

      <ConfirmModal
        open={
          pendingDeleteRecord !==
          null
        }
        title="기록을 삭제하시겠습니까?"
        isPending={
          isDeletingRecord
        }
        errorMessage={
          deleteRecordError
        }
        pendingText="삭제 중..."
        onCancel={() => {
          if (
            isDeletingRecord
          ) {
            return;
          }

          setDeleteRecordError(
            "",
          );

          setPendingDeleteRecord(
            null,
          );
        }}
        onConfirm={() =>
          void handleDeleteRecord()
        }
      />

      <TimelineShareModal
        isOpen={
          isShareModalOpen
        }
        onClose={() =>
          setIsShareModalOpen(
            false,
          )
        }
        onSaveMyVideo={
          handleSaveMyVideo
        }
        onSaveWithFriend={
          handleSaveWithFriend
        }
      />
    </div>
  );
}
