import { useEffect, useRef, useState } from "react";

import { searchUsers } from "../../friends/api/friendsApi";
import type { UserSearchResponse } from "../../friends/types/friend";
import type { FriendSearchResult } from "../types/FriendSearch";

const SEARCH_DELAY_MS = 400;
const USERNAME_PATTERN = /^[a-zA-Z0-9._]+$/;

function mapUserSearchResult(
  result: UserSearchResponse,
): FriendSearchResult {
  return {
    id: result.user.username,
    name: result.user.nickname,
    userId: result.user.id,
    profileImageUrl: result.user.profileImageUrl,
    relationshipStatus: result.relationshipStatus,
    friendshipId: result.friendshipId,
  };
}

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
        if (!normalizedKeyword) {
          setSearchedUsers([]);
          setSelectedUserId("");
          setSearchErrorMessage("");
          setIsSearching(false);
          return;
        }

        if (
          normalizedKeyword.length > 30 ||
          !USERNAME_PATTERN.test(normalizedKeyword)
        ) {
          setSearchedUsers([]);
          setSelectedUserId("");
          setSearchErrorMessage(
            "영문, 숫자, 마침표, 밑줄만 사용할 수 있어요.",
          );
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
    }, SEARCH_DELAY_MS);

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

  const selectedUser = searchedUsers.find((user) => user.id === selectedUserId);
  const isFriendRequestEnabled =
    selectedUser?.relationshipStatus === "NONE";

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
