"use client";

import type { Session } from "@/lib/types";

export default function SessionList({
  sessions,
  activeId,
  onSelect,
  onNew,
}: {
  sessions: Session[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <div className="flex w-56 flex-col border-r border-zinc-800">
      <button
        onClick={onNew}
        className="m-2 rounded bg-zinc-700 px-2 py-1 text-sm text-zinc-100 hover:bg-zinc-600"
      >
        + Nueva sesión
      </button>
      <div className="flex-1 overflow-y-auto">
        {sessions.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`w-full truncate px-3 py-2 text-left text-sm ${
              s.id === activeId
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-400 hover:bg-zinc-900"
            }`}
          >
            {s.title || "Sin título"}
          </button>
        ))}
      </div>
    </div>
  );
}