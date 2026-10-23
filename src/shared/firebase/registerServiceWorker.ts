let registrationPromise:
  Promise<ServiceWorkerRegistration> | null = null;

let isRefreshing = false;
let listenersInitialized = false;

let updateCheckPromise: Promise<void> | null = null;

const UPDATE_INTERVAL = 60 * 60 * 1000;

// ========================================
// 서비스워커 업데이트 확인
// ========================================

async function checkForUpdates(
  registration: ServiceWorkerRegistration,
) {
  if (
    !import.meta.env.PROD ||
    !navigator.onLine
  ) {
    return;
  }

  // 이미 업데이트 확인 중이면 기존 작업 재사용
  if (updateCheckPromise) {
    return updateCheckPromise;
  }

  updateCheckPromise = registration
    .update()
    .catch((error) => {
      console.error(
        "서비스워커 업데이트 확인 실패:",
        error,
      );
    })
    .then(() => undefined)
    .finally(() => {
      updateCheckPromise = null;
    });

  return updateCheckPromise;
}

// ========================================
// 서비스워커 이벤트 등록
// ========================================

function initializeUpdateListeners(
  registration: ServiceWorkerRegistration,
) {
  if (listenersInitialized) {
    return;
  }

  listenersInitialized = true;

  // 최초 설치인지 기존 서비스워커가 있는지 확인
  let hadController =
    navigator.serviceWorker.controller !== null;

  // ========================================
  // 서비스워커 변경 시 새로고침
  // ========================================

  navigator.serviceWorker.addEventListener(
    "controllerchange",
    () => {
      if (!hadController) {
        hadController = true;
        return;
      }

      if (isRefreshing) {
        return;
      }

      isRefreshing = true;

      window.location.reload();
    },
  );

  // ========================================
  // 앱 다시 활성화 시 업데이트 확인
  // ========================================

  document.addEventListener(
    "visibilitychange",
    () => {
      if (
        document.visibilityState === "visible"
      ) {
        void checkForUpdates(registration);
      }
    },
  );

  // ========================================
  // 브라우저 포커스 복귀 시 업데이트 확인
  // ========================================

  window.addEventListener(
    "focus",
    () => {
      void checkForUpdates(registration);
    },
  );

  // ========================================
  // 네트워크 연결 복구 시 업데이트 확인
  // ========================================

  window.addEventListener(
    "online",
    () => {
      void checkForUpdates(registration);
    },
  );

  // ========================================
  // 장시간 실행 중 업데이트 확인
  // ========================================

  window.setInterval(
    () => {
      if (
        document.visibilityState === "visible"
      ) {
        void checkForUpdates(registration);
      }
    },
    UPDATE_INTERVAL,
  );

  // ========================================
  // 최초 실행 시 업데이트 확인
  // ========================================

  void checkForUpdates(registration);
}

// ========================================
// Firebase 및 PWA 서비스워커 등록
// ========================================

export function registerFirebaseServiceWorker():
  Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) {
    return Promise.reject(
      new Error(
        "현재 브라우저는 Service Worker를 지원하지 않습니다.",
      ),
    );
  }

  // 기존 등록 작업이 있으면 재사용
  if (registrationPromise) {
    return registrationPromise;
  }

  const isProduction =
    import.meta.env.PROD;

  const serviceWorkerUrl = isProduction
    ? "/firebase-messaging-sw.js"
    : "/dev-sw.js?dev-sw";

  // ========================================
  // 서비스워커 등록
  // ========================================

  registrationPromise =
    navigator.serviceWorker
      .register(
        serviceWorkerUrl,
        {
          scope: "/",

          type: isProduction
            ? "classic"
            : "module",

          // 서비스워커 스크립트 HTTP 캐시 재검증
          updateViaCache: "none",
        },
      )
      .then((registration) => {
        initializeUpdateListeners(
          registration,
        );

        return registration;
      })
      .catch((error) => {
        // 실패 시 재시도 가능하도록 초기화
        registrationPromise = null;

        throw error;
      });

  return registrationPromise;
}