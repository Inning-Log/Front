import { FriendSearchItem } from "./FriendSearchItem";
import type { FriendSearchListProps } from "../types/FriendSearch";
import searchIcon from "../../../assets/icons/search.svg";
import searchNoIcon from "../../../assets/icons/searchno.svg";

export function FriendSearchList({
  users,
  hasKeyword,
  selectedUserId,
  onSelectUser,
}: FriendSearchListProps) {
  if (users.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-start justify-center pt-[62px]">
        <img
          src={hasKeyword ? searchNoIcon : searchIcon}
          alt=""
          className={hasKeyword ? "h-[55px] w-[65px]" : "h-[48px] w-[47px]"}
        />
      </div>
    );
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
