import { apiClient } from "../../../shared/api/apiClient";

import type {
  GetFriendTimelineParams,
  GetMyTimelineParams,
  GetTimelineProfilesParams,
  TimelineProfilesResponse,
  TimelineResponse,
} from "../types/timeline";

// 내 경기 타임라인 조회
export function getMyTimeline({
  gameId,
  cursor,
  limit = 50,
}: GetMyTimelineParams) {
  const params = new URLSearchParams();

  params.set("gameId", String(gameId));
  params.set("limit", String(limit));

  if (cursor) {
    params.set("cursor", cursor);
  }

  return apiClient<TimelineResponse>(
    `/api/timelines/me?${params.toString()}`,
    {
      method: "GET",
      fallbackErrorMessage:
        "내 타임라인을 불러오지 못했습니다.",
    },
  );
}

// 친구 경기 타임라인 조회
export function getFriendTimeline({
  userId,
  gameId,
  cursor,
  limit = 50,
}: GetFriendTimelineParams) {
  const params = new URLSearchParams();

  params.set("gameId", String(gameId));
  params.set("limit", String(limit));

  if (cursor) {
    params.set("cursor", cursor);
  }

  return apiClient<TimelineResponse>(
    `/api/timelines/${userId}?${params.toString()}`,
    {
      method: "GET",
      fallbackErrorMessage:
        "친구 타임라인을 불러오지 못했습니다.",
    },
  );
}

// 오늘의 타임라인 프로필 조회
export function getTimelineProfiles({
  afterUserId = 0,
  limit = 50,
}: GetTimelineProfilesParams = {}) {
  const params = new URLSearchParams();

  params.set("afterUserId", String(afterUserId));
  params.set("limit", String(limit));

  return apiClient<TimelineProfilesResponse>(
    `/api/timelines/profiles?${params.toString()}`,
    {
      method: "GET",
      fallbackErrorMessage:
        "타임라인 프로필을 불러오지 못했습니다.",
    },
  );
}