const GOOGLE_IDENTITY_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleButtonConfig = {
  type: "standard" | "icon";
  theme: "outline" | "filled_blue" | "filled_black";
  size: "large" | "medium" | "small";
  shape: "rectangular" | "pill" | "circle" | "square";
  text: "signin_with" | "signup_with" | "continue_with" | "signin";
  width: number;
  locale?: string;
};

type GoogleAccounts = {
  id: {
    initialize: (config: {
      client_id: string;
      callback: (response: GoogleCredentialResponse) => void;
    }) => void;
    renderButton: (parent: HTMLElement, config: GoogleButtonConfig) => void;
    disableAutoSelect: () => void;
  };
};

declare global {
  interface Window {
    google?: {
      accounts: GoogleAccounts;
    };
  }
}

let googleIdentityScriptPromise: Promise<void> | null = null;

export function loadGoogleIdentityScript() {
  if (window.google?.accounts) {
    return Promise.resolve();
  }

  if (googleIdentityScriptPromise) {
    return googleIdentityScriptPromise;
  }

  googleIdentityScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${GOOGLE_IDENTITY_SCRIPT_SRC}"]`,
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_IDENTITY_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject();
    document.head.appendChild(script);
  });

  return googleIdentityScriptPromise;
}

export function renderGoogleLoginButton(
  parent: HTMLElement,
  onCredential: (credential: string) => void,
) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error("Google Client ID가 설정되어 있지 않습니다.");
  }

  if (!window.google?.accounts) {
    throw new Error("Google 로그인 스크립트를 불러오지 못했습니다.");
  }

  parent.innerHTML = "";

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response) => {
      if (response.credential) {
        onCredential(response.credential);
      }
    },
  });

  window.google.accounts.id.renderButton(parent, {
    type: "standard",
    theme: "filled_black",
    size: "large",
    shape: "pill",
    text: "continue_with",
    width: 358,
    locale: "ko",
  });
}
