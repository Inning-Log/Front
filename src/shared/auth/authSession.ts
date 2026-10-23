type AuthTokenSet = {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  tokenType: string;
};

const AUTH_STORAGE_KEYS = {
  accessToken: "accessToken",
  accessTokenExpiresAt: "accessTokenExpiresAt",
  refreshToken: "refreshToken",
  refreshTokenExpiresAt: "refreshTokenExpiresAt",
  tokenType: "tokenType",
} as const;

export function saveAuthSession(tokens: AuthTokenSet) {
  Object.entries(tokens).forEach(([key, value]) => {
    localStorage.setItem(AUTH_STORAGE_KEYS[key as keyof AuthTokenSet], value);
  });
}

export function clearAuthSession() {
  Object.values(AUTH_STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
}

export function getAccessToken() {
  return localStorage.getItem(AUTH_STORAGE_KEYS.accessToken);
}

export function getRefreshToken() {
  return localStorage.getItem(AUTH_STORAGE_KEYS.refreshToken);
}

export function getTokenType() {
  return localStorage.getItem(AUTH_STORAGE_KEYS.tokenType) || "Bearer";
}

export function hasStoredAuthSession() {
  return Boolean(getAccessToken() || getRefreshToken());
}
