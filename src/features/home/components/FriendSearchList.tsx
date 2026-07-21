import { FriendSearchItem } from "./FriendSearchItem";
import type { FriendSearchListProps } from "../types/FriendSearch";

export function FriendSearchList({
  users,
  selectedUserId,
  onSelectUser,
}: FriendSearchListProps) {
  if (users.length === 0) {
    return null;
  }

  return (
    <div
      data-scroll-lock-allow
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[14px]"
    >
      {users.map((user) => (
        <FriendSearchItem
          key={user.id}
          user={user}
          selected={selectedUserId === user.id}
          onSelect={onSelectUser}
        />
      ))}
    </div>
  );
}
