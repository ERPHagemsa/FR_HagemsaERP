# Delta for Calendario (frontend)

> Capability nueva. Este delta define la vista de calendario de Cotizaciones
> Ganadas del módulo Comercial (frontend). El feed de datos lo provee BC03
> (`GET /cotizaciones/ganadas/calendario`), fuera de esta spec.

## ADDED Requirements

### Requirement: Vista de calendario mensual de Cotizaciones Ganadas

La app DEBE mostrar una grilla mensual donde cada Cotización Ganada aparece como un
evento ubicado en su fecha de inicio de servicio. Los eventos con fecha de fin se
muestran abarcando el rango inicio–fin (dentro del mes visible). La vista muestra
todas las ganadas del área (no solo las del usuario). Cada evento muestra su título
(Prospecto/Cliente + número de Cotización).

#### Scenario: El mes muestra las ganadas en su día de inicio

- GIVEN cotizaciones ganadas con fecha de inicio de servicio en el mes visible
- WHEN el usuario abre el calendario
- THEN cada una aparece como un evento en la celda de su fecha de inicio de servicio
- AND el evento muestra el nombre del Prospecto/Cliente y el número de Cotización

#### Scenario: Evento de rango (servicio con fin)

- GIVEN una cotización ganada con fecha de inicio y fecha de fin de servicio en el mes visible
- WHEN se renderiza el calendario
- THEN el evento se muestra en cada día que abarca el rango inicio–fin (recortado al mes visible)

#### Scenario: Click en un evento navega al detalle

- GIVEN un evento visible en el calendario
- WHEN el usuario hace click sobre él
- THEN es navegado al detalle de esa Cotización (usando el `enlace` del evento)

#### Scenario: Mes sin ganadas

- GIVEN un mes sin cotizaciones ganadas con inicio de servicio
- WHEN el usuario lo abre
- THEN la grilla se muestra vacía (sin eventos) y sin error

### Requirement: Navegación temporal del calendario

La app DEBE permitir navegar al mes anterior, al mes siguiente y volver al mes
actual ("Hoy"). Al cambiar de mes, el calendario DEBE volver a pedir los eventos del
nuevo rango visible.

#### Scenario: Navegar entre meses

- GIVEN el calendario en un mes dado
- WHEN el usuario pulsa "mes siguiente" (o "anterior")
- THEN la grilla pasa al mes correspondiente
- AND se piden los eventos del nuevo rango visible

#### Scenario: Volver a hoy

- GIVEN el calendario en un mes distinto al actual
- WHEN el usuario pulsa "Hoy"
- THEN la grilla vuelve al mes actual con el día de hoy resaltado

### Requirement: Consumo del feed del backend por rango visible

La app DEBE pedir los eventos al feed del backend (`GET
/cotizaciones/ganadas/calendario?desde=&hasta=`) usando el rango de fechas del mes
visible (incluyendo los días de relleno del inicio/fin de la grilla), y DEBE manejar
los estados de carga y error.

#### Scenario: Carga

- GIVEN el calendario pidiendo los eventos de un mes
- WHEN la petición está en curso
- THEN se muestra un estado de carga (skeleton) en la grilla

#### Scenario: Error del feed

- GIVEN el feed responde con error
- WHEN el usuario está en el calendario
- THEN se muestra un mensaje de error con opción de reintentar, sin romper la vista

### Requirement: Ruta y navegación del calendario

La app DEBE exponer el calendario en `/comercial/calendario` y ofrecer acceso desde
el sidebar, en el bloque "Gestión Comercial".

#### Scenario: Acceso desde el sidebar

- GIVEN un usuario autenticado en el área Comercial
- WHEN abre el sidebar y elige "Calendario de ganadas"
- THEN es llevado a `/comercial/calendario` con el calendario del mes actual
