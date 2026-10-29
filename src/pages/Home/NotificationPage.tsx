import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "../../app/layouts/PageHeader";

import {
  acceptFriendRequest,
  getReceivedFriendRequests,
  rejectFriendRequest,
} from "../../features/friends/api/friendsApi";

import type {
  FriendshipResponse,
} from "../../features/friends/types/friend";

import {
  getNotifications,
  readNotification,
  readAllNotifications,
} from "../../features/home/api/notificationApi";

import {
  FriendRequestNotificationItem,
} from "../../features/home/components/FriendRequestNotificationItem";

import {
  NotificationItem,
  type NotificationCategory,
} from "../../features/home/components/NotificationItem";

import type {
  NotificationResponse,
  NotificationType,
} from "../../features/home/types/notification";

import { Toast } from "../../shared/ui/Toast";

type NotificationTab = "request" | "game";

type ToastState = {
  open: boolean;
  message: string;
};

const GAME_NOTIFICATION_TYPES: NotificationType[] = [
  "GAME_INNING_STARTED",
  "GAME_INNING_ENDED",
  "GAME_SCORE_CHANGED",
];

const RECORD_NOTIFICATION_TYPES: NotificationType[] = [
  "RECORD_REMINDER",
  "GENERATED_VIDEO_READY",
  "GENERATED_VIDEO_FAILED",
];

const SOCIAL_NOTIFICATION_TYPES: NotificationType[] = [
  "FRIEND_ACCEPTED",
  "TIMELINE_COMMENT",
  "TIMELINE_REACTION",
];

function getNotificationCategory(
  notification: NotificationResponse,
): NotificationCategory {
  if (
    GAME_NOTIFICATION_TYPES.includes(
      notification.type,
    )
  ) {
    return "경기 알림";
  }

  if (
    RECORD_NOTIFICATION_TYPES.includes(
      notification.type,
    )
  ) {
    return "기록 알림";
  }

  if (
    SOCIAL_NOTIFICATION_TYPES.includes(
      notification.type,
    )
  ) {
    return "친구 알림";
  }

  return "친구 알림";
}

function parsePositiveInteger(
  value?: string,
) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);

  if (
    !Number.isSafeInteger(parsed) ||
    parsed <= 0
  ) {
    return null;
  }

  return parsed;
}

function normalizeAppLink(
  link?: string,
) {
  if (!link) {
    return null;
  }

  try {
    const url = new URL(
      link,
      window.location.origin,
    );

    if (
      url.origin !==
      window.location.origin
    ) {
      return null;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

function buildCommentFallbackTarget(
  notification: NotificationResponse,
) {
  const data = notification.data;

  const ownerUserId =
    parsePositiveInteger(
      data.ownerUserId,
    );

  const recipientUserId =
    parsePositiveInteger(
      data.recipientUserId,
    );

  const gameId =
    parsePositiveInteger(
      data.gameId,
    );

  if (
    !ownerUserId ||
    !gameId
  ) {
    return null;
  }

  /*
   * 알림 수신자가 영상 소유자라면
   * 내 타임라인으로 이동
   */
  if (
    recipientUserId &&
    ownerUserId === recipientUserId
  ) {
    return `/timeline/history/${gameId}`;
  }

  /*
   * 영상 소유자와 알림 수신자가 다르면
   * 영상 소유자의 친구 타임라인으로 이동
   */
  return `/timeline/${ownerUserId}?gameId=${gameId}`;
}

function buildNotificationTarget(
  notification: NotificationResponse,
) {
  const data = notification.data;

  let target = normalizeAppLink(
    data.link,
  );

  if (
    !target &&
    notification.type === "FRIEND_ACCEPTED"
  ) {
    const actorUserId =
      parsePositiveInteger(
        data.actorUserId,
      );

    target = actorUserId
      ? `/timeline/${actorUserId}`
      : "/mypage/friends";
  }

  if (
    !target &&
    notification.type === "TIMELINE_COMMENT"
  ) {
    target = buildCommentFallbackTarget(
      notification,
    );
  }

  if (!target) {
    return null;
  }

  if (
    notification.type !== "TIMELINE_COMMENT"
  ) {
    return target;
  }

  const targetUrl = new URL(
    target,
    window.location.origin,
  );

  const recordId =
    parsePositiveInteger(
      data.recordId,
    );

  const videoId =
    parsePositiveInteger(
      data.videoId,
    );

  const commentId =
    parsePositiveInteger(
      data.commentId,
    );

  if (recordId) {
    targetUrl.searchParams.set(
      "recordId",
      String(recordId),
    );
  }

  if (videoId) {
    targetUrl.searchParams.set(
      "videoId",
      String(videoId),
    );
  }

  if (commentId) {
    targetUrl.searchParams.set(
      "commentId",
      String(commentId),
    );
  }

  return `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
}

export function NotificationPage() {
  const navigate = useNavigate();

  const [
    activeTab,
    setActiveTab,
  ] = useState<NotificationTab>("request");

  const [
    notifications,
    setNotifications,
  ] = useState<NotificationResponse[]>([]);

  const [
    nextCursor,
    setNextCursor,
  ] = useState<number | null>(null);

  const [
    hasNext,
    setHasNext,
  ] = useState(false);

  const [
    isLoadingNotifications,
    setIsLoadingNotifications,
  ] = useState(true);

  const [
    isLoadingMore,
    setIsLoadingMore,
  ] = useState(false);

  // 모든 알림 읽음 처리 진행 상태
  const [
    isMarkingAllRead,
    setIsMarkingAllRead,
  ] = useState(false);

  // 중복 요청 방지
  const isMarkingAllReadRef = useRef(false);

  const [
    friendRequests,
    setFriendRequests,
  ] = useState<FriendshipResponse[]>([]);

  const [
    toast,
    setToast,
  ] = useState<ToastState>({
    open: false,
    message: "",
  });

  useEffect(() => {
    let cancelled = false;

    const fetchNotifications = async () => {
      try {
        const data = await getNotifications(
          null,
          20,
        );

        if (cancelled) {
          return;
        }

        setNotifications(data.items);
        setNextCursor(data.nextCursor);
        setHasNext(data.hasNext);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "알림 목록 조회 실패:",
          error,
        );
      } finally {
        if (!cancelled) {
          setIsLoadingNotifications(false);
        }
      }
    };

    const fetchFriendRequests = async () => {
      try {
        const data =
          await getReceivedFriendRequests();

        if (cancelled) {
          return;
        }

        setFriendRequests(data);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "받은 친구 신청 목록 조회 실패:",
          error,
        );
      }
    };

    void fetchNotifications();
    void fetchFriendRequests();

    return () => {
      cancelled = true;
    };
  }, []);

  const generalNotifications =
    notifications.filter(
      (notification) =>
        notification.type !== "FRIEND_REQUEST",
    );

  const hasNotifications =
    activeTab === "request"
      ? friendRequests.length > 0
      : generalNotifications.length > 0 ||
        hasNext;

  const removeFriendRequest = (
    friendshipId: number,
  ) => {
    setFriendRequests(
      (previousRequests) =>
        previousRequests.filter(
          (request) =>
            request.id !== friendshipId,
        ),
    );
  };

  const handleAcceptRequest = async (
    friendship: FriendshipResponse,
  ) => {
    try {
      await acceptFriendRequest(
        friendship.id,
      );

      removeFriendRequest(
        friendship.id,
      );

      setToast({
        open: true,
        message:
          "친구 신청을 수락했습니다!",
      });
    } catch (error) {
      console.error(
        "친구 신청 수락 실패:",
        error,
      );
    }
  };

  const handleRejectRequest = async (
    friendship: FriendshipResponse,
  ) => {
    try {
      await rejectFriendRequest(
        friendship.id,
      );

      removeFriendRequest(
        friendship.id,
      );

      setToast({
        open: true,
        message:
          "친구 신청을 거절했습니다.",
      });
    } catch (error) {
      console.error(
        "친구 신청 거절 실패:",
        error,
      );
    }
  };

  const handleLoadMore = async () => {
    if (
      !hasNext ||
      nextCursor === null ||
      isLoadingMore ||
      isMarkingAllReadRef.current
    ) {
      return;
    }

    try {
      setIsLoadingMore(true);

      const data = await getNotifications(
        nextCursor,
        20,
      );

      setNotifications((previous) => {
        const existingIds = new Set(
          previous.map(
            (item) => item.id,
          ),
        );

        const newItems = data.items.filter(
          (item) =>
            !existingIds.has(item.id),
        );

        return [
          ...previous,
          ...newItems,
        ];
      });

      setNextCursor(data.nextCursor);
      setHasNext(data.hasNext);
    } catch (error) {
      console.error(
        "알림 추가 조회 실패:",
        error,
      );

      setToast({
        open: true,
        message:
          "이전 알림을 불러오지 못했습니다.",
      });
    } finally {
      setIsLoadingMore(false);
    }
  };

  /*
   * 모든 알림 읽음 처리
   *
   * PATCH /api/notifications/read-all
   *
   * 서버 요청이 성공한 경우에만
   * 현재 알림 목록의 읽음 상태를 변경한다.
   */
  const handleReadAllNotifications = async () => {
    if (
      isMarkingAllReadRef.current ||
      isLoadingNotifications ||
      isLoadingMore
    ) {
      return;
    }

    isMarkingAllReadRef.current = true;
    setIsMarkingAllRead(true);

    try {
      await readAllNotifications();

      const readAt = new Date().toISOString();

      setNotifications(
        (previousNotifications) =>
          previousNotifications.map(
            (notification) => ({
              ...notification,
              readAt:
                notification.readAt ?? readAt,
            }),
          ),
      );

      setToast({
        open: true,
        message:
          "모든 알림을 읽음 처리했습니다.",
      });
    } catch (error) {
      console.error(
        "모든 알림 읽음 처리 실패:",
        error,
      );

      setToast({
        open: true,
        message:
          error instanceof Error
            ? error.message
            : "모든 알림 읽음 처리에 실패했습니다.",
      });
    } finally {
      isMarkingAllReadRef.current = false;
      setIsMarkingAllRead(false);
    }
  };

  const handleNotificationClick = async (
    notification: NotificationResponse,
  ) => {
    if (isMarkingAllReadRef.current) {
      return;
    }

    const target = buildNotificationTarget(
      notification,
    );

    if (!notification.readAt) {
      try {
        await readNotification(
          notification.id,
        );

        setNotifications(
          (previousNotifications) =>
            previousNotifications.map(
              (item) =>
                item.id === notification.id
                  ? {
                      ...item,
                      readAt:
                        new Date().toISOString(),
                    }
                  : item,
            ),
        );
      } catch (error) {
        console.error(
          "알림 읽음 처리 실패:",
          error,
        );
      }
    }

    if (!target) {
      setToast({
        open: true,
        message:
          "이동할 수 없는 알림입니다.",
      });

      return;
    }

    navigate(target);
  };

  const handleCloseToast = () => {
    setToast(
      (previousToast) => ({
        ...previousToast,
        open: false,
      }),
    );
  };

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-white pt-[45px]">
      {/* 페이지 헤더 */}
      <div className="shrink-0">
        <PageHeader
          title="알림"
          rightText="알림 설정"
          rightTo="/home/notifications/settings"
        />
      </div>

      {/* 알림 탭 */}
      <div
        role="tablist"
        aria-label="알림 유형"
        className="grid h-[53px] w-full shrink-0 grid-cols-2"
      >
        <button
          type="button"
          role="tab"
          aria-selected={
            activeTab === "request"
          }
          onClick={() =>
            setActiveTab("request")
          }
          className={[
            "relative flex items-center justify-center",
            "font-pretendard text-[16px] font-medium leading-6 tracking-[0.32px]",
            activeTab === "request"
              ? "text-black"
              : "text-text-tertiary",
          ].join(" ")}
        >
          신청 대기

          {activeTab === "request" && (
            <span className="absolute bottom-0 left-1/2 h-[3px] w-[180px] -translate-x-1/2 rounded-full bg-accent-primary" />
          )}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={
            activeTab === "game"
          }
          onClick={() =>
            setActiveTab("game")
          }
          className={[
            "relative flex items-center justify-center",
            "font-pretendard text-[16px] font-medium leading-6 tracking-[0.32px]",
            activeTab === "game"
              ? "text-black"
              : "text-text-tertiary",
          ].join(" ")}
        >
          알림

          {activeTab === "game" && (
            <span className="absolute bottom-0 left-1/2 h-[3px] w-[180px] -translate-x-1/2 rounded-full bg-accent-primary" />
          )}
        </button>
      </div>

      {/* 알림 목록 영역 */}
      <main
        className="flex min-h-0 flex-1 flex-col items-center gap-[8px] overflow-y-auto overscroll-y-contain bg-[#F5F5F5] pb-[24px] pt-[20px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* 알림 탭에서만 모두 읽음 버튼 표시 */}
        {activeTab === "game" && (
          <div className="flex w-full shrink-0 justify-end px-4 pb-[4px]">
            <button
              type="button"
              onClick={() =>
                void handleReadAllNotifications()
              }
              disabled={
                isMarkingAllRead ||
                isLoadingNotifications ||
                isLoadingMore ||
                !hasNotifications
              }
              aria-busy={isMarkingAllRead}
              className="flex min-h-[36px] items-center justify-center rounded-[8px] px-[12px] text-label-4 text-text-tertiary transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isMarkingAllRead
                ? "처리 중..."
                : "모두 읽음"}
            </button>
          </div>
        )}

        {hasNotifications ? (
          activeTab === "request" ? (
            /* 친구 신청 목록 */
            friendRequests.map(
              (friendship) => (
                <FriendRequestNotificationItem
                  key={friendship.id}
                  userId={
                    friendship.friend.username
                  }
                  userName={
                    friendship.friend.nickname
                  }
                  profileImage={
                    friendship.friend.profileImageUrl ??
                    undefined
                  }
                  onAccept={() =>
                    void handleAcceptRequest(
                      friendship,
                    )
                  }
                  onDelete={() =>
                    void handleRejectRequest(
                      friendship,
                    )
                  }
                />
              ),
            )
          ) : (
            /* 일반 알림 목록 */
            <>
              {generalNotifications.map(
                (notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() =>
                      void handleNotificationClick(
                        notification,
                      )
                    }
                    disabled={isMarkingAllRead}
                    className="w-full shrink-0 disabled:cursor-not-allowed"
                  >
                    <NotificationItem
                      category={getNotificationCategory(
                        notification,
                      )}
                      message={notification.body}
                      isRead={
                        notification.readAt !==
                        null
                      }
                    />
                  </button>
                ),
              )}

              {/* 이전 알림 더보기 */}
              {hasNext && (
                <button
                  type="button"
                  onClick={() =>
                    void handleLoadMore()
                  }
                  disabled={
                    isLoadingMore ||
                    isMarkingAllRead
                  }
                  className="mt-[8px] shrink-0 rounded-full border border-surface-secondary bg-white px-[22px] py-[10px] text-label-4 text-black disabled:opacity-50"
                >
                  {isLoadingMore
                    ? "불러오는 중..."
                    : "이전 알림 더보기"}
                </button>
              )}

              {!hasNext &&
                generalNotifications.length >
                  0 && (
                  <p className="shrink-0 py-[12px] text-caption text-text-tertiary">
                    모든 알림을 확인했습니다.
                  </p>
                )}
            </>
          )
        ) : (
          <p className="pt-[40px] text-label-4 text-text-tertiary">
            {activeTab === "request"
              ? "대기 중인 신청이 없습니다."
              : "알림이 없습니다."}
          </p>
        )}
      </main>

      {/* 토스트 메시지 */}
      <Toast
        open={toast.open}
        message={toast.message}
        onClose={handleCloseToast}
      />
    </div>
  );
}