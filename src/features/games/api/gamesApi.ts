import { apiClient } from "../../../shared/api/apiClient";
import type {
  GameListResponse,
  GameStateHistoryResponse,
} from "../types/game";

export function getGames(date: string) {
  return apiClient<GameListResponse>("/games", {
    fallbackErrorMessage: "해당 날짜의 경기 목록을 불러오지 못했습니다.",
    params: { date },
  });
}

export function getGameStateHistory(gameId: number) {
  return apiClient<GameStateHistoryResponse>(
    `/games/${gameId}/states`,
    {
      method: "GET",
      fallbackErrorMessage:
        "경기 진행 상태를 불러오지 못했습니다.",
    },
  );
}
