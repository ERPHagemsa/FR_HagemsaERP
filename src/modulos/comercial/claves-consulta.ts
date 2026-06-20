// Claves de invalidacion de useConsulta para el modulo Comercial.
// Una mutacion que cambia un recurso llama invalidarConsulta(CLAVE_X) y todas las
// consultas montadas con esa clave se refetchean (ver compartido/api/use-consulta).
// Convencion: "comercial/<recurso>" (lista) y "comercial/<recurso>/detalle".
export const CLAVE_SOLICITUDES_CLIENTE = "comercial/solicitudes-cliente";
export const CLAVE_SOLICITUD_CLIENTE_DETALLE = "comercial/solicitudes-cliente/detalle";
export const CLAVE_PROSPECTOS = "comercial/prospectos";
export const CLAVE_PROSPECTO_DETALLE = "comercial/prospectos/detalle";
export const CLAVE_PROSPECTO_HISTORIAL = "comercial/prospectos/historial";
export const CLAVE_COTIZACIONES = "comercial/cotizaciones";
export const CLAVE_COTIZACION_DETALLE = "comercial/cotizaciones/detalle";
export const CLAVE_MODALIDADES = "comercial/modalidades";
export const CLAVE_CARGOS_ADICIONALES = "comercial/cargos-adicionales";
