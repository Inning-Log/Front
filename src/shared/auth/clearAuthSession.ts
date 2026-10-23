import { clearCurrentUserId } from "../firebase/pushUserStorage";
import { syncPushUserContext } from "../firebase/pushUserContext";
import { clearStoredAuthSession } from "./authSession";

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
  clearStoredAuthSession();
}
