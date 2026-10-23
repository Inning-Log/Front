export type NotificationType =
  | "FRIEND_REQUEST"
  | "FRIEND_ACCEPTED"
  | "TIMELINE_COMMENT"
  | "TIMELINE_REACTION"
  | "GAME_INNING_STARTED"
  | "GAME_INNING_ENDED"
  | "GAME_SCORE_CHANGED"
  | "RECORD_REMINDER"
  | "GENERATED_VIDEO_READY"
  | "GENERATED_VIDEO_FAILED";

export type NotificationSettingsResponse = {
  gameProgressEnabled: boolean;
  recordReminderEnabled: boolean;
  socialReactionEnabled: boolean;
};

export type UpdateNotificationSettingsRequest = {
  gameProgressEnabled?: boolean;
  recordReminderEnabled?: boolean;
  socialReactionEnabled?: boolean;
};

export type NotificationData = {
  actorUserId?: string;
  type?: NotificationType;
  friendshipId?: string;
  requestRevision?: string;
  screen?: string;

  [key: string]: string | undefined;
};

export type NotificationResponse = {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  data: NotificationData;
  readAt: string | null;
  createdAt: string;
};

export type NotificationListResponse = {
  items: NotificationResponse[];
  nextCursor: number | null;
  hasNext: boolean;
  unreadCount: number;
};

export type PushRegistrationRequest = {
  platform: "WEB";
  installationId: string;
};

export type PushRegistrationResponse = {
  id: number;
  platform: string;
  installationId: string;
  enabled: boolean;
  lastSeenAt: string;
};