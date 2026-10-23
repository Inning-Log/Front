export type GameTeamResponse = {
  id: number;
  teamCode: string;
  name: string;
  shortName: string;
  logoUrl?: string | null;
};

export type GameResponse = {
  gameId: number;
  seasonYear: number;
  gameType: string;
  date: string;
  gameSequence: number;
  scheduledAt: string;
  status: string;
  homeTeam: GameTeamResponse;
  awayTeam: GameTeamResponse;
  stadiumName?: string | null;
  score?: {
    home: number;
    away: number;
  } | null;
  displayTeam?: GameTeamResponse | null;
  opponentTeam?: GameTeamResponse | null;
  displayResult?: string | null;
  myViewing?: {
    id: number;
    viewingType: string;
    cheeringTeamId: number;
  } | null;
  recordingState?: string | null;
  resultObservedAt?: string | null;
  recordCount: number;
  hasRecords: boolean;
};

export type ScheduleDataResponse = {
  state: string;
  lastAppliedAt?: string | null;
};

export type GameListResponse = {
  date: string;
  today: string;
  scheduleData: ScheduleDataResponse;
  games: GameResponse[];
};
