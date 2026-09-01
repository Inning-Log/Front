import { apiClient } from "../../../shared/api/apiClient";
import type {
  FavoriteTeamSelectionRequest,
  NicknameSetupRequest,
  OnboardingStatusResponse,
  UsernameAvailabilityResponse,
  UsernameSetupRequest,
} from "../types/onboarding";

export function getOnboardingStatus() {
  return apiClient<OnboardingStatusResponse>("/onboarding");
}

export function checkUsernameAvailability(username: string) {
  return apiClient<UsernameAvailabilityResponse>(
    "/onboarding/username-availability",
    {
      params: { username },
    },
  );
}

export function setupUsername(username: string) {
  const body: UsernameSetupRequest = { username };

  return apiClient<OnboardingStatusResponse>("/onboarding/username", {
    body,
    fallbackErrorMessage: "아이디를 저장하지 못했습니다.",
    method: "PUT",
  });
}

export function setupNickname(nickname: string) {
  const body: NicknameSetupRequest = { nickname };

  return apiClient<OnboardingStatusResponse>("/onboarding/nickname", {
    body,
    fallbackErrorMessage: "닉네임을 저장하지 못했습니다.",
    method: "PUT",
  });
}

export function selectFavoriteTeam(favoriteTeamId: number) {
  const body: FavoriteTeamSelectionRequest = { favoriteTeamId };

  return apiClient<OnboardingStatusResponse>("/onboarding/favorite-team", {
    body,
    fallbackErrorMessage: "응원팀을 저장하지 못했습니다.",
    method: "PUT",
  });
}
