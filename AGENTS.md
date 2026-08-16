# AGENTS.md

Proyecto: web de chat para OpenCode (Zen Free + Go) deployada en Railway. Monorepo con `backend/` (Docker con `opencode serve`) y `web/` (Next.js 15 App Router).

## Comandos útiles

- **Backend local:** `opencode serve --port 4096 --hostname 0.0.0.0` (desde `backend/` con `opencode.json` presente)
- **Frontend dev:** `npm run dev` en `web/` (puerto 3022)
- **Frontend build:** `npm run build` en `web/`
- **Frontend lint:** `npm run lint` en `web/`
- **Verificar modelos:** `opencode run --model <id> "..."` (IDs en `web/src/lib/models.ts`)

## Convenciones

- **Modelos permitidos (4, no agregar otros):**
  - `opencode/deepseek-v4-flash-free` — Zen, free
  - `opencode/hy3-free` — Zen, free
  - `opencode/nemotron-3.5-lightning-free` — Zen, free
  - `opencode-go/mimo-v2.5` — Go, suscripción
- La lista de modelos se define en DOS lugares: `backend/opencode.json` (whitelist por provider) y `web/src/lib/models.ts` (constante del frontend). Si se agrega/quita un modelo, actualizar ambos.
- **API keys:** solo via env var `OPENCODE_API_KEY` (sirve para Zen y Go). Nunca commitear keys. Nunca exponer la key al frontend.
- **Auth del backend:** Basic auth `opencode:password` (env vars `OPENCODE_SERVER_PASSWORD` / `OPENCODE_SERVER_USERNAME`). El password se guarda en localStorage del browser.
- **Streaming:** siempre por SSE con `fetch` + `ReadableStream` (NUNCA `EventSource`, no soporta headers de auth).
- **Estilos:** v1 funcional, estética mínima. La capa visual se trabaja después.
- No usar el puerto 3022 para otra cosa; Railway setea `PORT` para producción.

## Flujo de trabajo

1. Levantar backend local y verificar con curl los endpoints (`/session`, `/event`, `/config/providers`)
2. Levantar frontend y probar chat end-to-end contra localhost
3. Deploy en Railway: servicio backend (Dockerfile) + servicio web (build de Next.js)
4. Mantener actualizados README.md y CLAUDE.md con el skill `update-readme-and-claude`