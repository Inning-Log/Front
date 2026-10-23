import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "../../app/layouts/PageHeader";

import addFriendIcon from "../../assets/icons/addfriend.svg";
import notificationIcon from "../../assets/icons/notification.svg";

import { FriendList } from "../../features/friends/components/FriendList";

import { getTimelineProfiles } from "../../features/timeline/api/timelineApi";

import type { TimelineProfile } from "../../features/timeline/types/timeline";

import { Toast } from "../../shared/ui/Toast";

export function FriendsPage() {
  const navigate = useNavigate();

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [toast, setToast] =
    useState({
      open: false,
      message: "",
    });

  const showToast = (
    message: string,
  ) => {
    setToast({
      open: true,
      message,
    });
  };

  /**
   * FriendList는 현재 username을 전달함.
   *
   * Timeline API는 숫자 userId가 필요하므로
   * profiles API에서 실제 userId + gameId 확인.
   */
  const handleSelectFriend =
    async (
      username: string,
    ) => {
      if (isLoading) {
        return;
      }

      try {
        setIsLoading(true);

        let afterUserId = 0;

        let selectedFriend:
          | TimelineProfile
          | undefined;

        const visitedCursors =
          new Set<number>();

        while (true) {
          const response =
            await getTimelineProfiles({
              afterUserId,
              limit: 50,
            });

          selectedFriend =
            response.friends.find(
              (friend) =>
                friend.username ===
                username,
            );

          if (selectedFriend) {
            break;
          }

          const nextAfterUserId =
            response.nextAfterUserId;

          if (
            nextAfterUserId ===
              null ||
            nextAfterUserId ===
              undefined
          ) {
            break;
          }

          if (
            nextAfterUserId ===
              afterUserId ||
            visitedCursors.has(
              nextAfterUserId,
            )
          ) {
            break;
          }

          visitedCursors.add(
            nextAfterUserId,
          );

          afterUserId =
            nextAfterUserId;
        }

        if (!selectedFriend) {
          showToast(
            "친구 정보를 찾을 수 없습니다.",
          );

          return;
        }

        const game =
          selectedFriend.games[0];

        /*
         * 친구에게 오늘 경기 기록이 없더라도
         * TimelinePage가 userId만으로 한번 더
         * profiles를 조회할 수 있도록 이동 가능.
         */
        if (!game) {
          navigate(
            `/timeline/${selectedFriend.userId}`,
          );

          return;
        }

        navigate(
          `/timeline/${selectedFriend.userId}?gameId=${game.gameId}`,
        );
      } catch (error) {
        console.error(
          "친구 타임라인 이동 실패:",
          error,
        );

        showToast(
          "친구 타임라인을 불러오지 못했습니다.",
        );
      } finally {
        setIsLoading(false);
      }
    };

  const handleFindFriends =
    () => {
      navigate(
        "/home/friends/add",
      );
    };

  return (
    <div className="flex min-h-dvh w-full flex-col bg-bg-primary">
      <div className="pt-[45px]">
        <PageHeader
          title="친구"
          rightContent={
            <div className="flex items-center gap-[16px]">
              <button
                type="button"
                onClick={
                  handleFindFriends
                }
                aria-label="친구 추가"
                className="flex size-[28px] items-center justify-center"
              >
                <img
                  src={
                    addFriendIcon
                  }
                  alt=""
                  aria-hidden="true"
                  className="size-[24px] object-contain"
                />
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/home/notifications",
                  )
                }
                aria-label="알림 확인"
                className="flex size-[20px] items-center justify-center"
              >
                <img
                  src={
                    notificationIcon
                  }
                  alt=""
                  aria-hidden="true"
                  className="size-[24px] object-contain"
                />
              </button>
            </div>
          }
        />
      </div>

      <FriendList
        onFindFriends={
          handleFindFriends
        }
        onSelectFriend={
          handleSelectFriend
        }
      />

      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="flex flex-col items-center rounded-[20px] bg-white px-[40px] py-[32px]">
            <div className="size-[36px] animate-spin rounded-full border-[4px] border-surface-secondary border-t-accent-primary" />

            <p className="mt-[16px] text-label-3 text-black">
              친구 타임라인을
              불러오는 중...
            </p>
          </div>
        </div>
      )}

      <Toast
        open={toast.open}
        message={
          toast.message
        }
        onClose={() =>
          setToast(
            (previous) => ({
              ...previous,
              open: false,
            }),
          )
        }
      />
    </div>
  );
}