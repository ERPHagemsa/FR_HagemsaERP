# Delta for Dashboard Comercial (frontend)

> Recablea `/comercial` para consumir los 8 endpoints reales de agregación de BC03
> Fase 2 (`GET /dashboard/*`, todos exigen `bc03:dashboard:leer`) en vez de componer
> hooks de resumen/listado de Cotizaciones y Solicitudes. Reemplaza la franja de KPI
> de conteos por KPI de dinero PEN/USD, y agrega win rate, ciclo de cierre, tendencia
> mensual, ranking de ejecutivos, motivos de pérdida y embudo de conversión. Introduce
> el selector global de período (con la excepción documentada de `tendencia-mensual`)
> y retira el cálculo cliente de "por vencer 72h". Fuera de alcance: cualquier cambio
> de backend/proxy, conversión de moneda entre PEN/USD, catálogo real de motivos de
> pérdida, tiempo real/websockets, export/PDF.

## ADDED Requirements

### Requirement: KPI de win rate del período

El dashboard DEBE mostrar el win rate del período vigente (`ganadas / (ganadas +
perdidas)` sobre cierres cuya fecha de cierre cae en el período) vía
`GET /dashboard/win-rate`, con un donut de ganadas vs. perdidas y la variación
`variacionVsMesAnterior` en **puntos porcentuales** respecto al período
inmediatamente anterior de igual duración. Ambos valores (`winRate` y
`variacionVsMesAnterior`) son `null` cuando el período correspondiente no tuvo
ningún cierre `GANADA`/`PERDIDA`; el widget NO DEBE tratar ese `null` como error.

#### Scenario: Win rate con cierres en el período
- GIVEN cierres `GANADA`/`PERDIDA` dentro del período vigente
- WHEN `win-rate` responde
- THEN el donut muestra la proporción ganadas/perdidas y el porcentaje de win rate

#### Scenario: Sin cierres en el período (null-safe)
- GIVEN ningún cierre `GANADA`/`PERDIDA` en el período vigente
- WHEN `win-rate` responde con `winRate: null`
- THEN el widget muestra un estado "sin datos" neutro (no un mensaje de error) y omite el donut

#### Scenario: Variación no calculable
- GIVEN el período vigente o el período anterior de igual duración sin cierres `GANADA`/`PERDIDA`
- WHEN `win-rate` responde con `variacionVsMesAnterior: null`
- THEN el indicador de variación se oculta o se muestra neutro, sin inventar un signo/valor

### Requirement: KPI de ciclo de cierre del período

El dashboard DEBE mostrar el promedio de días entre creación y cierre `GANADA` del
período vigente vía `GET /dashboard/ciclo-cierre`, junto con `variacionVsMesAnterior`
(delta en días, valor **crudo sin invertir signo**, contra el período inmediatamente
anterior de igual duración). El frontend DEBE aplicar la convención "menos es
mejor": un delta negativo (el ciclo se acortó) se colorea como mejora (verde/positivo)
y un delta positivo (el ciclo se alargó) se colorea como deterioro (rojo/negativo),
aunque el signo aritmético crudo indique lo contrario de "más alto = mejor".
Ambos valores son `null` cuando el período correspondiente no tuvo cierres `GANADA`.

#### Scenario: Ciclo con cierres GANADA en el período
- GIVEN cierres `GANADA` en el período vigente
- WHEN `ciclo-cierre` responde `cicloPromedioDias`
- THEN el widget muestra el promedio de días

#### Scenario: Coloreado "menos es mejor" con delta negativo
- GIVEN `variacionVsMesAnterior: -2.1` (el ciclo se acortó 2.1 días vs. el período anterior)
- WHEN el widget renderiza la variación
- THEN la muestra como una mejora (color/ícono positivo), no como un valor negativo genérico

#### Scenario: Coloreado "menos es mejor" con delta positivo
- GIVEN `variacionVsMesAnterior: 3.5` (el ciclo se alargó 3.5 días vs. el período anterior)
- WHEN el widget renderiza la variación
- THEN la muestra como un deterioro (color/ícono negativo)

#### Scenario: Sin cierres GANADA (null-safe)
- GIVEN ningún cierre `GANADA` en el período vigente o en el anterior de igual duración
- WHEN `ciclo-cierre` responde `cicloPromedioDias: null` y/o `variacionVsMesAnterior: null`
- THEN el widget muestra un estado "sin datos" neutro, sin tratarlo como error

### Requirement: Tendencia mensual ganado vs. perdido

El dashboard DEBE mostrar un gráfico de barras con el monto ganado vs. perdido por
mes (PEN y USD por separado) de los últimos N meses calendario vía
`GET /dashboard/tendencia-mensual` (`meses` default 6). Este widget NO DEBE
recibir `desde`/`hasta` del selector global de período: su ventana es siempre fija
("últimos N meses terminando en el mes actual"), independiente del período
seleccionado en el resto del dashboard. La serie siempre trae un punto por cada mes
de la ventana (meses sin cierres llegan con montos en `0`, no se omiten).

#### Scenario: Serie completa con meses en cero
- GIVEN una ventana de 6 meses donde 2 meses no tuvieron cierres
- WHEN `tendencia-mensual` responde
- THEN el gráfico muestra 6 puntos, con los 2 meses sin cierres en monto `0` (no ausentes)

#### Scenario: Independencia del selector global de período
- GIVEN el usuario cambia el selector global de período a un rango específico
- WHEN el dashboard recalcula los widgets period-scoped
- THEN `tendencia-mensual` NO cambia su ventana ni vuelve a pedir datos por ese cambio

### Requirement: Ranking de ejecutivos

El dashboard DEBE mostrar una tabla de ranking del equipo vía
`GET /dashboard/ranking-ejecutivos`, con columnas `ejecutivoNombre`, `ganado`
(PEN/USD por separado), `pipeline` (PEN/USD por separado), `cantidadGanadas`,
`cantidadCerradas` y `winRate` (null-safe, mismo patrón sin-división-por-cero que
el KPI de win rate). Este endpoint no acepta `idEjecutivoResponsable` como filtro
(ya agrupa por ejecutivo): el widget SIEMPRE muestra el ranking completo del
equipo bajo el período vigente, **sin importar** el valor del filtro global de
ejecutivo — el ranking es intrínsecamente comparativo y perdería su propósito si
se acotara a un solo ejecutivo. La tabla se ordena por `ganado.pen` descendente
(criterio elegido porque PEN y USD nunca se sudan/convierten entre sí — ver KPI
monetarios).

#### Scenario: Ranking no afectado por el filtro de ejecutivo
- GIVEN el filtro global de ejecutivo en "Todos"
- WHEN el usuario selecciona un ejecutivo específico
- THEN la tabla de ranking sigue mostrando a todos los ejecutivos del equipo (sin recalcular ni filtrar filas)

#### Scenario: Orden por ganado en PEN
- GIVEN varios ejecutivos con distinto `ganado.pen` en el período vigente
- WHEN se renderiza la tabla
- THEN las filas aparecen ordenadas por `ganado.pen` descendente

#### Scenario: Ejecutivo sin cierres en el período (null-safe)
- GIVEN un ejecutivo con `cantidadCerradas: 0` en el período vigente
- WHEN se renderiza su fila
- THEN `winRate` se muestra como "sin datos" (no como `0%` ni como error)

### Requirement: Motivos de pérdida del período

El dashboard DEBE mostrar un desglose en barras de los motivos de pérdida del
período vigente vía `GET /dashboard/motivos-perdida`, usando `motivoOriginal`
como etiqueta visible y `cantidad` como valor de la barra. Dado que el
agrupamiento es best-effort (`trim` + minúsculas, sin catálogo/enum real), el
widget NO DEBE presentar la lista como una taxonomía cerrada ni garantizar que
motivos redactados de forma distinta para la misma causa aparezcan agrupados.

#### Scenario: Motivos con datos en el período
- GIVEN cierres `PERDIDA` con distintos `motivoPerdida` en el período vigente
- WHEN `motivos-perdida` responde
- THEN cada grupo se muestra como una barra con su `motivoOriginal` y `cantidad`

#### Scenario: Sin pérdidas en el período
- GIVEN ningún cierre `PERDIDA` en el período vigente
- WHEN `motivos-perdida` responde una lista vacía
- THEN el widget muestra un estado vacío sin error

### Requirement: Embudo de conversión del período

El dashboard DEBE mostrar el embudo `solicitud → cotizada → enviada → ganada` del
período vigente vía `GET /dashboard/embudo-conversion`, con semántica
**"alcanzó en algún momento"** (no "estado actual"): una solicitud cuya cotización
terminó `GANADA` cuenta en las 4 etapas. Los contadores son monótonamente
decrecientes (`solicitud ≥ cotizada ≥ enviada ≥ ganada`). El filtro global de
ejecutivo acota las etapas `cotizada`/`enviada`/`ganada` (involucran una
cotización), pero **NO** acota la etapa `solicitud` (`SolicitudCliente` no tiene
`idEjecutivoResponsable`).

#### Scenario: Embudo monotónicamente decreciente
- GIVEN los 4 conteos del embudo del período vigente
- WHEN se renderiza el widget
- THEN cada etapa muestra un conteo menor o igual a la etapa anterior

#### Scenario: Filtro de ejecutivo no afecta la etapa "solicitud"
- GIVEN el filtro global de ejecutivo en "Todos"
- WHEN el usuario selecciona un ejecutivo específico
- THEN el conteo de la etapa `solicitud` NO cambia, mientras `cotizada`/`enviada`/`ganada` sí se recalculan

### Requirement: Selector global de período

El dashboard DEBE exponer un selector global de período (`desde`/`hasta`) que
alimenta a todos los widgets period-scoped: KPI monetarios, win rate, ciclo de
cierre, ranking de ejecutivos, motivos de pérdida y embudo de conversión. Si el
usuario no fija explícitamente ambos extremos (`desde` y `hasta`), el backend
usa el mes calendario actual como período por defecto — el frontend NO DEBE
enviar solo uno de los dos extremos. `tendencia-mensual` y `acciones-pendientes`
quedan explícitamente **exentos** del selector de período (ver sus requisitos
dedicados).

#### Scenario: Período por defecto
- GIVEN el dashboard recién cargado sin selección explícita de período
- WHEN los widgets period-scoped consultan sus endpoints
- THEN no envían `desde`/`hasta` (o envían ambos coherentes con el mes calendario actual) y el backend resuelve el mes calendario vigente

#### Scenario: Cambio de período recalcula los widgets aplicables
- GIVEN el selector global de período en su valor por defecto
- WHEN el usuario elige un rango distinto
- THEN KPI monetarios, win rate, ciclo de cierre, ranking, motivos de pérdida y embudo de conversión se recalculan con el nuevo `desde`/`hasta`

#### Scenario: Widgets exentos no reaccionan al período
- GIVEN el selector global de período en su valor por defecto
- WHEN el usuario elige un rango distinto
- THEN `tendencia-mensual` y `acciones-pendientes` (por vencer 72h, esperando aprobación, sin cotizar) NO vuelven a consultarse por ese cambio

### Requirement: Estados de carga y error independientes por widget

Cada uno de los 8 widgets del dashboard (KPI monetarios, win rate, ciclo de
cierre, tendencia mensual, ranking, motivos de pérdida, embudo, acciones
pendientes) DEBE gestionar su propio estado de carga y error de forma
independiente (una instancia de `useConsulta` por widget). El fallo de un
endpoint NO DEBE impedir que los demás widgets carguen o muestren sus datos.

#### Scenario: Un widget en error no bloquea a los demás
- GIVEN `GET /dashboard/motivos-perdida` responde con error
- WHEN el resto de endpoints responde correctamente
- THEN el widget de motivos de pérdida muestra su propio estado de error mientras los demás widgets muestran sus datos con normalidad

#### Scenario: Carga independiente
- GIVEN el dashboard recién montado
- WHEN los 8 endpoints están en vuelo
- THEN cada widget muestra su propio estado de carga hasta que su respuesta individual llega, sin esperar a los demás

## MODIFIED Requirements

### Requirement: Franja de KPI monetarios (PEN/USD)

> Reemplaza la Requirement Fase 1 "Franja de KPI del embudo (solo conteos)": ya
> no se muestran conteos de buckets de Cotizaciones/Solicitudes, sino KPI de
> dinero agregados por backend.

El dashboard DEBE mostrar una franja de KPI monetarios del período vigente vía
`GET /dashboard/kpis-monetarios`: Ganado, Pipeline (vivo) y Ticket promedio, cada
uno con PEN y USD como totales **SEPARADOS** — el frontend NO DEBE sumar ni
convertir montos entre monedas. El endpoint también expone
`variacionVsMesAnterior` con la **misma forma** que `actual` (Ganado/Pipeline/
Ticket promedio en PEN/USD), pero calculado sobre el período inmediatamente
anterior de igual duración — a diferencia de win rate y ciclo de cierre, este
campo **no es un delta precalculado**: el frontend es responsable de derivar la
variación visual (aumento/disminución) comparando `actual` contra
`variacionVsMesAnterior`, por moneda. `ticketPromedio` es `0` (no `null`) cuando
no hubo cierres `GANADA` en el período, por construcción del backend
(`ganado / cantidad de cierres`, `0` sin cierres).

#### Scenario: KPI con datos en ambas monedas
- GIVEN cierres `GANADA` y cotizaciones en curso con montos en PEN y USD en el período vigente
- WHEN `kpis-monetarios` responde
- THEN Ganado, Pipeline y Ticket promedio se muestran con su valor en PEN y su valor en USD por separado, nunca sumados ni convertidos

#### Scenario: Variación derivada por el frontend
- GIVEN `actual.ganado.pen: 15000` y `variacionVsMesAnterior.ganado.pen: 9000`
- WHEN el widget renderiza la variación de Ganado en PEN
- THEN calcula y muestra el aumento/disminución comparando ambos valores (no consume un campo de delta ya calculado por el backend)

#### Scenario: Zero-data del período (sin error)
- GIVEN ningún cierre `GANADA` ni cotización viva en el período vigente
- WHEN `kpis-monetarios` responde con `ganado`, `pipeline` y `ticketPromedio` en `0` para ambas monedas
- THEN el widget muestra los KPI en `0` con un indicador de variación neutro (no un mensaje de error)

### Requirement: Acciones pendientes (listas accionables)

> Reemplaza las 3 Requirements Fase 1 "Lista de cotizaciones pendientes de
> aprobación", "Lista de solicitudes sin cotizar" y "Lista de cotizaciones
> enviadas por vencer (regla de 72 h en cliente)": las 3 listas se consolidan en
> un único endpoint de backend; se retira el cálculo cliente de la regla de 72h
> (`utilidades/por-vencer.ts` queda obsoleto).

El dashboard DEBE mostrar las 3 listas accionables (por vencer en 72h, esperando
aprobación, sin cotizar) vía un único `GET /dashboard/acciones-pendientes`, sin
cálculo de negocio en cliente. Este endpoint NO es dependiente de período (usa
siempre "ahora" para la ventana de 72h y el estado vigente para "esperando
aprobación"; no acepta `desde`/`hasta`) — el selector global de período NO lo
afecta. El filtro global de ejecutivo acota `porVencer72h` y `esperandoAprobacion`
(cotizaciones con ejecutivo asignado), pero **NO** afecta `solicitudesSinCotizar`:
esas solicitudes aún no tienen ejecutivo asignado (`idEjecutivoResponsable`,
`nombreEjecutivoResponsable`, `moneda` y `monto` siempre `null`), es un invariante
de dominio (no una deuda pendiente) y la lista siempre muestra el conjunto
completo de solicitudes sin asignar, sin importar el ejecutivo seleccionado.

#### Scenario: Regla de 72h resuelta por backend
- GIVEN cotizaciones `ENVIADA` con `fechaVencimiento` dentro de las próximas 72h
- WHEN `acciones-pendientes` responde `porVencer72h`
- THEN la lista se muestra tal cual la entrega el backend, sin recalcular el umbral en el frontend

#### Scenario: Sin-cotizar no varía con el filtro de ejecutivo
- GIVEN el filtro global de ejecutivo en "Todos" y una lista `solicitudesSinCotizar` con N elementos
- WHEN el usuario selecciona un ejecutivo específico
- THEN la lista `solicitudesSinCotizar` sigue mostrando los mismos N elementos, sin filtrar por ese ejecutivo

#### Scenario: Por vencer / esperando aprobación sí varían con el filtro de ejecutivo
- GIVEN el filtro global de ejecutivo en "Todos"
- WHEN el usuario selecciona un ejecutivo específico
- THEN `porVencer72h` y `esperandoAprobacion` se recalculan acotadas a ese ejecutivo

#### Scenario: Listas exentas del selector de período
- GIVEN el selector global de período en su valor por defecto
- WHEN el usuario elige un rango distinto
- THEN las 3 listas de `acciones-pendientes` NO vuelven a consultarse por ese cambio

#### Scenario: Las 3 listas vacías (sin error)
- GIVEN ninguna cotización por vencer, ninguna esperando aprobación y ninguna solicitud sin cotizar
- WHEN `acciones-pendientes` responde con las 3 listas vacías
- THEN el dashboard muestra un estado vacío sin error en cada una

### Requirement: Filtro global de ejecutivo (Todos / uno)

> Extiende la Requirement Fase 1 del mismo nombre: mismo comportamiento base
> (default "Todos", propaga `idEjecutivoResponsable`), pero ahora alcanza a los
> 8 widgets con dos excepciones documentadas.

El dashboard DEBE exponer un filtro global de ejecutivo con valor por defecto
"Todos". Al cambiar el valor, DEBE propagar `idEjecutivoResponsable` y recalcular
todos los widgets que lo soportan: KPI monetarios, win rate, ciclo de cierre,
tendencia mensual, motivos de pérdida, embudo de conversión (etapas 2-4) y las
listas `porVencer72h`/`esperandoAprobacion` de acciones pendientes. Tiene dos
excepciones explícitas: (1) **ranking de ejecutivos**, que siempre muestra al
equipo completo porque el endpoint no acepta este filtro (ya agrupa por
ejecutivo); y (2) **solicitudes sin cotizar**, que nunca tiene ejecutivo asignado
(invariante de dominio).

#### Scenario: Filtro por defecto
- GIVEN el dashboard recién cargado
- WHEN se observa el filtro
- THEN su valor es "Todos" y los widgets aplicables reflejan toda el área

#### Scenario: Selección de un ejecutivo recalcula los widgets aplicables
- GIVEN el filtro en "Todos"
- WHEN el usuario elige un ejecutivo específico
- THEN KPI monetarios, win rate, ciclo de cierre, tendencia mensual, motivos de pérdida, embudo (etapas 2-4) y las listas por-vencer/esperando-aprobación se recalculan con `idEjecutivoResponsable`

#### Scenario: Excepciones documentadas no reaccionan al filtro
- GIVEN el filtro en "Todos"
- WHEN el usuario elige un ejecutivo específico
- THEN el ranking de ejecutivos sigue mostrando a todo el equipo y la lista de solicitudes sin cotizar no cambia

### Requirement: Composición vía tríada dedicada de endpoints, sin cambios de backend

> Reemplaza la Requirement Fase 1 "Composición sin duplicación de consultas ni
> cambios de backend": Fase 1 componía hooks de lectura ya existentes de
> Cotizaciones/Solicitudes deliberadamente sin tríada `api`/`queries` propia; Fase
> 2b introduce esa tríada como reversión documentada, no como violación de la
> convención per-BC.

El dashboard DEBE construirse consumiendo los 8 endpoints dedicados
`GET /dashboard/*` a través de una tríada `dashboard-api.ts` + `dashboard-queries.ts`
+ extensión de `tipos/dashboard.tipos.ts`, siguiendo el patrón `useConsulta<T>` /
`clienteComercial` / `claves-consulta.ts` ya usado en otros módulos del BC. El
slice NO DEBE introducir cambios de backend ni del proxy `/api/comercial`, y NO
DEBE realizar trabajo de autenticación en frontend: `bc03:dashboard:leer` se
aplica backend-side y el proxy ya inyecta `Authorization: Bearer` server-side.

#### Scenario: Uso de la tríada dedicada
- GIVEN los widgets del dashboard
- WHEN consumen datos
- THEN lo hacen a través de `dashboard-queries.ts` (que usa `dashboard-api.ts`), no componiendo hooks de Cotizaciones/Solicitudes

#### Scenario: Cero cambios de backend/proxy/auth
- GIVEN el recableado completo del dashboard
- WHEN se audita el diff
- THEN no hay cambios en BC03 (backend), en `src/app/api/comercial/[[...path]]/route.ts` (proxy), ni lógica de verificación de permisos en frontend

## REMOVED Requirements

### Requirement: Rotulado explícito del alcance temporal de los KPI

**Motivo de remoción**: esta Requirement Fase 1 existía porque
`/cotizaciones/resumen` y `/solicitudes-cliente/resumen` no aceptaban rango de
fechas y devolvían conteos all-time, obligando a rotular "acumulado" en vez de
"del mes". Fase 2b reemplaza esos KPI por `kpis-monetarios`, que sí es
period-scoped (mes calendario actual por defecto, o el rango del selector
global de período) — la franja de KPI monetarios ya no es all-time, por lo que
el rótulo "acumulado, no del mes" ya no aplica y se retira.
