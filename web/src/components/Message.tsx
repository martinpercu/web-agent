"use client";

import type { Message } from "@/lib/types";
import { stripToolCalls } from "@/lib/text";

export default function MessageView({ message }: { message: Message }) {
  const isUser = message.info.role === "user";
  const rawText = message.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as { text: string }).text)
    .join("");
  const text = stripToolCalls(rawText);
  const toolOnly = rawText.trim().length > 0 && text.length === 0;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 whitespace-pre-wrap ${
          isUser
            ? "bg-zinc-700 text-zinc-100"
            : "bg-zinc-800 text-zinc-200"
        }`}
      >
        {isUser ? (
          text
        ) : toolOnly ? (
          <span className="text-zinc-500 italic">
            El asistente intentó usar una herramienta, que no está disponible en el chat.
          </span>
        ) : (
          text || <span className="text-zinc-500">…</span>
        )}
      </div>
    </div>
  );
}