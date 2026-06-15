# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`FR_HagemsaERP` (package name `frontddd`) is a single Next.js 16 (App Router, React 19) monolithic frontend for the HAGEMSA ERP. It consumes **separate backends per bounded context** (Activos, Combustible, Socio-Negocios, Configuración General) plus a centralized HAGEMSA Auth Service. There is no backend here — only the frontend and thin Next.js Route Handlers that proxy to those services.

## Commands

```bash
npm run dev            # dev server (add `-- --port 3001` to change port)
npm run build          # production build (output: standalone, for Docker/Cloud Run)
npm run start          # serve the production build
npm run lint           # eslint (flat config, next/core-web-vitals + next/typescript)
```

There is **no test runner configured** — no Jest/Vitest/Playwright, no `test` script, no test files. Do not assume a TDD harness exists. Validation before a PR is `npm run build` plus manual visual checks. `pnpm` is also supported (`pnpm-lock.yaml` is committed); use whichever lockfile the team is on.

Deploy: `./deploy.sh` reads `.env.cloud` and runs `gcloud run deploy` to Cloud Run (`us-central1`).

## Conventions (read before writing any code)

- **The entire codebase — folders, files, identifiers, types, comments — is in Spanish.** Match it. New code, variable names, and types must be Spanish (`obtenerActivos`, `clienteHttp`, `RespuestaPaginada`). This overrides the usual "default to English for artifacts" instinct: you are extending a project that clearly uses Spanish.
- File naming is kebab-case with role suffixes: `*-vista.tsx` (page-level views), `*-api.ts` (HTTP services), `*.tipos.ts` (type modules), `use-*.ts` (hooks/"ganchos"), `*-queries.ts` (query-key/fetch helpers).
- Import alias: `@/*` → `src/*` (the only path alias).

## Architecture

Three top-level layers under `src/`:

- `app/` — Next.js routes, layouts, and Route Handlers only. Two route groups: `(public)/` (login) and `(privado)/` (everything behind auth, wrapped by `AppShell` in its layout). `app/api/` Route Handlers must be **thin adapters** — real logic lives in `compartido/` or `modulos/`.
- `modulos/<contexto>/` — business logic per bounded context, each with `componentes/`, `servicios/`, `tipos/`, `vistas/` (and `ganchos/` where needed). Current modules: `activos`, `administracion`, `autenticacion`, `combustible`, `configuracion-general`, `socio-negocios`.
- `compartido/` — cross-context infrastructure: `api/` (HTTP clients + hooks), `autenticacion/` (server-side session/JWT), `componentes/ui/` (shadcn primitives — must not depend on any module), `ganchos/`, `utilidades/`.

A "vista" is the top-level component a `page.tsx` renders; pages stay near-empty and delegate to `modulos/<bc>/vistas/*-vista.tsx`.

### Two HTTP client patterns (important)

1. **Browser → Next Route Handler → backend (server-side proxy).** Use this whenever the call needs the JWT. `compartido/api/cliente-http.ts` (`clienteHttp`) hits same-origin `/api/...`; httpOnly cookies ride along automatically. The Route Handler reads the cookie and injects `Authorization: Bearer`. Socio de Negocios and Configuracion General use this pattern. **The JWT never reaches browser JS.**
2. **Browser → backend directly.** `compartido/api/clientes-backend.ts` also exports preconfigured axios instances for BCs that do not require the JWT. These read `NEXT_PUBLIC_<BC>_API_URL` from `compartido/api/config.ts`, use `withCredentials: false`, and do **not** carry the JWT.

A module's HTTP calls always live in `modulos/<bc>/servicios/<bc>-api.ts` and use the appropriate client. Adding a new BC: add the env var, add the entry in `config.ts` (and extend the `ServicioApi` union), then add the instance in `clientes-backend.ts` — the header comment in that file is the step-by-step.

Errors from any axios client are normalized to the `ApiError` class (`compartido/api/axios.ts`). Use the `esError401/403/404/...` and `extraerMensajeError` helpers from `compartido/api` (`formato-error.ts`) instead of inspecting raw errors. Backend responses follow a standard envelope (`RespuestaRecurso`, `RespuestaPaginada`, `RespuestaError`) defined in `compartido/api/contrato.ts`.

### Data fetching — no TanStack Query

Despite older README wording, TanStack Query is **not** used. `compartido/api` provides hand-rolled `useConsulta` (queries) and `useMutar` (mutations) as drop-in replacements. Key difference: `useConsulta` has **no shared cache** — each hook instance fetches independently, cancels stale requests on dep change/unmount, and exposes `refetch`. Don't reach for `@tanstack/react-query`.

### Auth & route protection

- Middleware lives in `src/proxy.ts` and is exported as `proxy` (not the default `middleware`) — Next 16 style. It gates all private routes, redirects unauthenticated users to `/login`, bounces logged-in users away from `/login`, and **transparently refreshes** the access token when it's near expiry (`refrescarSiNecesario`).
- Login flow: `/api/auth/login` calls the real Auth Service, then stores `hagemsa_access` + `hagemsa_refresh` as **httpOnly cookies** (browser never sees the JWTs). `/api/auth/logout` revokes and clears them. A dev-only `/api/auth/dev-login` exists, gated by `AUTH_MODO_DESARROLLO`.
- Server-side session helpers are in `compartido/autenticacion/` (e.g. `sesion-servidor.ts` → `obtenerAccessToken()` for Route Handlers).
- Client-side identity/role: `useSesion()` (`@/modulos/autenticacion/ganchos/use-sesion`) returns `{ usuario, estaCargando, estaAutenticado }`. Gate UI with `useTieneRol("SUPER_ADMIN")` or `<RolGuard rol="...">`.

## UI

shadcn/ui (style `radix-maia`, base color `mist`, RSC enabled) installed into `compartido/`. Aliases in `components.json`: `ui` → `@/compartido/componentes/ui`, `utils` → `@/compartido/utilidades/utils`, `hooks` → `@/compartido/ganchos`. Tailwind v4 (config-less, via `@tailwindcss/postcss`); theme lives in `src/app/globals.css`. `next-themes` for dark mode, `sonner` for toasts.

**Icons: use `lucide-react` ONLY.** Do not use `@hugeicons/*` or `@tabler/icons-react` in new code, even though they are still installed (legacy usage exists in some shared components). All new icons come from `lucide-react`.

## Environment

Server-only (no `NEXT_PUBLIC_`): `AUTH_SERVICE_URL`, `AUTH_MODO_DESARROLLO`, `SOCIO_NEGOCIOS_API_URL`, `CONFIGURACION_GENERAL_API_URL`. Client-exposed: `NEXT_PUBLIC_<BC>_API_URL` only for backends called directly by the browser, plus optional `NEXT_PUBLIC_API_GATEWAY_URL`. Copy `.env.local.example` → `.env.local` for local dev. **Never put the bearer token client-side** — that's the whole point of the cookie + proxy design.

## Branch flow

`feature/* → test → main`. Branch off `test`, PR back into `test`; do not merge straight to `main` unless told. (Note: the active working branch here is `desarrollo`.)
