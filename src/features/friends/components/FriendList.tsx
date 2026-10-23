import { useEffect, useState } from "react";

import {
  deleteFriendship,
  getFriends,
} from "../api/friendsApi";
import type { FriendshipResponse } from "../types/friend";
import { ConfirmModal } from "../../../shared/ui/ConfirmModal";
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
  const [pendingDeleteFriendshipId, setPendingDeleteFriendshipId] =
    useState<number | null>(null);
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

  const handleDeleteFriend = async () => {
    if (
      deletingFriendshipId !== null ||
      pendingDeleteFriendshipId === null
    ) {
      return;
    }

    const friendshipId = pendingDeleteFriendshipId;

    setDeletingFriendshipId(friendshipId);
    setDeleteErrorMessage("");

    try {
      await deleteFriendship(friendshipId);
      setFriends((currentFriends) =>
        currentFriends.filter(
          (friendship) => friendship.id !== friendshipId,
        ),
      );
      setPendingDeleteFriendshipId(null);
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
    <>
      <main className="mt-[66px] min-h-0 flex-1 overflow-y-auto px-[29px]">
        <div className="border-t-[1.5px] border-surface-secondary">
          {friendItems.map((friend) => (
            <FriendListItem
              key={friend.friendshipId}
              friend={friend}
              isDeleting={
                deletingFriendshipId === friend.friendshipId
              }
              onDelete={() => {
                setDeleteErrorMessage("");
                setPendingDeleteFriendshipId(friend.friendshipId);
              }}
              onSelect={onSelectFriend}
            />
          ))}
        </div>
      </main>

      <ConfirmModal
        open={pendingDeleteFriendshipId !== null}
        title="친구를 삭제하시겠습니까?"
        isPending={deletingFriendshipId !== null}
        errorMessage={deleteErrorMessage}
        pendingText="삭제 중..."
        onCancel={() => {
          if (deletingFriendshipId !== null) return;

          setDeleteErrorMessage("");
          setPendingDeleteFriendshipId(null);
        }}
        onConfirm={() => {
          void handleDeleteFriend();
        }}
      />
    </>
  );
}
