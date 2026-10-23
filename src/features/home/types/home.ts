import type {
  GameResponse,
  GameTeamResponse,
  ScheduleDataResponse,
} from "../../games/types/game";

export type HomeWinRateResponse = {
  seasonYear: number;
  gameTypes: string[];
  viewingType: string;
  registeredCount: number;
  wins: number;
  losses: number;
  draws: number;
  pendingCount: number;
  voidCount: number;
  unknownCount: number;
  unclassifiedCount: number;
  decidedCount: number;
  winRatePercent: number | null;
  calculatedAt: string;
};

export type HomeCalendarTeam = GameTeamResponse;
export type HomeCalendarGame = GameResponse;

export type HomeCalendarResponse = {
  year: number;
  month: number;
  timezone: string;
  today: string;
  favoriteTeamId: number;
  scheduleData: ScheduleDataResponse;
  days: Array<{
    date: string;
    games: HomeCalendarGame[];
  }>;
};
