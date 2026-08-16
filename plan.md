# Plan v2: Web Chat OpenCode (Zen Free + Go) en Railway

## Decisiones tomadas

| Decisión | Elección |
|---|---|
| **Modelos (4)** | 3 free de Zen + 1 de Go |
| **Streaming** | SSE en tiempo real (con `fetch` stream, no `EventSource`) |
| **Estructura** | Monorepo: `backend/` + `web/` |
| **Estilos** | Después (v1 funcional, estética mínima) |

### Los 4 modelos (IDs verificados en docs)

| Modelo | ID completo | Provider | Costo |
|---|---|---|---|
| DeepSeek V4 Flash Free | `opencode/deepseek-v4-flash-free` | Zen | Free |
| Hy3 Free | `opencode/hy3-free` | Zen | Free |
| Nemotron 3.5 Lightning Free | `opencode/nemotron-3.5-lightning-free` | Zen | Free |
| MiMo V2.5 | `opencode-go/mimo-v2.5` | Go | Incluido en sub |

**Cómo se restringen:** `whitelist` por provider (oculta todo excepto lo listado) + `enabled_providers` (solo `opencode` y `opencode-go`). Doble filtro: el backend solo expone esos 4, y el frontend además los hardcodea en una constante.

## Arquitectura

```
Browser (Next.js frontend)
  ↕ HTTPS (Basic auth: opencode:password)
Railway (backend: opencode serve en Docker, puerto 4096)
  ↕ API interna
  OpenCode Zen (3 modelos free) + OpenCode Go (MiMo V2.5)
```

---

## 1. Fase 1 — Instalaciones

1. Verificar Node.js ≥ 20 (`node -v`), instalar si falta (via Homebrew)
2. Instalar opencode CLI local: `npm install -g opencode-ai`
3. Conectar localmente las 2 keys (`opencode auth login` → OpenCode Zen y OpenCode Go) y correr `/models` para confirmar que los 4 modelos responden
4. Instalar Railway CLI: `brew install railway`
5. Inicializar git en la carpeta

**Pendiente a resolver acá:** mecanismo headless para las 2 API keys en Docker (env var `OPENCODE_API_KEY` para Zen, o `opencode auth login --provider ...` no interactivo, o escribir `auth.json`).

## 2. Fase 2 — Skills (trabajar mejor)

1. Crear `AGENTS.md` en la raíz con el workflow del proyecto (cómo levantar backend/web, comandos, convenciones)
2. Definir `.opencode/skills/` del repo:
   - **skill de backend**: verificar config, levantar serve, testear endpoints con curl
   - **skill de frontend**: comandos de dev/build/lint
3. Reutilizar el skill existente `update-readme-and-claude` para mantener docs al día

## 3. Fase 3 — Backend (`backend/`)

### `backend/Dockerfile`

```dockerfile
FROM node:20-alpine
RUN npm install -g opencode-ai
WORKDIR /app
COPY opencode.json ./
EXPOSE 4096
CMD ["opencode", "serve", "--port", "4096", "--hostname", "0.0.0.0"]
```

### `backend/opencode.json` (con los 4 modelos restringidos)

```json
{
  "$schema": "https://opencode.ai/config.json",
  "enabled_providers": ["opencode", "opencode-go"],
  "provider": {
    "opencode": {
      "whitelist": ["deepseek-v4-flash-free", "hy3-free", "nemotron-3.5-lightning-free"]
    },
    "opencode-go": {
      "whitelist": ["mimo-v2.5"]
    }
  },
  "model": "opencode/deepseek-v4-flash-free",
  "small_model": "opencode/deepseek-v4-flash-free",
  "tools": { "*": false },
  "server": {
    "port": 4096,
    "hostname": "0.0.0.0",
    "cors": ["https://<URL-FRONTEND>"]
  },
  "autoupdate": false,
  "share": "disabled",
  "snapshot": false
}
```

Puntos clave:
- **Tools deshabilitados** (`"*": false`): chat puro, no hay filesystem en Railway; evita tool calls fallidas
- **`small_model`** = un free para títulos de sesión automáticos
- **CORS**: obligatorio porque el browser habla directo con el backend; `EventSource` nativo NO soporta headers de auth → usar fetch-streaming sí o sí
- **API keys**: DENTRO del Docker, nunca expuestas al frontend

### Env vars en Railway (backend)

- `OPENCODE_SERVER_PASSWORD`, `OPENCODE_SERVER_USERNAME` (Basic auth, username default `opencode`)
- Key(s) de Zen/Go

## 4. Fase 4 — Frontend (`web/`)

```bash
npx create-next-app@latest web --typescript --tailwind --src-dir --app --no-import-alias
```

### Estructura

```
web/
├── src/
│   ├── app/page.tsx           # layout chat (v1 sin estilos finos)
│   ├── lib/
│   │   ├── models.ts          # LOS 4 MODELOS (constante)
│   │   ├── api.ts             # client con Basic auth + fetch-stream SSE
│   │   └── types.ts           # Session, Message, Part, SSE events
│   └── components/
│       ├── Chat.tsx           # orquesta sesión + mensajes
│       ├── Message.tsx        # mensaje individual
│       ├── ModelSelector.tsx  # selector con los 4
│       ├── SessionList.tsx    # lista lateral
│       └── Settings.tsx       # URL backend + password (localStorage)
├── next.config.ts
└── package.json               # dev: "next dev -p 3022"
```

### `lib/api.ts` — flujo de streaming (lo importante)

1. `POST /session` → crea sesión
2. `POST /session/:id/prompt_async` con `{ model: { id }, parts: [{ type: "text", text }] }` → 204 (no espera)
3. `GET /event` con `fetch` + `ReadableStream` reader (SSE con header `Authorization: Basic`) → escuchar `message.part.updated` (texto) y `session.idle` (fin de corrida)
4. Al terminar, `GET /session/:id/message` para el estado final
5. `POST /session/:id/abort` para botón "detener"
6. Auth en todas: `Authorization: Basic base64(opencode:password)` — password en localStorage, nunca en código

### Env vars (web)

- Local: `.env.local` con `OPENCODE_BACKEND_URL`
- Railway: `PORT` lo define Railway (Next respeta `PORT`); producción con `next start`

## 5. Fase 5 — Integración + Deploy

1. Levantar backend local → probar endpoints con curl (`/doc` spec OpenAPI, `/session`, `/event`, mensaje real contra los 4 modelos)
2. Frontend apuntando a localhost → chat end-to-end con streaming
3. Railway: servicio 1 = backend (Dockerfile de `backend/`), servicio 2 = web (build de `web/`), setear env vars, CORS con la URL real del frontend
4. Verificar en producción: 4 modelos + streaming + abort

## 6. Fase 6 — Estilos (después, fuera de alcance por ahora)

---

## Endpoints clave del server (verificados en docs)

| Método | Path | Descripción |
|---|---|---|
| `GET` | `/session` | Listar sesiones → `Session[]` |
| `POST` | `/session` | Crear sesión `{ title? }` |
| `GET` | `/session/:id/message` | Mensajes de una sesión (`limit?`) |
| `POST` | `/session/:id/message` | Enviar y esperar respuesta completa |
| `POST` | `/session/:id/prompt_async` | Enviar async → 204 (para SSE) |
| `POST` | `/session/:id/abort` | Abortar corrida en curso |
| `GET` | `/event` | Stream SSE de eventos |
| `GET` | `/config/providers` | Providers + modelos + default |
| `GET` | `/doc` | Spec OpenAPI 3.1 |

## Notas técnicas

- Auth del server: `OPENCODE_SERVER_PASSWORD` (Basic auth, username default `opencode`)
- La API key nunca se expone al frontend; el frontend solo necesita URL del backend + password
- Los 4 modelos se hardcodean en el frontend (constante) como filtro final
- Next.js 15 App Router, TS, Tailwind