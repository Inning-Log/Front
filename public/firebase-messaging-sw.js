importScripts(
  "https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js",
);

importScripts(
  "https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js",
);

const params = new URL(
  self.location.href,
).searchParams;

firebase.initializeApp({
  apiKey: params.get("apiKey"),
  authDomain: params.get("authDomain"),
  projectId: params.get("projectId"),
  storageBucket: params.get("storageBucket"),
  messagingSenderId: params.get(
    "messagingSenderId",
  ),
  appId: params.get("appId"),
});

const messaging = firebase.messaging();

const DB_NAME = "inninglog-push";
const STORE_NAME = "settings";
const DB_VERSION = 1;

function openDatabase() {
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

async function setValue(key, value) {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
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

    transaction.oncomplete = resolve;
    transaction.onerror = () =>
      reject(transaction.error);
  });
}

async function getValue(key) {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
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

    request.onsuccess = () =>
      resolve(request.result);

    request.onerror = () =>
      reject(request.error);
  });
}

self.addEventListener(
  "message",
  (event) => {
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
  notificationId,
) {
  const handledIds =
    (await getValue(
      "handledNotificationIds",
    )) ?? [];

  if (
    handledIds.includes(notificationId)
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

function getSafeLink(link) {
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

messaging.onBackgroundMessage(
  async (payload) => {
    const data = payload.data;

    if (!data) {
      return;
    }

    const currentUserId =
      await getValue("currentUserId");

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

    const link = getSafeLink(data.link);

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
  (event) => {
    event.notification.close();

    const link =
      event.notification.data?.link;

    if (!link) {
      return;
    }

    event.waitUntil(
      clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      }).then(async (clientList) => {
        const targetUrl = new URL(link);

        for (const client of clientList) {
          const clientUrl = new URL(
            client.url,
          );

          if (
            clientUrl.origin ===
            targetUrl.origin
          ) {
            await client.focus();
            return client.navigate(link);
          }
        }

        return clients.openWindow(link);
      }),
    );
  },
);