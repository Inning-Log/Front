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

export type HomeCalendarTeam = {
  id: number;
  teamCode: string;
  name: string;
  shortName: string;
  logoUrl?: string | null;
};

export type HomeCalendarGame = {
  gameId: number;
  seasonYear: number;
  gameType: string;
  date: string;
  gameSequence: number;
  scheduledAt: string;
  status: string;
  homeTeam: HomeCalendarTeam;
  awayTeam: HomeCalendarTeam;
  stadiumName?: string | null;
  score?: {
    home: number;
    away: number;
  } | null;
  displayTeam?: HomeCalendarTeam | null;
  opponentTeam?: HomeCalendarTeam | null;
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

export type HomeCalendarResponse = {
  year: number;
  month: number;
  timezone: string;
  today: string;
  favoriteTeamId: number;
  scheduleData: {
    state: string;
    lastAppliedAt?: string | null;
  };
  days: Array<{
    date: string;
    games: HomeCalendarGame[];
  }>;
};
