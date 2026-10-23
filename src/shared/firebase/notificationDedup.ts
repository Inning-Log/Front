const HANDLED_NOTIFICATION_IDS_KEY =
  "handledNotificationIds";

const MAX_IDS = 100;

export function markNotificationAsHandled(
  notificationId: string,
) {
  const stored = sessionStorage.getItem(
    HANDLED_NOTIFICATION_IDS_KEY,
  );

  const ids: string[] = stored
    ? JSON.parse(stored)
    : [];

  if (ids.includes(notificationId)) {
    return false;
  }

  const nextIds = [
    notificationId,
    ...ids,
  ].slice(0, MAX_IDS);

  sessionStorage.setItem(
    HANDLED_NOTIFICATION_IDS_KEY,
    JSON.stringify(nextIds),
  );

  return true;
}