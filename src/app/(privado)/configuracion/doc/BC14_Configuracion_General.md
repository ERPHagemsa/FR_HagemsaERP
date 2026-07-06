# Piloto Detallado: BC-14 Configuracion General

Este documento describe la administracion de los datos maestros de configuracion que sirven como base para otros procesos del sistema: ubicaciones, sedes, areas, almacenes, cargos, cuentas, contratos, regimenes laborales, peajes, tarifas y rutas. Actua como fuente de referencia para mantener catalogos consistentes, disponibles y auditables.

| Campo | Detalle |
| --- | --- |
| Area | Administracion / Operaciones / Configuracion del sistema |
| Roles | **Administrador Principal**, **Analista de Configuracion**, **Usuario Operativo** y **Auditor**. |
| Relacion clave | La configuracion se organiza por tipo de maestro. Algunos registros son independientes (ubicaciones, cuentas y regimenes) y otros dependen de ellos: sedes dependen de ubicaciones; areas dependen de sedes y opcionalmente de gerencias; almacenes dependen de ubicaciones y opcionalmente de sedes; cargos pueden reportar a otro cargo; contratos dependen de una cuenta o contrato padre; peajes dependen de ubicaciones de tipo PEAJE; rutas ordenan ubicaciones y pueden tener peajes por tramo. |
| Alcance funcional | Registrar, modificar, consultar, inhabilitar, reactivar, anular y exportar datos maestros de configuracion; revisar resumen general; consultar listados por seccion; mantener jerarquias; administrar peajes y tarifas; administrar rutas, puntos y peajes del recorrido; calcular costos de peajes por tipo de cobro, sentido y numero de ejes. |
| Regla de edicion | La edicion normal permite actualizar nombre, descripcion y campos propios permitidos por tipo. No permite cambiar el tipo de maestro ni el codigo autogenerado. En contratos, el padre se define al crear y no se modifica desde la edicion normal. |
| Lo que entra | Solicitudes de alta o cambio de maestros; motivos de inhabilitacion o anulacion; seleccion de dependencias; datos geograficos; parametros de regimen; ubicaciones de peaje; tarifas; estructura de rutas; filtros de consulta y exportacion. |
| Lo que sale | Catalogos activos para otros modulos; registros consultables por estado; jerarquias; exportaciones; costos estimados de peajes; historial basico de creacion, modificacion, inhabilitacion y anulacion. |
| Quien la usa | Usuarios que configuran la base operativa y organizacional del ERP, procesos que consumen catalogos, responsables de auditoria y usuarios que consultan reportes de configuracion. |

> **Fuera de alcance:** Este bounded context no ejecuta operaciones de transporte, asignaciones reales de personal, asistencia, ventas, compras, facturacion ni liquidaciones. Tampoco reemplaza la gestion operativa de rutas; solo administra los datos maestros y referencias necesarias para que otros procesos los usen.

## Resumen de Epicas

| # | Epica | Objetivo de negocio | Historias |
| --- | --- | --- | --- |
| 1 | Panel y Consulta General | Visualizar el estado de los maestros, acceder a secciones y consultar registros por filtros. | 3 |
| 2 | Ubicaciones, Sedes, Areas y Almacenes | Mantener la base geografica, centros de trabajo, estructura interna y almacenes. | 4 |
| 3 | Cargos, Cuentas, Contratos y Regimenes | Mantener catalogos organizacionales, comerciales y laborales reutilizables. | 4 |
| 4 | Ciclo de Vida y Auditoria | Editar, inhabilitar, reactivar, anular y revisar detalles de configuraciones. | 3 |
| 5 | Peajes y Tarifas | Administrar peajes asociados a ubicaciones y sus tarifas de cobro. | 3 |
| 6 | Rutas y Costos de Peajes | Administrar rutas, ordenar puntos, asignar peajes y calcular costos. | 4 |
| 7 | Reportes y Exportacion | Consolidar informacion de configuracion para revision y salida de datos. | 2 |

> **Nota sobre estados:** Un registro puede estar **Activo** o **Inactivo**. Ademas, su registro puede estar **Vigente** o **Anulado**. Los activos y vigentes quedan disponibles para ser consumidos por otros procesos. Los inactivos se conservan para consulta, pero no deben usarse en nuevas operaciones. Los anulados quedan como referencia historica.

> **Nota sobre dependencia:** Cuando un maestro necesita otro registro activo, el sistema bloquea o informa el alta si la dependencia no existe. Por ejemplo, no se crea una sede sin ubicacion, un area sin sede, un almacen sin ubicacion o un contrato sin cuenta/contrato padre.

> **Nota sobre navegacion:** El usuario inicia en **CS-Configuracion General**, revisa metricas, entra a secciones dedicadas, registra nuevos maestros desde `/configuracion/nuevo/<tipo>`, consulta reportes o administra rutas y peajes desde sus pantallas propias.

## Epica 1: Panel y Consulta General

> **Objetivo:** Permitir que el usuario revise el estado general de la configuracion y consulte los datos maestros por seccion, filtros y jerarquia.

---

### HU-14-001 Como Administrador Principal, quiero ver el panel de configuracion general, para conocer el estado de los catalogos del sistema.

**Prioridad: Alta | Estimacion: 3 puntos**

**Precondiciones**

- Usuario autenticado y con permiso para consultar Configuracion General.
- El servicio de configuracion esta disponible o debe informarse su indisponibilidad.

**Criterios de Aceptacion**

- [ ] DADO que el usuario ingresa a Configuracion General, CUANDO carga el panel, ENTONCES ve metricas de maestros totales, activos, inactivos, anulados y vigentes consumibles.
- [ ] DADO que existen registros por tipo, CUANDO carga el panel, ENTONCES ve el resumen separado por ubicaciones, sedes, areas, almacenes, cargos, cuentas, contratos y regimenes.
- [ ] DADO que el usuario necesita registrar un dato, CUANDO selecciona Nuevo, ENTONCES accede al formulario de registro por tipo.
- [ ] DADO que el usuario necesita revisar reportes, CUANDO selecciona Ver reportes, ENTONCES accede a la vista consolidada.
- [ ] DADO que el servicio no responde, CUANDO carga el panel, ENTONCES el sistema muestra un mensaje de error sin bloquear la navegacion ya disponible.

**Flujo Principal**

1. Entra a CS-Configuracion General.
2. Revisa las metricas y estado del servicio.
3. Selecciona una seccion o una accion rapida.

**Flujos de Excepcion**

- No se puede cargar el resumen.
- No se puede verificar el estado del servicio.
- El usuario no tiene permiso para consultar el modulo.

**Eventos del Dominio**

- No registra cambios; es una historia de consulta.

---

### HU-14-002 Como Analista de Configuracion, quiero consultar registros por seccion, para encontrar rapidamente el maestro que necesito revisar.

**Prioridad: Alta | Estimacion: 5 puntos**

**Precondiciones**

- Usuario autenticado y con permiso para consultar maestros.
- Existen registros o la lista puede estar vacia.

**Criterios de Aceptacion**

- [ ] DADO una seccion de configuracion, CUANDO el usuario entra, ENTONCES ve su listado dedicado: ubicaciones, sedes y areas, almacenes, cuentas y contratos, cargos o regimenes.
- [ ] DADO una seccion que agrupa dos tipos, CUANDO el usuario cambia el selector, ENTONCES el listado muestra el tipo elegido.
- [ ] DADO filtros por nombre, codigo, estado o estado de registro, CUANDO el usuario los aplica, ENTONCES el listado muestra solo coincidencias.
- [ ] DADO filtros aplicados, CUANDO el usuario selecciona Limpiar, ENTONCES vuelve a la consulta base de activos y vigentes.
- [ ] DADO que el listado usa paginacion, CUANDO el usuario cambia de pagina, ENTONCES se conserva el criterio de consulta.

**Flujo Principal**

1. Entra a la seccion de configuracion.
2. Busca por nombre o codigo.
3. Filtra por estado o vigencia.
4. Revisa los registros encontrados.

**Flujos de Excepcion**

- No existen registros para el filtro aplicado.
- No se pudo cargar el listado.
- El usuario no tiene permiso para consultar la seccion.

**Eventos del Dominio**

- No registra cambios; es una historia de consulta.

---

### HU-14-003 Como Usuario Operativo, quiero ver las configuraciones jerarquicas, para entender dependencias entre ubicaciones, sedes, areas, almacenes, cargos y contratos.

**Prioridad: Media | Estimacion: 5 puntos**

**Precondiciones**

- Usuario autenticado y con permiso para consultar maestros.
- Existen maestros relacionados o el sistema muestra vacios controlados.

**Criterios de Aceptacion**

- [ ] DADO una consulta de sedes, areas o almacenes, CUANDO se muestra la informacion, ENTONCES puede verse la relacion con ubicaciones y sedes.
- [ ] DADO una consulta de cargos, CUANDO se muestra la informacion, ENTONCES puede identificarse a quien reporta cada cargo si aplica.
- [ ] DADO una consulta de contratos, CUANDO se muestra la informacion, ENTONCES puede identificarse la cuenta o contrato padre.
- [ ] DADO una jerarquia sin hijos, CUANDO se consulta, ENTONCES el sistema muestra el nodo sin romper la vista.
- [ ] DADO un registro inactivo o anulado incluido por filtros, CUANDO aparece, ENTONCES se diferencia claramente de uno activo y vigente.

**Flujo Principal**

1. Abre una seccion jerarquica.
2. Revisa nodos y dependencias.
3. Accede a acciones permitidas desde el registro.

**Flujos de Excepcion**

- La jerarquia no puede cargarse.
- Existen referencias historicas que ya no estan activas.
- El usuario no tiene permiso para ver la jerarquia.

**Eventos del Dominio**

- No registra cambios; es una historia de consulta.

## Epica 2: Ubicaciones, Sedes, Areas y Almacenes

> **Objetivo:** Administrar la base geografica y fisica que sostiene los procesos operativos y organizacionales.

---

### HU-14-004 Como Analista de Configuracion, quiero registrar ubicaciones, para disponer de puntos fisicos o logisticos reutilizables.

**Prioridad: Alta | Estimacion: 5 puntos**

**Precondiciones**

- Usuario autenticado y con permiso para registrar ubicaciones.
- El usuario cuenta con nombre, tipo y datos geograficos basicos.

**Criterios de Aceptacion**

- [ ] DADO una nueva ubicacion, CUANDO el usuario la registra, ENTONCES informa nombre, descripcion opcional, tipo de ubicacion, pais, departamento, provincia y distrito.
- [ ] DADO una ubicacion de Peru, CUANDO elige departamento y provincia, ENTONCES el sistema muestra distritos disponibles y puede autocompletar coordenadas si existen en el ubigeo.
- [ ] DADO coordenadas de Google Maps, CUANDO el usuario las ingresa como "latitud, longitud", ENTONCES el sistema las separa para enviarlas al backend.
- [ ] DADO datos opcionales, CUANDO el usuario registra direccion o referencia, ENTONCES quedan asociados a la ubicacion.
- [ ] DADO el alta correcta, CUANDO guarda, ENTONCES la ubicacion queda activa y vigente para ser usada por sedes, almacenes, peajes y rutas.

**Flujo Principal**

1. Entra a Nueva configuracion y elige Ubicacion.
2. Completa nombre, descripcion y tipo.
3. Selecciona pais, departamento, provincia y distrito.
4. Agrega direccion, referencia o coordenadas si corresponde.
5. Guarda el registro.

**Flujos de Excepcion**

- Falta nombre o pais.
- La coordenada no tiene formato separable.
- No se pudo registrar la ubicacion.
- El usuario no tiene permiso para registrar.

**Eventos del Dominio**

- Ubicacion registrada.

---

### HU-14-005 Como Analista de Configuracion, quiero registrar sedes, para vincular centros de trabajo a ubicaciones existentes.

**Prioridad: Alta | Estimacion: 5 puntos**

**Precondiciones**

- Existe al menos una ubicacion activa.
- Usuario autenticado y con permiso para registrar sedes.

**Criterios de Aceptacion**

- [ ] DADO una sede nueva, CUANDO el usuario la registra, ENTONCES indica nombre, descripcion opcional y ubicacion activa.
- [ ] DADO que no existen ubicaciones activas, CUANDO intenta crear una sede, ENTONCES el sistema informa que primero debe registrar una ubicacion.
- [ ] DADO una sede registrada, CUANDO se consulta, ENTONCES muestra la ubicacion a la que pertenece.
- [ ] DADO una sede activa y vigente, CUANDO otros formularios la necesitan, ENTONCES aparece como opcion para areas y almacenes.

**Flujo Principal**

1. Entra a Nueva configuracion y elige Sede.
2. Selecciona la ubicacion.
3. Completa nombre y descripcion.
4. Guarda el registro.

**Flujos de Excepcion**

- No hay ubicaciones activas.
- No selecciona ubicacion.
- No se pudo registrar la sede.

**Eventos del Dominio**

- Sede registrada.

---

### HU-14-006 Como Analista de Configuracion, quiero administrar areas y gerencias, para reflejar la estructura interna de cada sede.

**Prioridad: Alta | Estimacion: 5 puntos**

**Precondiciones**

- Existe al menos una sede activa.
- Usuario autenticado y con permiso para registrar areas.

**Criterios de Aceptacion**

- [ ] DADO una nueva area, CUANDO el usuario la registra, ENTONCES selecciona una sede activa.
- [ ] DADO el nivel del registro, CUANDO selecciona GERENCIA, ENTONCES no requiere gerencia superior.
- [ ] DADO el nivel del registro, CUANDO selecciona AREA, ENTONCES puede elegir una gerencia superior de la misma sede si existe.
- [ ] DADO que no existen sedes activas, CUANDO intenta crear un area, ENTONCES el sistema informa que primero debe registrar una sede.
- [ ] DADO una area registrada, CUANDO se consulta, ENTONCES muestra sede, nivel y gerencia superior si aplica.

**Flujo Principal**

1. Entra a Nueva configuracion y elige Area.
2. Selecciona la sede.
3. Indica si es Gerencia o Area.
4. Si es Area, selecciona gerencia superior cuando corresponda.
5. Guarda el registro.

**Flujos de Excepcion**

- No hay sedes activas.
- No selecciona sede.
- La gerencia superior no pertenece a la sede seleccionada.
- No se pudo registrar el area.

**Eventos del Dominio**

- Area registrada.

---

### HU-14-007 Como Analista de Configuracion, quiero registrar almacenes, para mantener puntos de almacenamiento fijos o temporales.

**Prioridad: Media | Estimacion: 5 puntos**

**Precondiciones**

- Existe al menos una ubicacion activa.
- Usuario autenticado y con permiso para registrar almacenes.

**Criterios de Aceptacion**

- [ ] DADO un almacen nuevo, CUANDO el usuario lo registra, ENTONCES selecciona una ubicacion activa.
- [ ] DADO un almacen asociado a una sede, CUANDO selecciona sede, ENTONCES queda vinculada como referencia organizacional.
- [ ] DADO un almacen temporal, CUANDO lo marca como temporal, ENTONCES puede registrar fecha de inicio y fecha de fin.
- [ ] DADO que no existen ubicaciones activas, CUANDO intenta crear un almacen, ENTONCES el sistema informa que primero debe registrar una ubicacion.
- [ ] DADO un almacen registrado, CUANDO se consulta, ENTONCES muestra si es fijo o temporal y su ubicacion.

**Flujo Principal**

1. Entra a Nueva configuracion y elige Almacen.
2. Selecciona ubicacion y, opcionalmente, sede.
3. Indica si es temporal.
4. Registra fechas si corresponde.
5. Guarda el registro.

**Flujos de Excepcion**

- No hay ubicaciones activas.
- No selecciona ubicacion.
- La fecha final es anterior a la inicial.
- No se pudo registrar el almacen.

**Eventos del Dominio**

- Almacen registrado.

## Epica 3: Cargos, Cuentas, Contratos y Regimenes

> **Objetivo:** Administrar catalogos reutilizables para estructura organizacional, relacion comercial y configuracion laboral.

---

### HU-14-008 Como Analista de Configuracion, quiero registrar cargos, para mantener puestos de trabajo y su dependencia.

**Prioridad: Media | Estimacion: 5 puntos**

**Precondiciones**

- Usuario autenticado y con permiso para registrar cargos.

**Criterios de Aceptacion**

- [ ] DADO un cargo nuevo, CUANDO el usuario lo registra, ENTONCES informa nombre y descripcion opcional.
- [ ] DADO que el cargo reporta a otro, CUANDO selecciona cargo superior, ENTONCES se guarda la relacion.
- [ ] DADO que no reporta a nadie, CUANDO selecciona esa opcion, ENTONCES el cargo queda como raiz de la jerarquia.
- [ ] DADO un cargo existente, CUANDO se edita, ENTONCES no puede seleccionarse a si mismo como cargo superior.

**Flujo Principal**

1. Entra a Nueva configuracion y elige Cargo.
2. Completa nombre y descripcion.
3. Selecciona cargo superior si aplica.
4. Guarda el registro.

**Flujos de Excepcion**

- Falta nombre.
- Se intenta crear una dependencia circular.
- No se pudo registrar el cargo.

**Eventos del Dominio**

- Cargo registrado.

---

### HU-14-009 Como Analista de Configuracion, quiero registrar cuentas, para agrupar contratos bajo una unidad comercial.

**Prioridad: Media | Estimacion: 3 puntos**

**Precondiciones**

- Usuario autenticado y con permiso para registrar cuentas.

**Criterios de Aceptacion**

- [ ] DADO una cuenta nueva, CUANDO el usuario la registra, ENTONCES informa nombre y descripcion opcional.
- [ ] DADO el registro correcto, CUANDO guarda, ENTONCES el backend asigna su codigo y nivel correspondiente.
- [ ] DADO una cuenta activa y vigente, CUANDO se crea un contrato, ENTONCES aparece como opcion de padre.

**Flujo Principal**

1. Entra a Nueva configuracion y elige Cuenta.
2. Completa nombre y descripcion.
3. Guarda el registro.

**Flujos de Excepcion**

- Falta nombre.
- No se pudo registrar la cuenta.

**Eventos del Dominio**

- Cuenta registrada.

---

### HU-14-010 Como Analista de Configuracion, quiero registrar contratos, para relacionarlos con cuentas o contratos principales.

**Prioridad: Alta | Estimacion: 5 puntos**

**Precondiciones**

- Existe al menos una cuenta o contrato activo.
- Usuario autenticado y con permiso para registrar contratos.

**Criterios de Aceptacion**

- [ ] DADO un contrato nuevo, CUANDO el usuario lo registra, ENTONCES informa nombre, descripcion opcional y cuenta o contrato padre.
- [ ] DADO que no existen cuentas ni contratos activos, CUANDO intenta crear un contrato, ENTONCES el sistema informa que primero debe registrar una cuenta o contrato principal.
- [ ] DADO un contrato creado, CUANDO se edita, ENTONCES puede cambiar nombre y descripcion, pero no el padre.
- [ ] DADO un contrato activo y vigente, CUANDO se crea otro contrato, ENTONCES puede aparecer como padre si corresponde.

**Flujo Principal**

1. Entra a Nueva configuracion y elige Contrato.
2. Selecciona cuenta o contrato principal.
3. Completa nombre y descripcion.
4. Guarda el registro.

**Flujos de Excepcion**

- No hay cuenta o contrato padre activo.
- No selecciona padre.
- Se intenta cambiar el padre en edicion.
- No se pudo registrar el contrato.

**Eventos del Dominio**

- Contrato registrado.

---

### HU-14-011 Como Analista de Configuracion, quiero registrar regimenes laborales, para definir ciclos de trabajo y descanso reutilizables.

**Prioridad: Media | Estimacion: 5 puntos**

**Precondiciones**

- Usuario autenticado y con permiso para registrar regimenes.

**Criterios de Aceptacion**

- [ ] DADO un regimen nuevo, CUANDO el usuario lo registra, ENTONCES informa nombre, descripcion opcional, codigo de regimen, horas por dia, dias de trabajo y dias de descanso.
- [ ] DADO valores numericos, CUANDO guarda, ENTONCES dias y horas deben ser numeros validos mayores o iguales a cero.
- [ ] DADO un regimen registrado, CUANDO se consulta, ENTONCES se muestra su codigo de negocio y patron de trabajo/descanso.
- [ ] DADO un regimen activo y vigente, CUANDO otros procesos lo necesitan, ENTONCES queda disponible como opcion.

**Flujo Principal**

1. Entra a Nueva configuracion y elige Regimen.
2. Completa codigo de regimen, horas por dia, dias de trabajo y dias de descanso.
3. Guarda el registro.

**Flujos de Excepcion**

- Falta codigo de regimen.
- Dias u horas no son validos.
- No se pudo registrar el regimen.

**Eventos del Dominio**

- Regimen registrado.

## Epica 4: Ciclo de Vida y Auditoria

> **Objetivo:** Mantener los registros actualizados y controlar su disponibilidad sin perder trazabilidad.

---

### HU-14-012 Como Analista de Configuracion, quiero modificar un maestro, para corregir o actualizar su informacion.

**Prioridad: Alta | Estimacion: 5 puntos**

**Precondiciones**

- Existe un maestro vigente.
- Usuario autenticado y con permiso para modificar.

**Criterios de Aceptacion**

- [ ] DADO un maestro vigente, CUANDO el usuario selecciona Editar, ENTONCES puede actualizar nombre, descripcion y campos propios permitidos.
- [ ] DADO un registro anulado, CUANDO el usuario abre acciones, ENTONCES la edicion no esta disponible.
- [ ] DADO un contrato existente, CUANDO se edita, ENTONCES el padre no puede cambiarse.
- [ ] DADO una modificacion correcta, CUANDO guarda, ENTONCES se actualiza fecha y usuario de modificacion.
- [ ] DADO una dependencia requerida, CUANDO se modifica, ENTONCES debe seguir apuntando a un registro valido.

**Flujo Principal**

1. Busca el registro.
2. Selecciona Editar.
3. Cambia los campos permitidos.
4. Guarda la modificacion.

**Flujos de Excepcion**

- Registro anulado.
- Datos obligatorios incompletos.
- Dependencia invalida.
- No se pudo modificar.

**Eventos del Dominio**

- Maestro actualizado.

---

### HU-14-013 Como Administrador Principal, quiero inhabilitar o reactivar configuraciones, para controlar si pueden usarse en nuevas operaciones.

**Prioridad: Alta | Estimacion: 3 puntos**

**Precondiciones**

- Existe un maestro vigente.
- Usuario autenticado y con permiso para cambiar estado.

**Criterios de Aceptacion**

- [ ] DADO un maestro activo y vigente, CUANDO el usuario lo inhabilita e informa motivo, ENTONCES queda inactivo.
- [ ] DADO un maestro inactivo y vigente, CUANDO el usuario lo reactiva, ENTONCES queda activo nuevamente.
- [ ] DADO un maestro anulado, CUANDO el usuario revisa acciones, ENTONCES no puede inhabilitarlo ni reactivarlo.
- [ ] DADO el cambio de estado, CUANDO finaliza, ENTONCES queda registrado usuario, fecha y motivo cuando corresponde.

**Flujo Principal**

1. Ubica el registro.
2. Selecciona Inhabilitar o Reactivar.
3. Ingresa motivo cuando corresponde.
4. Confirma la accion.

**Flujos de Excepcion**

- Falta motivo de inhabilitacion.
- Registro anulado.
- No se pudo cambiar el estado.

**Eventos del Dominio**

- Maestro inhabilitado.
- Maestro reactivado.

---

### HU-14-014 Como Administrador Principal, quiero anular configuraciones creadas por error, para retirarlas de uso conservando referencia historica.

**Prioridad: Media | Estimacion: 3 puntos**

**Precondiciones**

- Existe un maestro no anulado.
- Usuario autenticado y con permiso para anular.

**Criterios de Aceptacion**

- [ ] DADO un maestro no anulado, CUANDO el usuario selecciona Borrar e informa motivo, ENTONCES queda anulado.
- [ ] DADO un maestro anulado, CUANDO se consulta, ENTONCES se muestra como anulado y solo permite acciones de consulta.
- [ ] DADO la anulacion, CUANDO finaliza, ENTONCES se registra fecha, usuario y motivo.
- [ ] DADO filtros por registro anulado, CUANDO el usuario consulta, ENTONCES puede encontrar los registros retirados.

**Flujo Principal**

1. Ubica el registro.
2. Selecciona Borrar.
3. Ingresa motivo de anulacion.
4. Confirma la accion.

**Flujos de Excepcion**

- Falta motivo.
- El registro ya esta anulado.
- No se pudo anular.

**Eventos del Dominio**

- Maestro anulado.

## Epica 5: Peajes y Tarifas

> **Objetivo:** Administrar peajes asociados a ubicaciones de tipo PEAJE y mantener tarifas usadas para calcular costos de rutas.

---

### HU-14-015 Como Analista de Configuracion, quiero registrar peajes, para usarlos en rutas y calculos de costo.

**Prioridad: Alta | Estimacion: 5 puntos**

**Precondiciones**

- Existe al menos una ubicacion activa de tipo PEAJE.
- Usuario autenticado y con permiso para administrar peajes.

**Criterios de Aceptacion**

- [ ] DADO un nuevo peaje, CUANDO el usuario lo registra, ENTONCES indica nombre y ubicacion de tipo PEAJE.
- [ ] DADO que no existen ubicaciones de tipo PEAJE, CUANDO intenta crear un peaje, ENTONCES el sistema informa que primero debe registrar una ubicacion con ese tipo.
- [ ] DADO un peaje registrado, CUANDO guarda correctamente, ENTONCES se abre el flujo de tarifas para completar su precio.
- [ ] DADO un peaje existente, CUANDO se edita, ENTONCES puede cambiar nombre y ubicacion.

**Flujo Principal**

1. Entra a Peajes.
2. Selecciona Nuevo peaje.
3. Completa nombre y ubicacion.
4. Guarda el peaje.
5. Registra tarifas.

**Flujos de Excepcion**

- No hay ubicaciones de tipo PEAJE.
- Falta nombre o ubicacion.
- No se pudo registrar el peaje.

**Eventos del Dominio**

- Peaje registrado.

---

### HU-14-016 Como Analista de Configuracion, quiero registrar tarifas de peaje, para calcular costos segun tipo de cobro y ejes.

**Prioridad: Alta | Estimacion: 5 puntos**

**Precondiciones**

- Existe un peaje registrado.
- Usuario autenticado y con permiso para administrar tarifas.

**Criterios de Aceptacion**

- [ ] DADO un peaje, CUANDO el usuario registra tarifa, ENTONCES informa tipo de cobro NORMAL o PEX, moneda, fecha de inicio opcional y precio unitario.
- [ ] DADO un precio unitario, CUANDO guarda, ENTONCES debe ser mayor que cero.
- [ ] DADO una tarifa guardada, CUANDO el backend procesa el registro, ENTONCES genera una tarifa base por unidad y tarifas por eje de 2 a 20.
- [ ] DADO una nueva tarifa del mismo peaje y tipo de cobro, CUANDO guarda, ENTONCES reemplaza o inactiva las tarifas anteriores de ese tipo.
- [ ] DADO una fila de tarifa existente, CUANDO el usuario la edita, ENTONCES puede ajustar solo el monto puntual sin recalcular las demas filas.

**Flujo Principal**

1. Abre Tarifas de un peaje.
2. Selecciona tipo de cobro.
3. Ingresa monto, moneda y fecha de inicio si aplica.
4. Guarda la tarifa.
5. Revisa la tabla generada.

**Flujos de Excepcion**

- Monto menor o igual a cero.
- No se pudo listar tarifas.
- No se pudo registrar o modificar tarifa.

**Eventos del Dominio**

- Tarifa de peaje registrada.
- Tarifa de peaje modificada.

---

### HU-14-017 Como Usuario Operativo, quiero consultar peajes y tarifas, para validar los costos disponibles antes de usarlos en rutas.

**Prioridad: Media | Estimacion: 3 puntos**

**Precondiciones**

- Usuario autenticado y con permiso para consultar peajes.

**Criterios de Aceptacion**

- [ ] DADO la pantalla de peajes, CUANDO el usuario busca por nombre, ENTONCES se listan los peajes activos que coinciden.
- [ ] DADO un peaje, CUANDO abre Tarifas, ENTONCES ve tipo de cobro, modalidad, ejes, monto, fecha de inicio y estado.
- [ ] DADO un peaje sin tarifas, CUANDO se consulta, ENTONCES el sistema informa que aun no tiene tarifas registradas.

**Flujo Principal**

1. Entra a Peajes.
2. Busca el peaje.
3. Abre Tarifas.
4. Revisa los montos.

**Flujos de Excepcion**

- No hay peajes.
- No se pudo cargar tarifas.
- El usuario no tiene permiso de consulta.

**Eventos del Dominio**

- No registra cambios; es una historia de consulta.

## Epica 6: Rutas y Costos de Peajes

> **Objetivo:** Administrar recorridos entre ubicaciones, definir sus puntos y peajes por tramo, y calcular costos estimados.

---

### HU-14-018 Como Analista de Configuracion, quiero registrar rutas, para definir recorridos reutilizables entre ubicaciones.

**Prioridad: Alta | Estimacion: 5 puntos**

**Precondiciones**

- Usuario autenticado y con permiso para administrar rutas.

**Criterios de Aceptacion**

- [ ] DADO una nueva ruta, CUANDO el usuario la registra, ENTONCES informa nombre y descripcion opcional.
- [ ] DADO el nombre de ruta, CUANDO guarda, ENTONCES el sistema valida que sea unico entre rutas activas.
- [ ] DADO una ruta creada, CUANDO se guarda, ENTONCES el usuario puede entrar a Ver mapa para definir origen, paradas, destino y peajes.
- [ ] DADO una ruta existente, CUANDO se edita, ENTONCES puede cambiar nombre y descripcion.

**Flujo Principal**

1. Entra a Rutas.
2. Selecciona Nueva ruta.
3. Completa nombre y descripcion.
4. Guarda la ruta.
5. Abre su estructura.

**Flujos de Excepcion**

- Falta nombre.
- Ya existe una ruta activa con el mismo nombre.
- No se pudo registrar la ruta.

**Eventos del Dominio**

- Ruta registrada.

---

### HU-14-019 Como Analista de Configuracion, quiero ordenar puntos de una ruta, para definir origen, paradas y destino.

**Prioridad: Alta | Estimacion: 8 puntos**

**Precondiciones**

- Existe una ruta registrada.
- Existen ubicaciones activas para usar como puntos.

**Criterios de Aceptacion**

- [ ] DADO una ruta, CUANDO el usuario agrega puntos, ENTONCES el primer punto queda como ORIGEN, el ultimo como DESTINO y los intermedios como PARADA.
- [ ] DADO puntos agregados, CUANDO el usuario los mueve, ENTONCES se recalcula el orden.
- [ ] DADO una ruta con menos de dos puntos, CUANDO intenta guardar estructura, ENTONCES el sistema informa que necesita origen y destino.
- [ ] DADO una ubicacion ya agregada, CUANDO intenta agregarla otra vez, ENTONCES el sistema evita duplicarla salvo que el flujo permita retorno al origen para ida y vuelta.
- [ ] DADO una estructura valida, CUANDO guarda, ENTONCES se persisten puntos y orden.

**Flujo Principal**

1. Entra al detalle de la ruta.
2. Agrega ubicaciones al recorrido.
3. Ordena origen, paradas y destino.
4. Guarda la estructura.

**Flujos de Excepcion**

- No hay ubicaciones activas.
- La ruta tiene menos de dos puntos.
- No se pudo guardar la estructura.

**Eventos del Dominio**

- Estructura de ruta actualizada.

---

### HU-14-020 Como Analista de Configuracion, quiero asignar peajes a una ruta, para asociar costos al recorrido completo o a tramos especificos.

**Prioridad: Alta | Estimacion: 8 puntos**

**Precondiciones**

- Existe una ruta con puntos.
- Existen peajes activos.

**Criterios de Aceptacion**

- [ ] DADO una ruta con puntos, CUANDO el usuario agrega un peaje, ENTONCES puede asignarlo al recorrido completo o a un tramo desde/hasta.
- [ ] DADO un peaje por tramo, CUANDO selecciona desde y hasta, ENTONCES ambos deben pertenecer a ubicaciones de la ruta.
- [ ] DADO un peaje, CUANDO lo configura, ENTONCES indica sentido IDA o REGRESO y si cobra o no cobra.
- [ ] DADO una ruta de solo ida, CUANDO guarda peajes, ENTONCES el sistema fuerza o conserva el sentido compatible con solo IDA.
- [ ] DADO puntos y peajes modificados, CUANDO guarda, ENTONCES se persisten juntos en una sola estructura.

**Flujo Principal**

1. Abre el detalle de ruta.
2. Selecciona el tramo o recorrido completo.
3. Agrega peajes.
4. Indica sentido y si cobra.
5. Guarda la estructura.

**Flujos de Excepcion**

- No hay peajes registrados.
- Peaje sin seleccion.
- Tramo incompleto o fuera de ruta.
- No se pudo guardar la estructura.

**Eventos del Dominio**

- Peajes de ruta actualizados.

---

### HU-14-021 Como Usuario Operativo, quiero calcular el costo de peajes de una ruta, para estimar el costo del recorrido segun cobro y ejes.

**Prioridad: Media | Estimacion: 5 puntos**

**Precondiciones**

- Existe una ruta con peajes asignados.
- Los peajes tienen tarifas activas.

**Criterios de Aceptacion**

- [ ] DADO una ruta con peajes, CUANDO el usuario calcula costo, ENTONCES indica tipo de cobro NORMAL o PEX, sentido y numero de ejes.
- [ ] DADO un numero de ejes, CUANDO calcula, ENTONCES el sistema usa tarifas por eje cuando corresponda.
- [ ] DADO una ruta sin peajes, CUANDO intenta calcular, ENTONCES el sistema deshabilita o informa que no hay peajes.
- [ ] DADO un costo calculado, CUANDO se muestra, ENTONCES ve total, moneda y detalle por peaje.
- [ ] DADO una consulta de resumen, CUANDO el usuario la ejecuta, ENTONCES ve costos por varios numeros de ejes.

**Flujo Principal**

1. Entra al detalle de ruta.
2. Selecciona tipo de cobro, sentido y ejes.
3. Calcula costo.
4. Revisa total y detalle.

**Flujos de Excepcion**

- Ruta sin peajes.
- Peajes sin tarifas vigentes.
- Numero de ejes invalido.
- No se pudo calcular el costo.

**Eventos del Dominio**

- No registra cambios; es una historia de calculo/consulta.

## Epica 7: Reportes y Exportacion

> **Objetivo:** Permitir la revision consolidada y salida de datos de configuracion.

---

### HU-14-022 Como Auditor, quiero revisar reportes de configuracion, para identificar registros disponibles, pausados y retirados.

**Prioridad: Media | Estimacion: 3 puntos**

**Precondiciones**

- Usuario autenticado y con permiso para consultar reportes.

**Criterios de Aceptacion**

- [ ] DADO la vista de reportes, CUANDO carga la informacion, ENTONCES muestra total de configuraciones y conteos de disponibles, pausadas y retiradas.
- [ ] DADO registros recientes, CUANDO se muestra la tabla, ENTONCES aparecen codigo, tipo, nombre, estado, detalle especifico y fecha.
- [ ] DADO que ocurre un error de API, CUANDO carga reportes, ENTONCES el sistema informa que no pudo cargar la informacion.

**Flujo Principal**

1. Entra a Reportes.
2. Revisa metricas consolidadas.
3. Revisa la tabla de configuraciones.

**Flujos de Excepcion**

- No se pudo cargar la informacion.
- No existen registros para revisar.

**Eventos del Dominio**

- No registra cambios; es una historia de consulta.

---

### HU-14-023 Como Auditor, quiero exportar configuraciones, para compartir informacion filtrada o consolidada.

**Prioridad: Media | Estimacion: 5 puntos**

**Precondiciones**

- Usuario autenticado y con permiso para exportar.
- Existe informacion consultable.

**Criterios de Aceptacion**

- [ ] DADO un listado por seccion, CUANDO el usuario selecciona Exportar, ENTONCES el sistema consulta la exportacion con los filtros aplicados.
- [ ] DADO filtros por tipo, estado o vigencia, CUANDO exporta, ENTONCES la salida corresponde al resultado filtrado.
- [ ] DADO la vista de reportes, CUANDO actualiza la exportacion, ENTONCES obtiene la vista consolidada de configuraciones.
- [ ] DADO un error de exportacion, CUANDO ocurre, ENTONCES el sistema informa el problema.

**Flujo Principal**

1. Entra al listado o reporte.
2. Aplica filtros si corresponde.
3. Selecciona Exportar o Actualizar.
4. Revisa el resultado consultado.

**Flujos de Excepcion**

- No existen registros para los filtros.
- No se pudo exportar.
- El usuario no tiene permiso.

**Eventos del Dominio**

- No registra cambios; corresponde a una salida de reporte.

## Informacion maestra de Configuracion General

| Tipo | Campos principales | Dependencias | Uso principal |
| --- | --- | --- | --- |
| UBICACION | Codigo, nombre, descripcion, tipo de ubicacion, pais, departamento, provincia, distrito, direccion, referencia, latitud, longitud | Ninguna | Base geografica para sedes, almacenes, peajes y rutas. |
| SEDE | Codigo, nombre, descripcion, ubicacion | Ubicacion activa | Centro de trabajo asociado a una ubicacion. |
| AREA | Codigo, nombre, descripcion, sede, nivel (GERENCIA/AREA), gerencia superior | Sede activa; gerencia opcional de la misma sede | Estructura interna por sede. |
| ALMACEN | Codigo, nombre, descripcion, ubicacion, sede opcional, temporalidad, fecha inicio, fecha fin | Ubicacion activa; sede opcional | Punto de almacenamiento fijo o temporal. |
| CARGO | Codigo, nombre, descripcion, cargo superior | Cargo superior opcional | Jerarquia de puestos. |
| CUENTA | Codigo, nombre, descripcion, nivel asignado por backend | Ninguna | Agrupador comercial para contratos. |
| CONTRATO | Codigo, nombre, descripcion, cuenta o contrato padre, nivel asignado por backend | Cuenta o contrato activo | Contrato comercial dentro de una jerarquia. |
| REGIMEN | Codigo, nombre, descripcion, codigo de regimen, dias de trabajo, dias de descanso, horas por dia | Ninguna | Patron laboral reutilizable. |
| PEAJE | Codigo, nombre, ubicacion | Ubicacion activa de tipo PEAJE | Peaje utilizable en rutas. |
| TARIFA_PEAJE | Tipo de cobro, modalidad, numero de ejes, monto, moneda, fecha inicio, fecha fin, estado | Peaje | Precio para calculo de costos. |
| RUTA | Codigo, nombre, descripcion, puntos ordenados, peajes asignados | Ubicaciones activas; peajes opcionales | Recorrido reutilizable y calculo de peajes. |

## Reglas Generales

| Regla | Descripcion |
| --- | --- |
| Codigo | El codigo lo asigna el backend y no se modifica desde la edicion normal. |
| Tipo de maestro | El tipo se define por la ruta o seccion de registro y no cambia despues de creado. |
| Disponibilidad | Solo registros activos y vigentes deben usarse como opciones para nuevas operaciones. |
| Inhabilitacion | Requiere motivo y conserva el registro para consulta. |
| Reactivacion | Solo aplica a registros inactivos y vigentes. |
| Anulacion | Requiere motivo y retira el registro de uso normal; se conserva para auditoria. |
| Contratos | El padre se define al crear y no se modifica desde la edicion normal. |
| Areas | Una gerencia no requiere gerencia superior; un area puede depender de una gerencia de la misma sede. |
| Peajes | Un peaje debe apuntar a una ubicacion de tipo PEAJE. |
| Tarifas | El monto debe ser mayor que cero. El alta de tarifa genera tabla base y por ejes segun backend. |
| Rutas | Una ruta necesita al menos origen y destino para guardar una estructura util. |

## Permisos sugeridos por rol

| Accion | Administrador Principal | Analista de Configuracion | Usuario Operativo | Auditor |
| --- | --- | --- | --- | --- |
| Consultar panel y listados | Si | Si | Si | Si |
| Registrar maestros | Si | Si | No | No |
| Modificar maestros | Si | Si | No | No |
| Inhabilitar/reactivar/anular | Si | Segun permiso | No | No |
| Administrar peajes y tarifas | Si | Si | No | No |
| Administrar rutas | Si | Si | No | No |
| Calcular costos de peajes | Si | Si | Si | Si |
| Exportar reportes | Si | Segun permiso | No | Si |
