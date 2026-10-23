import { apiClient } from "../../../shared/api/apiClient";
import type {
  CreateUserGameLogRequest,
  UpdateUserGameLogRequest,
  UserGameLogResponse,
} from "../types/userGameLog";

export function createUserGameLog(request: CreateUserGameLogRequest) {
  return apiClient<UserGameLogResponse>("/user-game-logs", {
    body: request,
    fallbackErrorMessage: "관람 정보를 저장하지 못했습니다.",
    method: "POST",
  });
}

export function getUserGameLog(id: number) {
  return apiClient<UserGameLogResponse>(`/user-game-logs/${id}`, {
    fallbackErrorMessage: "관람 정보를 불러오지 못했습니다.",
    method: "GET",
  });
}

export function updateUserGameLog(
  id: number,
  request: UpdateUserGameLogRequest,
) {
  return apiClient<UserGameLogResponse>(`/user-game-logs/${id}`, {
    body: request,
    fallbackErrorMessage: "관람 정보를 수정하지 못했습니다.",
    method: "PATCH",
  });
}

export function deleteUserGameLog(id: number) {
  return apiClient<void>(`/user-game-logs/${id}`, {
    fallbackErrorMessage: "관람 기록을 삭제하지 못했습니다.",
    method: "DELETE",
  });
}
