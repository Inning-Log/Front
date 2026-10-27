// 사용자 정보
export type TimelineUser = {
  userId: number;
  username: string;
  nickname: string;
  profileImageUrl: string | null;
};

// 팀 정보
export type TimelineTeam = {
  id: number;
  teamCode: string;
  name: string;
  shortName: string;
  logoUrl: string | null;
};

// 직관 / 집관 정보
export type TimelineViewing = {
  id: number;
  viewingType: string;
  cheeringTeamId: number;
};

// 경기 점수
export type TimelineScore = {
  home: number;
  away: number;
};

// 경기 정보
export type TimelineGame = {
  gameId: number;
  seasonYear: number;
  gameType: string;
  date: string;
  gameSequence: number;
  scheduledAt: string;
  status: string;

  homeTeam: TimelineTeam;
  awayTeam: TimelineTeam;

  stadiumName: string;

  score: TimelineScore;

  displayTeam: TimelineTeam;
  opponentTeam: TimelineTeam;

  displayResult: string;

  myViewing: TimelineViewing;

  recordingState: string;

  resultObservedAt: string;

  recordCount: number;
  hasRecords: boolean;
};

// 타임라인 기록
export type TimelineRecord = {
  id: number;

  gameId: number;
  userGameLogId: number;

  clientRecordId: string;

  inning: number;
  half: string;

  recordedAt: string;

  text: string;

  homeScore: number;
  awayScore: number;

  scoreObservedAt: string;

  videoStatus: string;

  createdAt: string;
  updatedAt: string;
};

// 내 / 친구 경기 타임라인 응답
export type TimelineResponse = {
  today: string;

  /*
   * 현재 타임라인 기준 날짜.
   * 서버 리셋 전에는 실제 달력 날짜(today)보다
   * 하루 이전 날짜일 수 있다.
   */
  timelineDate: string;

  /*
   * 다음 타임라인 리셋 시각.
   * UTC ISO-8601 문자열.
   */
  nextResetAt: string;

  timezone: string;

  owner: TimelineUser;

  game: TimelineGame;

  viewing: TimelineViewing;

  currentInning: number;
  currentHalf: string;

  canCreateRecord: boolean;
  requiresViewingRegistration: boolean;

  recordCount: number;

  records: TimelineRecord[];

  nextCursor: string | null;
};

// 프로필별 경기
export type TimelineProfileGame = {
  gameId: number;
  viewingType: string;
  recordCount: number;
};

// 타임라인 프로필
export type TimelineProfile = TimelineUser & {
  hasRecordedToday: boolean;
  games: TimelineProfileGame[];
};

// 타임라인 프로필 응답
export type TimelineProfilesResponse = {
  today: string;

  timelineDate: string;

  nextResetAt: string;

  me: TimelineProfile;

  friends: TimelineProfile[];

  nextAfterUserId: number | null;
};

// 내 타임라인 조회 파라미터
export type GetMyTimelineParams = {
  gameId: number;
  cursor?: string;
  limit?: number;
};

// 친구 타임라인 조회 파라미터
export type GetFriendTimelineParams = {
  userId: number;
  gameId: number;
  cursor?: string;
  limit?: number;
};

// 타임라인 프로필 조회 파라미터
export type GetTimelineProfilesParams = {
  afterUserId?: number;
  limit?: number;
};