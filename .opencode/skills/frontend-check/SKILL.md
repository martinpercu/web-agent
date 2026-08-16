---
name: frontend-check
description: Verificar el frontend Next.js (deps, dev server, build, lint). Usar al trabajar en web/ o ante errores de compilación.
---

Verificá el estado del frontend Next.js en `web/`.

## Pasos

1. **Dependencias:** en `web/`, si falta `node_modules/`, correr `npm install`.
2. **Dev server:** `npm run dev` (puerto 3022). Verificar con `curl -s -o /dev/null -w "%{http_code}" http://localhost:3022`.
3. **Lint:** `npm run lint` en `web/`. Corregir errores antes de build.
4. **Build:** `npm run build` en `web/`. Debe pasar sin errores de tipo.
5. **Modelos:** `web/src/lib/models.ts` debe contener exactamente los 4 modelos (ver AGENTS.md) y coincidir con las whitelists de `backend/opencode.json`.
6. **Conexión al backend:** con el backend local corriendo (puerto 4096), el chat debe funcionar end-to-end (crear sesión, enviar mensaje, streaming SSE, abort).

## Reglas

- No tocar `web/.env.local` (contiene la URL del backend).
- No exponer el password: vive solo en localStorage del browser.