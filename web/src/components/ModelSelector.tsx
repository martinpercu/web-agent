"use client";

import { MODELS } from "@/lib/models";

export default function ModelSelector({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-200"
    >
      {MODELS.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name} · {m.provider} {m.free ? "(free)" : ""}
        </option>
      ))}
    </select>
  );
}