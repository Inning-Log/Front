import { apiClient } from "../../../shared/api/apiClient";

import type {
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