"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SessionList from "./SessionList";
import ModelSelector from "./ModelSelector";
import Settings from "./Settings";
import MessageView from "./Message";
import { DEFAULT_MODEL } from "@/lib/models";
import { stripToolCalls } from "@/lib/text";
import type { Connection, Message, Session, StreamEvent } from "@/lib/types";
import {
  abortSession,
  clearStoredConnection,
  createSession,
  getStoredConnection,
  listMessages,
  listSessions,
  sendMessageAsync,
  storeConnection,
  streamEvents,
} from "@/lib/api";

export default function Chat() {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [modelId, setModelId] = useState(DEFAULT_MODEL.id);
  const [input, setInput] = useState("");
  const [streamText, setStreamText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const sortSessions = (s: Session[]) =>
    [...s].sort((a, b) => b.time.created - a.time.created);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- leer localStorage post-hydration (evita mismatch SSR)
    setConnection(getStoredConnection());
  }, []);

  useEffect(() => {
    if (!connection) return;
    listSessions(connection)
      .then((s) => setSessions(sortSessions(s)))
      .catch((e) => setError(String(e.message || e)));
  }, [connection]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamText]);

  const selectSession = useCallback(
    async (id: string) => {
      if (!connection) return;
      setActiveId(id);
      setMessages([]);
      setStreamText("");
      try {
        setMessages(await listMessages(connection, id));
      } catch (e) {
        setError(String((e as Error).message || e));
      }
    },
    [connection]
  );

  const newSession = useCallback(async () => {
    if (!connection) return;
    try {
      const s = await createSession(connection);
      setSessions((prev) => sortSessions([s, ...prev]));
      await selectSession(s.id);
    } catch (e) {
      setError(String((e as Error).message || e));
    }
  }, [connection, selectSession]);

  const stopStreaming = useCallback(() => {
    streamRef.current?.abort();
    streamRef.current = null;
    setIsStreaming(false);
  }, []);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || !connection || !activeId || isStreaming) return;
    setInput("");
    setError(null);

    const model = { providerID: modelId.split("/")[0], modelID: modelId.split("/").slice(1).join("/") };
    const userMsg: Message = {
      info: { id: `local-${Date.now()}`, role: "user", time: { created: Date.now() } },
      parts: [{ id: `local-${Date.now()}`, type: "text", text }],
    };
    setMessages((prev) => [...prev, userMsg]);
    setStreamText("");
    setIsStreaming(true);

    const controller = new AbortController();
    streamRef.current = controller;

    let resolveConnected: () => void = () => {};
    let rejectConnected: (e: Error) => void = () => {};
    const connected = new Promise<void>((res, rej) => {
      resolveConnected = res;
      rejectConnected = rej;
    });

    try {
      const onEvent = (e: StreamEvent) => {
        if (e.type === "message.part.delta") {
          const p = e.properties as { sessionID: string; field: string; delta: string };
          if (p.sessionID === activeId && p.field === "text") {
            setStreamText((prev) => stripToolCalls(prev + p.delta));
          }
        } else if (e.type === "message.part.updated") {
          const p = e.properties as { sessionID: string; part: { type: string; text?: string } };
          if (p.sessionID === activeId && p.part.type === "text" && p.part.text != null) {
            setStreamText(stripToolCalls(p.part.text));
          }
        } else if (e.type === "session.idle") {
          const p = e.properties as { sessionID: string };
          if (p.sessionID === activeId) {
            controller.abort();
          }
        }
      };

      const streamPromise = streamEvents(connection, onEvent, controller.signal, resolveConnected);
      streamPromise.catch((e) => {
        if ((e as Error).name !== "AbortError") rejectConnected(e as Error);
      });

      const connectTimeout = setTimeout(() => {
        controller.abort();
        rejectConnected(new Error("Timeout: no se pudo conectar al stream SSE"));
      }, 10000);

      await connected;
      clearTimeout(connectTimeout);

      await sendMessageAsync(connection, activeId, model, text);
      await streamPromise;
      setIsStreaming(false);
      streamRef.current = null;

      const final = await listMessages(connection, activeId);
      setMessages(final);
      setStreamText("");
    } catch (e) {
      controller.abort();
      if ((e as Error).name !== "AbortError") {
        setError(String((e as Error).message || e));
      }
      setIsStreaming(false);
      streamRef.current = null;
      const final = await listMessages(connection, activeId).catch(() => null);
      if (final) {
        setMessages(final);
        setStreamText("");
      }
    }
  }, [connection, activeId, input, isStreaming, modelId]);

  const handleStop = useCallback(async () => {
    if (!connection || !activeId) return;
    try {
      await abortSession(connection, activeId);
    } catch {
      // ignorar
    }
    stopStreaming();
    const final = await listMessages(connection, activeId).catch(() => null);
    if (final) {
      setMessages(final);
      setStreamText("");
    }
  }, [connection, activeId, stopStreaming]);

  const activeSession = sessions.find((s) => s.id === activeId);

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-200">
      <SessionList
        sessions={sessions}
        activeId={activeId}
        onSelect={selectSession}
        onNew={newSession}
      />
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
          <span className="text-sm text-zinc-400">
            {activeSession?.title || "Chat OpenCode"}
          </span>
          <div className="flex items-center gap-2">
            <ModelSelector
              value={modelId}
              onChange={setModelId}
              disabled={isStreaming}
            />
            <Settings
              connection={connection}
              onSave={(conn) => {
                storeConnection(conn);
                setConnection(conn);
                setSessions([]);
                setActiveId(null);
                setMessages([]);
              }}
            />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-3">
          {error && (
            <div className="mb-2 rounded bg-red-950 px-3 py-2 text-sm text-red-300">
              {error}
              {!connection && " Configurá el backend en ⚙ Config."}
            </div>
          )}
          {messages.map((m) => (
            <div key={m.info.id} className="mb-3">
              <MessageView message={m} />
            </div>
          ))}
          {isStreaming && (
            <div className="mb-3 flex justify-start">
              <div className="max-w-[80%] rounded-lg bg-zinc-800 px-3 py-2 whitespace-pre-wrap text-zinc-200">
                {streamText}
                <span className="animate-pulse text-zinc-500">▍</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </main>
        <footer className="border-t border-zinc-800 p-3">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              disabled={!connection || !activeId || isStreaming}
              placeholder={
                !connection
                  ? "Configurá el backend en ⚙ Config"
                  : !activeId
                    ? "Creá una sesión para empezar"
                    : isStreaming
                      ? "Generando…"
                      : "Escribí un mensaje…"
              }
              className="flex-1 rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500"
            />
            {isStreaming ? (
              <button
                onClick={handleStop}
                className="rounded bg-red-900 px-4 py-2 text-sm text-red-100 hover:bg-red-800"
              >
                Detener
              </button>
            ) : (
              <button
                onClick={() => void send()}
                disabled={!connection || !activeId}
                className="rounded bg-zinc-700 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-600 disabled:opacity-50"
              >
                Enviar
              </button>
            )}
          </div>
          {connection && (
            <button
              onClick={() => {
                clearStoredConnection();
                setConnection(null);
                setSessions([]);
                setActiveId(null);
                setMessages([]);
              }}
              className="mt-1 text-xs text-zinc-600 hover:text-zinc-400"
            >
              Desconectar backend
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}