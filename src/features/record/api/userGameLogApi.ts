import { apiClient } from "../../../shared/api/apiClient";
import type {
  CreateUserGameLogRequest,
  UserGameLogResponse,
} from "../types/userGameLog";

export function createUserGameLog(request: CreateUserGameLogRequest) {
  return apiClient<UserGameLogResponse>("/user-game-logs", {
    body: request,
    fallbackErrorMessage: "관람 정보를 저장하지 못했습니다.",
    method: "POST",
  });
}
