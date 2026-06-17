# Piloto Detallado: BC-01 Socio de Negocio

Este BC administra las personas y organizaciones que interactúan con la empresa como clientes, proveedores y personal. Actúa como la fuente oficial de información maestra de Socios de Negocio, permitiendo registrar, modificar, dar de baja, consultar y exportar información maestra.

| Campo | Detalle |
| --- | --- |
| Área | Recursos Humanos |
| Roles | **Administrador Principal**, **Analista de Recursos Humanos** y **Auditor**. |
| Relación clave | Un Socio de Negocio se identifica por la combinación de documento/RUC/DNI + tipo de socio. Un mismo documento puede estar asociado a más de un Socio de Negocio cuando cumple roles diferentes dentro de la empresa, por ejemplo, CLIENTE, PROVEEDOR o PERSONAL. Cada registro mantiene el tipo de socio, si está disponible para operar o fue dado de baja, si el registro sigue vigente o fue anulado, y si está pendiente de aprobación, aprobado o rechazado. |
| Alcance funcional | Registrar, modificar, dar de baja, consultar y exportar socios de negocio. |
| Eventos de salida funcionales esperados | ClienteRegistrado, ClienteModificado, ClienteDadoDeBaja, ClienteAnulado; ProveedorRegistrado, ProveedorModificado, ProveedorDadoDeBaja, ProveedorAnulado; PersonalRegistrado, PersonalModificado, PersonalDadoDeBaja, PersonalAnulado. |
| Regla de edición | La edición normal permite actualizar razón social, nombre comercial, dirección, contacto, correo, celular y, cuando aplica, nombres/apellidos. No permite cambiar documento ni código interno SAP. |


## Resumen de Épicas — BC-01

| # | Épica | Objetivo de negocio | Historias |
| --- | --- | --- | --- |
| 1 | Gestión de Clientes | Administrar el alta, validación SAP, aprobación, modificación, baja y anulación de clientes como socios de negocio. | 4 |
| 2 | Gestión de Proveedores | Administrar el alta, validación SAP, aprobación, modificación, baja y anulación de proveedores como socios de negocio. | 3 |
| 3 | Gestión de Personal | Administrar el alta, aprobación, modificación, baja y anulación del personal como socio local, manteniendo datos personales básicos. | 3 |
| 4 | Gestión de Asignaciones Operativas de Personal | Administrar cargo, sede, área, aprobación, vigencia y múltiples cuentas o contratos del personal. | 4 |
| 5 | Reportes y Consultas de Socios de Negocio | Permitir consultar, filtrar, auditar y exportar información de clientes, proveedores, personal y asignaciones. | 3 |

> **Nota sobre alcance:** En el resumen, los objetivos de las épicas 1 y 2 mencionan *validación SAP* y *aprobación*, pero esas capacidades no tienen una HU propia: la *validación SAP* se realiza dentro de las HU de registro con la acción **Consultar SAP** (HU-01-001 para cliente y HU-01-005 para proveedor), y la *aprobación o rechazo* del cliente se cubre en HU-01-002. Para proveedor y personal, la aprobación o rechazo se ejecuta desde la pantalla de detalle del socio (la de personal está incluida en HU-01-008).

## Épica 1: Gestión de Clientes

> **Objetivo:** Administrar el alta, modificación, aprobación, baja y anulación de clientes como Socios de Negocio, manteniendo actualizada su información maestra.

> **Nota funcional:** 

El registro de clientes se realiza con informacion maestra validada. Para CLIENTE, el usuario consulta SAP por documento antes de continuar con el registro manual. BC-01 no administra leads, seguimiento comercial, oportunidades ni estados comerciales; solo mantiene la pantalla de detalle del Socio de Negocio cuando corresponde. En este documento, "pantalla de detalle" se refiere a la vista del socio que se abre automaticamente despues del alta o con la accion Ver desde el Listado de Socios de Negocio.

---

### HU-01-001 Como Analista de Recursos Humanos, quiero registrar un cliente, para mantener su información maestra disponible como Socio de Negocio.

**Prioridad: Alta | Estimación: 5 SP**

**Precondiciones**

- Usuario autenticado y con permiso para registrar socios de negocio.
- Información principal y de contacto del cliente disponible.

**Criterios de Aceptación**

- ☐ DADO el campo de documento, CUANDO el usuario lo llena, ENTONCES solo acepta numeros: un DNI de 8 digitos o un RUC de 11 digitos.
- ☐ DADO un documento valido, CUANDO el usuario usa Consultar SAP, ENTONCES si SAP lo encuentra el sistema abre el detalle de ese socio, y si no, avisa que no existe en SAP y deja seguir el registro manual.
- ☐ DADO el campo de celular, CUANDO el usuario lo llena, ENTONCES solo acepta numeros y debe tener 9 digitos.
- ☐ DADO un documento ya registrado como cliente, CUANDO el usuario intenta registrarlo otra vez, ENTONCES el sistema avisa la duplicidad y no crea un registro repetido.
- ☐ DADO el formulario completo, CUANDO el usuario selecciona Agregar cliente, ENTONCES el cliente queda Pendiente de aprobacion y el sistema abre su pantalla de detalle.
- ☐ DADO el detalle del cliente recien creado, CUANDO el usuario lo revisa, ENTONCES puede aprobarlo, rechazarlo, editarlo o auditarlo segun su estado.

**Flujo Principal**

1. Entra a Socio de Negocio y selecciona Nuevo.
2. Elige el tipo Cliente.
3. Ingresa el RUC o DNI; si lo desea, usa Consultar SAP.
4. Completa razon social, nombre comercial y datos de contacto.
5. Selecciona Agregar cliente.
6. El sistema abre el detalle del cliente, ya en estado Pendiente.
7. Un usuario autorizado lo aprueba o rechaza desde el detalle.

**Flujos de Excepción**

- El DNI no tiene 8 dígitos o el RUC no tiene 11 dígitos.
- El celular no tiene 9 dígitos.
- El documento ya está registrado como CLIENTE (el sistema muestra el dialogo "No se pudo registrar").
- Faltan datos obligatorios.
- La consulta SAP no encuentra información; el usuario continua con el registro manual.

**Eventos de Dominio**

- ClienteRegistrado
- SocioAprobado
- SocioRechazado

---

### HU-01-002 Como Administrador Principal, quiero revisar y aprobar o rechazar la información de cliente recibida desde Comercial, para formalizar su información maestra como Socio de Negocio tipo CLIENTE.

**Prioridad: Alta | Estimación: 8 SP**

**Precondiciones**

- Existe un cliente recibido desde Comercial y visible en el Listado de Socios de Negocio con origen COMERCIAL.
- Usuario autenticado y con permiso para revisar y aprobar socios.

**Criterios de Aceptación**

- ☐ DADO un cliente recibido desde Comercial, CUANDO aparece en el listado, ENTONCES se muestra con origen COMERCIAL y su estado de aprobacion (Pendiente, Aprobado o No aprobado).
- ☐ DADO un cliente del listado, CUANDO el usuario selecciona Ver, ENTONCES se abre su detalle completo para revisarlo.
- ☐ DADO que hay datos por corregir, CUANDO el usuario selecciona Editar datos, ENTONCES el detalle pasa a modo edicion y puede actualizar los campos permitidos.
- ☐ DADO un cliente activo, vigente y Pendiente, CUANDO el usuario selecciona Aprobar, ENTONCES su estado cambia a Aprobado de inmediato.
- ☐ DADO un cliente activo, vigente y Pendiente, CUANDO el usuario selecciona Rechazar, ENTONCES el sistema pide un motivo y el rechazo queda visible en el detalle y en el historial.
- ☐ DADO un cliente anulado o inactivo, CUANDO se muestra su detalle, ENTONCES no aparecen acciones de aprobar ni rechazar.

**Flujo Principal**

1. Entra al listado y filtra por origen COMERCIAL (o busca al cliente).
2. Selecciona Ver y revisa la informacion recibida.
3. Si hace falta, usa Editar datos y corrige.
4. Selecciona Aprobar, o Rechazar indicando el motivo.
5. El sistema muestra el resultado y lo guarda en el historial.

**Flujos de Excepción**

- El cliente recibido tiene información obligatoria incompleta.
- Ya existe otro CLIENTE con el mismo documento.
- El usuario intenta rechazar sin indicar un motivo.
- El usuario no tiene permiso para aprobar o rechazar.

**Eventos de Dominio**

- ClienteRegistrado
- SocioAprobado
- SocioRechazado

---

### HU-01-003 Como Analista de Recursos Humanos, quiero modificar los datos de un cliente, para mantener actualizada su información maestra.

**Prioridad: Alta | Estimación: 5 SP**

**Precondiciones**

- Cliente registrado.
- Usuario autenticado y con permiso para modificar socios.

**Criterios de Aceptación**

- ☐ DADO un cliente registrado, CUANDO el usuario selecciona Editar datos, ENTONCES el detalle pasa a modo edicion en la misma pantalla.
- ☐ DADO el modo edicion, CUANDO el usuario cambia razon social, nombre comercial, direccion, contacto, correo o celular, ENTONCES puede guardar esos cambios.
- ☐ DADO el modo edicion, CUANDO el usuario ve tipo, documento y codigo SAP, ENTONCES esos datos aparecen bloqueados y no se pueden cambiar.
- ☐ DADO el campo de celular, CUANDO el usuario guarda, ENTONCES debe tener exactamente 9 digitos.
- ☐ DADO un cambio valido, CUANDO el usuario selecciona Guardar cambios, ENTONCES el detalle se actualiza y el cambio queda registrado en Auditar.
- ☐ DADO un registro anulado, CUANDO el usuario abre el detalle, ENTONCES la edicion no esta disponible.

**Flujo Principal**

1. Busca al cliente en el listado y selecciona Editar datos (o Ver y luego Editar datos).
2. Cambia los datos permitidos en el detalle.
3. Selecciona Guardar cambios.
4. El sistema muestra el detalle actualizado.

**Flujos de Excepción**

- Cliente no encontrado.
- Datos obligatorios incompletos o inválidos.
- El celular no tiene 9 dígitos.
- El usuario necesita cambiar el documento o codigo SAP; la edicion actual no lo permite.
- El usuario no tiene permiso de modificación.

**Eventos de Dominio**

- ClienteModificado

---

### HU-01-004 Como Analista de Recursos Humanos, quiero dar de baja o anular a un cliente, para que deje de estar disponible como socio activo cuando corresponda.

**Prioridad: Alta | Estimación: 3 SP**

**Precondiciones**

- Cliente registrado.
- Usuario autenticado y con permiso para administrar el estado del socio.

**Criterios de Aceptación**

- ☐ DADO un cliente aprobado y activo, CUANDO el usuario selecciona Dar de baja e indica el motivo, ENTONCES el cliente queda inactivo; si no esta aprobado y activo, el boton Dar de baja aparece deshabilitado.
- ☐ DADO un cliente inactivo (no anulado), CUANDO el usuario selecciona Reactivar, ENTONCES el sistema crea un nuevo registro Pendiente ligado al anterior. Reactivar esta disponible en el detalle y en el listado.
- ☐ DADO un registro creado por error, CUANDO el usuario selecciona Anular desde el listado e indica el motivo, ENTONCES el registro queda anulado y deja de poder operar.
- ☐ DADO cualquiera de estas acciones, CUANDO termina bien, ENTONCES el resultado se ve en el detalle o el listado y queda registrado en Auditar.

**Flujo Principal**

1. Busca al cliente en el listado.
2. Para Anular o Reactivar, usalos directamente desde las acciones de la fila y confirma.
3. Para Dar de baja, abre Ver y ejecuta la accion desde el detalle.
4. Indica el motivo o los datos que pide el sistema y confirma.
5. El sistema aplica el cambio y conserva el movimiento en el historial.

**Flujos de Excepción**

- El motivo obligatorio no fue informado.
- Se intenta dar de baja un socio que no esta aprobado, activo y vigente (el boton aparece deshabilitado).
- Se intenta reactivar un registro anulado.
- El usuario no tiene permiso para realizar la acción.

**Eventos de Dominio**

- ClienteDadoDeBaja
- ClienteAnulado
- SocioReactivado

## Épica 2: Gestión de Proveedores

> **Objetivo:** Administrar el alta, modificación, aprobación, baja y anulación de proveedores como socios de negocio.

---

### HU-01-005 Como Analista de Recursos Humanos, quiero registrar un proveedor, para mantener su información maestra disponible como Socio de Negocio.

**Prioridad: Alta | Estimación: 5 SP**

**Precondiciones**

- Usuario autenticado y con permiso para registrar socios de negocio.
- Información principal y de contacto del proveedor disponible.

**Criterios de Aceptación**

- ☐ DADO el campo de documento, CUANDO el usuario lo llena, ENTONCES solo acepta numeros: un DNI de 8 digitos o un RUC de 11 digitos.
- ☐ DADO un documento valido, CUANDO el usuario usa Consultar SAP, ENTONCES si SAP lo encuentra el sistema abre el detalle de ese socio, y si no, avisa que no existe en SAP y deja seguir el registro manual.
- ☐ DADO el campo de celular, CUANDO el usuario lo llena, ENTONCES solo acepta numeros y debe tener 9 digitos.
- ☐ DADO un documento ya registrado como proveedor, CUANDO el usuario intenta registrarlo otra vez, ENTONCES el sistema avisa la duplicidad y no crea un registro repetido.
- ☐ DADO el formulario completo, CUANDO el usuario selecciona Agregar proveedor, ENTONCES el proveedor queda Pendiente de aprobacion y el sistema abre su pantalla de detalle.
- ☐ DADO el detalle del proveedor recien creado, CUANDO el usuario lo revisa, ENTONCES puede aprobarlo, rechazarlo, editarlo o auditarlo segun su estado.

**Flujo Principal**

1. Entra a Socio de Negocio y selecciona Nuevo.
2. Elige el tipo Proveedor.
3. Ingresa el RUC o DNI; si lo desea, usa Consultar SAP.
4. Completa razon social, nombre comercial y datos de contacto.
5. Selecciona Agregar proveedor.
6. El sistema abre el detalle del proveedor, ya en estado Pendiente.
7. Un usuario autorizado lo aprueba o rechaza desde el detalle.

**Flujos de Excepción**

- El DNI no tiene 8 dígitos o el RUC no tiene 11 dígitos.
- El celular no tiene 9 dígitos.
- El documento ya está registrado como PROVEEDOR (el sistema muestra el dialogo "No se pudo registrar").
- Faltan datos obligatorios.
- La consulta SAP no encuentra información; el usuario continua con el registro manual.

**Eventos de Dominio**

- ProveedorRegistrado
- SocioAprobado
- SocioRechazado

---

### HU-01-006 Como Analista de Recursos Humanos, quiero modificar los datos de un proveedor, para mantener actualizada su información maestra.

**Prioridad: Alta | Estimación: 5 SP**

**Precondiciones**

- Proveedor registrado.
- Usuario autenticado y con permiso para modificar socios.

**Criterios de Aceptación**

- ☐ DADO un proveedor registrado, CUANDO el usuario selecciona Editar datos, ENTONCES el detalle pasa a modo edicion en la misma pantalla.
- ☐ DADO el modo edicion, CUANDO el usuario cambia razon social, nombre comercial, direccion, contacto, correo o celular, ENTONCES puede guardar esos cambios.
- ☐ DADO el modo edicion, CUANDO el usuario ve tipo, documento y codigo SAP, ENTONCES esos datos aparecen bloqueados y no se pueden cambiar.
- ☐ DADO el campo de celular, CUANDO el usuario guarda, ENTONCES debe tener exactamente 9 digitos.
- ☐ DADO un cambio valido, CUANDO el usuario selecciona Guardar cambios, ENTONCES el detalle se actualiza y el cambio queda registrado en el historial.

**Flujo Principal**

1. Busca al proveedor en el listado y selecciona Editar datos (o Ver y luego Editar datos).
2. Cambia los datos permitidos en el detalle.
3. Selecciona Guardar cambios.
4. El sistema muestra el detalle actualizado.

**Flujos de Excepción**

- Proveedor no encontrado.
- Datos obligatorios incompletos o inválidos.
- El celular no tiene 9 dígitos.
- El usuario necesita cambiar el documento o codigo SAP; la edicion actual no lo permite.
- El usuario no tiene permiso de modificación.

**Eventos de Dominio**

- ProveedorModificado

---

### HU-01-007 Como Analista de Recursos Humanos, quiero dar de baja o anular a un proveedor, para que deje de estar disponible como socio activo cuando corresponda.

**Prioridad: Alta | Estimación: 3 SP**

**Precondiciones**

- Proveedor registrado.
- Usuario autenticado y con permiso para administrar el estado del socio.

**Criterios de Aceptación**

- ☐ DADO un proveedor aprobado y activo, CUANDO el usuario selecciona Dar de baja e indica el motivo, ENTONCES el proveedor queda inactivo; si no esta aprobado y activo, el boton Dar de baja aparece deshabilitado.
- ☐ DADO un proveedor inactivo (no anulado), CUANDO el usuario selecciona Reactivar, ENTONCES el sistema crea un nuevo registro Pendiente ligado al anterior. Reactivar esta disponible en el detalle y en el listado.
- ☐ DADO un registro creado por error, CUANDO el usuario selecciona Anular desde el listado e indica el motivo, ENTONCES el registro queda anulado y deja de poder operar.
- ☐ DADO cualquiera de estas acciones, CUANDO termina bien, ENTONCES el resultado se ve en el detalle o el listado y queda registrado en Auditar.

**Flujo Principal**

1. Busca al proveedor en el listado.
2. Para Anular o Reactivar, usalos directamente desde las acciones de la fila y confirma.
3. Para Dar de baja, abre Ver y ejecuta la accion desde el detalle.
4. Indica el motivo o los datos que pide el sistema y confirma.
5. El sistema aplica el cambio y conserva el movimiento en el historial.

**Flujos de Excepción**

- El motivo obligatorio no fue informado.
- Se intenta dar de baja un socio que no esta aprobado, activo y vigente (el boton aparece deshabilitado).
- Se intenta reactivar un registro anulado.
- El usuario no tiene permiso para realizar la acción.

**Eventos de Dominio**

- ProveedorDadoDeBaja
- ProveedorAnulado
- SocioReactivado

## Épica 3: Gestión de Personal

> **Objetivo:** Administrar el alta, modificación, aprobación, baja y anulación del personal como socio local, manteniendo sus datos personales básicos.

---

### HU-01-008 Como Analista de Recursos Humanos, quiero registrar personal, para mantener actualizado el maestro de empleados de Hagemsa.

**Prioridad: Alta | Estimación: 8 SP**

**Precondiciones**

- Usuario autenticado y con permiso para registrar personal.
- Datos personales y de contacto disponibles.

**Criterios de Aceptación**

- ☐ DADO el campo de documento, CUANDO el usuario lo llena, ENTONCES solo acepta un DNI de 8 digitos y no aparece la opcion Consultar SAP (el personal no usa SAP).
- ☐ DADO los nombres, CUANDO el usuario los llena, ENTONCES debe ingresar primer nombre, apellido paterno y apellido materno (el segundo nombre es opcional) y el sistema arma la razon social con esos datos.
- ☐ DADO el campo de celular, CUANDO el usuario lo llena, ENTONCES solo acepta numeros y debe tener 9 digitos.
- ☐ DADO un DNI ya registrado como personal, CUANDO el usuario intenta registrarlo otra vez, ENTONCES el sistema avisa la duplicidad y no crea un registro repetido.
- ☐ DADO el formulario completo, CUANDO el usuario selecciona Agregar personal, ENTONCES el personal queda Pendiente de aprobacion y el sistema abre su pantalla de detalle.
- ☐ DADO el detalle del personal recien creado, CUANDO el usuario lo revisa, ENTONCES puede aprobarlo, rechazarlo, editarlo o auditarlo segun su estado.
- ☐ DADO un personal aprobado, activo y con registro activo, CUANDO el usuario selecciona Gestionar asignaciones, ENTONCES entra a la pantalla donde administra cargo, sede, area, cuentas, contrato e historial.

**Flujo Principal**

1. Entra a Socio de Negocio y selecciona Nuevo.
2. Elige el tipo Personal.
3. Ingresa el DNI, los nombres y apellidos, y los datos de contacto.
4. Selecciona Agregar personal.
5. El sistema abre el detalle del personal, ya en estado Pendiente.
6. Un usuario autorizado lo aprueba o rechaza desde el detalle.
7. Una vez aprobado y activo, el personal continúa con su asignación (Épica 4) para completar su configuración operativa.

**Flujos de Excepción**

- El DNI no tiene 8 dígitos.
- El celular no tiene 9 dígitos.
- El DNI ya está registrado como PERSONAL (el sistema muestra el dialogo "No se pudo registrar").
- Faltan datos obligatorios.
- El usuario no tiene permiso para registrar o aprobar.

**Eventos de Dominio**

- PersonalRegistrado
- SocioAprobado
- SocioRechazado

---

### HU-01-009 Como Analista de Recursos Humanos, quiero modificar los datos del personal, para mantener actualizada su información maestra.

**Prioridad: Alta | Estimación: 8 SP**

**Precondiciones**

- Personal registrado.
- Usuario autenticado y con permiso para modificar socios.

**Criterios de Aceptación**

- ☐ DADO un personal registrado, CUANDO el usuario selecciona Editar datos, ENTONCES el detalle pasa a modo edicion en la misma pantalla.
- ☐ DADO el modo edicion, CUANDO el usuario cambia razon social, nombre comercial, direccion, contacto, correo o celular, ENTONCES puede guardar esos cambios.
- ☐ DADO el modo edicion, CUANDO el usuario ve tipo y DNI, ENTONCES esos datos aparecen bloqueados y no se pueden cambiar.
- ☐ DADO el campo de celular, CUANDO el usuario guarda, ENTONCES debe tener exactamente 9 digitos.
- ☐ DADO que necesita cambiar cargo, sede, area, cuentas o contrato, CUANDO el usuario lo requiere, ENTONCES lo hace en Gestionar asignaciones, no en la edicion de datos personales.
- ☐ DADO un cambio valido, CUANDO el usuario selecciona Guardar cambios, ENTONCES el detalle se actualiza (sin tocar sus asignaciones) y queda registrado en el historial.

**Flujo Principal**

1. Busca al personal en el listado y selecciona Editar datos (o Ver y luego Editar datos).
2. Cambia los datos personales permitidos en el detalle.
3. Selecciona Guardar cambios.
4. El sistema muestra el detalle actualizado, sin modificar sus asignaciones.

**Flujos de Excepción**

- Personal no encontrado.
- Datos obligatorios incompletos o inválidos.
- El celular no tiene 9 dígitos.
- El usuario necesita cambiar el DNI; la edicion actual no lo permite.
- El usuario intenta modificar una asignación desde la edición de datos personales.

**Eventos de Dominio**

- PersonalModificado

---

### HU-01-010 Como Analista de Recursos Humanos, quiero dar de baja o anular al personal, para que deje de figurar como empleado activo cuando corresponda.

**Prioridad: Alta | Estimación: 3 SP**

**Precondiciones**

- Personal registrado.
- Usuario autenticado y con permiso para administrar el estado del socio.

**Criterios de Aceptación**

- ☐ DADO un personal aprobado y activo, CUANDO el usuario selecciona Dar de baja e indica el motivo, ENTONCES el personal queda inactivo y sus asignaciones, cuentas y contratos vigentes se dan por finalizados; si no esta aprobado y activo, el boton Dar de baja aparece deshabilitado.
- ☐ DADO un personal inactivo (no anulado), CUANDO el usuario selecciona Reactivar, ENTONCES el sistema crea un nuevo registro Pendiente ligado al anterior. Reactivar esta disponible en el detalle y en el listado.
- ☐ DADO un registro creado por error, CUANDO el usuario selecciona Anular e indica el motivo, ENTONCES el personal queda anulado y sus asignaciones, cuentas y contratos vigentes pasan a anulados.
- ☐ DADO que la baja o la anulacion afecto sus asignaciones, CUANDO termina, ENTONCES esos cambios quedan reflejados en el historial de cada asignacion.
- ☐ DADO cualquiera de estas acciones, CUANDO termina bien, ENTONCES el resultado se ve en el detalle o el listado y queda registrado en Auditar.

**Flujo Principal**

1. Busca al personal en el listado.
2. Para Anular o Reactivar, usalos directamente desde las acciones de la fila y confirma.
3. Para Dar de baja, abre Ver y ejecuta la accion desde el detalle.
4. Indica el motivo o los datos que pide el sistema y confirma.
5. El sistema aplica el cambio (al dar de baja o anular, finaliza o anula sus asignaciones) y conserva el movimiento en el historial.

**Flujos de Excepción**

- El motivo obligatorio no fue informado.
- Se intenta dar de baja un personal que no esta aprobado, activo y vigente (el boton aparece deshabilitado).
- Se intenta reactivar un registro anulado.
- El usuario no tiene permiso para realizar la acción.

**Eventos de Dominio**

- PersonalDadoDeBaja
- PersonalAnulado
- SocioReactivado

> **Nota de flujo (Personal → Asignación):** Como todo socio, el personal se registra en estado Pendiente y luego se aprueba o rechaza, igual que el cliente y el proveedor. La diferencia es que, una vez aprobado y activo, el sistema continúa con su **asignación** (Épica 4) para completar su configuración operativa: cargo, sede, área, cuentas y contrato. Los clientes y proveedores quedan completos solo con su registro y aprobación; no requieren asignación.

## Épica 4: Gestión de Asignaciones Operativas de Personal

> **Objetivo:** Administrar la asignación operativa del personal con cargo, sede, área, aprobación, vigencia, múltiples cuentas y un contrato final, conservando el snapshot recibido desde Configuración General.

> **Nota funcional:** 

La asignacion operativa se modela como un agregado propio. SocioDeNegocio conserva la identidad y los datos maestros del PERSONAL, mientras AsignacionPersonal protege las reglas de asignacion, aprobacion, vigencia, cuentas/contratos e historial. Por eso, cuando el usuario necesita cambiar cargo, sede, area, cuentas o contrato, no edita la pantalla principal del socio: ingresa a Gestionar asignaciones y trabaja sobre la asignacion del personal.

---

### HU-01-011 Como Analista de Recursos Humanos, quiero crear una asignación operativa para un personal, para dejar trazada su configuración vigente.

**Prioridad: Alta | Estimación: 8 SP**

**Precondiciones**

- Personal registrado, aprobado, activo y con registro activo.
- Usuario autenticado y con permiso para administrar asignaciones.
- Cargo, sede, área, cuentas y contratos disponibles para selección.

**Criterios de Aceptación**

- ☐ DADO un personal aprobado, activo y con registro activo, CUANDO el usuario selecciona Nueva asignación, ENTONCES se abre un dialogo con tres bloques: Datos laborales, Relacion contractual y Vigencia.
- ☐ DADO el bloque Datos laborales, CUANDO el usuario lo completa, ENTONCES elige en cascada Distrito, Ubicacion, Sede, Area y Cargo (distrito y ubicacion solo sirven para filtrar; se guardan sede, area y cargo).
- ☐ DADO el bloque Relación contractual, CUANDO el usuario elige una cuenta, ENTONCES se agrega sola; puede añadir varias cuentas sin repetir y quitarlas con la papelera.
- ☐ DADO el contrato, CUANDO el usuario lo elige, ENTONCES solo puede haber un contrato final y debe pertenecer a una de las cuentas elegidas.
- ☐ DADO el bloque Vigencia, CUANDO el usuario lo completa, ENTONCES Vigente desde es obligatorio y Vigente hasta es opcional, pero no puede ser anterior a Vigente desde.
- ☐ DADO los datos validos, CUANDO el usuario selecciona Crear asignación, ENTONCES la asignacion queda ligada al mismo personal, sin crear otro socio de negocio.

**Flujo Principal**

1. Busca al personal en el listado y entra a sus asignaciones (Asignaciones desde la fila, o Ver y luego Gestionar asignaciones).
2. Selecciona Nueva asignación.
3. Completa Datos laborales: Distrito, Ubicacion, Sede, Area y Cargo.
4. En Relacion contractual agrega las cuentas y, si aplica, un contrato final.
5. Indica la Vigencia (desde y, opcional, hasta).
6. Selecciona Crear asignación; el sistema la muestra dentro del mismo personal.

**Flujos de Excepción**

- El socio seleccionado no es PERSONAL (la pantalla informa que no aplica).
- El personal todavía no está aprobado, activo y con registro activo.
- Falta seleccionar distrito, ubicacion, sede, area o cargo.
- Falta la vigencia inicial o la fecha de fin es anterior a la fecha de inicio.
- Se intenta agregar una cuenta repetida o más de un contrato, o un contrato que no pertenece a las cuentas seleccionadas.
- No fue posible cargar alguna opción necesaria.

**Eventos de Dominio**

- AsignacionPersonalRegistrada

---

### HU-01-012 Como Analista de Recursos Humanos, quiero modificar la asignación operativa de un personal, para mantener correctamente sus datos de cargo, ubicación, cuentas y contrato.

**Prioridad: Alta | Estimación: 8 SP**

**Precondiciones**

- Personal con una asignación registrada.
- Usuario autenticado y con permiso para administrar asignaciones.

**Criterios de Aceptación**

- ☐ DADO una asignación, CUANDO el usuario selecciona Editar cargo y ubicacion, ENTONCES puede cambiar cargo, sede, area o vigencia sin tocar cuentas ni contrato; lo que no cambie conserva su valor actual.
- ☐ DADO que quiere cambiar el area, CUANDO edita cargo y ubicacion, ENTONCES tambien debe elegir la sede.
- ☐ DADO una asignación, CUANDO el usuario selecciona Cambiar cuentas y contrato, ENTONCES ve dos bloques: Relación actual (lo vigente hoy) y Nueva relación (ya precargada para ajustar).
- ☐ DADO el bloque Nueva relación, CUANDO el usuario agrega o quita cuentas o el contrato final, ENTONCES solo cambia la relacion contractual de esa asignacion; el personal sigue siendo el mismo.
- ☐ DADO que confirma una nueva relacion, CUANDO termina, ENTONCES las cuentas y el contrato anteriores dejan de estar vigentes pero quedan visibles en el historial.
- ☐ DADO que quiere dejar la asignacion sin cuentas ni contrato, CUANDO retira todo, ENTONCES debe marcar la casilla de confirmacion para que el cambio se aplique.

**Flujo Principal**

1. Entra a las asignaciones del personal y ubica la tarjeta a modificar.
2. Para cargo, sede, area o vigencia: usa Editar cargo y ubicacion y cambia solo lo necesario.
3. Para cuentas o contrato: usa Cambiar cuentas y contrato, revisa la Relación actual y ajusta la Nueva relación.
4. Confirma el cambio (Guardar cambios o Confirmar cambio contractual).
5. El sistema muestra la asignacion actualizada y guarda lo anterior en el historial.

**Flujos de Excepción**

- Se intenta agregar dos veces la misma cuenta o contrato.
- Se intenta seleccionar más de un contrato final, o uno que no pertenece a las cuentas seleccionadas.
- La vigencia de cuentas o contrato queda fuera de la vigencia de la asignación.
- Se intenta eliminar toda la relación contractual sin marcar la casilla de confirmacion.
- No fue posible cargar el catálogo necesario.
- El usuario no tiene permiso para modificar asignaciones.

**Eventos de Dominio**

- AsignacionPersonalModificada

---

### HU-01-013 Como Administrador Principal, quiero aprobar una asignación operativa, para dejar constancia de que la configuración del personal fue validada.

**Prioridad: Alta | Estimación: 3 SP**

**Precondiciones**

- Asignación registrada y pendiente de aprobación.
- Usuario autenticado con permiso para aprobar asignaciones.

**Criterios de Aceptación**

- ☐ DADO una asignacion con aprobacion Pendiente, CUANDO el aprobador revisa su cargo, sede, area, vigencia, cuentas y contrato en la tarjeta, ENTONCES dispone del boton Aprobar.
- ☐ DADO que el aprobador selecciona Aprobar, CUANDO la operacion finaliza correctamente, ENTONCES la tarjeta muestra el estado de aprobacion Aprobado, sin un paso de confirmacion adicional.
- ☐ DADO una asignación ya aprobada, CUANDO se muestran sus acciones, ENTONCES el boton Aprobar deja de estar disponible.
- ☐ DADO que se aprueba una asignación, CUANDO se consulta el personal, ENTONCES sus datos personales no cambian.
- ☐ DADO una aprobación realizada, CUANDO el usuario selecciona Ver historial en la tarjeta, ENTONCES puede consultar la aprobación registrada.

**Flujo Principal**

1. El aprobador entra a las asignaciones del personal.
2. Ubica la tarjeta con aprobacion Pendiente y revisa su cargo, sede, area, vigencia, cuentas y contrato.
3. Selecciona Aprobar.
4. El sistema cambia el estado a Aprobado y lo registra en el historial.

**Flujos de Excepción**

- La asignación ya fue aprobada.
- La asignación ya no está disponible.
- El usuario no tiene permiso para aprobar.
- No fue posible completar la aprobación.

**Eventos de Dominio**

- AsignacionPersonalAprobada

---

### HU-01-014 Como Analista de Recursos Humanos, quiero consultar las asignaciones y su historial, para conocer la configuración operativa vigente y los cambios realizados.

**Prioridad: Media | Estimación: 5 SP**

**Precondiciones**

- Personal registrado.
- Usuario autenticado con permiso para consultar asignaciones.

**Criterios de Aceptación**

- ☐ DADO un personal registrado, CUANDO el usuario entra a sus asignaciones, ENTONCES ve cada asignacion con su estado, aprobacion, vigencia, cargo, sede, area, cuentas y contrato.
- ☐ DADO una asignacion con relacion vigente, CUANDO se muestra su tarjeta, ENTONCES aparece el bloque Cuenta/contrato asignado con las cuentas y el contrato final vigentes.
- ☐ DADO una asignacion con cambios, CUANDO el usuario selecciona Ver historial, ENTONCES ve los movimientos de cargo, sede, area, vigencia, cuentas, contrato y aprobacion, con los valores anteriores para auditoria.
- ☐ DADO un personal dado de baja o anulado, CUANDO el usuario consulta sus asignaciones, ENTONCES las ve como finalizadas o anuladas segun lo aplicado al personal.
- ☐ DADO el listado de socios, CUANDO aparece un personal, ENTONCES se muestra su estado de aprobacion y, si no tiene asignacion vigente, se informa claramente.

**Flujo Principal**

1. Ubica al personal en el listado y entra a sus asignaciones (Ver o Asignaciones).
2. Revisa las tarjetas de asignacion y su relacion contractual vigente.
3. Selecciona Ver historial en la asignacion que necesite.
4. El sistema muestra los movimientos y el detalle de cada cambio.

**Flujos de Excepción**

- El personal no tiene asignaciones registradas.
- La asignación no tiene cuentas ni contrato vigentes.
- No fue posible cargar las asignaciones o el historial.
- El usuario no tiene permiso de consulta.

**Eventos de Dominio**

- No aplica.

## Épica 5: Reportes y Consultas de Socios de Negocio

> **Objetivo:** Permitir consultar, filtrar, auditar y exportar información de clientes, proveedores y personal para apoyar la gestión administrativa y de RRHH.

---

### HU-01-015 Como Analista de Recursos Humanos, quiero consultar el personal por datos maestros y estado, para obtener información actualizada del maestro de socios.

**Prioridad: Media | Estimación: 5 SP**

**Precondiciones**

- Usuario autenticado con permiso para consultar socios.
- Existen registros de PERSONAL en el Listado de Socios de Negocio.

**Criterios de Aceptación**

- ☐ DADO que el usuario necesita consultar personal, CUANDO filtra por tipo PERSONAL o busca por nombre o DNI, ENTONCES el Listado de Socios de Negocio muestra los registros coincidentes.
- ☐ DADO un personal listado, CUANDO se muestra el resultado, ENTONCES se visualizan su estado, registro, aprobación y estado de asignación vigente.
- ☐ DADO un personal sin asignación vigente, CUANDO aparece en el Listado de Socios de Negocio, ENTONCES el sistema lo informa claramente.
- ☐ DADO un personal encontrado, CUANDO el usuario selecciona Ver, ENTONCES accede a la pantalla de detalle completa.
- ☐ DADO un personal aprobado, activo y con registro activo, CUANDO el usuario selecciona Asignaciones, ENTONCES accede a la pantalla única para administrar y consultar sus asignaciones.

**Flujo Principal**

1. Entra al listado y filtra por tipo Personal, o busca por nombre o DNI.
2. Selecciona Aplicar y revisa los datos y estados.
3. Segun lo que necesite, usa Ver (detalle) o Asignaciones.

**Flujos de Excepción**

- No existen registros para el filtro aplicado.
- El personal no tiene asignación vigente.
- El personal no esta aprobado, activo y con registro activo; el acceso a asignaciones no se muestra para operar.
- No fue posible cargar el listado.
- El usuario no tiene permiso de consulta.

**Eventos de Dominio**

- No aplica.

---

### HU-01-016 Como Analista de Recursos Humanos, quiero consultar socios de negocio por tipo, estado y trazabilidad, para identificar clientes, proveedores y personal activos, inactivos, anulados o pendientes de aprobación.

**Prioridad: Media | Estimación: 5 SP**

**Precondiciones**

- Usuario autenticado con permiso para consultar socios e historial.
- Existen socios de negocio registrados.

**Criterios de Aceptación**

- ☐ DADO que el usuario ingresa al Listado de Socios de Negocio sin filtro de registro, CUANDO carga la consulta normal, ENTONCES se muestran solo socios vigentes con estadoRegistro ACTIVO.
- ☐ DADO que el usuario filtra por registro Anulados, CUANDO aplica el filtro, ENTONCES la consulta envia estadoRegistro=ANULADO y se muestran solo socios anulados.
- ☐ DADO un socio listado, CUANDO el usuario abre sus acciones, ENTONCES encuentra Ver, Editar datos, Auditar y las acciones permitidas por su estado; si el socio esta anulado, solo encuentra acciones de consulta e historial.
- ☐ DADO que el usuario selecciona Ver, CUANDO abre la pantalla de detalle, ENTONCES puede consultar toda la información y ejecutar las acciones disponibles.
- ☐ DADO que el usuario selecciona Editar datos, CUANDO abre la pantalla de detalle, ENTONCES la misma pantalla se muestra en modo edición.
- ☐ DADO que el usuario selecciona Auditar, CUANDO abre el historial, ENTONCES visualiza fecha, acción, usuario y cambios principales.
- ☐ DADO filtros aplicados, CUANDO el usuario selecciona Limpiar, ENTONCES el Listado de Socios de Negocio vuelve al listado de socios vigentes.

**Flujo Principal**

1. Entra al listado, busca por socio o documento y aplica los filtros que necesite.
2. Selecciona Aplicar y revisa los resultados y sus estados.
3. Abre las acciones del socio y elige Ver, Editar datos, Auditar o Asignaciones (cuando aplique).

**Flujos de Excepción**

- No existen registros para los filtros aplicados.
- El usuario necesita ver vigentes y anulados al mismo tiempo; por ahora el listado muestra un solo estado a la vez, así que primero revisa los vigentes y luego cambia el filtro a Anulados para ver esos registros.
- Una acción no está disponible para el estado actual del socio.
- Asignaciones no aplica para clientes o proveedores.
- No fue posible cargar el listado o historial.

**Eventos de Dominio**

- No aplica.

---

### HU-01-017 Como Auditor, quiero exportar la información de socios de negocio, para compartir reportes en Excel o PDF.

**Prioridad: Media | Estimación: 5 SP**

**Precondiciones**

- Usuario autenticado con permiso para consultar y exportar socios.
- Listado de Socios de Negocio disponible. La exportación se realiza desde ese listado, no desde una pantalla separada de reportes.

**Criterios de Aceptación**

- ☐ DADO que el usuario aplica filtros en el Listado de Socios de Negocio, CUANDO selecciona Excel o PDF desde el listado, ENTONCES el archivo contiene el resultado filtrado.
- ☐ DADO que no se aplican filtros, CUANDO el usuario exporta desde el listado, ENTONCES el archivo contiene el listado vigente disponible.
- ☐ DADO que el usuario selecciona Excel, CUANDO finaliza la generación, ENTONCES el sistema descarga el archivo en ese formato.
- ☐ DADO que el usuario selecciona PDF, CUANDO finaliza la generación, ENTONCES el sistema descarga el archivo en ese formato.
- ☐ DADO que ocurre un error, CUANDO no se puede generar el archivo, ENTONCES el sistema informa el problema al usuario.

**Flujo Principal**

1. Entra al listado y aplica los filtros que quiere incluir en el reporte.
2. Selecciona Excel o PDF en los botones de exportacion del listado.
3. El sistema genera y descarga el archivo para que el usuario lo revise.

**Flujos de Excepción**

- No existen registros para los filtros aplicados.
- No fue posible generar o descargar el archivo.
- El usuario no tiene permiso de exportación.

**Eventos de Dominio**

- No aplica.

## Información maestra del Socio de Negocio

Aplica para CLIENTE, PROVEEDOR y PERSONAL:

| Campo | Cliente | Proveedor | Personal | Observación |
| --- | --- | --- | --- | --- |
| Código interno / Código SAP | Sí | Sí | No | Aplica a CLIENTE y PROVEEDOR cuando se sincronizan con SAP. No se modifica por edición normal. PERSONAL no tiene código SAP en BC-01. |
| Tipo de socio | Sí | Sí | Sí | Puede ser CLIENTE, PROVEEDOR o PERSONAL. |
| Documento / RUC / DNI | Sí | Sí | Sí | No se modifica por edición normal. |
| Razón social o nombres | Sí | Sí | Sí | Para empresas se usa razón social; para personas, nombres. |
| Nombre comercial | Sí | Sí | Sí | Aplica si corresponde. |
| Dirección | Sí | Sí | Sí | Dirección principal registrada. |
| Contacto | Sí | Sí | Sí | Persona o referencia de contacto. |
| Estado | Sí | Sí | Sí | ACTIVO o INACTIVO. Además, estadoRegistro puede ser ACTIVO o ANULADO. |
| Correo | Sí | Sí | Sí | Correo principal del socio. |
| Nro. de celular | Sí | Sí | Sí | Número de contacto. |
| Cargo | No | No | Por asignación | No pertenece a SocioDeNegocio; AsignacionPersonal persiste su nombre y snapshot, no el ID externo. |
| Sede | No | No | Por asignación | No pertenece a SocioDeNegocio; AsignacionPersonal persiste su nombre y snapshot, no el ID externo. |
| Área | No | No | Por asignación | No pertenece a SocioDeNegocio; AsignacionPersonal persiste su nombre y snapshot, no el ID externo. |
| Contrato | No | No | Uno final por asignación | Se persiste como detalle tipo CONTRATO mediante código, nombre y snapshot, validado contra Configuración General. |
| Cuenta | No | No | Múltiples por asignación | Se persiste como detalle tipo CUENTA dentro de AsignacionPersonalCuentaContrato, validado contra Configuración General. |
| Condición laboral | No | No | No | No forma parte del modelo vigente de SocioDeNegocio ni de AsignacionPersonal. |
