import { apiClient } from "../../../shared/api/apiClient";
import type {
  HomeCalendarResponse,
  HomeWinRateResponse,
} from "../types/home";

export function getHomeWinRate() {
  return apiClient<HomeWinRateResponse>("/home/win-rate", {
    fallbackErrorMessage: "직관 승률을 불러오지 못했습니다.",
  });
}

export function getHomeCalendar(year: number, month: number) {
  return apiClient<HomeCalendarResponse>("/home/calendar", {
    fallbackErrorMessage: "월간 경기 일정을 불러오지 못했습니다.",
    params: {
      month,
      year,
    },
  });
}
