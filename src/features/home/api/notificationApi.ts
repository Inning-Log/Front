import { apiClient } from "../../../shared/api/apiClient";

import type {
  NotificationListResponse,
  NotificationSettingsResponse,
  PushRegistrationRequest,
  PushRegistrationResponse,
  UpdateNotificationSettingsRequest,
} from "../types/notification";

// 알림 설정 조회
export function getNotificationSettings() {
  return apiClient<NotificationSettingsResponse>(
    "/notification-settings",
    {
      method: "GET",
      fallbackErrorMessage:
        "알림 설정을 불러오지 못했습니다.",
    },
  );
}

// 알림 설정 변경
export function updateNotificationSettings(
  request: UpdateNotificationSettingsRequest,
) {
  return apiClient<NotificationSettingsResponse>(
    "/notification-settings",
    {
      method: "PATCH",
      body: request,
      fallbackErrorMessage:
        "알림 설정을 변경하지 못했습니다.",
    },
  );
}

// 알림 목록 조회
export function getNotifications(
  cursor?: number | null,
  size = 20,
) {
  return apiClient<NotificationListResponse>(
    "/notifications",
    {
      method: "GET",
      params: {
        cursor: cursor ?? undefined,
        size,
      },
      fallbackErrorMessage:
        "알림 목록을 불러오지 못했습니다.",
    },
  );
}

// 개별 알림 읽음 처리
export function readNotification(
  notificationId: number,
) {
  return apiClient<void>(
    `/notifications/${notificationId}/read`,
    {
      method: "PATCH",
      fallbackErrorMessage:
        "알림 읽음 처리에 실패했습니다.",
    },
  );
}

// 모든 알림 읽음 처리
export function readAllNotifications() {
  return apiClient<void>(
    "/notifications/read-all",
    {
      method: "PATCH",
      fallbackErrorMessage:
        "모든 알림 읽음 처리에 실패했습니다.",
    },
  );
}

// 푸시 알림 기기 등록
export function registerPushNotification(
  request: PushRegistrationRequest,
) {
  return apiClient<PushRegistrationResponse>(
    "/notifications/push-registration",
    {
      method: "PUT",
      body: request,
      fallbackErrorMessage:
        "푸시 알림 기기 등록에 실패했습니다.",
    },
  );
}

// 푸시 알림 기기 해제
export function unregisterPushNotification(
  installationId: string,
) {
  return apiClient<void>(
    "/notifications/push-registration",
    {
      method: "DELETE",
      params: {
        installationId,
      },
      fallbackErrorMessage:
        "푸시 알림 기기 해제에 실패했습니다.",
    },
  );
}