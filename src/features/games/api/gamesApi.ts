import { apiClient } from "../../../shared/api/apiClient";
import type { GameListResponse } from "../types/game";

export function getGames(date: string) {
  return apiClient<GameListResponse>("/games", {
    fallbackErrorMessage: "해당 날짜의 경기 목록을 불러오지 못했습니다.",
    params: { date },
  });
}
