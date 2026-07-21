import { useMemo, useState } from "react";

import { mockFriendSearchUsers } from "../mock/friendSearch.mock";

export function useFriendSearch() {
  const [keyword, setKeyword] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const normalizedKeyword = keyword.trim().toLowerCase();

  const searchedUsers = useMemo(() => (
    normalizedKeyword.length > 0
      ? mockFriendSearchUsers.filter((user) => (
          user.id.startsWith(normalizedKeyword)
        ))
      : []
  ), [normalizedKeyword]);

  const selectedUser = searchedUsers.find((user) => user.id === selectedUserId);
  const isFriendRequestEnabled = Boolean(selectedUser);

  return {
    keyword,
    setKeyword,
    selectedUserId,
    setSelectedUserId,
    searchedUsers,
    selectedUser,
    isFriendRequestEnabled,
  };
}
