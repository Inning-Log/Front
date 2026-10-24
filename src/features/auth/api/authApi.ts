import {
  apiClient,
} from "../../../shared/api/apiClient";

import type {
  CurrentUserResponse,
  LoginResponse,
  LogoutRequest,
} from "../types/auth";

export async function loginWithGoogle(
  credential: string,
): Promise<LoginResponse> {
  return apiClient<LoginResponse>(
    "/auth/google",
    {
      auth: false,
      body: {
        credential,
      },
      fallbackErrorMessage:
        "로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      method: "POST",
    },
  );
}

export function getCurrentUser() {
  return apiClient<CurrentUserResponse>(
    "/auth/me",
    {
      fallbackErrorMessage:
        "로그인 정보를 확인하지 못했습니다.",
    },
  );
}

export async function logout(
  installationId?: string | null,
): Promise<void> {
  const body:
    LogoutRequest | undefined =
    installationId
      ? {
          installationId,
        }
      : undefined;

  return apiClient<void>(
    "/auth/logout",
    {
      body,
      fallbackErrorMessage:
        "로그아웃에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      method: "POST",
    },
  );
}
