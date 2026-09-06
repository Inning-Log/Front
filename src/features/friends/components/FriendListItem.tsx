import defaultProfileIcon from "../../../assets/icons/defaultprofile.svg";

export type FriendListItemData = {
  friendshipId: number;
  username: string;
  nickname: string;
  profileImageUrl: string | null;
};

type FriendListItemProps = {
  friend: FriendListItemData;
  onSelect: (userId: string) => void;
};

export function FriendListItem({
  friend,
  onSelect,
}: FriendListItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(friend.username)}
      className="flex h-[66px] w-full items-center border-b border-surface-secondary text-left"
    >
      <div className="flex h-full w-full items-center px-[10px]">
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
      </div>
    </button>
  );
}
