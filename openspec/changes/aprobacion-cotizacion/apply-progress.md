# Apply progress: aprobacion-cotizacion

## Estado

- Modo: Standard Mode (sin Strict TDD; `openspec/config.yaml` define `rules.apply.tdd: false`).
- Alcance implementado: tareas 1.1–11.2 completadas.
- Tarea 12.1: ejecutada parcialmente; `npm run build` verde, `npm run lint` bloqueado por errores existentes fuera del cambio.

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

## Workload / commits

- Entrega: directa, sin PRs.
- WU7 se partió de forma dependency-safe en dos commits previstos: 9.1+9.2 y 9.3+9.4.

## Verificación

- `npm run build`: verde.
- `npx eslint <archivos modificados>`: verde.
- `npm run lint`: falla por errores preexistentes en `src/modulos/activos/**` y `src/modulos/comercial/catalogos/condiciones/**` (`react-hooks/refs`, `react-hooks/set-state-in-effect`, etc.); no son introducidos por este cambio.

## Desviaciones

- Ninguna funcional: implementación sigue spec/design.
- La verificación completa de lint queda bloqueada por deuda existente fuera del alcance.
