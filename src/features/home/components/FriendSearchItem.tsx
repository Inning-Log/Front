import type { FriendRelationshipStatus } from "../../friends/types/friend";
import type { FriendSearchItemProps } from "../types/FriendSearch";

const RELATIONSHIP_STATUS_LABELS: Record<
  FriendRelationshipStatus,
  string
> = {
  FRIEND: "이미 친구",
  NONE: "신청 가능",
  REQUEST_RECEIVED: "받은 신청",
  REQUEST_SENT: "신청 완료",
};

function getRelationshipStatusClass(
  status: FriendRelationshipStatus,
) {
  if (status === "NONE") {
    return "text-accent-primary";
  }

  return "text-text-tertiary";
}

export function FriendSearchItem({
  user,
  selected,
  onSelect,
}: FriendSearchItemProps) {
  const relationshipStatus = user.relationshipStatus;
  const isSelectable =
    !relationshipStatus || relationshipStatus === "NONE";

  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={!isSelectable}
      onClick={() => onSelect(user.id)}
      className="flex h-[66px] w-full items-center border-b border-surface-secondary text-left disabled:cursor-not-allowed"
    >
      <div
        className={[
          "flex w-full items-center px-[10px]",
          isSelectable ? "" : "opacity-70",
          selected
            ? "h-[54px] rounded-[27.5px] bg-surface-secondary"
            : "h-full",
        ].join(" ")}
      >
        <span
          aria-hidden="true"
          className="h-[44px] w-[44px] shrink-0 rounded-full bg-text-tertiary"
        />

        <div className="ml-[9px] flex min-w-0 flex-1 flex-col justify-center">
          <p className="truncate text-label-3 text-black">
            {user.id}
          </p>
          <p className="mt-[4.5px] truncate text-caption text-text-secondary">
            {user.name}
          </p>
        </div>

        {relationshipStatus && (
          <span
            className={[
              "ml-[8px] shrink-0 text-caption",
              getRelationshipStatusClass(relationshipStatus),
            ].join(" ")}
          >
            {RELATIONSHIP_STATUS_LABELS[relationshipStatus]}
          </span>
        )}
      </div>
    </button>
  );
}
