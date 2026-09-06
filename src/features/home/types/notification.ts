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

export type NotificationResponse = {
  id: number;
  type: string;
  title: string;
  body: string;
  data: Record<string, string>;
  readAt: string | null;
  createdAt: string;
};

export type NotificationListResponse = {
  items: NotificationResponse[];
  nextCursor: number | null;
  hasNext: boolean;
  unreadCount: number;
};