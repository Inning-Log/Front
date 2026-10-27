let registrationPromise:
  Promise<ServiceWorkerRegistration> | null =
    null;

let isRefreshing =
  false;

let listenersInitialized =
  false;

let updateCheckPromise:
  Promise<void> | null =
    null;

const UPDATE_INTERVAL =
  60 * 60 * 1000;

const RECORD_OPERATION_KEY =
  "inninglog-record-operation-active";

function isRecordOperationActive() {
  try {
    return (
      sessionStorage.getItem(
        RECORD_OPERATION_KEY,
      ) === "1"
    );
  } catch {
    return false;
  }
}

async function checkForUpdates(
  registration:
    ServiceWorkerRegistration,
) {
  if (
    !import.meta.env.PROD ||
    !navigator.onLine
  ) {
    return;
  }

  if (
    updateCheckPromise
  ) {
    return updateCheckPromise;
  }

  updateCheckPromise =
    registration
      .update()
      .catch(
        (error) => {
          console.error(
            "서비스워커 업데이트 확인 실패:",
            error,
          );
        },
      )
      .then(
        () =>
          undefined,
      )
      .finally(
        () => {
          updateCheckPromise =
            null;
        },
      );

  return updateCheckPromise;
}

function initializeUpdateListeners(
  registration:
    ServiceWorkerRegistration,
) {
  if (
    listenersInitialized
  ) {
    return;
  }

  listenersInitialized =
    true;

  let hadController =
    navigator.serviceWorker.controller !==
    null;

  navigator.serviceWorker.addEventListener(
    "controllerchange",
    () => {
      if (
        !hadController
      ) {
        hadController =
          true;

        return;
      }

      /*
       * 촬영·캡션 작성·영상 업로드 중에는
       * 새 서비스워커 때문에 페이지를
       * 강제로 새로고침하지 않는다.
       *
       * 동시에 RecordPage에서는 IndexedDB에
       * 촬영본을 보존하므로 예기치 않은 새로고침에도
       * 복구 가능하다.
       */
      if (
        isRecordOperationActive()
      ) {
        console.info(
          "기록 작업 중이므로 서비스워커 자동 새로고침을 보류합니다.",
        );

        return;
      }

      if (
        isRefreshing
      ) {
        return;
      }

      isRefreshing =
        true;

      window.location.reload();
    },
  );

  document.addEventListener(
    "visibilitychange",
    () => {
      if (
        document.visibilityState ===
        "visible"
      ) {
        void checkForUpdates(
          registration,
        );
      }
    },
  );

  window.addEventListener(
    "focus",
    () => {
      void checkForUpdates(
        registration,
      );
    },
  );

  window.addEventListener(
    "online",
    () => {
      void checkForUpdates(
        registration,
      );
    },
  );

  window.setInterval(
    () => {
      if (
        document.visibilityState ===
        "visible"
      ) {
        void checkForUpdates(
          registration,
        );
      }
    },
    UPDATE_INTERVAL,
  );

  void checkForUpdates(
    registration,
  );
}

export function registerFirebaseServiceWorker():
  Promise<ServiceWorkerRegistration> {
  if (
    !(
      "serviceWorker" in
      navigator
    )
  ) {
    return Promise.reject(
      new Error(
        "현재 브라우저는 Service Worker를 지원하지 않습니다.",
      ),
    );
  }

  if (
    registrationPromise
  ) {
    return registrationPromise;
  }

  const isProduction =
    import.meta.env.PROD;

  const serviceWorkerUrl =
    isProduction
      ? "/firebase-messaging-sw.js"
      : "/dev-sw.js?dev-sw";

  registrationPromise =
    navigator.serviceWorker
      .register(
        serviceWorkerUrl,
        {
          scope:
            "/",

          type:
            isProduction
              ? "classic"
              : "module",

          updateViaCache:
            "none",
        },
      )
      .then(
        (
          registration,
        ) => {
          initializeUpdateListeners(
            registration,
          );

          return registration;
        },
      )
      .catch(
        (error) => {
          registrationPromise =
            null;

          throw error;
        },
      );

  return registrationPromise;
}