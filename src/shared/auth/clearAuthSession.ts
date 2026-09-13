import { clearCurrentUserId } from "../firebase/pushUserStorage";
import { syncPushUserContext } from "../firebase/pushUserContext";

export async function clearAuthSession() {
  try {
    await syncPushUserContext(null);
  } catch (error) {
    console.error(
      "푸시 사용자 정보 초기화 실패:",
      error,
    );
  }

  clearCurrentUserId();

  localStorage.removeItem("accessToken");
  localStorage.removeItem("tokenType");
  localStorage.removeItem(
    "accessTokenExpiresAt",
  );
}