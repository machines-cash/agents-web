export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(options: { status: number; message: string; code?: string | null }) {
    super(options.message);
    this.name = "ApiRequestError";
    this.status = options.status;
    this.code = options.code ?? null;
  }
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const WRONG_HOST_MESSAGE =
  "API request hit a frontend host. Set NEXT_PUBLIC_API_BASE_URL to http://localhost:8080 or run API on port 8080.";

type BrowserLocationSnapshot = {
  protocol: string;
  hostname: string;
  origin: string;
};

function getBrowserLocationSnapshot(): BrowserLocationSnapshot | null {
  if (typeof window === "undefined" || !window.location) {
    return null;
  }
  return {
    protocol: window.location.protocol,
    hostname: window.location.hostname,
    origin: window.location.origin.replace(/\/$/, ""),
  };
}

function isPrivateIpv4(hostname: string) {
  const match = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    return false;
  }

  const octets = match.slice(1).map((value) => Number(value));
  if (octets.some((value) => Number.isNaN(value) || value < 0 || value > 255)) {
    return false;
  }

  const [first, second] = octets;
  if (first === 10 || first === 127) {
    return true;
  }
  if (first === 192 && second === 168) {
    return true;
  }
  if (first === 172 && second >= 16 && second <= 31) {
    return true;
  }
  return false;
}

function isLocalOrLanHostname(hostname: string) {
  const normalized = hostname.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  if (LOCAL_HOSTS.has(normalized)) {
    return true;
  }
  if (normalized.endsWith(".local")) {
    return true;
  }
  return isPrivateIpv4(normalized);
}

function buildOrigin(protocol: string, hostname: string, port: number) {
  return `${protocol}//${hostname}:${port}`;
}

function rewriteConfiguredLocalhostApiBase(configured: string) {
  const snapshot = getBrowserLocationSnapshot();
  if (!snapshot) {
    return configured;
  }

  try {
    const configuredUrl = new URL(configured);
    const configuredHost = configuredUrl.hostname.toLowerCase();
    const currentHost = snapshot.hostname.toLowerCase();
    const configuredIsLoopback = LOCAL_HOSTS.has(configuredHost);
    const currentIsLan = isLocalOrLanHostname(currentHost) && !LOCAL_HOSTS.has(currentHost);

    if (configuredIsLoopback && currentIsLan) {
      const port = configuredUrl.port ? Number(configuredUrl.port) : 8080;
      return buildOrigin(configuredUrl.protocol, currentHost, Number.isFinite(port) ? port : 8080);
    }
    return configuredUrl.origin.replace(/\/$/, "");
  } catch {
    return configured;
  }
}

function resolveLocalDevApiBase() {
  const snapshot = getBrowserLocationSnapshot();
  if (!snapshot) {
    return null;
  }
  if (!isLocalOrLanHostname(snapshot.hostname)) {
    return null;
  }
  return buildOrigin(snapshot.protocol, snapshot.hostname, 8080);
}

function normalizeNonJsonErrorMessage(text: string) {
  const trimmed = text.trim();
  const lowered = trimmed.toLowerCase();
  if (lowered.startsWith("<!doctype html") || lowered.startsWith("<html")) {
    return WRONG_HOST_MESSAGE;
  }
  return trimmed || "request failed";
}

export function resolveApiBase() {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (configured) {
    return rewriteConfiguredLocalhostApiBase(configured);
  }

  const localDev = resolveLocalDevApiBase();
  if (localDev) {
    return localDev;
  }

  throw new Error(
    "api base url is not configured. Set NEXT_PUBLIC_API_BASE_URL (example: http://localhost:8080).",
  );
}

export function resolveAppOrigin() {
  const origin = process.env.NEXT_PUBLIC_APP_ORIGIN?.replace(/\/$/, "");
  if (origin) {
    return origin;
  }

  const snapshot = getBrowserLocationSnapshot();
  if (snapshot && isLocalOrLanHostname(snapshot.hostname)) {
    return buildOrigin(snapshot.protocol, snapshot.hostname, 3000);
  }

  return "https://app.machines.cash";
}

export function resolveAgentOrigin() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/$/, "");
  }
  const origin = process.env.NEXT_PUBLIC_AGENT_ORIGIN?.replace(/\/$/, "");
  if (origin) {
    return origin;
  }
  return "https://agent.machines.cash";
}

export async function requestJson<T>(options: {
  path: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  token?: string;
  body?: unknown;
  signal?: AbortSignal;
}): Promise<T> {
  const apiBase = resolveApiBase();
  const response = await fetch(`${apiBase}${options.path}`, {
    method: options.method ?? "GET",
    headers: {
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (!response.ok) {
    if (isJson) {
      const payload = (await response.json()) as { message?: string; error?: string };
      throw new ApiRequestError({
        status: response.status,
        message: payload.message ?? payload.error ?? "request failed",
        code: payload.error ?? null,
      });
    }
    const text = normalizeNonJsonErrorMessage(await response.text());
    throw new ApiRequestError({
      status: response.status,
      message: text,
    });
  }

  if (!isJson) {
    throw new Error(normalizeNonJsonErrorMessage(await response.text()));
  }

  return (await response.json()) as T;
}
