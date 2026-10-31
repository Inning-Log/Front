export async function syncPushUserContext(
  userId: number | null,
) {
  if (
    !(
      "serviceWorker" in
      navigator
    )
  ) {
    return;
  }

  const message = {
    type:
      "SET_CURRENT_USER_ID",

    userId:
      userId === null
        ? null
        : String(
            userId,
          ),
  };

  /*
   * 현재 등록되어 있는 워커에도 우선 전달한다.
   */
  const registration =
    await navigator.serviceWorker.getRegistration(
      "/",
    );

  if (registration) {
    registration.active?.postMessage(
      message,
    );

    registration.waiting?.postMessage(
      message,
    );

    registration.installing?.postMessage(
      message,
    );
  }

  navigator.serviceWorker.controller?.postMessage(
    message,
  );

  /*
   * 서비스워커가 installing / activating 상태일 수 있으므로
   * 실제 active 상태가 될 때까지 기다린 뒤 다시 전달한다.
   */
  try {
    const readyRegistration =
      await navigator.serviceWorker.ready;

    readyRegistration.active?.postMessage(
      message,
    );
  } catch (error) {
    console.error(
      "서비스워커 사용자 정보 동기화 실패:",
      error,
    );
  }
}