import type {
  CreateInningRecordRequest,
} from "../types/inningRecord";

export type CapturedRecordContext = {
  gameId: number;
  inning: number;
  half: string;
  recordedAt: string;
  clientRecordId: string;
};

export type PersistedRecordDraft = {
  context:
    CapturedRecordContext;

  video: Blob;

  caption: string;

  createRequest:
    CreateInningRecordRequest | null;

  recordId:
    number | null;

  updatedAt: string;
};

const DB_NAME =
  "inninglog-record-draft";

const STORE_NAME =
  "drafts";

const DB_VERSION =
  1;

const CURRENT_DRAFT_KEY =
  "current";

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

export async function saveRecordDraft(
  draft:
    PersistedRecordDraft,
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
        draft,
        CURRENT_DRAFT_KEY,
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

export async function getRecordDraft():
  Promise<
    PersistedRecordDraft | null
  > {
  const database =
    await openDatabase();

  return new Promise(
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
          CURRENT_DRAFT_KEY,
        );

      request.onsuccess =
        () => {
          resolve(
            (request.result as
              | PersistedRecordDraft
              | undefined) ??
              null,
          );
        };

      request.onerror =
        () => {
          reject(
            request.error,
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

export async function clearRecordDraft() {
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

      store.delete(
        CURRENT_DRAFT_KEY,
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