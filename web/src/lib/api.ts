import type { Connection, Message, Session, StreamEvent } from "./types";

const DEFAULT_BASE_URL =
  process.env.NEXT_PUBLIC_OPENCODE_BACKEND_URL || "http://localhost:4096";

export function getStoredConnection(): Connection | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem("opencode.connection");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Connection;
    if (!parsed.baseUrl) return null;
    return {
      baseUrl: parsed.baseUrl,
      username: parsed.username || "opencode",
      password: parsed.password || "",
    };
  } catch {
    return null;
  }
}

export function storeConnection(conn: Connection): void {
  window.localStorage.setItem("opencode.connection", JSON.stringify(conn));
}

export function clearStoredConnection(): void {
  window.localStorage.removeItem("opencode.connection");
}

function authHeader(conn: Connection): string {
  return "Basic " + btoa(`${conn.username}:${conn.password}`);
}

async function apiFetch(
  conn: Connection,
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const url = (conn.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, "") + path;
  const headers: Record<string, string> = {
    Authorization: authHeader(conn),
    ...(init.headers as Record<string, string> | undefined),
  };
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${body.slice(0, 300)}`);
  }
  return res;
}

export async function listSessions(conn: Connection): Promise<Session[]> {
  const res = await apiFetch(conn, "/session");
  return res.json();
}

export async function createSession(
  conn: Connection,
  title?: string
): Promise<Session> {
  const res = await apiFetch(conn, "/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(title ? { title } : {}),
  });
  return res.json();
}

export async function listMessages(
  conn: Connection,
  sessionId: string
): Promise<Message[]> {
  const res = await apiFetch(conn, `/session/${sessionId}/message`);
  return res.json();
}

export async function sendMessageAsync(
  conn: Connection,
  sessionId: string,
  model: { providerID: string; modelID: string },
  text: string
): Promise<void> {
  await apiFetch(conn, `/session/${sessionId}/prompt_async`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      parts: [{ type: "text", text }],
    }),
  });
}

export async function abortSession(
  conn: Connection,
  sessionId: string
): Promise<void> {
  await apiFetch(conn, `/session/${sessionId}/abort`, { method: "POST" });
}

export async function streamEvents(
  conn: Connection,
  onEvent: (event: StreamEvent) => void,
  signal: AbortSignal,
  onConnected?: () => void
): Promise<void> {
  const url = (conn.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, "") + "/event";
  const res = await fetch(url, {
    headers: { Authorization: authHeader(conn) },
    signal,
  });
  if (!res.ok || !res.body) {
    throw new Error(`${res.status} ${res.statusText} on /event`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line.startsWith("data: ")) continue;
        try {
          const event = JSON.parse(line.slice(6)) as StreamEvent;
          if (event.type === "server.connected") onConnected?.();
          onEvent(event);
        } catch {
          // ignorar líneas malformadas
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}