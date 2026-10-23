const CURRENT_USER_ID_KEY = "currentUserId";

export function saveCurrentUserId(userId: number) {
  localStorage.setItem(
    CURRENT_USER_ID_KEY,
    String(userId),
  );
}

export function getCurrentUserId() {
  return localStorage.getItem(CURRENT_USER_ID_KEY);
}

export function clearCurrentUserId() {
  localStorage.removeItem(CURRENT_USER_ID_KEY);
}