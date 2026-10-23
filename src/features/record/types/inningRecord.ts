export type CreateInningRecordRequest = {
  gameId: number;
  clientRecordId: string;
  inning: number;
  half: string;
  recordedAt: string;
  text: string;
};

export type UpdateInningRecordRequest = {
  text: string;
};

export type InningRecordResponse = {
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