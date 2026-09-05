import { useEffect, useRef, useState } from "react";

import { searchUsers } from "../api/friendsApi";
import type { FriendSearchResult } from "../types/friendSearch";
import {
  canSendFriendRequest,
  FRIEND_SEARCH_DELAY_MS,
  getFriendSearchValidationMessage,
  mapUserSearchResult,
} from "../utils/friendSearch";

export function useFriendSearch() {
  const searchRequestIdRef = useRef(0);
  const [keyword, setKeyword] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [searchedUsers, setSearchedUsers] = useState<
    FriendSearchResult[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchErrorMessage, setSearchErrorMessage] = useState("");
  const normalizedKeyword = keyword.trim();

  useEffect(() => {
    const requestId = searchRequestIdRef.current + 1;
    searchRequestIdRef.current = requestId;

    const timer = window.setTimeout(() => {
      const fetchUsers = async () => {
        const validationMessage =
          getFriendSearchValidationMessage(normalizedKeyword);

        if (!normalizedKeyword) {
          setSearchedUsers([]);
          setSelectedUserId("");
          setSearchErrorMessage("");
          setIsSearching(false);
          return;
        }

        if (validationMessage) {
          setSearchedUsers([]);
          setSelectedUserId("");
          setSearchErrorMessage(validationMessage);
          setIsSearching(false);
          return;
        }

        try {
          setIsSearching(true);
          setSearchErrorMessage("");

          const results = await searchUsers(normalizedKeyword);

          if (requestId !== searchRequestIdRef.current) {
            return;
          }

          const nextUsers = results.map(mapUserSearchResult);

          setSearchedUsers(nextUsers);
          setSelectedUserId((currentUserId) =>
            nextUsers.some((user) => user.id === currentUserId)
              ? currentUserId
              : "",
          );
        } catch (error) {
          if (requestId !== searchRequestIdRef.current) {
            return;
          }

          const message =
            error instanceof Error
              ? error.message
              : "사용자 검색에 실패했습니다.";

          setSearchedUsers([]);
          setSelectedUserId("");
          setSearchErrorMessage(message);
        } finally {
          if (requestId === searchRequestIdRef.current) {
            setIsSearching(false);
          }
        }
      };

      void fetchUsers();
    }, FRIEND_SEARCH_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [normalizedKeyword]);

  const handleKeywordChange = (nextKeyword: string) => {
    setKeyword(nextKeyword);
    setSelectedUserId("");
  };

  const markFriendRequestSent = (
    userId: string,
    friendshipId: number,
  ) => {
    setSearchedUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === userId
          ? {
              ...user,
              friendshipId,
              relationshipStatus: "REQUEST_SENT",
            }
          : user,
      ),
    );
    setSelectedUserId((currentUserId) =>
      currentUserId === userId ? "" : currentUserId,
    );
  };

  const selectedUser = searchedUsers.find(
    (user) => user.id === selectedUserId,
  );
  const isFriendRequestEnabled = canSendFriendRequest(selectedUser);

  return {
    keyword,
    setKeyword: handleKeywordChange,
    selectedUserId,
    setSelectedUserId,
    searchedUsers,
    selectedUser,
    isSearching,
    searchErrorMessage,
    isFriendRequestEnabled,
    markFriendRequestSent,
  };
}
