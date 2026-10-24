/// <reference lib="webworker" />
/// <reference types="vite/client" />

import {
  initializeApp,
} from "firebase/app";

import {
  getMessaging,
  onBackgroundMessage,
} from "firebase/messaging/sw";

import {
  clientsClaim,
} from "workbox-core";

import {
  cleanupOutdatedCaches,
  matchPrecache,
  precacheAndRoute,
} from "workbox-precaching";

import {
  registerRoute,
} from "workbox-routing";

import {
  NetworkFirst,
} from "workbox-strategies";

declare let self:
  ServiceWorkerGlobalScope & {
    __WB_MANIFEST:
      Array<{
        url: string;
        revision?:
          string | null;
      }>;
  };

self.skipWaiting();
clientsClaim();

const navigationStrategy =
  new NetworkFirst({
    cacheName:
      "inninglog-pages-v1",
    networkTimeoutSeconds:
      5,
  });

registerRoute(
  (
    {
      request,
    },
  ) =>
    request.mode ===
    "navigate",

  async ({
    event,
    request,
  }) => {
    try {
      return await navigationStrategy.handle(
        {
          event,
          request,
        },
      );
    } catch {
      const cachedPage =
        await matchPrecache(
          "/index.html",
        );

      if (
        cachedPage
      ) {
        return cachedPage;
      }

      return Response.error();
    }
  },
);

cleanupOutdatedCaches();
precacheAndRoute(
  self.__WB_MANIFEST,
);

const firebaseApp =
  initializeApp({
    apiKey:
      import.meta.env
        .VITE_FIREBASE_API_KEY,

    authDomain:
      import.meta.env
        .VITE_FIREBASE_AUTH_DOMAIN,

    projectId:
      import.meta.env
        .VITE_FIREBASE_PROJECT_ID,

    storageBucket:
      import.meta.env
        .VITE_FIREBASE_STORAGE_BUCKET,

    messagingSenderId:
      import.meta.env
        .VITE_FIREBASE_MESSAGING_SENDER_ID,

    appId:
      import.meta.env
        .VITE_FIREBASE_APP_ID,
  });

const messaging =
  getMessaging(
    firebaseApp,
  );

const DB_NAME =
  "inninglog-push";

const STORE_NAME =
  "settings";

const DB_VERSION =
  1;

function openDatabase():
  Promise<IDBDatabase> {
  return new Promise(
    (
      resolve,
      reject,
    ) => {
      const request =
        indexedDB.open(
          DB_NAME,
          DB_VERSION,
        );

      request.onupgradeneeded =
        () => {
          const database =
            request.result;

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

      request.onsuccess =
        () => {
          resolve(
            request.result,
          );
        };

      request.onerror =
        () => {
          reject(
            request.error,
          );
        };
    },
  );
}

async function setValue(
  key: string,
  value: unknown,
) {
  const database =
    await openDatabase();

  return new Promise<void>(
    (
      resolve,
      reject,
    ) => {
      const transaction =
        database.transaction(
          STORE_NAME,
          "readwrite",
        );

      const store =
        transaction.objectStore(
          STORE_NAME,
        );

      store.put(
        value,
        key,
      );

      transaction.oncomplete =
        () => {
          database.close();
          resolve();
        };

      transaction.onerror =
        () => {
          database.close();

          reject(
            transaction.error,
          );
        };
    },
  );
}

async function getValue<T>(
  key: string,
): Promise<
  T | undefined
> {
  const database =
    await openDatabase();

  return new Promise<
    T | undefined
  >(
    (
      resolve,
      reject,
    ) => {
      const transaction =
        database.transaction(
          STORE_NAME,
          "readonly",
        );

      const store =
        transaction.objectStore(
          STORE_NAME,
        );

      const request =
        store.get(
          key,
        );

      request.onsuccess =
        () => {
          resolve(
            request.result as
              | T
              | undefined,
          );
        };

      transaction.oncomplete =
        () => {
          database.close();
        };

      transaction.onerror =
        () => {
          database.close();

          reject(
            transaction.error,
          );
        };
    },
  );
}

self.addEventListener(
  "message",
  (
    event:
      ExtendableMessageEvent,
  ) => {
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

async function markNotificationAsHandled(
  notificationId:
    string,
) {
  const handledIds =
    (
      await getValue<
        string[]
      >(
        "handledNotificationIds",
      )
    ) ?? [];

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
  ].slice(
    0,
    100,
  );

  await setValue(
    "handledNotificationIds",
    nextIds,
  );

  return true;
}

function parsePositiveIntegerString(
  value?: string,
) {
  if (!value) {
    return null;
  }

  const parsed =
    Number(value);

  if (
    !Number.isSafeInteger(
      parsed,
    ) ||
    parsed <= 0
  ) {
    return null;
  }

  return String(
    parsed,
  );
}

/**
 * 서버가 절대 URL 또는 /timeline/... 같은 상대 경로를
 * 보내도 현재 프론트 origin 기준으로 안전하게 해석한다.
 */
function getSafeLink(
  link?: string,
): URL | null {
  if (!link) {
    return null;
  }

  try {
    const sourceUrl =
      new URL(
        link,
        self.location.origin,
      );

    if (
      sourceUrl.protocol !==
        "https:" &&
      sourceUrl.protocol !==
        "http:"
    ) {
      return null;
    }

    /*
     * 서버가 Production origin의 절대 URL을 보내더라도
     * 현재 실행 중인 앱 origin에서 같은 pathname/query를 연다.
     * Preview/localhost 검증에서도 동일하게 동작한다.
     */
    return new URL(
      `${sourceUrl.pathname}${sourceUrl.search}${sourceUrl.hash}`,
      self.location.origin,
    );
  } catch {
    return null;
  }
}

function buildNotificationLink(
  data:
    Record<
      string,
      string
    >,
) {
  const safeUrl =
    getSafeLink(
      data.link,
    );

  if (!safeUrl) {
    return null;
  }

  if (
    data.type ===
    "TIMELINE_COMMENT"
  ) {
    const recordId =
      parsePositiveIntegerString(
        data.recordId,
      );

    const videoId =
      parsePositiveIntegerString(
        data.videoId,
      );

    const commentId =
      parsePositiveIntegerString(
        data.commentId,
      );

    if (recordId) {
      safeUrl.searchParams.set(
        "recordId",
        recordId,
      );
    }

    if (videoId) {
      safeUrl.searchParams.set(
        "videoId",
        videoId,
      );
    }

    if (commentId) {
      safeUrl.searchParams.set(
        "commentId",
        commentId,
      );
    }
  }

  return safeUrl.toString();
}

onBackgroundMessage(
  messaging,
  async (
    payload,
  ) => {
    const data =
      payload.data;

    if (!data) {
      return;
    }

    const currentUserId =
      await getValue<string>(
        "currentUserId",
      );

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

    if (
      !notificationId
    ) {
      return;
    }

    const shouldHandle =
      await markNotificationAsHandled(
        notificationId,
      );

    if (
      !shouldHandle
    ) {
      return;
    }

    const title =
      payload.notification
        ?.title ??
      data.title ??
      "이닝로그";

    const body =
      payload.notification
        ?.body ??
      data.body ??
      "";

    const link =
      buildNotificationLink(
        data,
      );

    await self.registration.showNotification(
      title,
      {
        body,
        tag:
          notificationId,
        data: {
          link,
          notificationId,

          recordId:
            data.recordId,
          videoId:
            data.videoId,
          commentId:
            data.commentId,
        },
      },
    );
  },
);

self.addEventListener(
  "notificationclick",
  (
    event:
      NotificationEvent,
  ) => {
    event.notification.close();

    const link =
      event.notification.data
        ?.link;

    if (
      typeof link !==
        "string" ||
      !link
    ) {
      return;
    }

    const safeUrl =
      getSafeLink(
        link,
      );

    if (
      !safeUrl
    ) {
      return;
    }

    const safeLink =
      safeUrl.toString();

    event.waitUntil(
      self.clients
        .matchAll({
          type:
            "window",
          includeUncontrolled:
            true,
        })
        .then(
          async (
            clientList,
          ) => {
            for (
              const client of
              clientList
            ) {
              const clientUrl =
                new URL(
                  client.url,
                );

              if (
                clientUrl.origin ===
                safeUrl.origin
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
          },
        ),
    );
  },
);
