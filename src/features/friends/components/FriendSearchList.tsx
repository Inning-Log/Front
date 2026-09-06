import searchIcon from "../../../assets/icons/search.svg";
import searchNoIcon from "../../../assets/icons/searchno.svg";
import type { FriendSearchListProps } from "../types/friendSearch";
import { FriendSearchItem } from "./FriendSearchItem";

export function FriendSearchList({
  errorMessage,
  users,
  hasKeyword,
  isLoading,
  selectedUserId,
  onSelectUser,
}: FriendSearchListProps) {
  if (isLoading) {
    return (
      <div className="flex min-h-0 flex-1 items-start justify-center pt-[62px]">
        <p className="text-caption text-text-secondary">
          사용자를 검색하는 중입니다.
        </p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex min-h-0 flex-1 items-start justify-center px-[20px] pt-[62px]">
        <p className="text-center text-caption text-danger">
          {errorMessage}
        </p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-start justify-center pt-[62px]">
        <img
          src={hasKeyword ? searchNoIcon : searchIcon}
          alt=""
          className={
            hasKeyword
              ? "h-[55px] w-[65px]"
              : "h-[48px] w-[47px]"
          }
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
