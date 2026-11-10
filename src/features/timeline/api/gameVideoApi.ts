import { apiClient, ApiError } from "../../../shared/api/apiClient";

export type GameVideo = {
  gameVideoId: number;
  gameId: number;
  status: "RENDERING" | "MERGING" | "READY" | "FAILED";
  mode: "SOLO" | "WITH_FRIENDS";
  memberUserIds: number[];
  segmentCount: number;
  readySegmentCount: number;
  durationSeconds: number | null;
  failureReason: string | null;
  downloadUrl: string | null;
  expiresAt: string | null;
  requestedAt: string;
  completedAt: string | null;
};

export type GameVideoFriend = {
  userId: number;
  username: string;
  nickname: string;
  profileImageUrl: string | null;
  cheeringTeamName: string | null;
  clipCount: number;
};

export function getGameVideo(gameId: number, signal?: AbortSignal) {
  return apiClient<GameVideo>(`/games/${gameId}/video`, {
    signal, cache: "no-store",
  });
}

export function createGameVideo(gameId: number, friendIds: number[] = []) {
  return apiClient<GameVideo>(`/games/${gameId}/video`, {
    method: "POST", body: { friendIds },
  });
}

export function deleteGameVideo(gameId: number) {
  return apiClient<void>(`/games/${gameId}/video`, { method: "DELETE" });
}

export function getGameVideoFriends(gameId: number, signal?: AbortSignal) {
  return apiClient<{ maxFriends: number; friends: GameVideoFriend[] }>(
    `/games/${gameId}/video/friends`, { signal },
  );
}

export function gameVideoError(error: unknown) {
  if (error instanceof ApiError) {
    const messages: Record<string, string> = {
      INVALID_FRIEND: "선택한 친구의 영상이나 친구 관계가 변경됐어요. 목록을 다시 확인해 주세요.",
      TOO_MANY_FRIENDS: "함께 저장할 수 있는 친구 수를 초과했어요.",
      GAME_VIDEO_IN_PROGRESS: "이미 영상을 만들고 있어요. 현재 상태를 확인해 주세요.",
      NO_CLIPS: "합칠 수 있는 업로드 완료 영상이 없어요.",
      GAME_VIDEO_DISABLED: "영상 저장 기능을 사용할 수 없어요. 잠시 후 다시 시도해 주세요.",
      GAME_NOT_FOUND: "경기를 찾을 수 없어요.",
      GAME_LOG_NOT_FOUND: "이 경기의 내 관람 기록이 없어요.",
      GAME_VIDEO_NOT_FOUND: "아직 생성한 영상이 없어요.",
    };
    if (error.status === 401) return "로그인 후 다시 시도해 주세요.";
    return messages[error.code ?? ""] ?? error.message;
  }
  return error instanceof Error ? error.message : "요청에 실패했어요. 다시 시도해 주세요.";
}
