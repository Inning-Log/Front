const PUSH_INSTALLATION_ID_KEY = "firebaseInstallationId";

export function savePushInstallationId(
  installationId: string,
) {
  localStorage.setItem(
    PUSH_INSTALLATION_ID_KEY,
    installationId,
  );
}

export function getPushInstallationId() {
  return localStorage.getItem(
    PUSH_INSTALLATION_ID_KEY,
  );
}