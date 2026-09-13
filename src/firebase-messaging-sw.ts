/// <reference lib="webworker" />
/// <reference types="vite/client" />

import { initializeApp } from "firebase/app";
import {
  getMessaging,
  onBackgroundMessage,
} from "firebase/messaging/sw";
import {
  cleanupOutdatedCaches,
  precacheAndRoute,
} from "workbox-precaching";

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{
    url: string;
    revision?: string | null;
  }>;
};

cleanupOutdatedCaches();

precacheAndRoute(self.__WB_MANIFEST);

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
        database.close();

        resolve(
          request.result as
            | T
            | undefined,
        );
      };

      request.onerror = () => {
        database.close();
        reject(request.error);
      };
    },
  );
}

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

onBackgroundMessage(
  messaging,
  async (payload) => {
    const data = payload.data;

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

    if (!notificationId) {
      return;
    }

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