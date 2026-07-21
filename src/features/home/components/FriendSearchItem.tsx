import type { FriendSearchItemProps } from "../types/FriendSearch";

export function FriendSearchItem({
  user,
  selected,
  onSelect,
}: FriendSearchItemProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(user.id)}
      className="flex h-[66px] w-full items-center border-b border-surface-secondary text-left"
    >
      <div
        className={[
          "flex w-full items-center px-[10px]",
          selected
            ? "h-[54px] rounded-[27.5px] bg-surface-secondary"
            : "h-full",
        ].join(" ")}
      >
        <span
          aria-hidden="true"
          className="h-[44px] w-[44px] shrink-0 rounded-full bg-text-tertiary"
        />

        <div className="ml-[9px] flex min-w-0 flex-col justify-center">
          <p className="truncate text-label-3 text-black">{user.id}</p>
          <p className="mt-[4.5px] truncate text-caption text-text-secondary">
            {user.name}
          </p>
        </div>
      </div>
    </button>
  );
}
