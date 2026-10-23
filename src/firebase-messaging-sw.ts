/// <reference lib="webworker" />
/// <reference types="vite/client" />

import { initializeApp } from "firebase/app";
import {
  getMessaging,
  onBackgroundMessage,
} from "firebase/messaging/sw";

import { clientsClaim } from "workbox-core";

import {
  cleanupOutdatedCaches,
  precacheAndRoute,
  matchPrecache,
} from "workbox-precaching";

import { registerRoute } from "workbox-routing";
import { NetworkFirst } from "workbox-strategies";

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{
    url: string;
    revision?: string | null;
  }>;
};

// ========================================
// PWA 서비스워커 자동 업데이트
// ========================================

// 새 서비스워커 설치 후 즉시 활성화
self.skipWaiting();

// 새 서비스워커가 기존 페이지 제어
clientsClaim();

// ========================================
// HTML 네트워크 우선 캐싱
// ========================================

const navigationStrategy = new NetworkFirst({
  cacheName: "inninglog-pages-v1",
  networkTimeoutSeconds: 5,
});

// HTML 요청은 네트워크 우선
registerRoute(
  ({ request }) => request.mode === "navigate",

  async ({ event, request }) => {
    try {
      return await navigationStrategy.handle({
        event,
        request,
      });
    } catch {
      // 네트워크 실패 시 PWA HTML 캐시 사용
      const cachedPage =
        await matchPrecache("/index.html");

      if (cachedPage) {
        return cachedPage;
      }

      return Response.error();
    }
  },
);
// ========================================
// 정적 파일 캐싱
// ========================================

// 이전 버전의 불필요한 Workbox 캐시 정리
cleanupOutdatedCaches();

// JS, CSS, 이미지 등 빌드 파일 캐싱
precacheAndRoute(self.__WB_MANIFEST);

// ========================================
// Firebase 초기화
// ========================================

const firebaseApp = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,

  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,

  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID,

  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,

  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,

  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});

const messaging = getMessaging(firebaseApp);

// ========================================
// IndexedDB 설정
// ========================================

const DB_NAME = "inninglog-push";
const STORE_NAME = "settings";
const DB_VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(
      DB_NAME,
      DB_VERSION,
    );

    request.onupgradeneeded = () => {
      const database = request.result;

      if (
        !database.objectStoreNames.contains(
          STORE_NAME,
        )
      ) {
        database.createObjectStore(
          STORE_NAME,
        );
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// ========================================
// IndexedDB 값 저장
// ========================================

async function setValue(
  key: string,
  value: unknown,
) {
  const database = await openDatabase();

  return new Promise<void>(
    (resolve, reject) => {
      const transaction =
        database.transaction(
          STORE_NAME,
          "readwrite",
        );

      const store =
        transaction.objectStore(
          STORE_NAME,
        );

      store.put(value, key);

      transaction.oncomplete = () => {
        database.close();
        resolve();
      };

      transaction.onerror = () => {
        database.close();
        reject(transaction.error);
      };
    },
  );
}

// ========================================
// IndexedDB 값 조회
// ========================================

async function getValue<T>(
  key: string,
): Promise<T | undefined> {
  const database = await openDatabase();

  return new Promise<T | undefined>(
    (resolve, reject) => {
      const transaction =
        database.transaction(
          STORE_NAME,
          "readonly",
        );

      const store =
        transaction.objectStore(
          STORE_NAME,
        );

      const request = store.get(key);

      request.onsuccess = () => {
        resolve(
          request.result as T | undefined,
        );
      };

      transaction.oncomplete = () => {
        database.close();
      };

      transaction.onerror = () => {
        database.close();
        reject(transaction.error);
      };
    },
  );
}

// ========================================
// 현재 로그인 사용자 ID 동기화
// ========================================

self.addEventListener(
  "message",
  (event: ExtendableMessageEvent) => {
    if (
      event.data?.type !==
      "SET_CURRENT_USER_ID"
    ) {
      return;
    }

    event.waitUntil(
      setValue(
        "currentUserId",
        event.data.userId,
      ),
    );
  },
);

// ========================================
// 중복 알림 방지
// ========================================

async function markNotificationAsHandled(
  notificationId: string,
) {
  const handledIds =
    (await getValue<string[]>(
      "handledNotificationIds",
    )) ?? [];

  if (
    handledIds.includes(
      notificationId,
    )
  ) {
    return false;
  }

  const nextIds = [
    notificationId,
    ...handledIds,
  ].slice(0, 100);

  await setValue(
    "handledNotificationIds",
    nextIds,
  );

  return true;
}

// ========================================
// 안전한 알림 이동 링크 검증
// ========================================

function getSafeLink(
  link?: string,
): string | null {
  if (!link) {
    return null;
  }

  try {
    const url = new URL(link);

    if (url.protocol !== "https:") {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

// ========================================
// Firebase 백그라운드 알림 처리
// ========================================

onBackgroundMessage(
  messaging,
  async (payload) => {
    const data = payload.data;

    if (!data) {
      return;
    }

    // 현재 로그인 사용자 확인
    const currentUserId =
      await getValue<string>(
        "currentUserId",
      );

    // 다른 사용자 알림 차단
    if (
      !currentUserId ||
      !data.audienceUserId ||
      data.audienceUserId !==
        currentUserId
    ) {
      return;
    }

    const notificationId =
      data.notificationId;

    if (!notificationId) {
      return;
    }

    // 중복 알림 방지
    const shouldHandle =
      await markNotificationAsHandled(
        notificationId,
      );

    if (!shouldHandle) {
      return;
    }

    const title =
      payload.notification?.title ??
      data.title ??
      "이닝로그";

    const body =
      payload.notification?.body ??
      data.body ??
      "";

    const link = getSafeLink(
      data.link,
    );

    // 푸시 알림 표시
    await self.registration.showNotification(
      title,
      {
        body,
        tag: notificationId,
        data: {
          link,
          notificationId,
        },
      },
    );
  },
);

// ========================================
// 푸시 알림 클릭 이벤트
// ========================================

self.addEventListener(
  "notificationclick",
  (event: NotificationEvent) => {
    event.notification.close();

    const link =
      event.notification.data?.link;

    if (
      typeof link !== "string" ||
      !link
    ) {
      return;
    }

    const safeLink =
      getSafeLink(link);

    if (!safeLink) {
      return;
    }

    event.waitUntil(
      self.clients
        .matchAll({
          type: "window",
          includeUncontrolled: true,
        })
        .then(async (clientList) => {
          const targetUrl =
            new URL(safeLink);

          for (const client of clientList) {
            const clientUrl =
              new URL(client.url);

            if (
              clientUrl.origin ===
              targetUrl.origin
            ) {
              await client.focus();

              return client.navigate(
                safeLink,
              );
            }
          }

          return self.clients.openWindow(
            safeLink,
          );
        }),
    );
  },
);