# Piloto Detallado: BC-14 Configuracion General

Este documento describe como los usuarios administran la configuracion base del sistema. Incluye ubicaciones, sedes, areas, almacenes, cargos, cuentas, contratos, regimenes, peajes, rutas y costos operativos del viaje.

La configuracion general sirve para que los usuarios encuentren y usen informacion ordenada, actual y facil de consultar.

| Campo | Detalle |
| --- | --- |
| Area | Administracion / Operaciones / Configuracion del sistema |
| Roles | **Administrador Principal**, **Analista de Configuracion**, **Usuario Operativo** y **Auditor**. |
| Orden de trabajo | Algunos datos deben existir antes de agregar otros. Por ejemplo: primero se crea una ubicacion y luego una sede; primero una sede y luego sus areas; primero una cuenta y luego sus contratos; primero una ubicacion de tipo Peaje y luego el peaje. |
| Alcance funcional | Consultar, registrar, modificar, pausar, reactivar, retirar y exportar configuraciones; administrar peajes, rutas y costos operativos del viaje. |
| Lo que entra | Solicitudes de alta o cambio, datos de ubicacion, datos de pertenencia, tarifas de peaje, recorridos, conceptos de costo y busquedas del usuario. |
| Lo que sale | Configuraciones listas para usar, listados filtrados, rutas con peajes, calculos de peaje, paquetes de costos operativos y reportes. |
| Quien la usa | Usuarios que preparan la base operativa y organizacional, usuarios que consultan configuraciones y responsables de revision. |

> **Fuera de alcance:** Configuracion General no ejecuta viajes, ventas, compras, facturacion, asistencia, planillas ni liquidaciones. Solo mantiene informacion base para que esos procesos puedan usarla.

## Resumen de Epicas

| # | Epica | Objetivo de negocio | Historias |
| --- | --- | --- | --- |
| 1 | Panel y Consulta General | Ver situacion general y entrar a cada pantalla de configuracion. | 3 |
| 2 | Ubicaciones, Sedes, Areas y Almacenes | Mantener lugares, centros de trabajo, estructura interna y almacenes. | 4 |
| 3 | Cargos, Cuentas, Contratos y Regimenes | Mantener datos organizacionales, comerciales y laborales. | 4 |
| 4 | Peajes y Tarifas | Mantener peajes y precios por tipo de cobro. | 3 |
| 5 | Rutas y Costos de Peajes | Definir recorridos, puntos, peajes y costo estimado. | 4 |
| 6 | Costos Operativos del Viaje | Mantener conceptos y paquetes de costo por ruta. | 4 |
| 7 | Reportes y Exportacion | Revisar informacion consolidada y exportar resultados. | 2 |

> **Estados usados por el usuario:** Una configuracion puede estar **Disponible**, **Pausada** o **Retirada**. Disponible aparece como opcion para trabajar. Pausada se conserva para consulta, pero ya no aparece para nuevos usos. Retirada queda solo como antecedente.

> **Orden de trabajo:** Si falta un dato necesario, el sistema indica que debe agregarse primero. Ejemplo: para crear una sede primero debe existir su ubicacion; para crear un contrato primero debe existir su cuenta o contrato principal.

> **Acciones comunes:** En las listas, segun permisos, el usuario puede editar, pausar, reactivar o retirar datos. Estas acciones aparecen dentro de cada pantalla.

> **Nota sobre la navegacion:** El usuario inicia en el panel de Configuracion General. Desde ahi puede entrar a Ubicaciones, Sedes y areas, Almacenes, Cargos, Regimenes, Cuentas y contratos, Peajes, Rutas, Costos operativos o Reportes, segun permisos.

## Epica 1: Panel y Consulta General

> **Objetivo:** Permitir que el usuario revise como esta la configuracion y entre a cada pantalla de trabajo.

---

### HU-14-001 Como Administrador Principal, quiero ver el panel de configuracion general, para saber que informacion ya esta lista para usarse.

**Prioridad: Alta | Estimacion: 3 puntos**

**Precondiciones**

- Usuario con permiso para consultar Configuracion General.

**Criterios de Aceptacion**

- [ ] DADO que el usuario ingresa a Configuracion General, CUANDO carga el panel, ENTONCES ve cuantos datos existen y cuantos estan disponibles.
- [ ] DADO que el usuario necesita administrar informacion, CUANDO selecciona una seccion, ENTONCES ingresa al listado correspondiente.
- [ ] DADO que el usuario necesita agregar un dato, CUANDO selecciona Nuevo, ENTONCES accede al formulario correspondiente.
- [ ] DADO que el usuario necesita revisar reportes, CUANDO selecciona Reportes, ENTONCES accede a la vista consolidada.
- [ ] DADO que no se puede cargar informacion, CUANDO ingresa al panel, ENTONCES ve un mensaje claro y puede seguir usando las opciones disponibles.

**Flujo Principal**

1. Entra a Configuracion General.
2. Revisa indicadores principales.
3. Selecciona una seccion, Nuevo o Reportes.

**Flujos de Excepcion**

- No se pudo cargar el resumen.
- Usuario sin permiso para consultar.

**Eventos del Dominio**

- No genera evento de cambio; es una consulta del panel.

---

### HU-14-002 Como Analista de Configuracion, quiero consultar informacion por pantalla, para encontrar rapido lo que necesito.

**Prioridad: Alta | Estimacion: 5 puntos**

**Precondiciones**

- Usuario con permiso para consultar configuraciones.

**Criterios de Aceptacion**

- [ ] DADO una seccion, CUANDO el usuario entra, ENTONCES ve su listado: ubicaciones, sedes y areas, almacenes, cargos, regimenes, cuentas y contratos.
- [ ] DADO una seccion con dos tipos de datos, CUANDO cambia el selector, ENTONCES ve el tipo elegido.
- [ ] DADO busquedas por nombre, codigo o disponibilidad, CUANDO las aplica, ENTONCES la lista muestra solo coincidencias.
- [ ] DADO una busqueda aplicada, CUANDO selecciona Limpiar, ENTONCES vuelve a la lista inicial.
- [ ] DADO muchos resultados, CUANDO cambia de pagina, ENTONCES conserva los criterios de busqueda.

**Flujo Principal**

1. Entra a una seccion.
2. Busca por nombre o codigo.
3. Ajusta la busqueda si corresponde.
4. Revisa resultados.

**Flujos de Excepcion**

- No existen resultados para la busqueda.
- No se pudo cargar el listado.
- Usuario sin permiso para consultar.

**Eventos del Dominio**

- No genera evento de cambio; es una consulta de informacion.

---

### HU-14-003 Como Usuario Operativo, quiero ver a que pertenece cada dato, para entender como esta organizada la informacion.

**Prioridad: Media | Estimacion: 5 puntos**

**Precondiciones**

- Usuario con permiso para consultar configuraciones.

**Criterios de Aceptacion**

- [ ] DADO una consulta de sedes, areas o almacenes, CUANDO se muestra la informacion, ENTONCES puede verse a que ubicacion o sede pertenece.
- [ ] DADO una consulta de cargos, CUANDO se muestra la informacion, ENTONCES puede verse el area y el cargo superior si corresponde.
- [ ] DADO una consulta de contratos, CUANDO se muestra la informacion, ENTONCES puede verse la cuenta o contrato principal.
- [ ] DADO un dato sin elementos debajo, CUANDO se consulta, ENTONCES se muestra con normalidad.
- [ ] DADO datos pausados o retirados incluidos en la busqueda, CUANDO aparecen, ENTONCES se distinguen de los disponibles.

**Flujo Principal**

1. Abre una seccion.
2. Revisa a que pertenece cada dato y si esta disponible.
3. Accede a acciones permitidas.

**Flujos de Excepcion**

- No se pudo cargar informacion vinculada.
- Usuario sin permiso para consultar.

**Eventos del Dominio**

- No genera evento de cambio; es una consulta de organizacion de datos.

## Epica 2: Ubicaciones, Sedes, Areas y Almacenes

> **Objetivo:** Administrar lugares fisicos y estructura interna usada por la operacion.

---

### HU-14-004 Como Analista de Configuracion, quiero registrar ubicaciones, para disponer de lugares reutilizables.

**Prioridad: Alta | Estimacion: 5 puntos**

**Precondiciones**

- Usuario con permiso para registrar ubicaciones.
- Usuario cuenta con nombre, pais y tipo de ubicacion.

**Criterios de Aceptacion**

- [ ] DADO una nueva ubicacion, CUANDO el usuario la registra, ENTONCES informa nombre, descripcion opcional, tipo, pais, departamento, provincia y distrito cuando corresponda.
- [ ] DADO una ubicacion de Peru, CUANDO busca distrito, ENTONCES puede seleccionar el resultado y completar departamento, provincia, distrito y ubigeo.
- [ ] DADO una ubicacion en mapa, CUANDO el usuario selecciona o arrastra el marcador, ENTONCES se completan direccion y coordenadas cuando esten disponibles.
- [ ] DADO coordenadas copiadas de Google Maps, CUANDO el usuario las ingresa, ENTONCES quedan guardadas con la ubicacion.
- [ ] DADO el alta correcta, CUANDO guarda, ENTONCES la ubicacion queda disponible para sedes, almacenes, peajes y rutas.

**Flujo Principal**

1. Entra a Nueva configuracion y elige Ubicacion.
2. Completa nombre, descripcion y tipo.
3. Selecciona pais y datos geograficos.
4. Usa mapa o coordenadas si corresponde.
5. Guarda.

**Flujos de Excepcion**

- Falta nombre o pais.
- Coordenadas invalidas.
- No se pudo registrar.

**Eventos del Dominio**

- Ubicacion registrada.

---

### HU-14-005 Como Analista de Configuracion, quiero registrar sedes, para vincular centros de trabajo a ubicaciones.

**Prioridad: Alta | Estimacion: 5 puntos**

**Precondiciones**

- Existe al menos una ubicacion disponible.
- Usuario con permiso para registrar sedes.

**Criterios de Aceptacion**

- [ ] DADO una sede nueva, CUANDO el usuario la registra, ENTONCES indica nombre, descripcion opcional y ubicacion.
- [ ] DADO que no existen ubicaciones disponibles, CUANDO intenta crear una sede, ENTONCES el sistema informa que primero debe registrar una ubicacion.
- [ ] DADO una sede registrada, CUANDO se consulta, ENTONCES muestra la ubicacion a la que pertenece.
- [ ] DADO una sede disponible, CUANDO se registran areas o almacenes, ENTONCES aparece como opcion.

**Flujo Principal**

1. Entra a Nueva configuracion y elige Sede.
2. Selecciona ubicacion.
3. Completa nombre y descripcion.
4. Guarda.

**Flujos de Excepcion**

- No hay ubicaciones disponibles.
- No selecciona ubicacion.
- No se pudo registrar.

**Eventos del Dominio**

- Sede registrada.

---

### HU-14-006 Como Analista de Configuracion, quiero administrar areas, para reflejar la estructura interna de cada sede.

**Prioridad: Alta | Estimacion: 5 puntos**

**Precondiciones**

- Existe al menos una sede disponible.
- Usuario con permiso para registrar areas.

**Criterios de Aceptacion**

- [ ] DADO una nueva area, CUANDO el usuario la registra, ENTONCES selecciona la sede a la que pertenece.
- [ ] DADO que el area no tiene superior, CUANDO guarda, ENTONCES queda como area raiz.
- [ ] DADO que el area pertenece a otra, CUANDO selecciona area superior, ENTONCES queda ubicada debajo de esa area.
- [ ] DADO el nivel del area, CUANDO elige Gerencia o Area, ENTONCES queda identificado para consulta.
- [ ] DADO que no existen sedes disponibles, CUANDO intenta crear un area, ENTONCES el sistema informa que primero debe registrar una sede.

**Flujo Principal**

1. Entra a Nueva configuracion y elige Area.
2. Selecciona sede.
3. Indica nivel.
4. Selecciona area superior si corresponde.
5. Guarda.

**Flujos de Excepcion**

- No hay sedes disponibles.
- No selecciona sede.
- No se pudo registrar.

**Eventos del Dominio**

- Area registrada.

---

### HU-14-007 Como Analista de Configuracion, quiero registrar almacenes, para mantener puntos de almacenamiento.

**Prioridad: Media | Estimacion: 5 puntos**

**Precondiciones**

- Existe al menos una ubicacion y una sede disponibles.
- Usuario con permiso para registrar almacenes.

**Criterios de Aceptacion**

- [ ] DADO un almacen nuevo, CUANDO el usuario lo registra, ENTONCES selecciona ubicacion y sede.
- [ ] DADO un almacen temporal, CUANDO lo marca como temporal, ENTONCES puede registrar fecha de inicio y fecha de fin.
- [ ] DADO que falta ubicacion o sede disponible, CUANDO intenta crear un almacen, ENTONCES el sistema informa que primero debe registrar lo faltante.
- [ ] DADO un almacen registrado, CUANDO se consulta, ENTONCES muestra si es fijo o temporal, su ubicacion y su sede.

**Flujo Principal**

1. Entra a Nueva configuracion y elige Almacen.
2. Selecciona ubicacion y sede.
3. Indica si es temporal.
4. Registra fechas si corresponde.
5. Guarda.

**Flujos de Excepcion**

- No hay ubicaciones o sedes disponibles.
- No selecciona ubicacion o sede.
- Fecha final anterior a fecha inicial.
- No se pudo registrar.

**Eventos del Dominio**

- Almacen registrado.

## Epica 3: Cargos, Cuentas, Contratos y Regimenes

> **Objetivo:** Administrar datos organizacionales, comerciales y laborales reutilizables.

---

### HU-14-008 Como Analista de Configuracion, quiero registrar cargos, para mantener puestos y linea de reporte.

**Prioridad: Media | Estimacion: 5 puntos**

**Precondiciones**

- Existe al menos un area disponible.
- Usuario con permiso para registrar cargos.

**Criterios de Aceptacion**

- [ ] DADO un cargo nuevo, CUANDO el usuario lo registra, ENTONCES informa nombre, descripcion opcional y area.
- [ ] DADO que el cargo reporta a otro, CUANDO selecciona cargo superior, ENTONCES queda indicado a quien reporta.
- [ ] DADO que no reporta a nadie, CUANDO selecciona esa opcion, ENTONCES queda como cargo raiz.
- [ ] DADO un cargo existente, CUANDO se edita, ENTONCES no puede seleccionarse a si mismo ni a cargos que reportan a el como cargo superior.

**Flujo Principal**

1. Entra a Nueva configuracion y elige Cargo.
2. Selecciona area.
3. Completa nombre y descripcion.
4. Selecciona cargo superior si corresponde.
5. Guarda.

**Flujos de Excepcion**

- No hay areas disponibles.
- Falta nombre o area.
- Se intenta indicar un cargo superior no permitido.
- No se pudo registrar.

**Eventos del Dominio**

- Cargo registrado.

---

### HU-14-009 Como Analista de Configuracion, quiero registrar cuentas, para agrupar contratos bajo una unidad comercial.

**Prioridad: Media | Estimacion: 3 puntos**

**Precondiciones**

- Usuario con permiso para registrar cuentas.

**Criterios de Aceptacion**

- [ ] DADO una cuenta nueva, CUANDO el usuario la registra, ENTONCES informa nombre y descripcion opcional.
- [ ] DADO una cuenta disponible, CUANDO se crea un contrato, ENTONCES aparece como opcion principal.
- [ ] DADO una cuenta registrada, CUANDO se consulta, ENTONCES muestra codigo, nombre, descripcion y disponibilidad.

**Flujo Principal**

1. Entra a Nueva configuracion y elige Cuenta.
2. Completa nombre y descripcion.
3. Guarda.

**Flujos de Excepcion**

- Falta nombre.
- No se pudo registrar.

**Eventos del Dominio**

- Cuenta registrada.

---

### HU-14-010 Como Analista de Configuracion, quiero registrar contratos, para indicar a que cuenta o contrato principal pertenecen.

**Prioridad: Alta | Estimacion: 5 puntos**

**Precondiciones**

- Existe al menos una cuenta o contrato disponible.
- Usuario con permiso para registrar contratos.

**Criterios de Aceptacion**

- [ ] DADO un contrato nuevo, CUANDO el usuario lo registra, ENTONCES informa nombre, descripcion opcional y cuenta o contrato principal.
- [ ] DADO que no existen cuentas ni contratos disponibles, CUANDO intenta crear un contrato, ENTONCES el sistema informa que primero debe registrar una cuenta o contrato principal.
- [ ] DADO un contrato creado, CUANDO se edita, ENTONCES puede cambiar nombre y descripcion, pero no la cuenta o contrato principal.
- [ ] DADO un contrato disponible, CUANDO se crea otro contrato, ENTONCES puede aparecer como principal si corresponde.

**Flujo Principal**

1. Entra a Nueva configuracion y elige Contrato.
2. Selecciona cuenta o contrato principal.
3. Completa nombre y descripcion.
4. Guarda.

**Flujos de Excepcion**

- No hay cuenta o contrato principal disponible.
- No selecciona cuenta o contrato principal.
- No se pudo registrar.

**Eventos del Dominio**

- Contrato registrado.

---

### HU-14-011 Como Analista de Configuracion, quiero registrar regimenes laborales, para definir ciclos de trabajo y descanso.

**Prioridad: Media | Estimacion: 5 puntos**

**Precondiciones**

- Usuario con permiso para registrar regimenes.

**Criterios de Aceptacion**

- [ ] DADO un regimen nuevo, CUANDO el usuario lo registra, ENTONCES informa nombre, descripcion opcional, codigo de regimen, dias de trabajo, dias de descanso y horas por dia.
- [ ] DADO valores numericos, CUANDO guarda, ENTONCES dias de trabajo y horas por dia deben ser mayores que cero, y dias de descanso no puede ser negativo.
- [ ] DADO un regimen registrado, CUANDO se consulta, ENTONCES se muestra su codigo y patron de trabajo/descanso.
- [ ] DADO un regimen disponible, CUANDO otros procesos lo necesitan, ENTONCES aparece como opcion.

**Flujo Principal**

1. Entra a Nueva configuracion y elige Regimen.
2. Completa codigo, dias y horas.
3. Guarda.

**Flujos de Excepcion**

- Falta codigo.
- Dias u horas invalidos.
- No se pudo registrar.

**Eventos del Dominio**

- Regimen registrado.

## Epica 4: Peajes y Tarifas

> **Objetivo:** Administrar peajes asociados a ubicaciones de tipo Peaje y sus precios.

---

### HU-14-012 Como Analista de Configuracion, quiero registrar peajes, para usarlos en rutas y calculos de costo.

**Prioridad: Alta | Estimacion: 5 puntos**

**Precondiciones**

- Existe al menos una ubicacion disponible de tipo Peaje.
- Usuario con permiso para administrar peajes.

**Criterios de Aceptacion**

- [ ] DADO un nuevo peaje, CUANDO el usuario lo registra, ENTONCES indica nombre y ubicacion de tipo Peaje.
- [ ] DADO que no existen ubicaciones de tipo Peaje, CUANDO intenta crear un peaje, ENTONCES el sistema informa que primero debe registrar esa ubicacion.
- [ ] DADO un peaje registrado, CUANDO guarda correctamente, ENTONCES puede registrar sus tarifas.
- [ ] DADO un peaje existente, CUANDO se edita, ENTONCES puede cambiar nombre y ubicacion.

**Flujo Principal**

1. Entra a Peajes.
2. Selecciona Nuevo peaje.
3. Completa nombre y ubicacion.
4. Guarda.
5. Registra tarifas.

**Flujos de Excepcion**

- No hay ubicaciones de tipo Peaje.
- Falta nombre o ubicacion.
- No se pudo guardar.

**Eventos del Dominio**

- Peaje registrado.
- Peaje actualizado.

---

### HU-14-013 Como Analista de Configuracion, quiero registrar tarifas de peaje, para calcular costos segun tipo de cobro y ejes.

**Prioridad: Alta | Estimacion: 5 puntos**

**Precondiciones**

- Existe un peaje registrado.
- Usuario con permiso para administrar tarifas.

**Criterios de Aceptacion**

- [ ] DADO un peaje, CUANDO el usuario registra tarifa, ENTONCES informa tipo de cobro, precio por eje, moneda y desde cuando aplica.
- [ ] DADO un precio por eje, CUANDO guarda, ENTONCES debe ser mayor que cero.
- [ ] DADO una tarifa guardada, CUANDO se consulta, ENTONCES se muestra tabla de montos por ejes.
- [ ] DADO una nueva tarifa del mismo tipo de cobro, CUANDO guarda, ENTONCES reemplaza los precios anteriores para ese tipo.
- [ ] DADO una fila de tarifa existente, CUANDO el usuario la edita, ENTONCES puede ajustar solo ese monto.

**Flujo Principal**

1. Abre Tarifas de un peaje.
2. Selecciona tipo de cobro.
3. Ingresa precio por eje, moneda y fecha si corresponde.
4. Guarda.
5. Revisa tabla generada.

**Flujos de Excepcion**

- Monto menor o igual a cero.
- No se pudo listar tarifas.
- No se pudo guardar o modificar.

**Eventos del Dominio**

- Tarifa de peaje registrada.
- Tarifa de peaje actualizada.

---

### HU-14-014 Como Usuario Operativo, quiero consultar peajes y tarifas, para validar costos disponibles antes de usarlos en rutas.

**Prioridad: Media | Estimacion: 3 puntos**

**Precondiciones**

- Usuario con permiso para consultar peajes.

**Criterios de Aceptacion**

- [ ] DADO la pantalla de peajes, CUANDO el usuario busca por nombre, ENTONCES se listan peajes coincidentes.
- [ ] DADO un peaje, CUANDO abre Tarifas, ENTONCES ve tipo de cobro, ejes, monto, fecha y disponibilidad.
- [ ] DADO un peaje sin tarifas, CUANDO se consulta, ENTONCES el sistema informa que aun no tiene tarifas registradas.

**Flujo Principal**

1. Entra a Peajes.
2. Busca el peaje.
3. Abre Tarifas.
4. Revisa montos.

**Flujos de Excepcion**

- No hay peajes.
- No se pudo cargar tarifas.
- Usuario sin permiso de consulta.

**Eventos del Dominio**

- No genera evento de cambio; es una consulta de peajes y tarifas.

## Epica 5: Rutas y Costos de Peajes

> **Objetivo:** Administrar recorridos entre ubicaciones, sus peajes y costo estimado.

---

### HU-14-015 Como Analista de Configuracion, quiero registrar rutas, para definir recorridos reutilizables.

**Prioridad: Alta | Estimacion: 5 puntos**

**Precondiciones**

- Usuario con permiso para administrar rutas.

**Criterios de Aceptacion**

- [ ] DADO una nueva ruta, CUANDO el usuario la registra, ENTONCES informa nombre del recorrido.
- [ ] DADO el nombre de ruta, CUANDO guarda, ENTONCES debe ser unico entre rutas disponibles.
- [ ] DADO una ruta creada, CUANDO se guarda, ENTONCES el usuario puede entrar a Ver mapa para definir origen, paradas, destino y peajes.
- [ ] DADO una ruta existente, CUANDO se edita, ENTONCES puede cambiar nombre.

**Flujo Principal**

1. Entra a Rutas.
2. Selecciona Nueva ruta.
3. Completa nombre.
4. Guarda.
5. Abre Ver mapa.

**Flujos de Excepcion**

- Falta nombre.
- Ya existe una ruta disponible con el mismo nombre.
- No se pudo guardar.

**Eventos del Dominio**

- Ruta registrada.
- Ruta actualizada.

---

### HU-14-016 Como Analista de Configuracion, quiero ordenar puntos de una ruta, para definir origen, paradas y destino.

**Prioridad: Alta | Estimacion: 8 puntos**

**Precondiciones**

- Existe una ruta registrada.
- Existen ubicaciones disponibles.

**Criterios de Aceptacion**

- [ ] DADO una ruta nueva, CUANDO el usuario inicia recorrido, ENTONCES se crean espacios para origen y destino.
- [ ] DADO ubicaciones agregadas, CUANDO el usuario las mueve, ENTONCES cambia el orden del recorrido.
- [ ] DADO una parada nueva, CUANDO el usuario la inserta en un tramo, ENTONCES queda entre dos puntos existentes.
- [ ] DADO una estructura invalida, CUANDO intenta guardar, ENTONCES el sistema informa que necesita un origen y un destino.
- [ ] DADO origen y destino iguales, CUANDO se guarda, ENTONCES se trata como ruta de ida y vuelta.

**Flujo Principal**

1. Entra al mapa de ruta.
2. Inicia recorrido.
3. Selecciona ubicaciones.
4. Ordena origen, paradas y destino.
5. Guarda ruta.

**Flujos de Excepcion**

- No hay ubicaciones disponibles.
- Falta origen o destino.
- No se pudo guardar.

**Eventos del Dominio**

- Recorrido de ruta actualizado.

---

### HU-14-017 Como Analista de Configuracion, quiero asignar peajes a una ruta, para asociar costos al recorrido.

**Prioridad: Alta | Estimacion: 8 puntos**

**Precondiciones**

- Existe una ruta con puntos.
- Existen peajes disponibles.

**Criterios de Aceptacion**

- [ ] DADO una ruta con puntos, CUANDO el usuario agrega un peaje, ENTONCES puede colocarlo en el recorrido.
- [ ] DADO un peaje en tramo, CUANDO selecciona desde y hasta, ENTONCES ambos deben pertenecer a la ruta.
- [ ] DADO un peaje, CUANDO lo configura, ENTONCES indica sentido y si cobra o no cobra.
- [ ] DADO una ruta solo ida, CUANDO guarda peajes, ENTONCES el sistema conserva el sentido compatible.
- [ ] DADO puntos y peajes modificados, CUANDO guarda, ENTONCES se actualiza toda la ruta.

**Flujo Principal**

1. Abre mapa de ruta.
2. Agrega peajes entre puntos o en la lista de peajes.
3. Indica sentido y cobro.
4. Guarda ruta.

**Flujos de Excepcion**

- No hay peajes registrados.
- Peaje sin seleccionar.
- Tramo incompleto o fuera de ruta.
- Peaje repetido en mismo sentido y tramo.
- No se pudo guardar.

**Eventos del Dominio**

- Peajes de ruta actualizados.

---

### HU-14-018 Como Usuario Operativo, quiero calcular el costo de peajes de una ruta, para estimar el costo del recorrido.

**Prioridad: Media | Estimacion: 5 puntos**

**Precondiciones**

- Existe una ruta con peajes asignados.
- Los peajes tienen tarifas disponibles.

**Criterios de Aceptacion**

- [ ] DADO una ruta con peajes, CUANDO el usuario calcula costo, ENTONCES indica tipo de cobro y numero de ejes si corresponde.
- [ ] DADO una ruta de ida y vuelta, CUANDO calcula, ENTONCES ve costo de ida, vuelta y total.
- [ ] DADO una ruta sin peajes, CUANDO intenta calcular, ENTONCES el sistema informa que debe asignar peajes.
- [ ] DADO un costo calculado, CUANDO se muestra, ENTONCES ve total, moneda y detalle por peaje.
- [ ] DADO la opcion Tabla por ejes, CUANDO la usa, ENTONCES ve costos por tipo de vehiculo o numero de ejes.

**Flujo Principal**

1. Entra al mapa de ruta.
2. Selecciona tipo de cobro y ejes.
3. Calcula costo.
4. Revisa total y detalle.

**Flujos de Excepcion**

- Ruta sin peajes.
- Peajes sin tarifas disponibles.
- Numero de ejes invalido.
- No se pudo calcular.

**Eventos del Dominio**

- No genera evento de cambio; es un calculo de consulta.

## Epica 6: Costos Operativos del Viaje

> **Objetivo:** Configurar costos internos por ruta, modalidad y tipo de carga.

---

### HU-14-019 Como Analista de Configuracion, quiero administrar conceptos de costo, para reutilizarlos en los costos operativos.

**Prioridad: Alta | Estimacion: 5 puntos**

**Precondiciones**

- Usuario con permiso para administrar costos operativos.

**Criterios de Aceptacion**

- [ ] DADO el catalogo de conceptos, CUANDO el usuario entra, ENTONCES ve conceptos como alimentacion, alojamiento, cochera, lavado o servicio fijo.
- [ ] DADO un nuevo concepto, CUANDO el usuario lo registra, ENTONCES indica nombre, como se cobra y desde cuando aplica.
- [ ] DADO un concepto de alimentacion, CUANDO se usa, ENTONCES permite manejar desayuno, almuerzo y cena.
- [ ] DADO un concepto disponible, CUANDO cambia, ENTONCES puede pausarse, reactivarse o modificarse segun permisos.

**Flujo Principal**

1. Entra a Costos operativos.
2. Abre Catalogo de conceptos.
3. Registra o modifica concepto.
4. Guarda.

**Flujos de Excepcion**

- Falta informacion obligatoria.
- Concepto duplicado.
- No se pudo guardar.

**Eventos del Dominio**

- Concepto de costo registrado.
- Concepto de costo actualizado.
- Concepto de costo pausado.
- Concepto de costo reactivado.

---

### HU-14-020 Como Analista de Configuracion, quiero configurar costos por ruta, para definir el costo operativo de un viaje.

**Prioridad: Alta | Estimacion: 8 puntos**

**Precondiciones**

- Existe cuenta o contrato disponible.
- Existe ruta disponible.
- Existen conceptos de costo disponibles.

**Criterios de Aceptacion**

- [ ] DADO una configuracion nueva, CUANDO el usuario inicia, ENTONCES selecciona cuenta o contrato, ruta, modalidad y tipo de carga.
- [ ] DADO dias y noches del viaje, CUANDO los ingresa, ENTONCES se usan para calcular cantidades.
- [ ] DADO conceptos disponibles, CUANDO el usuario los marca, ENTONCES puede registrar precios y cantidades.
- [ ] DADO la misma cuenta o contrato, ruta, modalidad y tipo de carga, CUANDO guarda otra vez, ENTONCES actualiza el paquete actual y evita duplicados.
- [ ] DADO la configuracion guardada, CUANDO se consulta, ENTONCES muestra conceptos, montos y total.

**Flujo Principal**

1. Entra a Configurar costo.
2. Selecciona cuenta o contrato y ruta.
3. Selecciona modalidad y tipo de carga.
4. Ingresa dias y noches.
5. Marca conceptos y precios.
6. Guarda.

**Flujos de Excepcion**

- Falta cuenta o contrato.
- Falta ruta.
- No hay conceptos disponibles.
- No se pudo guardar.

**Eventos del Dominio**

- Paquete de costo operativo registrado.
- Paquete de costo operativo actualizado.

---

### HU-14-021 Como Usuario Operativo, quiero consultar paquetes de costo configurados, para revisar costos actuales por ruta.

**Prioridad: Media | Estimacion: 5 puntos**

**Precondiciones**

- Existen paquetes de costo registrados.
- Usuario con permiso para consultar costos operativos.

**Criterios de Aceptacion**

- [ ] DADO la pestaña Paquetes configurados, CUANDO el usuario selecciona cuenta o contrato, ENTONCES ve rutas con costo configurado.
- [ ] DADO un paquete, CUANDO lo despliega, ENTONCES ve modalidad, tipo de carga, dias, noches, conceptos y montos.
- [ ] DADO muchos paquetes, CUANDO navega paginas, ENTONCES puede revisar resultados ordenados.
- [ ] DADO un paquete disponible, CUANDO selecciona Editar, ENTONCES vuelve al formulario con informacion cargada.

**Flujo Principal**

1. Entra a Paquetes configurados.
2. Selecciona cuenta o contrato.
3. Revisa paquetes.
4. Edita si corresponde.

**Flujos de Excepcion**

- No hay paquetes para la cuenta o contrato.
- No se pudo cargar informacion.

**Eventos del Dominio**

- No genera evento de cambio; es una consulta de costos operativos.

---

### HU-14-022 Como Administrador Principal, quiero retirar paquetes de costo, para evitar que se usen cuando ya no corresponden.

**Prioridad: Media | Estimacion: 3 puntos**

**Precondiciones**

- Existe un paquete de costo disponible.
- Usuario con permiso para retirar costos operativos.

**Criterios de Aceptacion**

- [ ] DADO un paquete disponible, CUANDO el usuario selecciona Anular, ENTONCES el sistema pide confirmacion.
- [ ] DADO la confirmacion, CUANDO acepta, ENTONCES el paquete queda retirado y deja de aparecer como opcion actual.
- [ ] DADO un paquete retirado, CUANDO se necesita consultar que existio, ENTONCES no se elimina definitivamente.

**Flujo Principal**

1. Entra a Paquetes configurados.
2. Ubica el paquete.
3. Selecciona Anular.
4. Confirma.

**Flujos de Excepcion**

- Usuario cancela confirmacion.
- No se pudo retirar.

**Eventos del Dominio**

- Paquete de costo operativo retirado.

## Epica 7: Reportes y Exportacion

> **Objetivo:** Permitir revision consolidada y salida de informacion de configuracion.

---

### HU-14-023 Como Auditor, quiero revisar reportes de configuracion, para identificar datos disponibles, pausados y retirados.

**Prioridad: Media | Estimacion: 3 puntos**

**Precondiciones**

- Usuario con permiso para consultar reportes.

**Criterios de Aceptacion**

- [ ] DADO la vista de reportes, CUANDO carga informacion, ENTONCES muestra total de configuraciones disponibles, pausadas y retiradas.
- [ ] DADO datos recientes, CUANDO se muestra la tabla, ENTONCES aparecen codigo, tipo, nombre, disponibilidad, detalle y fecha.
- [ ] DADO que no se puede cargar informacion, CUANDO entra a reportes, ENTONCES el sistema informa el problema.

**Flujo Principal**

1. Entra a Reportes.
2. Revisa indicadores consolidados.
3. Revisa tabla de configuraciones.

**Flujos de Excepcion**

- No se pudo cargar informacion.
- No existen datos para revisar.

**Eventos del Dominio**

- No genera evento de cambio; es una consulta de reportes.

---

### HU-14-024 Como Auditor, quiero exportar configuraciones, para compartir informacion filtrada o consolidada.

**Prioridad: Media | Estimacion: 5 puntos**

**Precondiciones**

- Usuario con permiso para exportar.
- Existe informacion consultable.

**Criterios de Aceptacion**

- [ ] DADO un listado por pantalla, CUANDO el usuario selecciona Exportar, ENTONCES el sistema prepara la informacion con la busqueda aplicada.
- [ ] DADO una busqueda por tipo o disponibilidad, CUANDO exporta, ENTONCES la salida corresponde al resultado mostrado.
- [ ] DADO la vista de reportes, CUANDO actualiza la informacion, ENTONCES obtiene vista consolidada.
- [ ] DADO un error de exportacion, CUANDO ocurre, ENTONCES el sistema informa el problema.

**Flujo Principal**

1. Entra al listado o reporte.
2. Aplica busqueda si corresponde.
3. Selecciona Exportar o actualiza informacion.
4. Revisa resultado.

**Flujos de Excepcion**

- No existen datos para la busqueda.
- No se pudo exportar.
- Usuario sin permiso.

**Eventos del Dominio**

- Exportacion de configuracion consultada.

## Informacion Maestra de Configuracion General

| Tipo | Informacion principal | Antes necesitas | Uso principal |
| --- | --- | --- | --- |
| Ubicacion | Nombre, tipo, pais, zona geografica, direccion, referencia y coordenadas. | Nada previo. | Base para sedes, almacenes, peajes y rutas. |
| Sede | Nombre, descripcion y ubicacion. | Ubicacion disponible. | Centro de trabajo. |
| Area | Nombre, sede, nivel y area superior opcional. | Sede disponible. | Estructura interna por sede. |
| Almacen | Nombre, ubicacion, sede y datos de temporalidad. | Ubicacion y sede disponibles. | Punto de almacenamiento. |
| Cargo | Nombre, area y cargo superior opcional. | Area disponible. | Puestos y linea de reporte. |
| Cuenta | Nombre y descripcion. | Nada previo. | Agrupador comercial. |
| Contrato | Nombre y cuenta o contrato principal. | Cuenta o contrato disponible. | Acuerdo comercial asociado a una cuenta. |
| Regimen | Codigo, dias de trabajo, dias de descanso y horas por dia. | Nada previo. | Patron laboral reutilizable. |
| Peaje | Nombre y ubicacion de cobro. | Ubicacion de tipo Peaje. | Cobro usado en rutas. |
| Tarifa de peaje | Tipo de cobro, precio, moneda, ejes y fecha desde que aplica. | Peaje existente. | Calculo de peajes por ruta. |
| Ruta | Nombre, origen, paradas, destino y peajes. | Ubicaciones disponibles; peajes opcionales. | Recorrido reutilizable. |
| Costo operativo | Cuenta o contrato, ruta, modalidad, tipo de carga, conceptos y precios. | Cuenta o contrato, ruta y conceptos. | Costo interno del viaje. |

## Reglas Generales para Usuarios

| Regla | Descripcion |
| --- | --- |
| Codigo | El codigo lo asigna el sistema y no se cambia manualmente. |
| Tipo de configuracion | El tipo se define al registrar y no se cambia despues. |
| Disponibilidad | Solo configuraciones disponibles se ofrecen para nuevos usos. |
| Pausar | Pide motivo y conserva el dato para consulta. |
| Reactivar | Permite volver a usar una configuracion pausada. |
| Retirar | Pide motivo y deja el dato solo como antecedente. |
| Contratos | La cuenta o contrato principal se elige al crear y no se cambia despues. |
| Areas | Un area puede quedar sola o debajo de otra area. |
| Cargos | Un cargo pertenece a un area y puede reportar a otro cargo. |
| Almacenes | Un almacen necesita ubicacion y sede. |
| Peajes | Un peaje debe estar asociado a una ubicacion de tipo Peaje. |
| Tarifas | El precio debe ser mayor que cero. |
| Rutas | Una ruta necesita origen y destino para guardar su recorrido. |
| Costos operativos | Para la misma cuenta o contrato, ruta, modalidad y tipo de carga debe existir un solo paquete actual. |

## Permisos Sugeridos por Rol

| Accion | Administrador Principal | Analista de Configuracion | Usuario Operativo | Auditor |
| --- | --- | --- | --- | --- |
| Consultar panel y listados | Si | Si | Si | Si |
| Registrar configuraciones | Si | Si | No | No |
| Modificar configuraciones | Si | Si | No | No |
| Pausar, reactivar o retirar | Si | Segun permiso | No | No |
| Administrar peajes y tarifas | Si | Si | No | No |
| Administrar rutas | Si | Si | No | No |
| Calcular costos de peajes | Si | Si | Si | Si |
| Administrar costos operativos | Si | Si | No | No |
| Consultar costos operativos | Si | Si | Si | Si |
| Exportar reportes | Si | Segun permiso | No | Si |
