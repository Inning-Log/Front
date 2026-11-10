
import defaultProfileIcon from "../../../assets/icons/defaultprofile.svg";

export type TimelineSelectableFriend = {
  id: string;
  username: string;
  name: string;
  profileImageUrl: string | null;
};

type TimelineFriendSelectItemProps = {
  disabled?: boolean;
  friend: TimelineSelectableFriend;
  onSelect: (userId: string) => void;
};

export function TimelineFriendSelectItem({
  disabled = false,
  friend,
  onSelect,
}: TimelineFriendSelectItemProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(friend.id)}
      className="flex h-[66px] w-full items-center border-b border-surface-secondary text-left disabled:cursor-not-allowed"
    >
      <div className="flex h-full w-full items-center px-[10px]">
        <div className="h-[44px] w-[44px] shrink-0 overflow-hidden rounded-full">
          <img
            key={friend.profileImageUrl ?? "default"}
            src={friend.profileImageUrl || defaultProfileIcon}
            alt={`${friend.name} 프로필`}
            onError={(event) => {
              event.currentTarget.onerror = null;
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
            {friend.name}
          </p>
        </div>
      </div>
    </button>
  );
}
