import type { UserSearchResponse } from "../types/friend";
import type { FriendSearchResult } from "../types/friendSearch";

export const FRIEND_SEARCH_DELAY_MS = 400;

const USERNAME_PATTERN = /^[a-zA-Z0-9._]+$/;

export function getFriendSearchValidationMessage(username: string) {
  if (!username) {
    return "";
  }

  if (username.length > 30) {
    return "아이디는 30자 이내로 입력해주세요.";
  }

  if (!USERNAME_PATTERN.test(username)) {
    return "영문, 숫자, 마침표, 밑줄만 사용할 수 있어요.";
  }

  return "";
}

export function mapUserSearchResult(
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

export function canSendFriendRequest(user?: FriendSearchResult) {
  return user?.relationshipStatus === "NONE";
}
