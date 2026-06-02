// Tipos del modulo Comercial / Solicitudes de Cliente (BC-03).
// Solo declaraciones de tipo — sin imports de runtime (zod va en solicitud-cliente.schemas.ts).

import type { CanalEntrada, EstadoCotizacion } from "../../cotizaciones/tipos/cotizaciones.tipos";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type EstadoSolicitudCliente =
  | "PENDIENTE"
  | "EN_COTIZACION"
  | "COTIZADA"
  | "CERRADA"
  | "DESCARTADA";

export type TipoOrigen = "PROSPECTO" | "CLIENTE";

export type VeredictoIdentidad = "CLIENTE" | "PROSPECTO" | "NUEVO";

// ---------------------------------------------------------------------------
// Entidades de lectura (read model)
// ---------------------------------------------------------------------------

// Ref ligera de cotizacion (NO confundir con Cotizacion completa — ADR-SC-4)
export type RefCotizacion = {
  id: string;
  estado: EstadoCotizacion;
  versionVigente: number | null;
  montoTotal: number | null;
};

// Entidad detalle (full)
export type SolicitudCliente = {
  id: string;
  origenTipo: TipoOrigen;
  origenId: string;
  contactoOrigenId: string | null;
  canalEntrada: CanalEntrada;
  estado: EstadoSolicitudCliente;
  descripcionServicio: string;
  fechaRequerida: string | null;
  observaciones: string | null;
  motivoDescarte: string | null;
  cotizaciones: RefCotizacion[];
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaModificacion: string | null;
};

// Item de listado (slim)
export type SolicitudClienteResumen = {
  id: string;
  origenTipo: TipoOrigen;
  origenId: string;
  estado: EstadoSolicitudCliente;
  descripcionServicio: string;
  fechaCreacion: string;
};

// ---------------------------------------------------------------------------
// Paginacion propia (NO reutiliza RespuestaPaginada de compartido — forma distinta)
// ---------------------------------------------------------------------------

export type RespuestaPaginadaSolicitudes = {
  data: SolicitudClienteResumen[];
  total: number;
  pagina: number;
  porPagina: number;
};

// ---------------------------------------------------------------------------
// Filtros para el listado
// ---------------------------------------------------------------------------

export type FiltrosSolicitudesCliente = {
  estado?: EstadoSolicitudCliente;
  origenTipo?: TipoOrigen;
  busqueda?: string;
  pagina?: number;
  porPagina?: number;
};

// ---------------------------------------------------------------------------
// Payloads de escritura (write model)
// ---------------------------------------------------------------------------

export type PayloadDescartarSC = {
  motivo: string;
};

// Respuesta del endpoint resolver-identidad
export type RespuestaResolverIdentidad = {
  veredicto: VeredictoIdentidad;
  cliente?: {
    clienteId: string;
    razonSocial: string;
    nombreComercial: string;
    estado: string;
  };
};

// ---------------------------------------------------------------------------
// Helper: acciones permitidas por estado (UI gating)
// ---------------------------------------------------------------------------

export type AccionesPermitidasSC = {
  agregarCotizacion: boolean;
  descartar: boolean;
};

// Estado-machine UI gating: estados finales no permiten mas acciones.
export function accionesPermitidasSC(
  estado: EstadoSolicitudCliente
): AccionesPermitidasSC {
  if (estado === "CERRADA" || estado === "DESCARTADA") {
    return { agregarCotizacion: false, descartar: false };
  }
  return { agregarCotizacion: true, descartar: true };
}
