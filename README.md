# Front DDD

Frontend monolitico en Next.js con App Router, organizado por contextos funcionales. Cada contexto tiene sus rutas en `src/app` y su logica propia en `src/modulos`.

El objetivo es tener un solo frontend para el ERP, pero consumiendo backends separados por bounded context o microservicio.

## Contextos actuales

- `activos`: BC-13 Gestion de Activos. Maestro de unidades, ficha tecnica, estados, imagenes y conexion con el backend de Activos.
- `combustible`: modulo inicial de combustible integrado en la rama `test`.
- `comercial`: ruta base del contexto comercial.
- `despacho`: ruta base del contexto despacho.
- `flota`: ruta base del contexto flota.

## Estructura base

```text
src/
  app/
    (public)/
      login/
        page.tsx
    (privado)/
      activos/
        page.tsx
        nuevo/
          page.tsx
        [codigo]/
          page.tsx
          editar/
            page.tsx
      combustible/
      comercial/
      despacho/
      flota/
      socio-negocios/
      layout.tsx
      page.tsx
    api/
      auth/
        login/
          route.ts
        logout/
          route.ts
    globals.css
    layout.tsx
  compartido/
    api/
    componentes/
      app-shell.tsx
      ui/
    autenticacion/
    constantes/
    ganchos/
    servicios/
    tipos/
    utilidades/
  modulos/
    activos/
      componentes/
      servicios/
      tipos/
      vistas/
    combustible/
      componentes/
      servicios/
      tipos/
      vistas/
    socio-negocios/
      componentes/
      servicios/
      tipos/
      vistas/
```

## Criterios de arquitectura

- `app/`: define rutas, layouts y puntos de entrada de Next.js.
- `app/api/`: contiene Route Handlers de Next.js. Deben ser adaptadores delgados; la logica reutilizable debe vivir en `compartido/` o `modulos/`.
- `app/(public)/`: contiene rutas publicas como login.
- `app/(privado)/`: contiene rutas protegidas y el layout con `AppShell`.
- `modulos/`: agrupa la logica de negocio del frontend por contexto funcional.
- `compartido/`: concentra piezas reutilizables entre contextos, como UI, utilidades, layout global y helpers.
- Cada modulo debe tener sus propios `componentes`, `servicios`, `tipos` y `vistas`.
- Los componentes de `compartido/componentes/ui` no deben depender de un modulo especifico.
- Las llamadas HTTP de cada modulo deben vivir en su carpeta `servicios`.
- El cliente HTTP generico, TanStack Query Provider y query keys base viven en `compartido/api`, porque son infraestructura compartida.
- Las llamadas HTTP especificas de un BC viven en `src/modulos/<contexto>/servicios`, aunque usen el cliente compartido.

## Modulo Activos

Rutas principales:

```text
/activos
/activos/nuevo
/activos/[codigo]
/activos/[codigo]/editar
```

Funcionalidades incluidas:

- Listado de activos.
- Filtros por texto, tipo, estado, operativo y calibracion.
- Registro y edicion de activos.
- Formulario con acordeones verticales.
- Campos obligatorios marcados con `*`.
- Detalle del activo por secciones.
- Acciones de ciclo de vida: inactivar y siniestrar.
- Mensajes de resultado al crear, modificar, inactivar o siniestrar.
- Gestion visual de imagenes del activo por URL.
- Consumo del backend de Activos mediante variable de entorno.

Servicio HTTP:

```text
src/modulos/activos/servicios/activos-api.ts
```

Tipos principales:

```text
src/modulos/activos/tipos/activo.tipos.ts
```

## Integracion con backends

Cada modulo frontend consume su propio backend o microservicio. En desarrollo local se usan variables `NEXT_PUBLIC_*` para apuntar al puerto correspondiente.

Archivo recomendado:

```text
.env.local
```

Variables actuales y futuras:

```env
NEXT_PUBLIC_ACTIVOS_API_URL=http://localhost:3000
NEXT_PUBLIC_COMBUSTIBLE_API_URL=http://localhost:3003
NEXT_PUBLIC_SOCIO_NEGOCIOS_API_URL=http://localhost:3005
NEXT_PUBLIC_FLOTA_API_URL=http://localhost:3004
```

Por ahora, para Activos es obligatoria:

```env
NEXT_PUBLIC_ACTIVOS_API_URL=http://localhost:3000
```

Si mas adelante existe un API Gateway, estas URLs pueden cambiar a una sola base, por ejemplo:

```env
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:8080
```

## Desarrollo

Instalar dependencias:

```bash
npm install
```

Levantar el proyecto:

```bash
npm run dev
```

Si se quiere usar otro puerto:

```bash
npm run dev -- --port 3001
```

Compilar:

```bash
npm run build
```

Si el equipo trabaja con `pnpm`, los equivalentes son:

```bash
pnpm install
pnpm dev
pnpm build
```

## Flujo de ramas

El flujo acordado es:

```text
feature/* -> test -> main
```

Para trabajar una nueva funcionalidad:

```bash
git checkout test
git pull origin test
git checkout -b feature/nombre-de-la-funcionalidad
```

Luego se crea un Pull Request hacia:

```text
base: test
compare: feature/nombre-de-la-funcionalidad
```

No se debe integrar directo a `main` salvo que el equipo lo indique.

## Validacion recomendada antes de PR

```bash
git status -sb
npm run build
```

Tambien se recomienda probar visualmente:

```text
http://localhost:3001/activos
http://localhost:3001/activos/nuevo
http://localhost:3001/activos/ACT-000001
```

## Autenticacion

El frontend habla con el Auth Service de HAGEMSA (servicio centralizado).

Flujo:

1. El usuario hace login en `/login`. El Route Handler `/api/auth/login` llama al Auth Service real (`AUTH_SERVICE_URL/api/auth/login`), recibe `accessToken` + `refreshToken` y los guarda en dos cookies httpOnly (`hagemsa_access`, `hagemsa_refresh`). El navegador nunca ve los JWTs.
2. El middleware (`src/proxy.ts`) protege todas las rutas privadas y refresca el access token automaticamente cuando faltan menos de 60s para expirar.
3. Para saber quien es el usuario en componentes React, usar el hook `useSesion()` de `@/modulos/autenticacion/ganchos/use-sesion`. Devuelve `{ usuario, estaCargando, estaAutenticado }`.
4. Para mostrar/ocultar UI por rol, usar `useTieneRol("SUPER_ADMIN")` o el componente `<RolGuard rol="...">`.
5. Logout: `POST /api/auth/logout` revoca la sesion en el Auth Service y borra las cookies locales.

Configurar `AUTH_SERVICE_URL` en `.env.local` (ver `.env.local.example`).

## Pendientes conocidos

- Definir si se consumira cada microservicio directo o mediante API Gateway.
- Migrar las llamadas a los backends de BC al patron de proxy server-side (`/app/api/<bc>/[...path]/route.ts`) para que el JWT viaje server-side y no quede expuesto al JS del navegador.
- Implementar carga real de archivos para imagenes/documentos cuando exista storage o endpoint multipart.
- Completar contratos de integracion con Combustible, Flota y otros bounded contexts.
- Agregar pruebas unitarias o de componentes para los flujos principales.
