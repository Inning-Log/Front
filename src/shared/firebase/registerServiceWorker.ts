let isRefreshing = false;
let isUpdateListenerRegistered = false;

export async function registerFirebaseServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    throw new Error(
      "현재 브라우저는 Service Worker를 지원하지 않습니다.",
    );
  }

  const isProduction =
    import.meta.env.MODE === "production";

  const serviceWorkerUrl = isProduction
    ? "/firebase-messaging-sw.js"
    : "/dev-sw.js?dev-sw";

  // 기존 서비스워커가 페이지를 제어하고 있는지 확인
  const hadController =
    navigator.serviceWorker.controller !== null;

  // 서비스워커 교체 시 페이지 새로고침
  if (!isUpdateListenerRegistered) {
    isUpdateListenerRegistered = true;

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => {
        // 최초 설치 시에는 새로고침하지 않음
        if (!hadController) {
          return;
        }

        // 중복 새로고침 방지
        if (isRefreshing) {
          return;
        }

        isRefreshing = true;

        window.location.reload();
      },
    );
  }

  // 기존 등록 여부와 관계없이 최신 서비스워커 등록
  const registration =
    await navigator.serviceWorker.register(
      serviceWorkerUrl,
      {
        scope: "/",
        type: isProduction
          ? "classic"
          : "module",
        updateViaCache: "none",
      },
    );

  // 서비스워커 업데이트 확인
  const checkForUpdates = async () => {
    try {
      await registration.update();
    } catch (error) {
      console.error(
        "서비스워커 업데이트 확인 실패:",
        error,
      );
    }
  };

  // 최초 등록 시 업데이트 확인
  if (isProduction) {
    void checkForUpdates();
  }

  // 앱을 다시 열었을 때 업데이트 확인
  if (
    isProduction &&
    !document.documentElement.dataset.swUpdateListener
  ) {
    document.documentElement.dataset.swUpdateListener =
      "registered";

    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.visibilityState === "visible") {
          void checkForUpdates();
        }
      },
    );
  }

  return registration;
}