export type ViewingType = "STADIUM" | "HOME";

export type CreateUserGameLogRequest = {
  gameId: number;
  cheeringTeamId: number;
  viewingType: ViewingType;
};

export type UpdateUserGameLogRequest = {
  viewingType: ViewingType;
};

export type UserGameLogResponse = {
  id: number;
  gameId: number;
  cheeringTeamId: number;
  viewingType: ViewingType;
  result?: string | null;
  createdAt: string;
  updatedAt: string;
};
