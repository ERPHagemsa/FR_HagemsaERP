# API — Aprobación de Cotizaciones (Épica 2)

Referencia de endpoints REST para el frontend. Documenta el comportamiento **real** de la API
tal como está implementado en `src/aprobacion/interfaces/http/aprobacion.controller.ts` y
verificado por `test/aprobaciones.e2e-spec.ts`.

> Última verificación contra el código: 2026-07-08 (feature nueva: aprobación obligatoria antes
> de que una cotización llegue a `ENVIADA` — RN-03-024).

> **Por qué existe este documento aparte de `API-Cotizaciones.md`.** El endpoint de envío
> (`POST /cotizaciones/:id/enviar`) sigue viviendo en la **misma ruta**, pero ya no lo resuelve
> `CotizacionesController`: ahora abre una solicitud de aprobación y el ciclo completo (aprobar,
> rechazar, observar, bandeja, historial) es dueño de la feature **`aprobacion`**. Este documento
> es la fuente única para ese endpoint y para el resto del loop.

---

## 1. Modelo de negocio — el loop de aprobación

Antes de esta feature, `enviar` era una transición directa `BORRADOR → ENVIADA` que congelaba la
versión y asignaba el número correlativo en el mismo paso. Ahora **enviar solo solicita
aprobación**: la cotización queda en `PENDIENTE_APROBACION` hasta que alguien con el permiso de
resolver decide su destino.

```
   BORRADOR / EN_REVISION ──── enviar ────▶ PENDIENTE_APROBACION
                                                    │
                              ┌─────────────────────┼─────────────────────┐
                              ▼                      ▼                      ▼
                          aprobar               rechazar               observar
                              │                      │                      │
                              ▼                      ▼                      ▼
                          ENVIADA                BORRADOR               BORRADOR
                   (versión congelada,     (motivo obligatorio,   (comentario obligatorio,
                    numerada si es la       cotización editable)   cotización editable)
                    primera vez, con
                    vencimiento fijado)
```

- **Quórum = 1.** Una única resolución (aprobar/rechazar/observar) cierra la solicitud. No hay
  múltiples aprobadores ni votos acumulados.
- **Rechazar y observar son operativamente equivalentes para la cotización** (ambos la devuelven a
  `BORRADOR`, editable); lo que cambia es la semántica para el ejecutivo: `rechazar` exige un
  `motivo` (la solicitud no procede), `observar` exige un `comentario` (hay que ajustar algo puntual
  antes de reintentar).
- **Reenviar abre una solicitud NUEVA.** Una solicitud resuelta (`APROBADA`/`RECHAZADA`/`OBSERVADA`)
  es terminal — no se reabre ni se reutiliza. Volver a llamar `enviar` crea otra fila en
  `solicitud_aprobacion`, por eso el historial (§5) puede tener varias entradas para la misma
  cotización.
- **La numeración se asigna una sola vez.** Si la cotización ya tiene `numeroCotizacion` (porque una
  solicitud anterior ya fue aprobada y luego se creó una nueva versión que se reenvía), aprobar
  **no** vuelve a numerar — solo congela la nueva versión.

### Estados de `SolicitudDeAprobacion`

`EN_APROBACION` (inicial, en bandeja) → `APROBADA` | `RECHAZADA` | `OBSERVADA` (terminales, sin
retorno).

### Concurrencia (quórum=1 bajo carrera)

La resolución (`aprobar`/`rechazar`/`observar`) persiste con un **update condicional**
(`WHERE estado = 'EN_APROBACION'`). Si dos resoluciones concurrentes llegan a resolver la misma
solicitud, la segunda en escribir recibe **409 Conflict** ("La solicitud de aprobación ya fue
resuelta por otra operación.") en lugar de sobrescribir la primera.

---

## 2. Convenciones generales

Mismas convenciones que el resto del BC (ver `API-Cotizaciones.md` §1-2): base URL `/api`,
autenticación opcional durante el MVP, `ValidationPipe` global (`whitelist` + `forbidNonWhitelisted`
+ `transform`), errores 400/404/409/422 con el mismo `DomainExceptionFilter`.

> El permiso `bc03:aprobacion:resolver` (aprobar/rechazar/observar) se declara con
> `@RequirePermission` pero **no se evalúa** hasta activar `JwtAuthGuard` en producción
> (`MvpSinPermisosGuard` deja pasar todo hoy) — mismo patrón que el resto del BC.

### Tabla de endpoints

| Método | Ruta | Permiso | Acción |
|--------|------|---------|--------|
| `POST` | `/cotizaciones/:id/enviar` | `bc03:cotizacion:escribir` | Solicitar aprobación (abre solicitud, → `PENDIENTE_APROBACION`) |
| `POST` | `/aprobaciones/:id/aprobar` | `bc03:aprobacion:resolver` | Aprobar (→ `ENVIADA`) |
| `POST` | `/aprobaciones/:id/rechazar` | `bc03:aprobacion:resolver` | Rechazar (motivo obligatorio, → `BORRADOR`) |
| `POST` | `/aprobaciones/:id/observar` | `bc03:aprobacion:resolver` | Observar (comentario obligatorio, → `BORRADOR`) |
| `GET` | `/aprobaciones/pendientes` | `bc03:aprobacion:leer` | Bandeja de solicitudes `EN_APROBACION` |
| `GET` | `/cotizaciones/:id/aprobaciones` | `bc03:aprobacion:leer` | Historial de solicitudes de una cotización |

---

## 3. Solicitar aprobación (enviar la cotización)

```
POST /api/cotizaciones/:id/enviar
```

`BORRADOR`/`EN_REVISION` → `PENDIENTE_APROBACION`. Abre una nueva `SolicitudDeAprobacion` en
`EN_APROBACION`. **No** congela la versión, **no** asigna número ni fija vencimiento — eso ocurre
recién si la solicitud se aprueba (§4).

**Body** (opcional)

| Campo | Tipo | Requerido | Reglas |
|---|---|---|---|
| `validezDias` | `number` | No | entero ≥ 1. Si se omite, usa el `validezDias` ya guardado en la versión activa, o `10` por defecto. Se snapshotea en la solicitud y se aplica recién al aprobar |

**Respuesta `201 Created`**

```json
{ "id": "0190f8a2-aaaa-7c4d-8e9f-1a2b3c4d5e6f" }
```

`id` es el id de la **solicitud de aprobación** creada (no el de la cotización) — usalo para
resolverla (§4) o para seguirla en la bandeja (§6).

**Errores**

| Código | Cuándo |
|---|---|
| `400 Bad Request` | `:id` no es UUID, `validezDias` no numérico o `< 1` |
| `404 Not Found` | la cotización no existe |
| `409 Conflict` | la cotización ya tiene una solicitud de aprobación vigente (`EN_APROBACION`) |
| `422 Unprocessable Entity` | la cotización no tiene líneas, o su estado no permite enviar (regla heredada de `Cotizacion.enviar()`) |

```bash
curl -X POST http://localhost:3000/api/cotizaciones/<id>/enviar \
  -H "Content-Type: application/json" -d '{ "validezDias": 15 }'
```

---

## 4. Resolver una solicitud

### 4.1. Aprobar

```
POST /api/aprobaciones/:id/aprobar
```

`EN_APROBACION → APROBADA`. En la misma transacción: congela la versión de la cotización, fija
`fechaVencimiento` (`fechaEnvio + validezDias` de la solicitud), asigna `numeroCotizacion`/
`anioCotizacion`/`codigoCotizacion` **solo si la cotización todavía no tiene número**, y la lleva a
`ENVIADA`.

**Body** (opcional)

| Campo | Tipo | Requerido | Reglas |
|---|---|---|---|
| `comentario` | `string` | No | comentario libre del aprobador |

**Respuesta `204 No Content`** — sin cuerpo. Consultá `GET /cotizaciones/:id` para ver el nuevo
estado, el número asignado (si aplica) y la versión congelada.

**Errores**

| Código | Cuándo |
|---|---|
| `400 Bad Request` | `:id` no es UUID |
| `404 Not Found` | la solicitud o su cotización no existen |
| `409 Conflict` | la solicitud ya fue resuelta (carrera con otra resolución concurrente) |
| `422 Unprocessable Entity` | la solicitud no está `EN_APROBACION` (guard de estado terminal del agregado) |

```bash
curl -X POST http://localhost:3000/api/aprobaciones/<id>/aprobar \
  -H "Content-Type: application/json" -d '{ "comentario": "Aprobado para envío" }'
```

### 4.2. Rechazar

```
POST /api/aprobaciones/:id/rechazar
```

`EN_APROBACION → RECHAZADA`. Devuelve la cotización a `BORRADOR` (vuelve a ser editable). Reenviar
crea una solicitud **nueva** — esta queda cerrada como registro histórico.

**Body**

| Campo | Tipo | Requerido | Reglas |
|---|---|---|---|
| `motivo` | `string` | **Sí** | no vacío — por qué se rechaza |

**Respuesta `204 No Content`** — sin cuerpo.

**Errores**: mismas familias que aprobar (§4.1), más `400` si falta `motivo`.

```bash
curl -X POST http://localhost:3000/api/aprobaciones/<id>/rechazar \
  -H "Content-Type: application/json" -d '{ "motivo": "Margen insuficiente" }'
```

### 4.3. Observar

```
POST /api/aprobaciones/:id/observar
```

`EN_APROBACION → OBSERVADA`. Igual efecto sobre la cotización que rechazar (vuelve a `BORRADOR`,
editable); la diferencia es semántica: se pide un ajuste puntual, no un rechazo de fondo.

**Body**

| Campo | Tipo | Requerido | Reglas |
|---|---|---|---|
| `comentario` | `string` | **Sí** | no vacío — qué hay que ajustar |

**Respuesta `204 No Content`** — sin cuerpo.

**Errores**: mismas familias que aprobar (§4.1), más `400` si falta `comentario`.

```bash
curl -X POST http://localhost:3000/api/aprobaciones/<id>/observar \
  -H "Content-Type: application/json" -d '{ "comentario": "Ajustar precio de la línea 1" }'
```

---

## 5. Historial de aprobaciones de una cotización

```
GET /api/cotizaciones/:id/aprobaciones
```

Devuelve **todas** las solicitudes de aprobación de la cotización (terminales y, si existe, la
vigente), en orden cronológico de creación — la traza completa del loop, incluidas las vueltas a
`BORRADOR` por rechazo u observación.

**Respuesta `200`**

```json
[
  {
    "id": "0190f8a2-aaaa-7c4d-8e9f-1a2b3c4d5e6f",
    "idCotizacion": "0190f8a2-7b3c-7c4d-8e9f-1a2b3c4d5e6f",
    "numeroVersion": 1,
    "estado": "OBSERVADA",
    "validezDias": 15,
    "comentario": "Ajustar precio de la línea 1",
    "usuarioCreacion": "mvp-sin-auth",
    "fechaCreacion": "2026-07-08T10:00:00.000Z",
    "usuarioResolucion": "mvp-sin-auth",
    "fechaResolucion": "2026-07-08T10:05:00.000Z"
  }
]
```

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `string (UUID)` | id de la solicitud |
| `idCotizacion` | `string (UUID)` | |
| `numeroVersion` | `number` | versión de la cotización que se intentó enviar |
| `estado` | `string` | `EN_APROBACION` \| `APROBADA` \| `RECHAZADA` \| `OBSERVADA` |
| `validezDias` | `number` | snapshoteado al abrir la solicitud |
| `comentario` | `string \| null` | del aprobador (aprobar) o motivo/comentario de rechazo/observación; `null` si sigue `EN_APROBACION` sin comentario |
| `usuarioCreacion` / `fechaCreacion` | | quién y cuándo se abrió (llamó a `enviar`) |
| `usuarioResolucion` / `fechaResolucion` | `string \| null` / `string (ISO) \| null` | quién y cuándo se resolvió; `null` mientras está `EN_APROBACION` |

**Errores**: `400` si `:id` no es UUID.

```bash
curl http://localhost:3000/api/cotizaciones/<id>/aprobaciones
```

---

## 6. Bandeja de solicitudes pendientes

```
GET /api/aprobaciones/pendientes
```

Lista las solicitudes `EN_APROBACION` de **todas** las cotizaciones — la bandeja del aprobador.

**Query params** (todos opcionales)

| Param | Tipo | Default | Reglas |
|---|---|---|---|
| `pagina` | `number` | `1` | entero ≥ 1 |
| `porPagina` | `number` | `10` | entero ≥ 1 |

**Respuesta `200`**

```json
{
  "data": [
    {
      "id": "0190f8a2-aaaa-7c4d-8e9f-1a2b3c4d5e6f",
      "idCotizacion": "0190f8a2-7b3c-7c4d-8e9f-1a2b3c4d5e6f",
      "numeroVersion": 1,
      "validezDias": 15,
      "fechaCreacion": "2026-07-08T10:00:00.000Z",
      "usuarioCreacion": "mvp-sin-auth",
      "numeroCotizacion": null,
      "anioCotizacion": null,
      "nombreEjecutivoResponsable": "Usuario MVP"
    }
  ],
  "total": 1,
  "pagina": 1,
  "porPagina": 10
}
```

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `string (UUID)` | id de la solicitud — usalo para resolverla (§4) |
| `idCotizacion` | `string (UUID)` | navegar al detalle de la cotización |
| `numeroVersion` | `number` | versión de la cotización que espera aprobación |
| `validezDias` | `number` | el que se aplicará al aprobar |
| `fechaCreacion` / `usuarioCreacion` | | quién y cuándo la envió |
| `numeroCotizacion` / `anioCotizacion` | `number \| null` | `null` si es el primer envío de la cotización (aún sin numerar); ya poblado si es un reenvío posterior a una aprobación previa |
| `nombreEjecutivoResponsable` | `string` | ejecutivo responsable de la cotización, para mostrar en la bandeja sin un join adicional en el frontend |

**Errores**: `400` si `pagina`/`porPagina` < 1.

```bash
curl "http://localhost:3000/api/aprobaciones/pendientes?pagina=1&porPagina=20"
```

---

## 7. Ver también

- **`API-Cotizaciones.md`** — ciclo de vida completo de la cotización (`estado`, KPIs de `/resumen`
  incluido el bucket `pendientesAprobacion`, borrador, nueva versión, ganada/perdida/cancelar).
- **`docs/ai/BACKLOG.md`** — pendiente de activar `JwtAuthGuard` en producción para que
  `bc03:aprobacion:resolver` se exija de verdad.
