import type { UserResponse } from "./auth";

export type OnboardingStep =
  | "USERNAME"
  | "NICKNAME"
  | "FAVORITE_TEAM"
  | "COMPLETED";

export type OnboardingStatusResponse = {
  nextStep: OnboardingStep;
  completed: boolean;
  user?: UserResponse;
};

export type UsernameSetupRequest = {
  username: string;
};

export type NicknameSetupRequest = {
  nickname: string;
};

export type FavoriteTeamSelectionRequest = {
  favoriteTeamId: number;
};

export type UsernameAvailabilityResponse = {
  username: string;
  available: boolean;
};

export type TeamSummaryResponse = {
  id: number;
  teamCode: string;
  name: string;
  shortName: string;
  logoUrl?: string;
  primaryColor?: string;
  displayOrder: number;
};

export type OnboardingErrorResponse = {
  code?: string;
  message?: string;
  timestamp?: string;
};
