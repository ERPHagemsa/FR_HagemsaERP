# Piloto Detallado: BC-01 Socio de Negocio

Este documento describe la gestión de personas y organizaciones que interactúan con la empresa como clientes, proveedores y personal. Actúa como fuente oficial de información maestra de Socios de Negocio, incluyendo el alta de cliente desde Comercial cuando un prospecto se convierte en cliente.

| Campo | Detalle |
| --- | --- |
| Área | Recursos Humanos |
| Roles | **Administrador Principal**, **Analista de Recursos Humanos** y **Auditor**. |
| Relación clave | Un Socio de Negocio se identifica por la combinación de documento/RUC/DNI + tipo de socio. Un mismo documento puede estar asociado a más de un Socio de Negocio cuando cumple roles diferentes dentro de la empresa, por ejemplo, CLIENTE, PROVEEDOR o PERSONAL. Cada registro mantiene el tipo de socio, si está disponible para operar o fue dado de baja, si el registro sigue vigente o fue anulado, y si está pendiente de aprobación o aprobado. |
| Alcance funcional | Registrar, modificar, aprobar, dar de baja, consultar y exportar clientes, proveedores y personal; recibir cliente desde Comercial a partir de prospecto convertido; revisar el resumen general del módulo; consultar listados separados por tipo; consultar SAP para clientes y proveedores cuando corresponda; administrar la asignación del personal (dónde trabaja, sus cuentas y contratos con su aprobación, y el horario o régimen de trabajo elegido); administrar tipos de tareo y configuraciones laborales; y registrar la disponibilidad esperada del personal. |
| Regla de edición | La edición normal permite actualizar razón social, nombre comercial, nombre completo o nombre para mostrar cuando aplica, dirección, contacto, correo y celular. No permite cambiar documento ni código interno. |
| Lo que entra | Solicitudes de registro, modificación, baja, anulación o aprobación de clientes, proveedores y personal; consulta de información SAP para clientes y proveedores; creación o cambios de la asignación del personal; aprobación de sus cuentas y contratos; cambios de horario, régimen o configuración laboral; y registro de disponibilidad esperada. |
| Lo que sale | Confirmaciones de los cambios realizados; decisiones de aprobación; estado de sincronización SAP cuando aplica; reportes e información para auditoría. |
| Quién la usa | Personas y áreas que consultan o reutilizan el maestro de clientes, proveedores y personal, incluyendo asignaciones, horarios y régimen, disponibilidad, reportería y auditoría. |

> **Fuera de alcance:** Este maestro no administra la operación diaria del personal, ni las solicitudes de permisos o viáticos, ni la asistencia (marcaciones, faltas, tardanzas, horas extra o regularizaciones). Esas funciones pertenecen a otros procesos de la empresa.

## Endpoints BFF Vigentes

Ruta canonica consumida por frontend:

- `POST /api/socios-de-negocio/desde-comercial/prospecto-convertido-a-cliente`

Alias BFF compatible:

- `POST /api/socio-negocios/socios-de-negocio/desde-comercial/prospecto-convertido-a-cliente`

Uso: alta de cliente ya validado desde Comercial. No gestiona ciclo de prospectos; solo consume conversion.

## Resumen de Épicas

| # | Épica | Objetivo de negocio | Historias |
| --- | --- | --- | --- |
| 1 | Gestión de Clientes | Administrar el alta, validación, aprobación, modificación, baja y anulación de clientes. | 4 |
| 2 | Gestión de Proveedores | Administrar el alta, validación, aprobación, modificación, baja y anulación de proveedores. | 3 |
| 3 | Gestión de Personal | Administrar el alta, aprobación, modificación, baja y anulación del personal, manteniendo datos personales básicos. | 3 |
| 4 | Asignación del Personal | Administrar dónde trabaja el personal y a qué estructura pertenece: cargo, sede, área, responsable, horario y régimen de trabajo, cuentas y contratos con su aprobación, y fechas de validez. | 4 |
| 5 | Catálogo de Horarios y Regímenes de Trabajo | Administrar las opciones de horario y régimen (turno, horario o programación de trabajo y descanso) que luego se eligen al asignar a un personal. | 3 |
| 6 | Disponibilidad del Personal | Registrar los periodos esperados del personal (vacaciones, permiso, licencia, descanso, etc.) como información de referencia. | 3 |
| 7 | Reportes y Consultas | Permitir consultar, filtrar, auditar y exportar información de clientes, proveedores y personal. | 3 |

> **Nota sobre el alta:** En las épicas 1, 2 y 3, la validación y la aprobación forman parte del alta de clientes, proveedores y personal. El alta termina cuando el registro queda aprobado. Si el revisor encuentra datos por corregir, los edita antes de aprobar; si el documento o RUC es incorrecto, anula el registro y lo vuelve a crear. La revisión del cliente recibido desde el área Comercial se detalla por separado porque nace desde otro proceso.

> **Nota sobre la gestión del personal:** Un personal aprobado y activo continúa con su **asignación** (Épica 4), que define dónde trabaja, su horario y régimen, y sus cuentas y contratos. Las opciones de horario y régimen que se eligen en la asignación se administran en el **catálogo** (Épica 5). Además, se puede registrar su **disponibilidad esperada** (Épica 6), como vacaciones o permisos previstos. Cada parte conserva sus fechas de validez y su historial.

> **Nota sobre la navegación del módulo:** El usuario inicia desde el panel de Socios de Negocio, donde puede revisar el resumen general, entrar a Clientes, Proveedores o Personal, registrar un nuevo socio y exportar información según sus permisos.

> **Nota sobre SAP:** Para clientes y proveedores, el usuario puede consultar SAP con el documento antes del registro. Si encuentra información relacionada, el sistema permite revisar el registro asociado; si no encuentra información suficiente, el alta continúa de forma manual. El personal no usa código SAP ni sincronización SAP.

## Épica 1: Gestión de Clientes

> **Objetivo:** Administrar el alta, modificación, aprobación, baja y anulación de clientes, manteniendo actualizada su información maestra.

> **Nota funcional:**

El registro de clientes se realiza con informacion maestra validada. Esta épica no administra prospectos, seguimiento comercial, oportunidades ni estados comerciales; solo mantiene la informacion maestra del cliente cuando corresponde.

---

### HU-01-001 Como Analista de Recursos Humanos, quiero registrar un cliente, para mantener su información maestra disponible.

**Prioridad: Alta | Estimación: 5 puntos**

**Precondiciones**

- Usuario autenticado y con permiso para registrar clientes.
- Información principal y de contacto del cliente disponible.

**Criterios de Aceptación**

- ☐ DADO el campo de documento, CUANDO el usuario lo llena, ENTONCES solo acepta numeros: un DNI de 8 digitos o un RUC de 11 digitos.
- ☐ DADO un documento valido, CUANDO el usuario realiza la validacion previa del cliente, ENTONCES el sistema confirma si puede continuar con el registro o informa que debe completar el alta manualmente.
- ☐ DADO un documento valido de cliente, CUANDO el usuario consulta SAP, ENTONCES el sistema informa si existe información relacionada para revisarla antes de registrar manualmente.
- ☐ DADO el campo de celular, CUANDO el usuario lo llena, ENTONCES solo acepta numeros y debe tener 9 digitos.
- ☐ DADO un documento ya registrado como cliente, CUANDO el usuario intenta registrarlo otra vez, ENTONCES el sistema avisa la duplicidad y no crea un registro repetido.
- ☐ DADO el formulario completo, CUANDO el usuario registra al cliente, ENTONCES el cliente queda Pendiente de aprobacion.
- ☐ DADO un cliente Pendiente de aprobacion, CUANDO un usuario autorizado lo revisa, ENTONCES puede aprobarlo; si encuentra datos por corregir, los edita antes de aprobar.
- ☐ DADO un cliente recien creado, CUANDO el usuario lo consulta, ENTONCES puede revisarlo y continuar su gestion segun su estado.

**Flujo Principal**

1. Entra al módulo de Socios de Negocio, abre Clientes y selecciona Nuevo.
2. Elige el tipo Cliente.
3. Consulta SAP con el documento si corresponde.
4. Completa el formulario con los datos del cliente.
5. Registra al cliente.
6. El sistema lo deja en estado Pendiente para su aprobación.
7. Un usuario autorizado lo revisa y aprueba; si hay datos por corregir, los edita antes de aprobar.

**Flujos de Excepción**

- El DNI no tiene 8 dígitos o el RUC no tiene 11 dígitos.
- El celular no tiene 9 dígitos.
- El documento ya esta registrado como CLIENTE.
- Faltan datos obligatorios.
- La validacion previa no encuentra informacion suficiente; el usuario continua con el registro manual.
- SAP devuelve información de otro registro; el usuario revisa el registro encontrado antes de continuar.

**Eventos del Dominio**

- Cliente registrado.
- Cliente aprobado.

---

### HU-01-002 Como Administrador Principal, quiero revisar y aprobar la información de cliente recibida desde Comercial, para formalizarlo como cliente.

**Prioridad: Alta | Estimación: 8 puntos**

**Precondiciones**

- Existe un cliente recibido desde Comercial y visible en el Listado de Socios de Negocio con origen COMERCIAL.
- Usuario autenticado y con permiso para revisar y aprobar clientes.

**Criterios de Aceptación**

- ☐ DADO un cliente recibido desde Comercial, CUANDO aparece en el listado, ENTONCES se muestra con origen COMERCIAL y su estado de aprobacion (Pendiente o Aprobado).
- ☐ DADO un cliente con origen MANUAL, COMERCIAL o SAP, CUANDO aparece en el listado, ENTONCES el usuario puede reconocer el origen del registro.
- ☐ DADO un cliente pendiente de revision, CUANDO el usuario lo consulta, ENTONCES puede revisar su informacion completa.
- ☐ DADO que hay datos por corregir, CUANDO el usuario decide ajustarlos, ENTONCES puede actualizar los campos permitidos antes de aprobar.
- ☐ DADO un cliente activo, vigente y Pendiente, CUANDO el usuario selecciona Aprobar, ENTONCES su estado cambia a Aprobado de inmediato.
- ☐ DADO un documento o RUC incorrecto que no se puede editar, CUANDO el usuario lo detecta, ENTONCES anula el registro y vuelve a crearlo con el documento correcto.
- ☐ DADO un cliente anulado o inactivo, CUANDO el usuario lo consulta, ENTONCES no puede aprobarlo.

**Flujo Principal**

1. Ubica al cliente pendiente de revisión.
2. Revisa la información recibida y corrige datos si corresponde.
3. Aprueba la información revisada.
4. El sistema registra el resultado.

**Flujos de Excepción**

- El cliente recibido tiene información obligatoria incompleta.
- Ya existe otro CLIENTE con el mismo documento.
- El documento o RUC es incorrecto; como no se puede editar, el usuario anula y vuelve a crear.
- El usuario no tiene permiso para aprobar clientes.

**Eventos del Dominio**

- Cliente actualizado cuando el aprobador corrige datos permitidos antes de aprobar.
- Cliente aprobado.

---

### HU-01-003 Como Analista de Recursos Humanos, quiero modificar los datos de un cliente, para mantener actualizada su información maestra.

**Prioridad: Alta | Estimación: 5 puntos**

**Precondiciones**

- Cliente registrado.
- Usuario autenticado y con permiso para modificar clientes.

**Criterios de Aceptación**

- ☐ DADO un cliente registrado, CUANDO el usuario decide actualizar su informacion, ENTONCES puede editar los datos permitidos.
- ☐ DADO la actualizacion de datos, CUANDO el usuario cambia razon social, nombre comercial, direccion, contacto, correo o celular, ENTONCES puede guardar esos cambios.
- ☐ DADO la actualizacion de datos, CUANDO el usuario revisa el registro, ENTONCES el tipo, el documento y el codigo interno se mantienen sin cambios.
- ☐ DADO un cliente con código SAP, CUANDO el usuario edita sus datos, ENTONCES el código SAP y el estado de sincronización no se modifican desde la edición normal.
- ☐ DADO el campo de celular, CUANDO el usuario guarda, ENTONCES debe tener exactamente 9 digitos.
- ☐ DADO un cambio valido, CUANDO el usuario guarda la actualizacion, ENTONCES la informacion del cliente se actualiza y el cambio queda registrado en el historial.
- ☐ DADO un registro anulado, CUANDO el usuario lo consulta, ENTONCES la edicion no esta disponible.

**Flujo Principal**

1. Busca al cliente en el listado.
2. Actualiza los datos permitidos.
3. Guarda los cambios.

**Flujos de Excepción**

- Cliente no encontrado.
- Datos obligatorios incompletos o inválidos.
- El celular no tiene 9 dígitos.
- El usuario necesita cambiar el documento o el codigo interno; esa actualizacion no forma parte de la edicion normal.
- El usuario no tiene permiso para modificar clientes.

**Eventos del Dominio**

- Cliente actualizado.

---

### HU-01-004 Como Analista de Recursos Humanos, quiero dar de baja o anular a un cliente, para que deje de estar disponible como cliente activo cuando corresponda.

**Prioridad: Alta | Estimación: 3 puntos**

**Precondiciones**

- Cliente registrado.
- Usuario autenticado y con permiso para administrar el estado del cliente.

**Criterios de Aceptación**

- ☐ DADO un cliente activo y vigente, CUANDO el usuario solicita la baja e indica el motivo, ENTONCES el cliente queda inactivo.
- ☐ DADO un cliente inactivo y no anulado, CUANDO el usuario solicita reactivarlo, ENTONCES el sistema genera un nuevo registro Pendiente relacionado con el anterior.
- ☐ DADO un registro creado por error, CUANDO el usuario solicita anularlo e indica el motivo, ENTONCES el registro queda anulado y deja de poder operar.
- ☐ DADO cualquiera de estas acciones, CUANDO termina correctamente, ENTONCES el resultado queda registrado en el historial.

**Flujo Principal**

1. Busca al cliente en el listado.
2. Selecciona la acción que corresponda: anular, reactivar o dar de baja.
3. Indica el motivo y confirma la acción.
4. El sistema aplica el cambio y lo guarda en el historial.

**Flujos de Excepción**

- El motivo obligatorio no fue informado.
- Se intenta dar de baja un cliente que no esta activo y vigente.
- Se intenta reactivar un registro anulado.
- El usuario no tiene permiso para administrar el estado del cliente.

**Eventos del Dominio**

- Cliente dado de baja.
- Cliente reactivado.
- Cliente anulado.

## Épica 2: Gestión de Proveedores

> **Objetivo:** Administrar el alta, modificación, aprobación, baja y anulación de proveedores.

---

### HU-01-005 Como Analista de Recursos Humanos, quiero registrar un proveedor, para mantener su información maestra disponible.

**Prioridad: Alta | Estimación: 5 puntos**

**Precondiciones**

- Usuario autenticado y con permiso para registrar proveedores.
- Información principal y de contacto del proveedor disponible.

**Criterios de Aceptación**

- ☐ DADO el campo de documento, CUANDO el usuario lo llena, ENTONCES solo acepta numeros: un DNI de 8 digitos o un RUC de 11 digitos.
- ☐ DADO un documento valido, CUANDO el usuario realiza la validacion previa del proveedor, ENTONCES el sistema confirma si puede continuar con el registro o informa que debe completar el alta manualmente.
- ☐ DADO un documento valido de proveedor, CUANDO el usuario consulta SAP, ENTONCES el sistema informa si existe información relacionada para revisarla antes de registrar manualmente.
- ☐ DADO el campo de celular, CUANDO el usuario lo llena, ENTONCES solo acepta numeros y debe tener 9 digitos.
- ☐ DADO un documento ya registrado como proveedor, CUANDO el usuario intenta registrarlo otra vez, ENTONCES el sistema avisa la duplicidad y no crea un registro repetido.
- ☐ DADO el formulario completo, CUANDO el usuario registra al proveedor, ENTONCES el proveedor queda Pendiente de aprobacion.
- ☐ DADO un proveedor Pendiente de aprobacion, CUANDO un usuario autorizado lo revisa, ENTONCES puede aprobarlo; si encuentra datos por corregir, los edita antes de aprobar.
- ☐ DADO un proveedor recien creado, CUANDO el usuario lo consulta, ENTONCES puede revisarlo y continuar su gestion segun su estado.

**Flujo Principal**

1. Entra al módulo de Socios de Negocio, abre Proveedores y selecciona Nuevo.
2. Elige el tipo Proveedor.
3. Consulta SAP con el documento si corresponde.
4. Completa el formulario con los datos del proveedor.
5. Registra al proveedor.
6. El sistema lo deja en estado Pendiente para su aprobación.
7. Un usuario autorizado lo revisa y aprueba; si hay datos por corregir, los edita antes de aprobar.

**Flujos de Excepción**

- El DNI no tiene 8 dígitos o el RUC no tiene 11 dígitos.
- El celular no tiene 9 dígitos.
- El documento ya esta registrado como PROVEEDOR.
- Faltan datos obligatorios.
- La validacion previa no encuentra informacion suficiente; el usuario continua con el registro manual.
- SAP devuelve información de otro registro; el usuario revisa el registro encontrado antes de continuar.

**Eventos del Dominio**

- Proveedor registrado.
- Proveedor aprobado.

---

### HU-01-006 Como Analista de Recursos Humanos, quiero modificar los datos de un proveedor, para mantener actualizada su información maestra.

**Prioridad: Alta | Estimación: 5 puntos**

**Precondiciones**

- Proveedor registrado.
- Usuario autenticado y con permiso para modificar proveedores.

**Criterios de Aceptación**

- ☐ DADO un proveedor registrado, CUANDO el usuario decide actualizar su informacion, ENTONCES puede editar los datos permitidos.
- ☐ DADO la actualizacion de datos, CUANDO el usuario cambia razon social, nombre comercial, direccion, contacto, correo o celular, ENTONCES puede guardar esos cambios.
- ☐ DADO la actualizacion de datos, CUANDO el usuario revisa el registro, ENTONCES el tipo, el documento y el codigo interno se mantienen sin cambios.
- ☐ DADO un proveedor con código SAP, CUANDO el usuario edita sus datos, ENTONCES el código SAP y el estado de sincronización no se modifican desde la edición normal.
- ☐ DADO el campo de celular, CUANDO el usuario guarda, ENTONCES debe tener exactamente 9 digitos.
- ☐ DADO un cambio valido, CUANDO el usuario guarda la actualizacion, ENTONCES la informacion del proveedor se actualiza y queda registrada en el historial.

**Flujo Principal**

1. Busca al proveedor en el listado.
2. Cambia los datos permitidos.
3. Guarda los cambios.

**Flujos de Excepción**

- Proveedor no encontrado.
- Datos obligatorios incompletos o inválidos.
- El celular no tiene 9 dígitos.
- El usuario necesita cambiar el documento o el codigo interno; la edicion actual no lo permite.
- El usuario no tiene permiso para modificar proveedores.

**Eventos del Dominio**

- Proveedor actualizado.

---

### HU-01-007 Como Analista de Recursos Humanos, quiero dar de baja o anular a un proveedor, para que deje de estar disponible como proveedor activo cuando corresponda.

**Prioridad: Alta | Estimación: 3 puntos**

**Precondiciones**

- Proveedor registrado.
- Usuario autenticado y con permiso para administrar el estado del proveedor.

**Criterios de Aceptación**

- ☐ DADO un proveedor activo y vigente, CUANDO el usuario solicita la baja e indica el motivo, ENTONCES el proveedor queda inactivo.
- ☐ DADO un proveedor inactivo y no anulado, CUANDO el usuario solicita reactivarlo, ENTONCES el sistema genera un nuevo registro Pendiente relacionado con el anterior.
- ☐ DADO un registro creado por error, CUANDO el usuario solicita anularlo e indica el motivo, ENTONCES el registro queda anulado y deja de poder operar.
- ☐ DADO cualquiera de estas acciones, CUANDO termina correctamente, ENTONCES el resultado queda registrado en el historial.

**Flujo Principal**

1. Busca al proveedor en el listado.
2. Selecciona la acción que corresponda: anular, reactivar o dar de baja.
3. Indica el motivo y confirma la acción.
4. El sistema aplica el cambio y lo guarda en el historial.

**Flujos de Excepción**

- El motivo obligatorio no fue informado.
- Se intenta dar de baja un proveedor que no esta activo y vigente.
- Se intenta reactivar un registro anulado.
- El usuario no tiene permiso para administrar el estado del proveedor.

**Eventos del Dominio**

- Proveedor dado de baja.
- Proveedor reactivado.
- Proveedor anulado.

## Épica 3: Gestión de Personal

> **Objetivo:** Administrar el alta, modificación, aprobación, baja y anulación del personal, manteniendo sus datos personales básicos.

---

### HU-01-008 Como Analista de Recursos Humanos, quiero registrar personal, para mantener actualizado el maestro de personal de Hagemsa.

**Prioridad: Alta | Estimación: 8 puntos**

**Precondiciones**

- Usuario autenticado y con permiso para registrar personal.
- Datos personales y de contacto disponibles.

**Criterios de Aceptación**

- ☐ DADO el campo de documento, CUANDO el usuario lo llena, ENTONCES solo acepta un DNI de 8 digitos.
- ☐ DADO los nombres, CUANDO el usuario los llena, ENTONCES debe ingresar primer nombre, apellido paterno y apellido materno; el segundo nombre es opcional.
- ☐ DADO el campo de celular, CUANDO el usuario lo llena, ENTONCES solo acepta numeros y debe tener 9 digitos.
- ☐ DADO un DNI ya registrado como personal, CUANDO el usuario intenta registrarlo otra vez, ENTONCES el sistema avisa la duplicidad y no crea un registro repetido.
- ☐ DADO el formulario completo, CUANDO el usuario registra al personal, ENTONCES el personal queda Pendiente de aprobacion.
- ☐ DADO un personal Pendiente de aprobacion, CUANDO un usuario autorizado lo revisa, ENTONCES puede aprobarlo; si encuentra datos por corregir, los edita antes de aprobar.
- ☐ DADO un personal recien creado, CUANDO el usuario lo consulta, ENTONCES puede revisarlo y continuar su gestion segun su estado.
- ☐ DADO un personal Pendiente de aprobacion, CUANDO el usuario intenta continuar con su gestion laboral, ENTONCES primero debe aprobarlo.
- ☐ DADO un personal aprobado, activo y con registro activo, CUANDO el usuario continúa su gestión, ENTONCES puede administrar su asignación y su disponibilidad.

**Flujo Principal**

1. Entra al módulo de Socios de Negocio, abre Personal y selecciona Nuevo.
2. Elige el tipo Personal.
3. Completa el formulario con los datos del personal.
4. Registra al personal.
5. El sistema lo deja en estado Pendiente para su aprobación.
6. Un usuario autorizado lo revisa y aprueba; si hay datos por corregir, los edita antes de aprobar.

**Flujos de Excepción**

- El DNI no tiene 8 dígitos.
- El celular no tiene 9 dígitos.
- El DNI ya esta registrado como PERSONAL.
- Faltan datos obligatorios.
- El usuario no tiene permiso para registrar o aprobar personal.

**Eventos del Dominio**

- Personal registrado.
- Personal aprobado.

---

### HU-01-009 Como Analista de Recursos Humanos, quiero modificar los datos del personal, para mantener actualizada su información maestra.

**Prioridad: Alta | Estimación: 8 puntos**

**Precondiciones**

- Personal registrado.
- Usuario autenticado y con permiso para modificar personal.

**Criterios de Aceptación**

- ☐ DADO un personal registrado, CUANDO el usuario decide actualizar su informacion, ENTONCES puede editar los datos permitidos.
- ☐ DADO la actualizacion de datos, CUANDO el usuario cambia nombre completo, nombre para mostrar, direccion, contacto, correo o celular, ENTONCES puede guardar esos cambios.
- ☐ DADO la actualizacion de datos, CUANDO el usuario revisa el registro, ENTONCES el tipo y el DNI se mantienen sin cambios.
- ☐ DADO el campo de celular, CUANDO el usuario guarda, ENTONCES debe tener exactamente 9 digitos.
- ☐ DADO que necesita cambiar cargo, sede, area, horario, cuentas o contrato, CUANDO el usuario lo requiere, ENTONCES debe gestionarlo en la asignacion del personal.
- ☐ DADO un cambio válido, CUANDO el usuario guarda la actualización, ENTONCES la información personal se actualiza sin alterar su asignación ni su disponibilidad, y queda registrada en el historial.

**Flujo Principal**

1. Busca al personal en el listado.
2. Cambia los datos personales permitidos.
3. Guarda los cambios.

**Flujos de Excepción**

- Personal no encontrado.
- Datos obligatorios incompletos o inválidos.
- El celular no tiene 9 dígitos.
- El usuario necesita cambiar el DNI; la edicion actual no lo permite.
- El usuario intenta modificar una asignacion desde la edicion de datos personales.

**Eventos del Dominio**

- Personal actualizado.

---

### HU-01-010 Como Analista de Recursos Humanos, quiero dar de baja o anular al personal, para que deje de figurar como personal activo cuando corresponda.

**Prioridad: Alta | Estimación: 3 puntos**

**Precondiciones**

- Personal registrado.
- Usuario autenticado y con permiso para administrar el estado del personal.

**Criterios de Aceptación**

- ☐ DADO un personal activo y vigente, CUANDO el usuario solicita la baja e indica el motivo, ENTONCES el personal queda inactivo y su asignación vigente queda finalizada si corresponde.
- ☐ DADO un personal inactivo y no anulado, CUANDO el usuario solicita reactivarlo, ENTONCES el sistema genera un nuevo registro Pendiente relacionado con el anterior.
- ☐ DADO un registro creado por error, CUANDO el usuario solicita anularlo e indica el motivo, ENTONCES el personal queda anulado y su asignación vigente queda anulada.
- ☐ DADO que la baja o la anulacion afecta su asignacion, CUANDO termina, ENTONCES esos cambios quedan reflejados en el historial correspondiente.
- ☐ DADO un personal reactivado (reingreso), CUANDO se crea la asignacion de su registro nuevo, ENTONCES puede reutilizar la configuracion de su etapa anterior con "Usar esta configuracion" (ver HU-01-011); el registro nuevo nace sin asignacion y la reutilizacion copia los datos en una asignacion nueva.
- ☐ DADO cualquiera de estas acciones, CUANDO termina correctamente, ENTONCES el resultado queda registrado en el historial.

**Flujo Principal**

1. Busca al personal en el listado.
2. Selecciona la acción que corresponda: anular, reactivar o dar de baja.
3. Indica el motivo y confirma la acción.
4. El sistema aplica el cambio y lo guarda en el historial.

**Flujos de Excepción**

- El motivo obligatorio no fue informado.
- Se intenta dar de baja un personal que no esta activo y vigente.
- Se intenta reactivar un registro anulado.
- El usuario no tiene permiso para administrar el estado del personal.

**Eventos del Dominio**

- Personal dado de baja.
- Personal reactivado.
- Personal anulado.
- Asignación del personal finalizada o anulada, cuando corresponda por el cambio de estado del personal.

> **Nota de flujo (Personal → Asignación → Disponibilidad):** El personal se registra en estado Pendiente y luego se aprueba. Recién cuando está aprobado y activo se le crea su **asignación** (Épica 4): dónde trabaja, su horario y régimen, y sus cuentas y contratos. Las opciones de horario y régimen salen del **catálogo** (Épica 5). Sobre esa base se puede registrar su **disponibilidad esperada** (Épica 6). Cuando un personal es reactivado (reingreso), su registro nuevo nace sin asignación; al crear la asignación se puede reutilizar la configuración de su etapa anterior con "Usar esta configuración", que copia los datos en una asignación nueva (no reactiva la anterior). Los clientes y proveedores quedan completos con su registro y aprobación; no requieren estas gestiones.

## Épica 4: Asignación del Personal

> **Objetivo:** Administrar dónde trabaja el personal y a qué estructura pertenece: cargo, sede, área, responsable, horario y régimen de trabajo, cuentas y contratos, con su aprobación y fechas de validez.

> **Nota funcional:**

La asignación reúne, en un solo lugar, todo lo laboral del personal: el cargo, la sede y el área donde trabaja, su responsable, el horario y régimen que cumple, y las cuentas y contratos a los que pertenece. El registro del personal mantiene su identidad y datos personales; la asignación mantiene lo laboral, sus fechas de validez y su historial. Cada personal tiene una sola asignación vigente a la vez. Una cuenta puede llevar un contrato hijo; cuando se agrega un contrato, se valida la cuenta a la que pertenece para evitar relaciones incorrectas. Cada cuenta o contrato puede requerir una o más aprobaciones antes de considerarse operativo. Cuando un trabajador es reincorporado, su registro nuevo nace sin asignación; al crearla se puede reutilizar la configuración de su etapa anterior (cargo, sede, jefe, horario y cuentas/contratos) con un clic. Esto copia los datos en una asignación nueva —no reactiva la anterior— y las cuentas y contratos vuelven a pasar por aprobación.

---

### HU-01-011 Como Analista de Recursos Humanos, quiero crear la asignación de un personal, para definir dónde trabaja, su horario y régimen, y sus cuentas y contratos.

**Prioridad: Alta | Estimación: 8 puntos**

**Precondiciones**

- Personal registrado, aprobado, activo y con registro activo.
- Usuario autenticado y con permiso para administrar asignaciones del personal.
- Cargo, sede, área, cuentas y contratos disponibles para elegir.

**Criterios de Aceptación**

- ☐ DADO un personal aprobado, activo y sin asignacion vigente, CUANDO el usuario inicia su asignacion, ENTONCES puede registrar cargo, sede, area, responsable, horario y regimen, cuentas y contratos, y fechas de validez.
- ☐ DADO el responsable, CUANDO el usuario lo indica, ENTONCES puede escribir su nombre como dato de referencia.
- ☐ DADO el horario y regimen, CUANDO el usuario elige un tipo de horario, ENTONCES puede seleccionar una de sus configuraciones disponibles (turno, horario o programación de trabajo y descanso).
- ☐ DADO que el tipo de horario elegido aun no tiene configuraciones, CUANDO el usuario lo selecciona, ENTONCES el sistema lo informa y le indica donde crearlas.
- ☐ DADO una cuenta, CUANDO el usuario la agrega, ENTONCES puede asociar varias cuentas sin repetirlas y, si quiere, un contrato hijo de esa cuenta.
- ☐ DADO un contrato, CUANDO el usuario lo agrega, ENTONCES selecciona la cuenta relacionada y el sistema valida que el contrato pertenezca a esa cuenta.
- ☐ DADO las cuentas y contratos, CUANDO el usuario indica quién las aprueba, ENTONCES registra uno o más aprobadores en orden; cada cuenta o contrato queda Pendiente de aprobación hasta resolverse.
- ☐ DADO que el usuario no indica aprobadores, CUANDO crea la asignación con cuentas o contratos, ENTONCES el sistema deja el detalle pendiente pero informa que no hay firmas disponibles para decidir hasta completar los aprobadores.
- ☐ DADO las fechas de validez, CUANDO el usuario las registra, ENTONCES la fecha inicial es obligatoria y la fecha final, si existe, no puede ser anterior a la inicial.
- ☐ DADO un personal que ya tuvo una asignacion (incluido un reingreso con un registro anterior), CUANDO crea una nueva, ENTONCES puede reutilizar su ultima configuracion con la opcion "Usar esta configuracion", que precarga cargo, sede, jefe, horario, y sus cuentas y contratos para revisarlos y ajustarlos antes de guardar.
- ☐ DADO que reutiliza la configuracion anterior, CUANDO se crea la asignacion, ENTONCES se genera una asignacion nueva (no se reactiva la anterior) y sus cuentas y contratos vuelven a quedar Pendientes de aprobacion.
- ☐ DADO que el area depende de la sede, CUANDO reutiliza una configuracion previa, ENTONCES puede necesitar volver a elegir el area aunque el resto quede precargado.
- ☐ DADO un personal que ya tiene una asignacion vigente, CUANDO el usuario intenta crear otra, ENTONCES el sistema no lo permite e indica que debe actualizar la existente.

**Flujo Principal**

1. Busca al personal y entra a su gestión de asignación.
2. Si ya tuvo una asignación antes (o es un reingreso), puede usar "Usar esta configuración" para precargar todo y solo ajustar lo que cambie.
3. Completa o revisa dónde trabaja: cargo, sede, área y responsable.
4. Elige el horario y régimen de trabajo.
5. Agrega las cuentas y contratos, e indica quién las aprueba.
6. Registra las fechas de validez y crea la asignación.

**Flujos de Excepción**

- El registro seleccionado no es personal.
- El personal todavía no está aprobado, activo y con registro activo.
- El personal ya tiene una asignacion vigente.
- Faltan datos obligatorios.
- Falta la fecha inicial o la fecha de fin es anterior a la fecha de inicio.
- Se intenta repetir una cuenta o un contrato.
- Se intenta asociar un contrato a una cuenta a la que no pertenece.
- El usuario no tiene permiso para administrar asignaciones del personal.

**Eventos del Dominio**

- Asignación del personal creada.

---

### HU-01-012 Como Analista de Recursos Humanos, quiero modificar la asignación de un personal, para mantener correctos su cargo, ubicación, horario, cuentas y contratos.

**Prioridad: Alta | Estimación: 8 puntos**

**Precondiciones**

- Personal con una asignación registrada.
- Usuario autenticado y con permiso para administrar asignaciones del personal.

**Criterios de Aceptación**

- ☐ DADO una asignacion vigente, CUANDO el usuario decide actualizarla, ENTONCES puede revisar y cambiar cargo, sede, area, responsable, horario y regimen, cuentas y contratos, y fechas de validez.
- ☐ DADO que quiere cambiar el area, CUANDO edita los datos, ENTONCES tambien debe elegir la sede.
- ☐ DADO que quiere cambiar el horario, CUANDO elige otro tipo de horario, ENTONCES puede seleccionar una nueva configuracion disponible para ese tipo.
- ☐ DADO las cuentas y contratos, CUANDO el usuario los reemplaza, ENTONCES la relación anterior deja de estar vigente pero queda visible en el historial.
- ☐ DADO que reemplaza cuentas y contratos, CUANDO guarda el cambio, ENTONCES puede indicar nuevamente quiénes aprueban y en qué orden.
- ☐ DADO que quiere dejar la asignacion sin cuentas ni contratos, CUANDO retira toda la relacion, ENTONCES el sistema solicita confirmacion explicita antes de aplicar el cambio.
- ☐ DADO un cambio valido, CUANDO el usuario guarda la actualizacion, ENTONCES el sistema actualiza la asignacion y conserva lo anterior en el historial.

**Flujo Principal**

1. Entra a la asignación del personal.
2. Ajusta los datos necesarios (ubicación, horario, cuentas y contratos).
3. Confirma la acción si retira las cuentas y contratos.
4. Guarda los cambios.

**Flujos de Excepción**

- Se intenta repetir una cuenta o un contrato.
- Se intenta asociar un contrato a una cuenta a la que no pertenece.
- Se intenta eliminar toda la relacion de cuentas y contratos sin confirmar la accion.
- No fue posible cargar la informacion necesaria.
- El usuario no tiene permiso para modificar asignaciones del personal.

**Eventos del Dominio**

- Asignación del personal actualizada.
- Cuentas y contratos reemplazados, cuando corresponda.

---

### HU-01-013 Como Administrador Principal, quiero aprobar o rechazar las cuentas y contratos de una asignación, para que queden operativos solo cuando estén autorizados.

**Prioridad: Alta | Estimación: 5 puntos**

**Precondiciones**

- Asignación con cuentas o contratos Pendientes de aprobación.
- Usuario autenticado y con permiso para aprobar cuentas y contratos.

**Criterios de Aceptación**

- ☐ DADO una cuenta o contrato Pendiente, CUANDO el usuario lo revisa, ENTONCES ve quiénes deben aprobarlo y en qué orden.
- ☐ DADO varios aprobadores en orden, CUANDO un aprobador decide, ENTONCES solo puede decidir el aprobador que sigue en el turno; no se puede saltar el orden.
- ☐ DADO una aprobación, CUANDO el aprobador la confirma, ENTONCES puede dejar un comentario; si ya no quedan aprobadores obligatorios pendientes, la cuenta o contrato queda Aprobado.
- ☐ DADO un rechazo, CUANDO el aprobador lo confirma, ENTONCES debe indicar el motivo y la cuenta o contrato queda Rechazado.
- ☐ DADO una cuenta o contrato ya Aprobado o Rechazado, CUANDO el usuario intenta decidir de nuevo, ENTONCES el sistema no lo permite.

**Flujo Principal**

1. Entra a la asignación del personal y ubica la cuenta o contrato pendiente.
2. Revisa los aprobadores y el orden.
3. Aprueba o rechaza indicando comentario o motivo según corresponda.
4. El sistema actualiza el estado y lo guarda en el historial.

**Flujos de Excepción**

- Se intenta decidir fuera de turno.
- Se intenta decidir una cuenta o contrato ya resuelto.
- Falta el motivo obligatorio al rechazar.
- El usuario no tiene permiso para aprobar cuentas y contratos.

**Eventos del Dominio**

- Cuenta o contrato aprobado.
- Cuenta o contrato rechazado.

---

### HU-01-014 Como Analista de Recursos Humanos, quiero consultar la asignación y su historial, para conocer la situación laboral vigente del personal y sus cambios.

**Prioridad: Media | Estimación: 5 puntos**

**Precondiciones**

- Personal registrado.
- Usuario autenticado con permiso para consultar asignaciones del personal.

**Criterios de Aceptación**

- ☐ DADO un personal registrado, CUANDO el usuario consulta su asignación, ENTONCES ve cargo, sede, área, responsable, horario y régimen, cuentas y contratos, estado y fechas de validez.
- ☐ DADO cuentas y contratos vigentes, CUANDO el usuario los revisa, ENTONCES identifica claramente cuáles están aprobados y cuáles pendientes.
- ☐ DADO una asignación con cambios, CUANDO el usuario consulta el historial, ENTONCES ve los movimientos con sus valores anteriores.
- ☐ DADO un personal dado de baja o anulado, CUANDO el usuario consulta su asignación, ENTONCES la ve como finalizada o anulada según lo aplicado al personal.
- ☐ DADO el listado de personal, CUANDO aparece un personal, ENTONCES se muestra su estado de aprobación y, si no tiene asignación vigente, se informa claramente.

**Flujo Principal**

1. Ubica al personal y entra a su asignación.
2. Revisa la asignación vigente.
3. Consulta el historial si necesita ver cambios anteriores.

**Flujos de Excepción**

- El personal no tiene asignación registrada.
- No fue posible cargar la asignación o el historial.
- El usuario no tiene permiso para consultar asignaciones del personal.

**Eventos del Dominio**

- No registra cambios de estado; es una historia de consulta e historial.

## Épica 5: Catálogo de Horarios y Regímenes de Trabajo

> **Objetivo:** Administrar las opciones de horario y régimen que luego se eligen al asignar a un personal.

> **Nota funcional:**

Este catálogo define, de forma reutilizable, cómo puede trabajar el personal. Tiene dos niveles simples: primero el **tipo de horario o tareo** (por turno, por horario o por régimen de trabajo y descanso) y luego sus **configuraciones laborales**, con el detalle correspondiente (por ejemplo, el turno, el horario de entrada y salida, o un patrón como 14x7, además de feriados, trabajo nocturno, horas extra y vigencia). Estas opciones se crean una sola vez y se eligen al armar la asignación de cada personal.

---

### HU-01-015 Como Analista de Recursos Humanos, quiero administrar los tipos de horario, para tener disponibles las formas de trabajo que usará el personal.

**Prioridad: Media | Estimación: 5 puntos**

**Precondiciones**

- Usuario autenticado y con permiso para administrar el catálogo de horarios.

**Criterios de Aceptación**

- ☐ DADO un tipo de horario o tareo, CUANDO el usuario lo crea, ENTONCES indica un código, un nombre y la forma de trabajo (por turno, por horario o por régimen).
- ☐ DADO un tipo de horario o tareo creado, CUANDO el usuario lo edita, ENTONCES puede cambiar su nombre, descripción y forma de trabajo; el código no cambia.
- ☐ DADO un tipo de horario, CUANDO el usuario lo activa o inactiva, ENTONCES queda disponible o deja de estar disponible para nuevas asignaciones.
- ☐ DADO un tipo de horario con configuraciones activas, CUANDO el usuario intenta inactivarlo, ENTONCES el sistema no lo permite y lo informa.
- ☐ DADO el catálogo de horarios, CUANDO el usuario lo consulta, ENTONCES puede trabajar en la pestaña de tipos de tareo o en la pestaña de configuraciones laborales.

**Flujo Principal**

1. Entra al catálogo de horarios y regímenes.
2. Abre la pestaña de tipos de tareo.
3. Crea o edita un tipo de horario o tareo.
4. Activa o inactiva según corresponda.

**Flujos de Excepción**

- El código ya existe.
- Faltan datos obligatorios.
- Se intenta inactivar un tipo con configuraciones activas.
- El usuario no tiene permiso para administrar el catálogo.

**Eventos del Dominio**

- Tipo de horario creado, actualizado, activado o inactivado.

---

### HU-01-016 Como Analista de Recursos Humanos, quiero administrar las configuraciones de un tipo de horario, para definir el detalle de turno, horario o régimen que usará el personal.

**Prioridad: Media | Estimación: 5 puntos**

**Precondiciones**

- Existe al menos un tipo de horario activo.
- Usuario autenticado y con permiso para administrar el catálogo de horarios.

**Criterios de Aceptación**

- ☐ DADO un tipo de horario o tareo activo, CUANDO el usuario crea una configuración laboral, ENTONCES indica el detalle según su forma: el turno, el horario de entrada y salida, o el patrón de trabajo y descanso (por ejemplo 14x7) con sus días.
- ☐ DADO que no existe un tipo de horario o tareo activo, CUANDO el usuario intenta crear una configuración laboral, ENTONCES el sistema le indica que primero debe crear o activar un tipo.
- ☐ DADO una configuración, CUANDO el usuario la completa, ENTONCES puede indicar feriados, trabajo nocturno, horas extra y fechas de validez.
- ☐ DADO una configuración por horario, CUANDO el usuario la guarda, ENTONCES la hora de inicio y fin deben ser válidas.
- ☐ DADO una configuración por régimen, CUANDO el usuario la guarda, ENTONCES el patrón debe coincidir con los días de trabajo y descanso indicados.
- ☐ DADO una configuración laboral creada, CUANDO el usuario la activa o inactiva, ENTONCES queda disponible o deja de estarlo para nuevas asignaciones.

**Flujo Principal**

1. Entra al catálogo y abre la pestaña de configuraciones laborales.
2. Elige un tipo de horario o tareo activo.
3. Crea o edita una configuración laboral con su detalle.
4. Activa o inactiva según corresponda.

**Flujos de Excepción**

- El tipo de horario no está activo.
- No existe ningún tipo de horario o tareo activo para crear la configuración laboral.
- El código de la configuración ya existe.
- El detalle no corresponde a la forma del tipo (turno, horario o régimen).
- Las fechas de validez son inválidas.
- El usuario no tiene permiso para administrar el catálogo.

**Eventos del Dominio**

- Configuración laboral creada, actualizada, activada o inactivada.

---

### HU-01-017 Como Analista de Recursos Humanos, quiero consultar el catálogo de horarios y regímenes, para conocer las opciones disponibles al asignar al personal.

**Prioridad: Baja | Estimación: 3 puntos**

**Precondiciones**

- Usuario autenticado con permiso para consultar el catálogo de horarios.

**Criterios de Aceptación**

- ☐ DADO el catálogo, CUANDO el usuario lo consulta, ENTONCES ve los tipos de horario o tareo y sus configuraciones laborales con su estado.
- ☐ DADO un filtro por tipo o estado, CUANDO el usuario lo aplica, ENTONCES la lista muestra solo las opciones que coinciden.
- ☐ DADO una configuración, CUANDO el usuario la revisa, ENTONCES ve su detalle (turno, horario o régimen, días y horas).

**Flujo Principal**

1. Entra al catálogo de horarios.
2. Filtra por tipo o estado si lo necesita.
3. Revisa el detalle de las configuraciones.

**Flujos de Excepción**

- No existen opciones para el filtro aplicado.
- No fue posible cargar el catálogo.
- El usuario no tiene permiso para consultar el catálogo.

**Eventos del Dominio**

- No registra cambios de estado; es una historia de consulta.

## Épica 6: Disponibilidad del Personal

> **Objetivo:** Registrar los periodos esperados del personal (vacaciones, permiso, licencia, descanso, etc.) como información de referencia.

> **Nota funcional:**

La disponibilidad indica, de forma informativa, en qué periodos se espera que un personal esté disponible o no, por ejemplo durante sus vacaciones o un permiso previsto. No es asistencia real ni reemplaza ningún control de marcaciones: solo deja anotado lo previsto. Cada disponibilidad se asocia a un personal y a su asignación, y toma como referencia el horario y régimen vigente de esa asignación.

---

### HU-01-018 Como Analista de Recursos Humanos, quiero registrar la disponibilidad esperada de un personal, para dejar anotado periodos como vacaciones, permisos o descansos.

**Prioridad: Media | Estimación: 5 puntos**

**Precondiciones**

- Personal con una asignación registrada.
- Usuario autenticado y con permiso para administrar disponibilidad del personal.

**Criterios de Aceptación**

- ☐ DADO un personal con asignación, CUANDO el usuario registra una disponibilidad, ENTONCES indica el estado (por ejemplo vacaciones, permiso o descanso), el motivo y las fechas de validez.
- ☐ DADO una disponibilidad, CUANDO el usuario la completa, ENTONCES puede agregar una observación y el origen (por ejemplo, manual).
- ☐ DADO las fechas, CUANDO el usuario las registra, ENTONCES la fecha final no puede ser anterior a la inicial; sin fecha final se entiende como indefinida.
- ☐ DADO un personal sin asignación vigente, CUANDO el usuario intenta registrar disponibilidad, ENTONCES el sistema informa que primero necesita una asignación vigente.
- ☐ DADO una disponibilidad registrada, CUANDO el usuario la consulta, ENTONCES ve el horario y régimen de referencia que toma de la asignación.

**Flujo Principal**

1. Ubica al personal y entra a su disponibilidad.
2. Revisa que tenga una asignación vigente.
3. Elige el estado, el origen, el motivo y las fechas.
4. Registra la disponibilidad.

**Flujos de Excepción**

- El personal no tiene una asignación vigente.
- Faltan datos obligatorios (estado o motivo).
- La fecha final es anterior a la inicial.
- El usuario no tiene permiso para administrar disponibilidad del personal.

**Eventos del Dominio**

- Disponibilidad del personal registrada.

---

### HU-01-019 Como Analista de Recursos Humanos, quiero modificar o anular una disponibilidad, para corregirla o retirarla cuando ya no corresponda.

**Prioridad: Media | Estimación: 3 puntos**

**Precondiciones**

- Disponibilidad registrada.
- Usuario autenticado y con permiso para administrar disponibilidad del personal.

**Criterios de Aceptación**

- ☐ DADO una disponibilidad registrada, CUANDO el usuario la modifica, ENTONCES puede cambiar el estado, el motivo, la observación y las fechas de validez.
- ☐ DADO una disponibilidad que ya no corresponde, CUANDO el usuario la anula, ENTONCES queda anulada y deja de considerarse vigente.
- ☐ DADO cualquiera de estas acciones, CUANDO termina correctamente, ENTONCES el cambio queda registrado.

**Flujo Principal**

1. Ubica la disponibilidad del personal.
2. Modifica los datos necesarios o la anula.
3. Guarda el cambio.

**Flujos de Excepción**

- La disponibilidad ya está anulada.
- La fecha final es anterior a la inicial.
- El usuario no tiene permiso para administrar disponibilidad del personal.

**Eventos del Dominio**

- Disponibilidad del personal actualizada o anulada.

---

### HU-01-020 Como Analista de Recursos Humanos, quiero consultar la disponibilidad del personal, para conocer los periodos previstos de cada persona.

**Prioridad: Baja | Estimación: 3 puntos**

**Precondiciones**

- Usuario autenticado con permiso para consultar disponibilidad del personal.

**Criterios de Aceptación**

- ☐ DADO un personal, CUANDO el usuario consulta su disponibilidad desde su registro, ENTONCES ve sus periodos con estado, origen, motivo y fechas.
- ☐ DADO un personal con disponibilidad vigente, CUANDO el usuario revisa su detalle, ENTONCES puede identificar los periodos previstos asociados a su asignación.
- ☐ DADO una disponibilidad anulada, CUANDO el usuario revisa la disponibilidad del personal, ENTONCES puede identificarla como anulada y diferenciarla de las vigentes.

**Flujo Principal**

1. Ubica al personal.
2. Entra a su disponibilidad.
3. Revisa los periodos registrados.

**Flujos de Excepción**

- No existen registros para el personal consultado.
- El personal consultado no tiene disponibilidad registrada.
- No fue posible cargar la información.
- El usuario no tiene permiso para consultar disponibilidad del personal.

**Eventos del Dominio**

- No registra cambios de estado; es una historia de consulta.

## Épica 7: Reportes y Consultas

> **Objetivo:** Permitir consultar, filtrar, auditar y exportar información de clientes, proveedores y personal.

---

### HU-01-021 Como Analista de Recursos Humanos, quiero consultar el personal por datos y estado laboral, para obtener una visión actualizada de su situación.

**Prioridad: Media | Estimación: 5 puntos**

**Precondiciones**

- Usuario autenticado con permiso para consultar personal.
- Existen registros de PERSONAL en el Listado de Socios de Negocio.

**Criterios de Aceptación**

- ☐ DADO que el usuario necesita consultar personal, CUANDO filtra por tipo PERSONAL o busca por nombre o DNI, ENTONCES el listado muestra los registros coincidentes.
- ☐ DADO un personal listado, CUANDO se muestra el resultado, ENTONCES se visualizan su estado, registro, aprobación y su asignación vigente.
- ☐ DADO el listado de personal, CUANDO el usuario filtra por cuenta o contrato, ENTONCES el listado muestra el personal que coincide con esa situación laboral.
- ☐ DADO un personal sin asignación vigente, CUANDO aparece en el listado, ENTONCES el sistema lo informa claramente.
- ☐ DADO un personal encontrado, CUANDO el usuario lo consulta, ENTONCES accede a toda su información disponible.
- ☐ DADO un personal aprobado, activo y con registro activo, CUANDO el usuario continúa su gestión, ENTONCES puede consultar su asignación y su disponibilidad según sus permisos.

**Flujo Principal**

1. Entra al panel de Socios de Negocio y abre Personal.
2. Busca o filtra al personal por datos o situación laboral.
3. Revisa sus datos, estado y asignación vigente.
4. Consulta su información o continúa con su gestión laboral.

**Flujos de Excepción**

- No existen registros para el filtro aplicado.
- El personal no tiene asignación vigente.
- El personal no está aprobado, activo y con registro activo; no puede continuar su gestión laboral.
- No fue posible cargar el listado.
- El usuario no tiene permiso para consultar personal.

**Eventos del Dominio**

- No registra cambios de estado; es una historia de consulta.

---

### HU-01-022 Como Analista de Recursos Humanos, quiero consultar clientes, proveedores y personal por tipo, estado e historial, para identificar registros activos, inactivos, anulados o pendientes de aprobación.

**Prioridad: Media | Estimación: 5 puntos**

**Precondiciones**

- Usuario autenticado con permiso para consultar clientes, proveedores, personal e historial.
- Existen clientes, proveedores o personal registrados.

**Criterios de Aceptación**

- ☐ DADO que el usuario ingresa al listado sin filtro de registro, CUANDO carga la consulta normal, ENTONCES se muestran solo los registros vigentes.
- ☐ DADO que el usuario ingresa al panel de Socios de Negocio, CUANDO carga el resumen, ENTONCES ve indicadores generales de clientes, proveedores, personal, activos, inactivos y anulados.
- ☐ DADO que el usuario ingresa a Clientes, Proveedores o Personal, CUANDO carga el listado, ENTONCES ve la información separada por tipo de socio.
- ☐ DADO que el usuario filtra por registros anulados, CUANDO aplica el filtro, ENTONCES se muestran solo los registros anulados.
- ☐ DADO un cliente o proveedor con información SAP, CUANDO aparece en el listado o detalle, ENTONCES se muestra su código SAP y su estado de sincronización cuando corresponda.
- ☐ DADO un registro listado, CUANDO el usuario lo consulta, ENTONCES puede acceder a las acciones permitidas por su estado; si el registro está anulado, solo dispone de acciones de consulta e historial.
- ☐ DADO un registro listado, CUANDO el sistema muestra su estado, ENTONCES también orienta la siguiente acción esperada, como aprobar, reactivar, gestionar asignación o consultar.
- ☐ DADO un registro consultado, CUANDO el usuario revisa su información, ENTONCES puede ver toda la información disponible y ejecutar las acciones permitidas.
- ☐ DADO que el usuario decide actualizar datos, CUANDO inicia la edición, ENTONCES puede modificar solo los campos permitidos.
- ☐ DADO que el usuario consulta el historial, CUANDO lo revisa, ENTONCES visualiza fecha, acción, usuario y cambios principales.
- ☐ DADO filtros aplicados, CUANDO el usuario selecciona Limpiar, ENTONCES el listado vuelve a mostrar los registros vigentes.

**Flujo Principal**

1. Entra al panel de Socios de Negocio.
2. Abre el listado general o el listado separado de clientes, proveedores o personal.
3. Busca o filtra los registros.
4. Revisa los resultados y sus estados.
5. Consulta, actualiza o revisa el historial según corresponda.

**Flujos de Excepción**

- No existen registros para los filtros aplicados.
- El usuario necesita revisar vigentes y anulados; debe consultarlos por separado según el filtro aplicado.
- Una acción no está disponible para el estado actual del registro.
- La asignación no aplica para clientes o proveedores.
- La información SAP no aplica para personal.
- No fue posible cargar el listado o historial.

**Eventos del Dominio**

- No registra cambios de estado; es una historia de consulta e historial.

---

### HU-01-023 Como Auditor, quiero exportar información, para compartir reportes en Excel o PDF según mi alcance autorizado.

**Prioridad: Media | Estimación: 5 puntos**

**Precondiciones**

- Usuario autenticado con permiso para consultar y exportar reportes de clientes, proveedores y personal.
- Información del módulo y filtros de consulta disponibles.

**Criterios de Aceptación**

- ☐ DADO que el usuario aplica filtros sobre clientes, proveedores o personal, CUANDO exporta desde el listado consultado, ENTONCES el archivo contiene solo el resultado filtrado y autorizado.
- ☐ DADO que no se aplican filtros, CUANDO exporta desde el listado consultado, ENTONCES el archivo contiene el conjunto vigente permitido para ese tipo de socio o consulta.
- ☐ DADO que el usuario selecciona Excel, CUANDO finaliza la generación, ENTONCES el sistema descarga el archivo en ese formato.
- ☐ DADO que el usuario selecciona PDF, CUANDO finaliza la generación, ENTONCES el sistema descarga el archivo en ese formato.
- ☐ DADO que ocurre un error, CUANDO no se puede generar el archivo, ENTONCES el sistema informa el problema al usuario.

**Flujo Principal**

1. Entra al listado que desea reportar.
2. Aplica filtros si corresponde.
3. Selecciona el formato de exportación.
4. Descarga el archivo generado.

**Flujos de Excepción**

- No existen registros para los filtros aplicados.
- No fue posible generar o descargar el archivo.
- El usuario no tiene permiso para exportar reportes.

**Eventos del Dominio**

- No registra cambios de estado; la exportación corresponde a una salida de reporte.

## Información maestra del Socio de Negocio

Aplica para CLIENTE, PROVEEDOR y PERSONAL:

| Campo | Cliente | Proveedor | Personal | Observación |
| --- | --- | --- | --- | --- |
| Código interno / Código SAP | Sí | Sí | No | Aplica a CLIENTE y PROVEEDOR como identificador interno. No se modifica por edición normal. El PERSONAL no tiene este dato. |
| Tipo de registro | Sí | Sí | Sí | Puede ser CLIENTE, PROVEEDOR o PERSONAL. |
| Documento / RUC / DNI | Sí | Sí | Sí | No se modifica por edición normal. |
| Razón social o nombres | Sí | Sí | Sí | Para empresas se usa razón social; para personas, nombres. |
| Nombre comercial | Sí | Sí | Sí | Aplica si corresponde. |
| Dirección | Sí | Sí | Sí | Dirección principal registrada. |
| Contacto | Sí | Sí | Sí | Persona o referencia de contacto. |
| Estado | Sí | Sí | Sí | Disponible (Activo) o dado de baja (Inactivo). Además, el registro puede estar vigente o anulado. |
| Correo | Sí | Sí | Sí | Correo principal del registro. |
| Nro. de celular | Sí | Sí | Sí | Número de contacto. |
| Cargo, Sede, Área | No | No | Por asignación | No es dato maestro; se define en la asignación del personal. |
| Responsable | No | No | Por asignación | Nombre de referencia que se indica en la asignación. |
| Horario y régimen de trabajo | No | No | Por asignación | Se elige en la asignación a partir del catálogo de horarios (turno, horario o programación de trabajo y descanso, por ejemplo 14x7). |
| Cuentas | No | No | Varias por asignación | Se relacionan dentro de la asignación, con su aprobación y sus fechas de validez. |
| Contratos | No | No | Por asignación | Se relacionan dentro de la asignación y se validan contra la cuenta correspondiente. Incluyen su aprobación. |
| Disponibilidad esperada | No | No | Varias por personal | Periodos previstos como vacaciones, permisos o descansos. Es información de referencia; no es asistencia real. |
