import { apiClient } from "../../../shared/api/apiClient";

export type FavoriteTeam = {
  id: number;
  teamCode: string;
  name: string;
  shortName: string;
  logoUrl: string;
  primaryColor: string;
  displayOrder: number;
};

export type MyPageResponse = {
  id: number;
  nickname: string;
  username: string;
  email: string;
  profileImageUrl: string | null;
  favoriteTeam: FavoriteTeam | null;
};

export type UsernameAvailabilityResponse = {
  username: string;
  available: boolean;
};

export type UpdateProfileRequest = {
  username: string;
  nickname: string;
};

export type UpdateProfileImageRequest = {
  profileImageUrl: string | null;
};

export type UpdateFavoriteTeamRequest = {
  favoriteTeamId: number;
};

export function getMyPage() {
  return apiClient<MyPageResponse>("/mypage", {
    method: "GET",
    fallbackErrorMessage:
      "마이페이지 정보를 불러오지 못했습니다.",
  });
}

export function checkUsernameAvailability(
  username: string,
) {
  return apiClient<UsernameAvailabilityResponse>(
    "/mypage/username-availability",
    {
      method: "GET",
      params: {
        username,
      },
      fallbackErrorMessage:
        "아이디 중복 확인에 실패했습니다.",
    },
  );
}

export function updateMyProfile(
  data: UpdateProfileRequest,
) {
  return apiClient<MyPageResponse>(
    "/mypage/profile",
    {
      method: "PATCH",
      body: data,
      fallbackErrorMessage:
        "프로필 수정에 실패했습니다.",
    },
  );
}

export function updateProfileImage(
  profileImageUrl: string | null,
) {
  const data: UpdateProfileImageRequest = {
    profileImageUrl,
  };

  return apiClient<MyPageResponse>(
    "/mypage/profile-image",
    {
      method: "PUT",
      body: data,
      fallbackErrorMessage:
        "프로필 이미지 변경에 실패했습니다.",
    },
  );
}

export function updateFavoriteTeam(
  favoriteTeamId: number,
) {
  const data: UpdateFavoriteTeamRequest = {
    favoriteTeamId,
  };

  return apiClient<MyPageResponse>(
    "/mypage/favorite-team",
    {
      method: "PUT",
      body: data,
      fallbackErrorMessage:
        "응원 팀 변경에 실패했습니다.",
    },
  );
}