import { useEffect, useState } from "react";

import addFriendWhiteIcon from "../../../assets/icons/addfriendwhite.svg";
import friendsIcon from "../../../assets/icons/friends.svg";
import { getFriends } from "../api/friendsApi";
import type { FriendshipResponse } from "../types/friend";
import {
  FriendListItem,
  type FriendListItemData,
} from "./FriendListItem";

type FriendListProps = {
  onFindFriends: () => void;
  onSelectFriend: (userId: string) => void;
};

function mapFriendshipToListItem(
  friendship: FriendshipResponse,
): FriendListItemData {
  return {
    friendshipId: friendship.id,
    username: friendship.friend.username,
    nickname: friendship.friend.nickname,
    profileImageUrl: friendship.friend.profileImageUrl,
  };
}

export function FriendList({
  onFindFriends,
  onSelectFriend,
}: FriendListProps) {
  const [friends, setFriends] = useState<FriendshipResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const friendItems = friends.map(mapFriendshipToListItem);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const friendList = await getFriends();

        setFriends(friendList);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "친구 목록을 불러오지 못했습니다.";

        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchFriends();
  }, []);

  if (isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center px-[16px]">
        <p className="text-label-3 text-text-secondary">
          친구 목록을 불러오는 중입니다.
        </p>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="flex flex-1 items-center justify-center px-[16px]">
        <p className="text-center text-caption text-danger">
          {errorMessage}
        </p>
      </main>
    );
  }

  if (friendItems.length === 0) {
    return (
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

          <button
            type="button"
            onClick={onFindFriends}
            className="mt-[20px] flex h-[47px] w-[178px] items-center justify-center gap-[9px] rounded-full bg-accent-primary text-label-2 leading-[150%] text-white"
          >
            <img
              src={addFriendWhiteIcon}
              alt=""
              aria-hidden="true"
              className="size-[28px] object-contain"
            />

            <span>친구 찾기</span>
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mt-[66px] min-h-0 flex-1 overflow-y-auto px-[29px]">
      <div className="border-t-[1.5px] border-surface-secondary">
        {friendItems.map((friend) => (
          <FriendListItem
            key={friend.friendshipId}
            friend={friend}
            onSelect={onSelectFriend}
          />
        ))}
      </div>
    </main>
  );
}
