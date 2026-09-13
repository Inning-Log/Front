import { apiClient } from "../../../shared/api/apiClient";
import type { LoginResponse } from "../types/auth";

export async function loginWithGoogle(
  credential: string,
): Promise<LoginResponse> {
  return apiClient<LoginResponse>("/auth/google", {
    auth: false,
    body: { credential },
    fallbackErrorMessage:
      "로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    method: "POST",
  });
}

export async function logout(): Promise<void> {
  return apiClient<void>("/auth/logout", {
    fallbackErrorMessage:
      "로그아웃에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    method: "POST",
  });
}