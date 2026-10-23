import { useEffect, useState } from "react";

import {
  deleteFriendship,
  getFriends,
} from "../api/friendsApi";
import type { FriendshipResponse } from "../types/friend";
import { FriendListEmptyState } from "./FriendListEmptyState";
import {
  FriendListItem,
  type FriendListItemData,
} from "./FriendListItem";
import { FriendListStatus } from "./FriendListStatus";

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
  const [deleteErrorMessage, setDeleteErrorMessage] = useState("");
  const [deletingFriendshipId, setDeletingFriendshipId] =
    useState<number | null>(null);
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

  const handleDeleteFriend = async (friendshipId: number) => {
    if (deletingFriendshipId !== null) {
      return;
    }

    setDeletingFriendshipId(friendshipId);
    setDeleteErrorMessage("");

    try {
      await deleteFriendship(friendshipId);
      setFriends((currentFriends) =>
        currentFriends.filter(
          (friendship) => friendship.id !== friendshipId,
        ),
      );
    } catch (error) {
      setDeleteErrorMessage(
        error instanceof Error
          ? error.message
          : "친구를 삭제하지 못했습니다.",
      );
    } finally {
      setDeletingFriendshipId(null);
    }
  };

  if (isLoading) {
    return (
      <FriendListStatus message="친구 목록을 불러오는 중입니다." />
    );
  }

  if (errorMessage) {
    return (
      <FriendListStatus
        message={errorMessage}
        tone="danger"
      />
    );
  }

  if (friendItems.length === 0) {
    return <FriendListEmptyState onFindFriends={onFindFriends} />;
  }

  return (
    <main className="mt-[66px] min-h-0 flex-1 overflow-y-auto px-[29px]">
      {deleteErrorMessage && (
        <p
          role="alert"
          className="mb-[8px] px-[10px] text-caption text-danger"
        >
          {deleteErrorMessage}
        </p>
      )}

      <div className="border-t-[1.5px] border-surface-secondary">
        {friendItems.map((friend) => (
          <FriendListItem
            key={friend.friendshipId}
            friend={friend}
            isDeleting={
              deletingFriendshipId === friend.friendshipId
            }
            onDelete={() => {
              void handleDeleteFriend(friend.friendshipId);
            }}
            onSelect={onSelectFriend}
          />
        ))}
      </div>
    </main>
  );
}
