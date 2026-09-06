export type TimelineSelectableFriend = {
  id: string;
  name: string;
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
        <span
          aria-hidden="true"
          className="h-[44px] w-[44px] shrink-0 rounded-full bg-text-tertiary"
        />

        <div className="ml-[9px] flex min-w-0 flex-col justify-center">
          <p className="truncate text-label-3 text-black">
            {friend.id}
          </p>
          <p className="mt-[4.5px] truncate text-caption text-text-secondary">
            {friend.name}
          </p>
        </div>
      </div>
    </button>
  );
}
