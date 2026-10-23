import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";

import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import defaultProfileIcon from "../../../assets/icons/defaultprofile.svg";

import { getTimelineProfiles } from "../api/timelineApi";

import type {
  TimelineProfile,
  TimelineProfilesResponse,
} from "../types/timeline";

import { TimelineProfileItem } from "./TimelineProfileItem";

const DRAG_THRESHOLD = 10;

type TimelineParams = {
  userId?: string;
};

export function TimelineProfileList() {
  const navigate = useNavigate();

  const { userId: pathUserId } =
    useParams<TimelineParams>();

  const [searchParams] =
    useSearchParams();

  const [profiles, setProfiles] =
    useState<TimelineProfilesResponse | null>(
      null,
    );

  const [friends, setFriends] =
    useState<TimelineProfile[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const scrollContainerRef =
    useRef<HTMLElement>(null);

  const dragStartXRef =
    useRef(0);

  const dragStartScrollLeftRef =
    useRef(0);

  const isPointerDownRef =
    useRef(false);

  const hasMovedRef =
    useRef(false);

  const queryUserId =
    searchParams.get("userId");

  const selectedUserId =
    queryUserId ??
    pathUserId ??
    null;

  const isViewingFriendTimeline =
    selectedUserId !== null;

  useEffect(() => {
    let cancelled = false;

    const fetchProfiles =
      async () => {
        try {
          setIsLoading(true);

          const firstPage =
            await getTimelineProfiles({
              afterUserId: 0,
              limit: 50,
            });

          if (cancelled) {
            return;
          }

          const allFriends = [
            ...firstPage.friends,
          ];

          let nextAfterUserId =
            firstPage.nextAfterUserId;

          const visitedCursors =
            new Set<number>();

          while (
            nextAfterUserId !==
              null &&
            nextAfterUserId !==
              undefined
          ) {
            if (
              visitedCursors.has(
                nextAfterUserId,
              )
            ) {
              break;
            }

            visitedCursors.add(
              nextAfterUserId,
            );

            const nextPage =
              await getTimelineProfiles({
                afterUserId:
                  nextAfterUserId,
                limit: 50,
              });

            if (cancelled) {
              return;
            }

            const existingIds =
              new Set(
                allFriends.map(
                  (friend) =>
                    friend.userId,
                ),
              );

            allFriends.push(
              ...nextPage.friends.filter(
                (friend) =>
                  !existingIds.has(
                    friend.userId,
                  ),
              ),
            );

            if (
              nextPage.nextAfterUserId ===
              nextAfterUserId
            ) {
              break;
            }

            nextAfterUserId =
              nextPage.nextAfterUserId;
          }

          if (cancelled) {
            return;
          }

          setProfiles(firstPage);
          setFriends(allFriends);
        } catch (error) {
          console.error(
            "타임라인 프로필 조회 실패:",
            error,
          );
        } finally {
          if (!cancelled) {
            setIsLoading(false);
          }
        }
      };

    void fetchProfiles();

    return () => {
      cancelled = true;
    };
  }, []);

  const handlePointerDown = (
    event: PointerEvent<HTMLElement>,
  ) => {
    const container =
      scrollContainerRef.current;

    if (
      !container ||
      !event.isPrimary
    ) {
      return;
    }

    isPointerDownRef.current =
      true;

    hasMovedRef.current =
      false;

    dragStartXRef.current =
      event.clientX;

    dragStartScrollLeftRef.current =
      container.scrollLeft;
  };

  const handlePointerMove = (
    event: PointerEvent<HTMLElement>,
  ) => {
    const container =
      scrollContainerRef.current;

    if (
      !container ||
      !isPointerDownRef.current
    ) {
      return;
    }

    const movedDistance =
      event.clientX -
      dragStartXRef.current;

    if (
      !hasMovedRef.current
    ) {
      if (
        Math.abs(
          movedDistance,
        ) < DRAG_THRESHOLD
      ) {
        return;
      }

      hasMovedRef.current =
        true;

      container.setPointerCapture(
        event.pointerId,
      );
    }

    container.scrollLeft =
      dragStartScrollLeftRef.current -
      movedDistance;
  };

  const handlePointerEnd = (
    event: PointerEvent<HTMLElement>,
  ) => {
    const container =
      scrollContainerRef.current;

    isPointerDownRef.current =
      false;

    if (
      container?.hasPointerCapture(
        event.pointerId,
      )
    ) {
      container.releasePointerCapture(
        event.pointerId,
      );
    }
  };

  const handleClickCapture = (
    event: MouseEvent<HTMLElement>,
  ) => {
    if (
      !hasMovedRef.current
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    hasMovedRef.current =
      false;
  };

  const handleFriendProfileClick = (
    friend: TimelineProfile,
  ) => {
    const game =
      friend.games[0];

    if (!game) {
      console.log(
        "친구가 오늘 관람한 경기가 없습니다.",
      );

      return;
    }

    navigate(
      `/timeline/${friend.userId}?gameId=${game.gameId}`,
    );
  };

  const handleRecordClick =
    () => {
      navigate(
        "/home/record",
      );
    };

  const handleBackToMyTimeline =
    () => {
      navigate("/timeline");
    };

  if (isLoading) {
    return (
      <div className="h-[100px] w-full animate-pulse bg-surface-secondary" />
    );
  }

  if (!profiles) {
    return null;
  }

  const me = profiles.me;

  return (
    <section
      ref={
        scrollContainerRef
      }
      onPointerDown={
        handlePointerDown
      }
      onPointerMove={
        handlePointerMove
      }
      onPointerUp={
        handlePointerEnd
      }
      onPointerCancel={
        handlePointerEnd
      }
      onClickCapture={
        handleClickCapture
      }
      className="scrollbar-hide w-full cursor-grab touch-pan-x select-none overflow-x-auto px-[16px] py-[12px] active:cursor-grabbing"
    >
      <div className="flex min-w-max items-start gap-[18px]">
        <TimelineProfileItem
          userId={`@${me.username}`}
          profileImage={
            me.profileImageUrl ||
            defaultProfileIcon
          }
          isMe
          hasRecordedToday={
            me.hasRecordedToday
          }
          isViewingFriendTimeline={
            isViewingFriendTimeline
          }
          onRecordClick={
            handleRecordClick
          }
          onBackClick={
            handleBackToMyTimeline
          }
        />

        {friends.map(
          (friend) => (
            <TimelineProfileItem
              key={
                friend.userId
              }
              userId={`@${friend.username}`}
              profileImage={
                friend.profileImageUrl ||
                defaultProfileIcon
              }
              isMe={false}
              hasRecordedToday={
                friend.hasRecordedToday
              }
              isViewingFriendTimeline={
                isViewingFriendTimeline
              }
              onProfileClick={() =>
                handleFriendProfileClick(
                  friend,
                )
              }
            />
          ),
        )}
      </div>
    </section>
  );
}