# Delta for Dashboard Comercial (frontend)

> Capability nueva. Pantalla de composición de solo lectura para BC-03 Comercial en
> `/dashboard`, servida a Ejecutivo y Gerente con un único layout y un filtro global
> de ejecutivo. Reutiliza hooks de lectura ya existentes (resumen y listados de
> Cotizaciones y Solicitudes) y embebe el slice `calendario` ya implementado (fuera
> de esta spec). Fuera de alcance (Fase 2): KPI de dinero, win rate, ranking por
> ejecutivo, motivos de pérdida, mix por modalidad/canal, contratos por vencer,
> filtrado real por rango de fechas.

## ADDED Requirements

### Requirement: Franja de KPI del embudo (solo conteos)

El dashboard DEBE mostrar una franja de KPI con conteos de Cotizaciones
(`enPreparacion`, `pendientesAprobacion`, `enviadas`, `ganadas`, `perdidas` + total)
vía `useResumenCotizacionesQuery`, y conteos de Solicitudes (`disponibles`,
`enCotizacion`, `sinRespuesta`, `cotizadas` + total) vía `useResumenSolicitudesQuery`.
El frontend NO DEBE calcular agregaciones de negocio (sumas de dinero, win rate).

#### Scenario: Conteos de Cotizaciones visibles
- GIVEN el dashboard cargado
- WHEN el resumen de Cotizaciones responde
- THEN se muestran los 5 buckets y el total

#### Scenario: Conteos de Solicitudes visibles
- GIVEN el dashboard cargado
- WHEN el resumen de Solicitudes responde
- THEN se muestran los 4 buckets y el total

### Requirement: Rotulado explícito del alcance temporal de los KPI

Dado que `/cotizaciones/resumen` y `/solicitudes-cliente/resumen` no aceptan rango de
fechas y devuelven conteos all-time, la franja de KPI DEBE rotular explícitamente
que los conteos son acumulados bajo el filtro de ejecutivo/contexto vigente, y NO
DEBE presentarlos como "del mes" ni como "del periodo".

#### Scenario: Rótulo all-time visible
- GIVEN la franja de KPI renderizada
- WHEN el usuario la observa
- THEN un rótulo indica que los conteos son acumulados (no del mes en curso)

### Requirement: Lista de cotizaciones pendientes de aprobación

El dashboard DEBE mostrar una lista de cotizaciones en estado que requiere
aprobación, vía `useListarCotizaciones`, con acceso al detalle de cada una.

#### Scenario: Hay pendientes
- GIVEN cotizaciones pendientes de aprobación bajo el filtro actual
- WHEN el usuario abre el dashboard
- THEN la lista las muestra con acceso a su detalle

#### Scenario: Sin pendientes
- GIVEN ninguna cotización pendiente de aprobación bajo el filtro actual
- WHEN el usuario abre el dashboard
- THEN la lista muestra un estado vacío sin error

### Requirement: Lista de solicitudes sin cotizar

El dashboard DEBE mostrar las solicitudes en estado `PENDIENTE` (sin cotizar), vía
`useSolicitudesClienteQuery`, ordenadas por `fechaCreacion` ascendente (más antiguas
primero).

#### Scenario: Orden por antigüedad
- GIVEN solicitudes `PENDIENTE` con distinta `fechaCreacion`
- WHEN se renderiza la lista
- THEN aparecen ordenadas de más antigua a más reciente

#### Scenario: Sin solicitudes pendientes
- GIVEN ninguna solicitud `PENDIENTE` bajo el filtro actual
- WHEN el usuario abre el dashboard
- THEN la lista muestra un estado vacío sin error

### Requirement: Lista de cotizaciones enviadas por vencer (regla de 72 h en cliente)

El dashboard DEBE mostrar las cotizaciones en estado `ENVIADA` cuya
`fechaVencimiento` cae dentro de las 72 h siguientes al momento actual. El umbral
DEBE calcularse en el cliente (deuda consciente de Fase 1, documentada; el bucket
`porVencer` en backend queda para Fase 2).

#### Scenario: Cotización dentro del umbral
- GIVEN una cotización `ENVIADA` con `fechaVencimiento` a menos de 72 h
- WHEN se calcula la lista de por vencer
- THEN la cotización aparece en la lista

#### Scenario: Cotización fuera del umbral
- GIVEN una cotización `ENVIADA` con `fechaVencimiento` a más de 72 h
- WHEN se calcula la lista de por vencer
- THEN la cotización NO aparece en la lista

#### Scenario: Ninguna por vencer
- GIVEN ninguna cotización `ENVIADA` dentro de las 72 h
- WHEN el usuario abre el dashboard
- THEN la lista muestra un estado vacío sin error

### Requirement: Filtro global de ejecutivo (Todos / uno)

El dashboard DEBE exponer un filtro global de ejecutivo (vía
`useEjecutivosCotizacionesQuery`) con valor por defecto "Todos". Al cambiar el
valor, DEBE propagar `idEjecutivoResponsable` y recalcular tanto la franja de KPI
como las tres listas accionables.

#### Scenario: Filtro por defecto
- GIVEN el dashboard recién cargado
- WHEN se observa el filtro
- THEN su valor es "Todos" y los KPI/listas reflejan toda el área

#### Scenario: Selección de un ejecutivo
- GIVEN el filtro en "Todos"
- WHEN el usuario elige un ejecutivo específico
- THEN la franja de KPI y las tres listas se recalculan con `idEjecutivoResponsable`

### Requirement: Composición sin duplicación de consultas ni cambios de backend

El dashboard DEBE construirse componiendo los hooks de lectura ya existentes
(resumen y listado de Cotizaciones/Solicitudes) sin duplicar consultas ni agregar
endpoints nuevos. El slice NO DEBE realizar mutaciones ni tocar el backend/proxy.

#### Scenario: Reuso de hooks existentes
- GIVEN los widgets del dashboard
- WHEN consumen datos
- THEN usan los mismos hooks que ya consumen las tablas de Cotizaciones/Solicitudes

### Requirement: Reemplazo del placeholder demo en `/dashboard`

La ruta `/dashboard` NO DEBE seguir mostrando el placeholder demo de shadcn
(`SectionCards`/`ChartAreaInteractive` con datos de ejemplo); DEBE renderizar los
widgets del slice `dashboard`. `pnpm build` y `pnpm lint` DEBEN pasar en verde.

#### Scenario: Placeholder eliminado
- GIVEN un usuario autenticado en `/dashboard`
- WHEN la página carga
- THEN ve la franja de KPI y las listas accionables, sin datos demo
