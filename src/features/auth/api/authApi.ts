import type { LoginResponse } from "../types/auth";

async function parseErrorMessage(response: Response) {
  const fallbackMessage = "로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.";

  try {
    const data = (await response.json()) as { message?: string; error?: string };
    return data.message ?? data.error ?? fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

export async function loginWithGoogle(credential: string): Promise<LoginResponse> {
  const response = await fetch("/api/auth/google", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ credential }),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return response.json() as Promise<LoginResponse>;
}
