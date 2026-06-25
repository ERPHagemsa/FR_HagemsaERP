# Catalogo actual de endpoints consumidos por frontend

Este documento resume las rutas que hoy consume el frontend de `FR_HagemsaERP` para el bounded context de Socio de Negocio.

Importante:

- Las rutas listadas son las rutas BFF de Next usadas por el frontend.
- `socio-negocios` y `asignaciones-personal` viven sobre el mismo backend, pero se exponen con prefijos distintos.
- Fuente: [socio-negocios-api.ts](/C:/ddd-proyectos/FR_HagemsaERP/src/modulos/socio-negocios/servicios/socio-negocios-api.ts) y [asignaciones-personal-api.ts](/C:/ddd-proyectos/FR_HagemsaERP/src/modulos/socio-negocios/servicios/asignaciones-personal-api.ts).

## Socio de negocio

| Metodo | Ruta BFF | Uso actual |
| --- | --- | --- |
| `GET` | `/api/socio-negocios/socios-de-negocio/estado` | Estado del BC |
| `GET` | `/api/socio-negocios/socios-de-negocio/resumen` | Resumen dashboard |
| `POST` | `/api/socio-negocios/socios-de-negocio` | Registrar socio |
| `POST` | `/api/socio-negocios/socios-de-negocio/desde-comercial/prospecto-convertido-a-cliente` | Registrar cliente desde Comercial |
| `PUT` | `/api/socio-negocios/socios-de-negocio/:id` | Modificar socio |
| `POST` | `/api/socio-negocios/socios-de-negocio/:id/reemplazo` | Reemplazar socio |
| `PATCH` | `/api/socio-negocios/socios-de-negocio/:id/aprobar` | Aprobar socio |
| `PATCH` | `/api/socio-negocios/socios-de-negocio/:id/rechazar` | Rechazar socio |
| `PATCH` | `/api/socio-negocios/socios-de-negocio/:id/baja` | Dar de baja socio |
| `PATCH` | `/api/socio-negocios/socios-de-negocio/:id/reactivar` | Reactivar socio |
| `GET` | `/api/socio-negocios/socios-de-negocio` | Listar socios |
| `GET` | `/api/socio-negocios/socios-de-negocio/clientes` | Listar clientes |
| `GET` | `/api/socio-negocios/socios-de-negocio/proveedores` | Listar proveedores |
| `GET` | `/api/socio-negocios/socios-de-negocio/personal` | Listar personal |
| `GET` | `/api/socio-negocios/socios-de-negocio/sap/business-partners/documento/:numeroDocumento` | Consultar BP SAP por documento |
| `GET` | `/api/socio-negocios/socios-de-negocio/sap/business-partners/:codigoInternoSap` | Consultar BP SAP por codigo |
| `POST` | `/api/socio-negocios/socios-de-negocio/desde-sap/documento/:numeroDocumento` | Registrar socio desde SAP |
| `GET` | `/api/socio-negocios/socios-de-negocio/clientes/por-documento/:numeroDocumento` | Buscar cliente por documento |
| `GET` | `/api/socio-negocios/socios-de-negocio/historial` | Historial general |
| `GET` | `/api/socio-negocios/socios-de-negocio/:id/historial` | Historial por socio |
| `GET` | `/api/socio-negocios/socios-de-negocio/eventos` | Eventos generales |
| `GET` | `/api/socio-negocios/socios-de-negocio/:id/eventos` | Eventos por socio |
| `GET` | `/api/socio-negocios/socios-de-negocio/exportar` | Exportar socios |
| `GET` | `/api/socio-negocios/socios-de-negocio/:id` | Obtener socio por id |
| `GET` | `/api/socio-negocios/socios-de-negocio/clientes/:id` | Obtener cliente por id |
| `GET` | `/api/socio-negocios/socios-de-negocio/proveedores/:id` | Obtener proveedor por id |
| `GET` | `/api/socio-negocios/socios-de-negocio/personal/:id` | Obtener personal por id |
| `GET` | `/api/socio-negocios/socios-de-negocio/personal/:id/linea-historica` | Linea historica de personal |

## Asignaciones de personal

| Metodo | Ruta BFF | Uso actual |
| --- | --- | --- |
| `POST` | `/api/asignaciones-personal` | Crear asignacion |
| `GET` | `/api/asignaciones-personal/personal/:personalId` | Listar asignaciones por personal |
| `GET` | `/api/asignaciones-personal/:id` | Obtener asignacion por id |
| `GET` | `/api/asignaciones-personal/:id/historial` | Historial de asignacion |
| `PATCH` | `/api/asignaciones-personal/:id` | Modificar asignacion |
| `PUT` | `/api/asignaciones-personal/:id/cuentas-contratos` | Reemplazar cuentas y contratos |

## Observaciones

- La parte que faltaba en el catalogo de Socio de Negocio era `asignaciones-personal`, que el frontend ya consume de forma separada.
- Hoy el frontend no tiene llamadas implementadas para una ruta de aprobacion de asignaciones; en el documento funcional aparece la HU, pero no existe consumo equivalente en `asignaciones-personal-api.ts`.
- En el frontend actual, `eventos` se consumen como `RespuestaDto<[]>` y no como respuesta paginada.
