# Cambio: `aprobacion-cotizacion`

**Punto de entrada para el agente que implemente este cambio.** Todo lo que necesitás está en esta carpeta. No hay contexto adicional en ninguna conversación previa.

## Qué hay que hacer, en una frase

El backend (BC-03) introdujo un paso obligatorio de aprobación antes de que una cotización quede oficializada. El frontend todavía habla el contrato viejo y **está roto contra la API real**. Este cambio alinea el front y agrega la feature de aprobaciones de punta a punta.

```
BORRADOR / EN_REVISION ──solicitar aprobación──▶ PENDIENTE_APROBACION ──┬─ aprobar  ▶ ENVIADA
                                                                        ├─ rechazar ▶ BORRADOR
                                                                        └─ observar ▶ BORRADOR
```

## Orden de lectura

| # | Archivo | Para qué |
|---|---------|----------|
| 1 | `../../config.yaml` | Contexto del proyecto y reglas por fase. Leelo primero. |
| 2 | `exploration.md` | Estado actual del código con `file:line`. Dónde está cada cosa hoy. |
| 3 | `proposal.md` | Qué problema resuelve, alcance, non-goals, plan de rollback. |
| 4 | `specs/cotizaciones/spec.md` y `specs/aprobaciones/spec.md` | El **qué**: requisitos con Given/When/Then, incluidos los caminos de error. |
| 5 | `design.md` | El **cómo**: decisiones D1–D6, contratos de tipos, estrategia de invalidación, manejo de errores. |
| 6 | `tasks.md` | El checklist ejecutable: 12 fases, 27 tareas, agrupadas en 10 work units commiteables. **Marcá `[x]` a medida que avanzás.** |
| — | `API-Aprobaciones.md` | Anexo: el contrato del backend, tal cual. Consultalo cuando necesites el detalle exacto de un endpoint. |

`tasks.md` es la fuente de verdad operativa. `design.md` es la fuente de verdad cuando una tarea te deje una duda de implementación. `API-Aprobaciones.md` es la fuente de verdad cuando la duda es sobre el contrato HTTP.

> **Sobre el anexo.** `API-Aprobaciones.md` es una **copia congelada** de `bc03-gestion-comercial/docs/api/API-Aprobaciones.md` (repo del backend, fuera de este proyecto), tomada el 2026-07-09 para que esta carpeta sea autosuficiente. El original manda. Si al implementar encontrás que el backend real no se comporta como dice esta copia, **el backend tiene razón y la copia está vieja**: pará y reportalo, no adaptes el contrato por tu cuenta.

## El orden de las tareas no es negociable

La Fase 1 va primero por una razón mecánica: apenas agregás `"PENDIENTE_APROBACION"` a la unión `EstadoCotizacion`, los `switch` exhaustivos (`accionesPermitidas`, `estado-cotizacion-badge`) **rompen `pnpm build`** hasta que cubras cada `case`. **No hay estado intermedio verde entre 1.1, 1.2 y 1.3** — van en el mismo commit.

Ese compilador es toda la red de seguridad que tenemos. Este proyecto **no tiene test runner**.

## Restricciones duras

No son sugerencias. Cada una viene de una decisión tomada con el dueño del producto.

- **Cero cambios en el backend.** El contrato es fuente de verdad y se toma como dado.
- **Cero cambios en el proxy.** El catch-all `src/app/api/comercial/[[...path]]/route.ts` ya reenvía `/aprobaciones/*` y `/cotizaciones/:id/aprobaciones` inyectando el bearer server-side. No lo toques.
- **El frontend NUNCA computa KPIs.** `pendientesAprobacion` se lee de `/cotizaciones/resumen` y se muestra. No se deriva contando filas.
- **El frontend NUNCA reordena el historial.** Se renderiza en el orden que manda el backend. Si algún día hace falta invertirlo, es un query param del backend.
- **Sin gating de permisos client-side.** MVP: las acciones de resolución son visibles para todos (el backend todavía no exige `bc03:aprobacion:resolver`).
- **Sin tests automatizados.** No hay runner configurado. No generes tareas ni archivos de test.
- **Todo en español**: carpetas, identificadores, comentarios, copy de UI. Es la convención del proyecto.

## Dos cosas que se malinterpretan siempre

**1. `ENVIADA` es un estado, no un email.** Significa que la cotización quedó oficializada: versión congelada + número asignado. El sistema **no manda correos**. La entrega física al cliente es el PDF (`use-imprimir-pdf.ts`), que descarga el ejecutivo. Por eso la acción se renombra a `solicitarAprobacion` (D1): la palabra "enviar" mentía. No agregues funcionalidad de email — está fuera de alcance y no existe contrato de backend para eso.

**2. El detalle de la cotización no conoce el `idSolicitud`.** Los endpoints de resolución son `POST /aprobaciones/:idSolicitud/…`, pero el detalle solo tiene `cotizacion.id`. Se deriva del historial que esa pantalla ya carga (D6, tarea 11.2). No crees endpoints ni queries nuevas para esto.

## La invalidación no es automática

Este proyecto **no usa TanStack Query**. Usa hooks propios `useConsulta` / `useMutar` en `src/compartido/api/`. **No hay invalidación automática**: cada mutación llama `invalidarConsulta(CLAVE)` a mano.

Por eso el design define un helper único `invalidarTrasResolver()` con las **cinco** claves. La quinta (`CLAVE_COTIZACION_APROBACIONES_HISTORIAL`) es la que se olvida. Ver `design.md` → "Estrategia de invalidación (CRÍTICO)".

## Entrega

- **Commits directos a la rama `desarrollo`.** Sin PRs, sin ramas encadenadas.
- Un commit por work unit (tabla al final de `tasks.md`), en ese orden.
- Conventional commits. **Sin `Co-Authored-By` ni atribución a IA.**
- Cada commit cierra con `pnpm build` verde.

## Gate de calidad (tarea 12.1)

```bash
pnpm build
pnpm lint
```

Ambos en verde. En particular, confirmá que no quedó ningún `switch` sobre `EstadoCotizacion` o `EstadoSolicitud` sin cubrir. Esto reemplaza a la suite automatizada — no hay otra.

## Si algo no cierra

`design.md` cerró **seis** decisiones (D1–D6) y `tasks.md` declara explícitamente: *"No queda nada librado al criterio de quien implemente."*

Si encontrás una ambigüedad real, **no la resuelvas por tu cuenta**: es una falla de los artefactos. Documentala y preguntá.
