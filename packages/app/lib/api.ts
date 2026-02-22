import { getToken, getCustomApiUrl } from "./storage";

function getDefaultApiBase(): string {
  const env = process.env.EXPO_PUBLIC_API_URL;
  if (env) return env + "/api/v1";
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin + "/api/v1";
  }
  return "http://localhost:3001/api/v1";
}

const DEFAULT_API_BASE = getDefaultApiBase();

async function getApiBase(): Promise<string> {
  const custom = await getCustomApiUrl();
  return custom ? custom.replace(/\/$/, "") + "/api/v1" : DEFAULT_API_BASE;
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const [token, apiBase] = await Promise.all([getToken(), getApiBase()]);
  const { method = "GET", body, headers = {} } = options;

  const res = await fetch(`${apiBase}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, error.message ?? "Request failed");
  }

  return res.json();
}

export type ServerInfo = {
  name: string;
  version: string;
  registrationEnabled: boolean;
};

export async function fetchServerInfo(baseUrl: string): Promise<ServerInfo | null> {
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/v1/server/info`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
