// Claves de invalidacion de useConsulta para el modulo Comercial.
// Una mutacion que cambia un recurso llama invalidarConsulta(CLAVE_X) y todas las
// consultas montadas con esa clave se refetchean (ver compartido/api/use-consulta).
// Convencion: "comercial/<recurso>" (lista) y "comercial/<recurso>/detalle".
export const CLAVE_SOLICITUDES_CLIENTE = "comercial/solicitudes-cliente";
export const CLAVE_SOLICITUDES_CLIENTE_RESUMEN = "comercial/solicitudes-cliente/resumen";
export const CLAVE_SOLICITUD_CLIENTE_DETALLE = "comercial/solicitudes-cliente/detalle";
export const CLAVE_PROSPECTOS = "comercial/prospectos";
export const CLAVE_PROSPECTO_DETALLE = "comercial/prospectos/detalle";
export const CLAVE_PROSPECTO_HISTORIAL = "comercial/prospectos/historial";
export const CLAVE_COTIZACIONES = "comercial/cotizaciones";
export const CLAVE_COTIZACIONES_RESUMEN = "comercial/cotizaciones/resumen";
export const CLAVE_COTIZACION_DETALLE = "comercial/cotizaciones/detalle";
export const CLAVE_APROBACIONES = "comercial/aprobaciones";
export const CLAVE_APROBACIONES_RESUMEN = "comercial/aprobaciones/resumen";
export const CLAVE_APROBADORES = "comercial/aprobaciones/aprobadores";
// Distinta de CLAVE_APROBADORES: aquella son los aprobadores que ya resolvieron
// solicitudes (dato de BC-03, para filtros); esta son las cuentas habilitadas como
// aprobadoras segun el servicio de autenticacion (para elegir destinatarios).
export const CLAVE_APROBADORES_CUENTAS = "comercial/aprobaciones/aprobadores-cuentas";
export const CLAVE_COTIZACION_APROBACIONES_HISTORIAL = "comercial/cotizaciones/aprobaciones-historial";
export const CLAVE_MODALIDADES = "comercial/modalidades";
export const CLAVE_TIPOS_UNIDAD = "comercial/tipos-unidad";
export const CLAVE_CARGOS_ADICIONALES = "comercial/cargos-adicionales";
export const CLAVE_COTIZACIONES_EJECUTIVOS = "comercial/cotizaciones/ejecutivos";
export const CLAVE_TARIFARIOS = "comercial/tarifarios";
export const CLAVE_TARIFARIO_DETALLE = "comercial/tarifarios/detalle";
export const CLAVE_CONTRATOS = "comercial/contratos";
export const CLAVE_CONTRATO_DETALLE = "comercial/contratos/detalle";
export const CLAVE_TARIFARIO_CONSOLIDADO = "comercial/contratos/tarifario-consolidado";
export const CLAVE_CONDICIONES = "comercial/condiciones";
export const CLAVE_MOTIVOS = "comercial/motivos";
export const CLAVE_UBICACIONES_TEMPORALES = "comercial/ubicaciones/temporales";
export const CLAVE_UBICACIONES_MAESTRA = "comercial/ubicaciones/maestra";
export const CLAVE_CALENDARIO_GANADAS = "comercial/cotizaciones/calendario-ganadas";
// Dashboard (Fase 2b, design D3) — una clave por endpoint de agregacion `/dashboard/*`.
// Solo lectura: ninguna mutacion de este BC invalida estas claves hoy; existen por
// consistencia con el patron y por si una accion futura quisiera invalidar cross-tree.
export const CLAVE_DASHBOARD_WIN_RATE = "comercial/dashboard/win-rate";
export const CLAVE_DASHBOARD_CICLO = "comercial/dashboard/ciclo-cierre";
export const CLAVE_DASHBOARD_TENDENCIA = "comercial/dashboard/tendencia-mensual";
export const CLAVE_DASHBOARD_RANKING = "comercial/dashboard/ranking-ejecutivos";
export const CLAVE_DASHBOARD_MOTIVOS = "comercial/dashboard/motivos-perdida";
export const CLAVE_DASHBOARD_EMBUDO = "comercial/dashboard/embudo-conversion";
export const CLAVE_DASHBOARD_ACCIONES = "comercial/dashboard/acciones-pendientes";
// dashboard-kpis-motivos-respuesta-front: endpoints posteriores a Fase 2b.
export const CLAVE_DASHBOARD_KPIS_CONSOLIDADO = "comercial/dashboard/kpis-consolidado";
export const CLAVE_DASHBOARD_MOTIVOS_RESPUESTA = "comercial/dashboard/motivos-respuesta-cliente";
