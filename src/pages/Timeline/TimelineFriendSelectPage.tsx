
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { PageHeader } from "../../app/layouts/PageHeader";

import friendsIcon from "../../assets/icons/friends.svg";
import selectedCheckIcon from "../../assets/icons/selected_check.svg";

import { getFriends } from "../../features/friends/api/friendsApi";
import type { FriendshipResponse } from "../../features/friends/types/friend";

import {
  getGameVideoFriends,
} from "../../features/timeline/api/gameVideoApi";

import { useGameVideoSave } from "../../features/timeline/hooks/useGameVideoSave";

import {
  TimelineFriendSelectItem,
  type TimelineSelectableFriend,
} from "../../features/timeline/components/TimelineFriendSelectItem";

import { Toast } from "../../shared/ui/Toast";

type SelectableFriend = TimelineSelectableFriend & {
  canSaveVideo: boolean;
};

export function TimelineFriendSelectPage() {
  const [params] = useSearchParams();

  const gameId = Number(params.get("gameId"));

  const {
    isSaving,
    message,
    clearMessage,
    save,
  } = useGameVideoSave();

  const [maxFriends, setMaxFriends] = useState(0);

  const [friends, setFriends] = useState<
    SelectableFriend[]
  >([]);

  const [selectedFriendId, setSelectedFriendId] =
    useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [refreshVersion, setRefreshVersion] =
    useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchFriends = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        if (
          !Number.isSafeInteger(gameId) ||
          gameId <= 0
        ) {
          throw new Error("경기 정보가 없습니다.");
        }

        // 실제 친구 목록과 영상 저장 가능 목록 조회
        const [friendships, videoFriends] =
          await Promise.all([
            getFriends(),
            getGameVideoFriends(gameId),
          ]);

        if (cancelled) {
          return;
        }

        // 서버가 허용한 영상 저장 대상 ID
        const eligibleFriendIds = new Set(
          videoFriends.friends.map(
            (friend) => friend.userId,
          ),
        );

        // 수락된 친구만 표시
        const acceptedFriends: FriendshipResponse[] =
          friendships.filter(
            (friendship) =>
              friendship.status === "ACCEPTED",
          );

        const mappedFriends: SelectableFriend[] =
          acceptedFriends.map((friendship) => ({
            id: String(friendship.friend.id),
            username: friendship.friend.username,
            name:
              friendship.friend.nickname ||
              friendship.friend.username,
            canSaveVideo: eligibleFriendIds.has(
              friendship.friend.id,
            ),
          }));

        // 저장 가능한 친구를 먼저 표시
        mappedFriends.sort(
          (a, b) =>
            Number(b.canSaveVideo) -
            Number(a.canSaveVideo),
        );

        setFriends(mappedFriends);
        setMaxFriends(videoFriends.maxFriends);

        setSelectedFriendId(null);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "영상 저장 친구 목록 조회 실패:",
          error,
        );

        setFriends([]);
        setMaxFriends(0);
        setSelectedFriendId(null);

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "친구 목록을 불러오지 못했습니다.",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchFriends();

    return () => {
      cancelled = true;
    };
  }, [gameId, refreshVersion]);

  const handleSelectFriend = (userId: string) => {
    if (isSaving || maxFriends < 1) {
      return;
    }

    const selectedFriend = friends.find(
      (friend) => friend.id === userId,
    );

    if (!selectedFriend?.canSaveVideo) {
      return;
    }

    setSelectedFriendId((current) =>
      current === userId ? null : userId,
    );
  };

  const handleSaveWithFriend = () => {
    if (
      !selectedFriendId ||
      maxFriends < 1 ||
      isSaving
    ) {
      return;
    }

    const selectedFriend = friends.find(
      (friend) => friend.id === selectedFriendId,
    );

    if (!selectedFriend?.canSaveVideo) {
      return;
    }

    void save(gameId, [
      Number(selectedFriendId),
    ]);
  };

  return (
    <div className="flex min-h-dvh w-full flex-col pt-[45px]">
      <PageHeader title="친구 선택" />

      {isLoading ? (
        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="size-[36px] animate-spin rounded-full border-[4px] border-surface-secondary border-t-accent-primary" />

            <p className="mt-[16px] text-label-3 text-black">
              친구 목록을 불러오는 중...
            </p>
          </div>
        </main>
      ) : errorMessage && friends.length === 0 ? (
        <main className="flex flex-1 flex-col items-center justify-center px-[16px]">
          <p className="text-label-3 text-black">
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={() =>
              setRefreshVersion((version) => version + 1)
            }
            className="mt-[16px] rounded-full bg-accent-primary px-[24px] py-[12px] text-white"
          >
            다시 시도
          </button>
        </main>
      ) : friends.length === 0 ? (
        <main className="flex flex-1 items-center justify-center px-[16px]">
          <div className="flex -translate-y-[20px] flex-col items-center">
            <img
              src={friendsIcon}
              alt=""
              aria-hidden="true"
              className="size-[56px] object-contain"
            />

            <p className="mt-[11px] text-center text-label-2 leading-[150%] text-black">
              아직 친구가 없어요
            </p>

            <p className="mt-[7px] text-center text-caption leading-[150%] text-black">
              친구를 추가하고 직관 기록을 공유해보세요
            </p>
          </div>
        </main>
      ) : (
        <>
          <main className="mt-[66px] min-h-0 flex-1 overflow-y-auto px-[29px] pb-[100px]">
            <div className="border-t-[1.5px] border-surface-secondary">
              {friends.map((friend) => {
                const selected =
                  selectedFriendId === friend.id;

                return (
                  <div
                    key={friend.id}
                    className="relative"
                  >
                    <TimelineFriendSelectItem
                      friend={friend}
                      disabled={
                        isSaving ||
                        maxFriends < 1 ||
                        !friend.canSaveVideo
                      }
                      onSelect={handleSelectFriend}
                    />

                    {selected && (
                      <img
                        src={selectedCheckIcon}
                        alt=""
                        aria-hidden="true"
                        className="pointer-events-none absolute right-[4px] top-1/2 size-[30px] -translate-y-1/2"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {errorMessage && (
              <p className="mt-[12px] text-center text-caption text-red-500">
                {errorMessage}
              </p>
            )}
          </main>

          {selectedFriendId && (
            <div className="fixed bottom-[32px] left-1/2 z-10 w-full max-w-[430px] -translate-x-1/2 px-[16px]">
              <button
                type="button"
                onClick={handleSaveWithFriend}
                disabled={isSaving || maxFriends < 1}
                className="text-label-3 flex h-[55px] w-full items-center justify-center rounded-[27.5px] bg-accent-primary text-white active:bg-accent-pressed"
              >
                함께 저장하기
              </button>
            </div>
          )}
        </>
      )}

      {isSaving && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="flex flex-col items-center rounded-[20px] bg-white px-[40px] py-[32px]">
            <div className="size-[36px] animate-spin rounded-full border-[4px] border-surface-secondary border-t-accent-primary" />

            <p className="mt-[16px] text-label-3 text-black">
              영상 저장 중...
            </p>
          </div>
        </div>
      )}

      <Toast
        open={Boolean(message)}
        message={message}
        onClose={clearMessage}
      />
    </div>
  );
}
