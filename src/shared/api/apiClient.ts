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
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    return null;
  }

  const tokenType = localStorage.getItem("tokenType") || "Bearer";

  return `${tokenType} ${accessToken}`;
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

  const response = await fetch(appendParams(resolveApiUrl(path), params), {
    ...requestInit,
    body: isFormDataBody ? body : hasBody ? JSON.stringify(body) : undefined,
    headers: requestHeaders,
  });

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
