# Apply progress: aprobacion-cotizacion

## Estado

- Modo: Standard Mode (sin Strict TDD; `openspec/config.yaml` define `rules.apply.tdd: false`).
- Alcance implementado: tareas 1.1–12.1 completadas.
- Tarea 12.1: cerrada con build verde, lint de Comercial verde y waiver explícito para deuda global no Comercial.

## Tareas completadas

- [x] 1.1–1.3 Estado `PENDIENTE_APROBACION`, acciones bloqueadas y badge.
- [x] 2.1–2.2 Bucket/campo `pendientesAprobacion`.
- [x] 3.1–3.2 Tipos y schemas del slice `aprobaciones`.
- [x] 4.1–4.2 Pipeline y KPI de pendientes de aprobación.
- [x] 5.1–5.3 Rename `enviarCotizacion` → `solicitarAprobacion`, contrato `201 { id }` y copy honesto.
- [x] 6.1 Claves de invalidación nuevas.
- [x] 7.1 Servicios API del slice `aprobaciones`.
- [x] 8.1–8.3 Hooks e invalidación centralizada, incluyendo bandeja, cotizaciones, resumen, detalle e historial.
- [x] 9.1–9.4 Componentes UI del slice `aprobaciones`.
- [x] 10.1–10.3 Vista, ruta `/comercial/aprobaciones` y sidebar.
- [x] 11.1–11.2 Historial y resolución desde detalle derivando `idSolicitud` desde historial.
- [x] 12.1 Verificación final: build verde, lint de Comercial verde y full lint documentado.

## Workload / commits

- Entrega: directa, sin PRs.
- WU7 se partió de forma dependency-safe en dos commits previstos: 9.1+9.2 y 9.3+9.4.

## Verificación

- `npm run build`: verde.
- `npx eslint src/modulos/comercial`: verde después de limpiar los únicos hallazgos de Comercial detectados por full lint:
  - `src/modulos/comercial/catalogos/condiciones/componentes/catalogo-condiciones-listado.tsx`: se eliminó el `useEffect` que sincronizaba estado de edición y se fuerza remount de `DialogEditar` por `key` del ítem.
  - `src/modulos/comercial/solicitudes-cliente/componentes/solicitud-cliente-nueva-sheet.tsx`: se eliminó el import no usado `SheetDescription`.
- `npm run lint`: sigue fallando con `✖ 95 problems (79 errors, 16 warnings)` únicamente fuera de `src/modulos/comercial/**` tras la limpieza. Evidencia: el output completo quedó en `/home/alex/.local/share/opencode/tool-output/tool_f474b39f9001pcfOPQFRjkp0zc` y `rg "src/modulos/comercial"` sobre ese output no devuelve coincidencias. Los errores restantes pertenecen a `src/modulos/activos/**` (`react-hooks/refs`, `react-hooks/set-state-in-effect`, etc.); warnings remanentes fuera de Comercial incluyen `src/modulos/configuracion-general/**` y `src/modulos/flota/**`.

## Waiver de lint global

- Decisión aplicada: corregir hallazgos de Comercial si son seguros; no tocar deuda no Comercial.
- Resultado: Comercial queda limpio por `npx eslint src/modulos/comercial`.
- Waiver: `npm run lint` no puede usarse como gate global de este change porque falla por deuda heredada fuera del ownership de Comercial y no introducida por `aprobacion-cotizacion`.

## Desviaciones

- Ninguna funcional: implementación sigue spec/design.
- La verificación global de lint queda exceptuada solo por deuda no Comercial existente fuera del alcance.
