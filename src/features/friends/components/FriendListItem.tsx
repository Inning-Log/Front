import defaultProfileIcon from "../../../assets/icons/defaultprofile.svg";
import deleteIcon from "../../../assets/icons/delete.svg";

export type FriendListItemData = {
  friendshipId: number;
  username: string;
  nickname: string;
  profileImageUrl: string | null;
};

type FriendListItemProps = {
  friend: FriendListItemData;
  isDeleting?: boolean;
  onDelete: () => void;
  onSelect: (userId: string) => void;
};

export function FriendListItem({
  friend,
  isDeleting = false,
  onDelete,
  onSelect,
}: FriendListItemProps) {
  return (
    <div className="flex h-[66px] w-full items-center border-b border-surface-secondary">
      <button
        type="button"
        onClick={() => onSelect(friend.username)}
        disabled={isDeleting}
        className="flex h-full min-w-0 flex-1 items-center px-[10px] text-left disabled:opacity-50"
      >
        <div className="h-[44px] w-[44px] shrink-0 overflow-hidden rounded-full bg-text-tertiary">
          <img
            src={friend.profileImageUrl ?? defaultProfileIcon}
            alt={`${friend.nickname} 프로필`}
            onError={(event) => {
              event.currentTarget.src = defaultProfileIcon;
            }}
            className="h-full w-full object-cover object-center"
          />
        </div>

        <div className="ml-[9px] flex min-w-0 flex-col justify-center">
          <p className="truncate text-label-3 text-black">
            {friend.username}
          </p>
          <p className="mt-[4.5px] truncate text-caption text-text-secondary">
            {friend.nickname}
          </p>
        </div>
      </button>

      <button
        type="button"
        onClick={onDelete}
        disabled={isDeleting}
        aria-label={`${friend.username} 친구 삭제`}
        className="mr-[10px] flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full disabled:opacity-50"
      >
        <img
          src={deleteIcon}
          alt=""
          className="h-full w-full"
        />
      </button>
    </div>
  );
}
