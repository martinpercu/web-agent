---
name: backend-check
description: Verificar el backend de opencode (config, serve local, endpoints, modelos). Usar al levantar/testear el backend o ante errores de API.
---

Verificá el estado del backend de opencode (`opencode serve`) y sus endpoints.

## Pasos

1. **Config:** leer `backend/opencode.json` y confirmar:
   - `enabled_providers` = `["opencode", "opencode-go"]`
   - Whitelists con los 4 modelos permitidos (ver AGENTS.md)
   - `model` y `small_model` apuntan a un modelo free
2. **Servidor:** levantar `opencode serve --port 4096 --hostname 0.0.0.0` desde `backend/` (si no está corriendo). Verificar con `curl -s http://localhost:4096/global/health`.
3. **Auth:** los endpoints requieren `Authorization: Basic base64(opencode:password)`. Si hay errores 401, revisar `OPENCODE_SERVER_PASSWORD`.
4. **Endpoints clave** (con auth):
   - `GET /config/providers` → confirmar que solo aparecen los 4 modelos
   - `POST /session` → crear sesión de prueba
   - `POST /session/:id/prompt_async` → enviar mensaje async
   - `GET /event` → stream SSE (primer evento `server.connected`)
   - `GET /session/:id/message` → mensajes finales
5. **Modelos:** si un modelo falla, probar directo: `opencode run --model <id> "OK"`.
6. **Spec:** `GET /doc` expone el OpenAPI 3.1 (útil para confirmar nombres de endpoints/eventos).

## Reglas

- No matar procesos del usuario sin avisar.
- Nunca loguear ni commitear keys/headers de auth completos.