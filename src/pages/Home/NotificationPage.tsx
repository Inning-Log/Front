import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  PageHeader,
} from "../../app/layouts/PageHeader";

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

import {
  Toast,
} from "../../shared/ui/Toast";

type NotificationTab =
  | "request"
  | "game";

type ToastState = {
  open: boolean;
  message: string;
};

const GAME_NOTIFICATION_TYPES:
  NotificationType[] = [
    "GAME_INNING_STARTED",
    "GAME_INNING_ENDED",
    "GAME_SCORE_CHANGED",
  ];

const RECORD_NOTIFICATION_TYPES:
  NotificationType[] = [
    "RECORD_REMINDER",
    "GENERATED_VIDEO_READY",
    "GENERATED_VIDEO_FAILED",
  ];

const SOCIAL_NOTIFICATION_TYPES:
  NotificationType[] = [
    "FRIEND_ACCEPTED",
    "TIMELINE_COMMENT",
    "TIMELINE_REACTION",
  ];

function getNotificationCategory(
  notification:
    NotificationResponse,
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

  const parsed =
    Number(value);

  if (
    !Number.isSafeInteger(
      parsed,
    ) ||
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
    const url =
      new URL(
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

function buildNotificationTarget(
  notification:
    NotificationResponse,
) {
  const data =
    notification.data;

  let target =
    normalizeAppLink(
      data.link,
    );

  /*
   * 친구 수락 알림 fallback
   */
  if (
    !target &&
    notification.type ===
      "FRIEND_ACCEPTED"
  ) {
    const actorUserId =
      parsePositiveInteger(
        data.actorUserId,
      );

    target =
      actorUserId
        ? `/timeline/${actorUserId}`
        : "/mypage/friends";
  }

  /*
   * 댓글 알림에서 link가 없는 경우 fallback
   */
  if (
    !target &&
    notification.type ===
      "TIMELINE_COMMENT"
  ) {
    const actorUserId =
      parsePositiveInteger(
        data.actorUserId,
      );

    const gameId =
      parsePositiveInteger(
        data.gameId,
      );

    if (
      actorUserId &&
      gameId
    ) {
      target =
        `/timeline/${actorUserId}?gameId=${gameId}`;
    } else if (
      gameId
    ) {
      target =
        `/timeline?gameId=${gameId}`;
    }
  }

  if (!target) {
    return null;
  }

  /*
   * 일반 알림이면 link 그대로 사용
   */
  if (
    notification.type !==
    "TIMELINE_COMMENT"
  ) {
    return target;
  }

  /*
   * 댓글 알림이면
   * recordId / videoId / commentId도
   * query parameter로 전달
   */
  const targetUrl =
    new URL(
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
      String(
        recordId,
      ),
    );
  }

  if (videoId) {
    targetUrl.searchParams.set(
      "videoId",
      String(
        videoId,
      ),
    );
  }

  if (commentId) {
    targetUrl.searchParams.set(
      "commentId",
      String(
        commentId,
      ),
    );
  }

  return `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
}

export function NotificationPage() {
  const navigate =
    useNavigate();

  const [
    activeTab,
    setActiveTab,
  ] =
    useState<NotificationTab>(
      "request",
    );

  const [
    notifications,
    setNotifications,
  ] =
    useState<
      NotificationResponse[]
    >([]);

  const [
    nextCursor,
    setNextCursor,
  ] =
    useState<
      number | null
    >(null);

  const [
    hasNext,
    setHasNext,
  ] =
    useState(false);

  const [
    isLoadingMore,
    setIsLoadingMore,
  ] =
    useState(false);

  const [
    friendRequests,
    setFriendRequests,
  ] =
    useState<
      FriendshipResponse[]
    >([]);

  const [
    toast,
    setToast,
  ] =
    useState<ToastState>({
      open: false,
      message: "",
    });

  useEffect(() => {
    let cancelled =
      false;

    const fetchNotifications =
      async () => {
        try {
          const data =
            await getNotifications(
              null,
              20,
            );

          if (
            cancelled
          ) {
            return;
          }

          setNotifications(
            data.items,
          );

          setNextCursor(
            data.nextCursor,
          );

          setHasNext(
            data.hasNext,
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
            "알림 목록 조회 실패:",
            error,
          );
        }
      };

    const fetchFriendRequests =
      async () => {
        try {
          const data =
            await getReceivedFriendRequests();

          if (
            cancelled
          ) {
            return;
          }

          setFriendRequests(
            data,
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
            "받은 친구 신청 목록 조회 실패:",
            error,
          );
        }
      };

    void fetchNotifications();
    void fetchFriendRequests();

    return () => {
      cancelled =
        true;
    };
  }, []);

  /*
   * FRIEND_REQUEST는 신청 대기 탭에서
   * 친구 신청 API 결과로 별도 표시
   */
  const generalNotifications =
    notifications.filter(
      (
        notification,
      ) =>
        notification.type !==
        "FRIEND_REQUEST",
    );

  const hasNotifications =
    activeTab ===
    "request"
      ? friendRequests.length >
        0
      : generalNotifications.length >
        0;

  const removeFriendRequest =
    (
      friendshipId:
        number,
    ) => {
      setFriendRequests(
        (
          previousRequests,
        ) =>
          previousRequests.filter(
            (
              request,
            ) =>
              request.id !==
              friendshipId,
          ),
      );
    };

  const handleAcceptRequest =
    async (
      friendship:
        FriendshipResponse,
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
      } catch (
        error
      ) {
        console.error(
          "친구 신청 수락 실패:",
          error,
        );
      }
    };

  const handleRejectRequest =
    async (
      friendship:
        FriendshipResponse,
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
      } catch (
        error
      ) {
        console.error(
          "친구 신청 거절 실패:",
          error,
        );
      }
    };

  /*
   * 알림 추가 조회
   */
  const handleLoadMore =
    async () => {
      if (
        !hasNext ||
        nextCursor ===
          null ||
        isLoadingMore
      ) {
        return;
      }

      try {
        setIsLoadingMore(
          true,
        );

        const data =
          await getNotifications(
            nextCursor,
            20,
          );

        setNotifications(
          (
            previous,
          ) => {
            const existingIds =
              new Set(
                previous.map(
                  (
                    item,
                  ) =>
                    item.id,
                ),
              );

            const newItems =
              data.items.filter(
                (
                  item,
                ) =>
                  !existingIds.has(
                    item.id,
                  ),
              );

            return [
              ...previous,
              ...newItems,
            ];
          },
        );

        setNextCursor(
          data.nextCursor,
        );

        setHasNext(
          data.hasNext,
        );
      } catch (
        error
      ) {
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
        setIsLoadingMore(
          false,
        );
      }
    };

  /*
   * 알림 클릭
   *
   * 읽은 알림도 이동 가능.
   * 안 읽은 알림만 read API 호출.
   */
  const handleNotificationClick =
    async (
      notification:
        NotificationResponse,
    ) => {
      const target =
        buildNotificationTarget(
          notification,
        );

      if (
        !notification.readAt
      ) {
        try {
          await readNotification(
            notification.id,
          );

          setNotifications(
            (
              previousNotifications,
            ) =>
              previousNotifications.map(
                (
                  item,
                ) =>
                  item.id ===
                  notification.id
                    ? {
                        ...item,

                        readAt:
                          new Date().toISOString(),
                      }
                    : item,
              ),
          );
        } catch (
          error
        ) {
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

      navigate(
        target,
      );
    };

  const handleCloseToast =
    () => {
      setToast(
        (
          previousToast,
        ) => ({
          ...previousToast,
          open: false,
        }),
      );
    };

  return (
    <div className="min-h-dvh w-full bg-white pt-[45px]">
      <PageHeader
        title="알림"
        rightText="알림 설정"
        rightTo="/home/notifications/settings"
      />

      <div
        role="tablist"
        aria-label="알림 유형"
        className="grid h-[53px] w-full grid-cols-2"
      >
        <button
          type="button"
          role="tab"
          aria-selected={
            activeTab ===
            "request"
          }
          onClick={() =>
            setActiveTab(
              "request",
            )
          }
          className={[
            "relative flex items-center justify-center",

            "font-pretendard text-[16px] font-medium leading-6 tracking-[0.32px]",

            activeTab ===
            "request"
              ? "text-black"
              : "text-text-tertiary",
          ].join(" ")}
        >
          신청 대기

          {activeTab ===
            "request" && (
            <span className="absolute bottom-0 left-1/2 h-[3px] w-[180px] -translate-x-1/2 rounded-full bg-accent-primary" />
          )}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={
            activeTab ===
            "game"
          }
          onClick={() =>
            setActiveTab(
              "game",
            )
          }
          className={[
            "relative flex items-center justify-center",

            "font-pretendard text-[16px] font-medium leading-6 tracking-[0.32px]",

            activeTab ===
            "game"
              ? "text-black"
              : "text-text-tertiary",
          ].join(" ")}
        >
          알림

          {activeTab ===
            "game" && (
            <span className="absolute bottom-0 left-1/2 h-[3px] w-[180px] -translate-x-1/2 rounded-full bg-accent-primary" />
          )}
        </button>
      </div>

      <main className="flex min-h-[calc(100dvh-151px)] flex-col items-center gap-[8px] bg-[#F5F5F5] pb-[24px] pt-[20px]">
        {hasNotifications ? (
          activeTab ===
          "request" ? (
            friendRequests.map(
              (
                friendship,
              ) => (
                <FriendRequestNotificationItem
                  key={
                    friendship.id
                  }
                  userId={
                    friendship
                      .friend
                      .username
                  }
                  userName={
                    friendship
                      .friend
                      .nickname
                  }
                  profileImage={
                    friendship
                      .friend
                      .profileImageUrl ??
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
            <>
              {generalNotifications.map(
                (
                  notification,
                ) => (
                  <button
                    key={
                      notification.id
                    }
                    type="button"
                    onClick={() =>
                      void handleNotificationClick(
                        notification,
                      )
                    }
                    className="w-full"
                  >
                    <NotificationItem
                      category={getNotificationCategory(
                        notification,
                      )}
                      message={
                        notification.body
                      }
                      isRead={
                        notification.readAt !==
                        null
                      }
                    />
                  </button>
                ),
              )}

              {hasNext && (
                <button
                  type="button"
                  onClick={() =>
                    void handleLoadMore()
                  }
                  disabled={
                    isLoadingMore
                  }
                  className="mt-[8px] rounded-full border border-surface-secondary bg-white px-[22px] py-[10px] text-label-4 text-black disabled:opacity-50"
                >
                  {isLoadingMore
                    ? "불러오는 중..."
                    : "이전 알림 더보기"}
                </button>
              )}

              {!hasNext &&
                generalNotifications.length >
                  0 && (
                  <p className="py-[12px] text-caption text-text-tertiary">
                    모든 알림을 확인했습니다.
                  </p>
                )}
            </>
          )
        ) : (
          <p className="pt-[40px] text-label-4 text-text-tertiary">
            {activeTab ===
            "request"
              ? "대기 중인 신청이 없습니다."
              : "알림이 없습니다."}
          </p>
        )}
      </main>

      <Toast
        open={
          toast.open
        }
        message={
          toast.message
        }
        onClose={
          handleCloseToast
        }
      />
    </div>
  );
}