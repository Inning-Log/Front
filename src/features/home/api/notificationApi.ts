import { apiClient } from "../../../shared/api/apiClient";

import type {
  NotificationListResponse,
  NotificationSettingsResponse,
  UpdateNotificationSettingsRequest,
} from "../types/notification";

export function getNotificationSettings() {
  return apiClient<NotificationSettingsResponse>("/api/notification-settings", {
    method: "GET",
    fallbackErrorMessage: "알림 설정을 불러오지 못했습니다.",
  });
}

export function updateNotificationSettings(
  request: UpdateNotificationSettingsRequest,
) {
  return apiClient<NotificationSettingsResponse>("/api/notification-settings", {
    method: "PATCH",
    body: request,
    fallbackErrorMessage: "알림 설정을 변경하지 못했습니다.",
  });
}

export function getNotifications(cursor?: number, size = 20) {
  const searchParams = new URLSearchParams();

  if (cursor !== undefined) {
    searchParams.set("cursor", String(cursor));
  }

  searchParams.set("size", String(size));

  return apiClient<NotificationListResponse>(
    `/api/notifications?${searchParams.toString()}`,
    {
      method: "GET",
      fallbackErrorMessage: "알림 목록을 불러오지 못했습니다.",
    },
  );
}

export function readNotification(notificationId: number) {
  return apiClient<void>(`/api/notifications/${notificationId}/read`, {
    method: "PATCH",
    fallbackErrorMessage: "알림 읽음 처리에 실패했습니다.",
  });
}