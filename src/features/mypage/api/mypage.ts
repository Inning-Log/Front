import {
  apiClient,
} from "../../../shared/api/apiClient";

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

/**
 * 프로필 사진 Presigned URL 발급 요청
 */
export type ProfileImageUploadUrlRequest = {
  contentType: string;
  contentLength: number;
};

/**
 * POST /mypage/profile-image/upload-url 응답
 */
export type ProfileImageUploadUrlResponse = {
  uploadId: string;
  uploadUrl: string;
  method: string;
  headers: Record<string, string>;
  expiresAt: string;
  profileImageUrl: string;
};

export function getMyPage() {
  return apiClient<MyPageResponse>(
    "/mypage",
    {
      method: "GET",

      fallbackErrorMessage:
        "마이페이지 정보를 불러오지 못했습니다.",
    },
  );
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

/**
 * 기존 URL 방식 프로필 이미지 변경/초기화
 *
 * PUT /api/mypage/profile-image
 */
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

/**
 * 프로필 이미지 S3 업로드 URL 발급
 *
 * POST /api/mypage/profile-image/upload-url
 */
export function createProfileImageUploadUrl(
  file: File,
) {
  const request: ProfileImageUploadUrlRequest =
    {
      contentType:
        file.type,

      contentLength:
        file.size,
    };

  return apiClient<ProfileImageUploadUrlResponse>(
    "/mypage/profile-image/upload-url",
    {
      method: "POST",

      body: request,

      fallbackErrorMessage:
        "프로필 이미지 업로드 URL을 발급하지 못했습니다.",
    },
  );
}

/**
 * Presigned URL로 S3에 직접 업로드
 *
 * 서버 JWT를 보내면 안 되므로
 * apiClient가 아니라 일반 fetch 사용
 */
export async function uploadProfileImageToS3(
  file: File,
  uploadInfo: ProfileImageUploadUrlResponse,
) {
  const response =
    await fetch(
      uploadInfo.uploadUrl,
      {
        method:
          uploadInfo.method,

        headers:
          uploadInfo.headers,

        body:
          file,
      },
    );

  if (!response.ok) {
    throw new Error(
      "프로필 이미지 업로드에 실패했습니다.",
    );
  }
}

/**
 * 프로필 사진 업로드 검증 및 적용
 *
 * POST /api/mypage/profile-image/{uploadId}/complete
 */
export function completeProfileImageUpload(
  uploadId: string,
) {
  return apiClient<MyPageResponse>(
    `/mypage/profile-image/${encodeURIComponent(
      uploadId,
    )}/complete`,
    {
      method: "POST",

      fallbackErrorMessage:
        "프로필 이미지 적용에 실패했습니다.",
    },
  );
}

/**
 * 프로필 이미지 파일 업로드 전체 과정
 *
 * 1. Presigned URL 발급
 * 2. S3 직접 PUT
 * 3. complete
 */
export async function uploadProfileImage(
  file: File,
) {
  const uploadInfo =
    await createProfileImageUploadUrl(
      file,
    );

  await uploadProfileImageToS3(
    file,
    uploadInfo,
  );

  return completeProfileImageUpload(
    uploadInfo.uploadId,
  );
}