import { apiClient } from "../../../shared/api/apiClient";
import type {
  FriendRequestCreateRequest,
  FriendshipResponse,
  UserSearchResponse,
} from "../types/friend";

export function getFriends() {
  return apiClient<FriendshipResponse[]>("/friendships", {
    fallbackErrorMessage: "친구 목록을 불러오지 못했습니다.",
  });
}

export function searchUsers(username: string) {
  return apiClient<UserSearchResponse[]>("/users/search", {
    fallbackErrorMessage: "사용자 검색에 실패했습니다.",
    params: { username },
  });
}

export function sendFriendRequest(receiverId: number) {
  const body: FriendRequestCreateRequest = { receiverId };

  return apiClient<FriendshipResponse>("/friendships/requests", {
    body,
    fallbackErrorMessage: "친구 신청에 실패했습니다.",
    method: "POST",
  });
}

export function getReceivedFriendRequests() {
  return apiClient<FriendshipResponse[]>("/friendships/requests", {
    fallbackErrorMessage: "받은 친구 신청 목록을 불러오지 못했습니다.",
  });
}

export function acceptFriendRequest(friendshipId: number) {
  return apiClient<FriendshipResponse>(
    `/friendships/${friendshipId}/accept`,
    {
      fallbackErrorMessage: "친구 신청 수락에 실패했습니다.",
      method: "POST",
    },
  );
}

export function rejectFriendRequest(friendshipId: number) {
  return apiClient<FriendshipResponse>(
    `/friendships/${friendshipId}/reject`,
    {
      fallbackErrorMessage: "친구 신청 거절에 실패했습니다.",
      method: "POST",
    },
  );
}

export function deleteFriendship(friendshipId: number) {
  return apiClient<void>(`/friendships/${friendshipId}`, {
    fallbackErrorMessage: "친구 관계 삭제에 실패했습니다.",
    method: "DELETE",
  });
}
