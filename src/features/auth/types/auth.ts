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
  refreshToken: string;
  refreshTokenExpiresAt: string;
  isNewUser: boolean;
  user?: UserResponse;
};

export type TokenPairResponse = {
  tokenType: string;
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
};

export type IssuedTokenResponse = {
  tokenType: string;
  accessToken: string;
  expiresAt: string;
};

export type CurrentUserResponse = {
  subject: string;
  authorities: string[];
  user?: UserResponse | null;
};
