"use client";

import { useState } from "react";
import type { Connection } from "@/lib/types";

export default function Settings({
  connection,
  onSave,
}: {
  connection: Connection | null;
  onSave: (conn: Connection) => void;
}) {
  const [open, setOpen] = useState(false);
  const [baseUrl, setBaseUrl] = useState(
    connection?.baseUrl ??
      (process.env.NEXT_PUBLIC_OPENCODE_BACKEND_URL || "http://localhost:4096")
  );
  const [username, setUsername] = useState(connection?.username ?? "opencode");
  const [password, setPassword] = useState(connection?.password ?? "");

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-300 hover:bg-zinc-800"
      >
        ⚙ Config
      </button>
      {open && (
        <div className="absolute right-2 top-12 z-10 w-80 rounded border border-zinc-700 bg-zinc-900 p-3 shadow-lg">
          <label className="mb-1 block text-xs text-zinc-400">Backend URL</label>
          <input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="mb-2 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-200"
            placeholder="https://tu-app.railway.app"
          />
          <label className="mb-1 block text-xs text-zinc-400">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mb-2 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-200"
          />
          <label className="mb-1 block text-xs text-zinc-400">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-3 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-200"
          />
          <button
            onClick={() => {
              onSave({ baseUrl: baseUrl.trim(), username: username.trim() || "opencode", password });
              setOpen(false);
            }}
            className="w-full rounded bg-zinc-700 px-2 py-1 text-sm text-zinc-100 hover:bg-zinc-600"
          >
            Guardar
          </button>
        </div>
      )}
    </div>
  );
}