export type UserResponse = {
  id: number;
  username?: string;
  email?: string;
  nickname?: string;
  profileImageUrl?: string;
  favoriteTeamId?: number;
  onboardingCompleted?: boolean;
};

export type LoginResponse = {
  tokenType: string;
  accessToken: string;
  expiresAt: string;
  isNewUser: boolean;
  user?: UserResponse;
};
