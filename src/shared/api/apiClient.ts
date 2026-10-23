import {
  getAccessToken,
  getRefreshToken,
  getTokenType,
  saveAuthSession,
} from "../auth/authSession";
import { clearAuthSession } from "../auth/clearAuthSession";

const API_BASE_PATH = "/api";

type ApiClientOptions = Omit<RequestInit, "body" | "headers"> & {
  auth?: boolean;
  body?: unknown;
  fallbackErrorMessage?: string;
  headers?: HeadersInit;
  params?: Record<string, boolean | number | string | null | undefined>;
};

type ApiErrorResponse = {
  code?: string;
  error?: string;
  message?: string;
};

type TokenRefreshResponse = {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  tokenType: string;
};

let refreshRequest: Promise<boolean> | null = null;

export class ApiError extends Error {
  code?: string;
  status: number;

  constructor({
    code,
    message,
    status,
  }: {
    code?: string;
    message: string;
    status: number;
  }) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

function resolveApiUrl(path: string) {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (
    normalizedPath === API_BASE_PATH ||
    normalizedPath.startsWith(`${API_BASE_PATH}/`)
  ) {
    return normalizedPath;
  }

  return `${API_BASE_PATH}${normalizedPath}`;
}

function appendParams(
  url: string,
  params?: ApiClientOptions["params"],
) {
  if (!params) {
    return url;
  }

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }

    searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();

  if (!queryString) {
    return url;
  }

  return `${url}${url.includes("?") ? "&" : "?"}${queryString}`;
}

function getAuthHeader() {
  const accessToken = getAccessToken();

  if (!accessToken) {
    return null;
  }

  return `${getTokenType()} ${accessToken}`;
}

function refreshAuthSession() {
  if (refreshRequest) {
    return refreshRequest;
  }

  refreshRequest = (async () => {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch(resolveApiUrl("/auth/refresh"), {
        body: JSON.stringify({ refreshToken }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        await clearAuthSession();
        return false;
      }

      const tokens = (await response.json()) as TokenRefreshResponse;

      if (
        !tokens.accessToken ||
        !tokens.refreshToken ||
        !tokens.accessTokenExpiresAt ||
        !tokens.refreshTokenExpiresAt
      ) {
        await clearAuthSession();
        return false;
      }

      saveAuthSession(tokens);
      return true;
    } catch {
      return false;
    }
  })().finally(() => {
    refreshRequest = null;
  });

  return refreshRequest;
}

async function parseErrorMessage(
  response: Response,
  fallbackMessage: string,
) {
  try {
    const data = (await response.json()) as ApiErrorResponse;

    return {
      code: data.code,
      message: data.message ?? data.error ?? fallbackMessage,
    };
  } catch {
    return {
      message: fallbackMessage,
    };
  }
}

async function parseResponse<TResponse>(response: Response) {
  if (response.status === 204) {
    return undefined as TResponse;
  }

  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return response.json() as Promise<TResponse>;
  }

  return response.text() as Promise<TResponse>;
}

export async function apiClient<TResponse>(
  path: string,
  {
    auth = true,
    body,
    fallbackErrorMessage = "요청에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    headers,
    params,
    ...requestInit
  }: ApiClientOptions = {},
) {
  const requestHeaders = new Headers(headers);
  const hasBody = body !== undefined;
  const isFormDataBody = body instanceof FormData;

  if (hasBody && !isFormDataBody && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (auth && !requestHeaders.has("Authorization")) {
    const authHeader = getAuthHeader();

    if (authHeader) {
      requestHeaders.set("Authorization", authHeader);
    }
  }

  const url = appendParams(resolveApiUrl(path), params);
  const requestBody = isFormDataBody
    ? body
    : hasBody
      ? JSON.stringify(body)
      : undefined;
  const sendRequest = () =>
    fetch(url, {
      ...requestInit,
      body: requestBody,
      headers: requestHeaders,
    });

  let response = await sendRequest();

  if (auth && response.status === 401 && (await refreshAuthSession())) {
    const refreshedAuthHeader = getAuthHeader();

    if (refreshedAuthHeader) {
      requestHeaders.set("Authorization", refreshedAuthHeader);
      response = await sendRequest();
    }
  }

  if (!response.ok) {
    const { code, message } = await parseErrorMessage(
      response,
      fallbackErrorMessage,
    );

    throw new ApiError({
      code,
      message,
      status: response.status,
    });
  }

  return parseResponse<TResponse>(response);
}
