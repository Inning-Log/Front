import {
  getAccessToken,
  getRefreshToken,
  getTokenType,
  saveAuthSession,
} from "../auth/authSession";

import {
  clearAuthSession,
} from "../auth/clearAuthSession";

const API_BASE_PATH =
  "/api";

export const AUTH_SESSION_REFRESHED_EVENT =
  "inninglog:auth-session-refreshed";

type ApiClientOptions =
  Omit<
    RequestInit,
    "body" | "headers"
  > & {
    auth?: boolean;
    body?: unknown;
    fallbackErrorMessage?: string;
    headers?: HeadersInit;

    params?: Record<
      string,
      | boolean
      | number
      | string
      | null
      | undefined
    >;
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

let refreshRequest:
  Promise<boolean> | null =
    null;

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
    super(
      message,
    );

    this.name =
      "ApiError";

    this.code =
      code;

    this.status =
      status;
  }
}

function resolveApiUrl(
  path: string,
) {
  if (
    /^https?:\/\//.test(
      path,
    )
  ) {
    return path;
  }

  const normalizedPath =
    path.startsWith(
      "/",
    )
      ? path
      : `/${path}`;

  if (
    normalizedPath ===
      API_BASE_PATH ||
    normalizedPath.startsWith(
      `${API_BASE_PATH}/`,
    )
  ) {
    return normalizedPath;
  }

  return `${API_BASE_PATH}${normalizedPath}`;
}

function appendParams(
  url: string,
  params?:
    ApiClientOptions["params"],
) {
  if (!params) {
    return url;
  }

  const searchParams =
    new URLSearchParams();

  Object.entries(
    params,
  ).forEach(
    (
      [
        key,
        value,
      ],
    ) => {
      if (
        value ===
          null ||
        value ===
          undefined
      ) {
        return;
      }

      searchParams.set(
        key,
        String(
          value,
        ),
      );
    },
  );

  const queryString =
    searchParams.toString();

  if (
    !queryString
  ) {
    return url;
  }

  return `${url}${url.includes("?") ? "&" : "?"}${queryString}`;
}

function getAuthHeader() {
  const accessToken =
    getAccessToken();

  if (!accessToken) {
    return null;
  }

  return `${getTokenType()} ${accessToken}`;
}

function isInvalidRefreshResponse(
  status: number,
) {
  /*
   * 실제 인증 정보가 유효하지 않은 경우에만
   * 로컬 세션을 삭제한다.
   *
   * 5xx나 네트워크 오류는 서버 장애일 수 있으므로
   * 로그인 정보를 유지한다.
   */
  return (
    status === 400 ||
    status === 401 ||
    status === 403
  );
}

function notifyAuthSessionRefreshed() {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  window.dispatchEvent(
    new Event(
      AUTH_SESSION_REFRESHED_EVENT,
    ),
  );
}

function refreshAuthSession() {
  if (
    refreshRequest
  ) {
    return refreshRequest;
  }

  refreshRequest =
    (async () => {
      const refreshToken =
        getRefreshToken();

      if (!refreshToken) {
        return false;
      }

      try {
        const response =
          await fetch(
            resolveApiUrl(
              "/auth/refresh",
            ),
            {
              body:
                JSON.stringify(
                  {
                    refreshToken,
                  },
                ),

              headers: {
                "Content-Type":
                  "application/json",
              },

              method:
                "POST",
            },
          );

        if (
          !response.ok
        ) {
          if (
            isInvalidRefreshResponse(
              response.status,
            )
          ) {
            await clearAuthSession();
          }

          return false;
        }

        const tokens =
          (await response.json()) as
            TokenRefreshResponse;

        if (
          !tokens.accessToken ||
          !tokens.refreshToken ||
          !tokens.accessTokenExpiresAt ||
          !tokens.refreshTokenExpiresAt
        ) {
          /*
           * 서버의 비정상 응답 때문에
           * 사용자를 즉시 로그아웃시키지 않는다.
           */
          return false;
        }

        saveAuthSession(
          tokens,
        );

        notifyAuthSessionRefreshed();

        return true;
      } catch (
        error
      ) {
        /*
         * 네트워크 단절 등의 일시 오류.
         *
         * 기존 로그인 정보는 보존하고
         * 다음 API 요청에서 다시 refresh 가능하게 한다.
         */
        console.error(
          "토큰 갱신 요청 실패:",
          error,
        );

        return false;
      }
    })().finally(
      () => {
        refreshRequest =
          null;
      },
    );

  return refreshRequest;
}

async function parseErrorMessage(
  response: Response,
  fallbackMessage: string,
) {
  try {
    const data =
      (await response.json()) as
        ApiErrorResponse;

    return {
      code:
        data.code,

      message:
        data.message ??
        data.error ??
        fallbackMessage,
    };
  } catch {
    return {
      message:
        fallbackMessage,
    };
  }
}

async function parseResponse<TResponse>(
  response: Response,
) {
  if (
    response.status ===
    204
  ) {
    return undefined as
      TResponse;
  }

  const contentType =
    response.headers.get(
      "content-type",
    );

  if (
    contentType?.includes(
      "application/json",
    )
  ) {
    return response.json() as
      Promise<TResponse>;
  }

  return response.text() as
    Promise<TResponse>;
}

export async function apiClient<TResponse>(
  path: string,
  {
    auth = true,
    body,
    fallbackErrorMessage =
      "요청에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    headers,
    params,
    ...requestInit
  }: ApiClientOptions = {},
) {
  const requestHeaders =
    new Headers(
      headers,
    );

  const hasBody =
    body !==
    undefined;

  const isFormDataBody =
    body instanceof
    FormData;

  if (
    hasBody &&
    !isFormDataBody &&
    !requestHeaders.has(
      "Content-Type",
    )
  ) {
    requestHeaders.set(
      "Content-Type",
      "application/json",
    );
  }

  if (
    auth &&
    !requestHeaders.has(
      "Authorization",
    )
  ) {
    const authHeader =
      getAuthHeader();

    if (authHeader) {
      requestHeaders.set(
        "Authorization",
        authHeader,
      );
    }
  }

  const url =
    appendParams(
      resolveApiUrl(
        path,
      ),
      params,
    );

  const requestBody =
    isFormDataBody
      ? body
      : hasBody
        ? JSON.stringify(
            body,
          )
        : undefined;

  const sendRequest =
    () =>
      fetch(
        url,
        {
          ...requestInit,

          body:
            requestBody,

          headers:
            requestHeaders,
        },
      );

  let response =
    await sendRequest();

  if (
    auth &&
    response.status ===
      401 &&
    (await refreshAuthSession())
  ) {
    const refreshedAuthHeader =
      getAuthHeader();

    if (
      refreshedAuthHeader
    ) {
      requestHeaders.set(
        "Authorization",
        refreshedAuthHeader,
      );

      response =
        await sendRequest();
    }
  }

  if (
    !response.ok
  ) {
    const {
      code,
      message,
    } =
      await parseErrorMessage(
        response,
        fallbackErrorMessage,
      );

    throw new ApiError({
      code,
      message,
      status:
        response.status,
    });
  }

  return parseResponse<TResponse>(
    response,
  );
}