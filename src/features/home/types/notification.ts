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