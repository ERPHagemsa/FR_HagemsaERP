// Tipos del modulo Comercial / Solicitudes de Cliente (BC-03).
// Solo declaraciones de tipo — sin imports de runtime (zod va en solicitud-cliente.schemas.ts).

import type { CanalEntrada, EjecutivoRef, EstadoCotizacion } from "../../cotizaciones/tipos/cotizaciones.tipos";

export type { EjecutivoRef };

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

// ---------------------------------------------------------------------------
// Entidades de lectura (read model)
// ---------------------------------------------------------------------------

// Snapshot del contacto — presente en GET detalle y GET listado (null solo si
// origen CLIENTE sin contacto en BC-01; para PROSPECTO siempre viene).
export type ContactoSolicitante = {
  nombre: string;
  correo: string | null;
  telefono: string | null;
};

// Ref ligera de cotizacion (NO confundir con Cotizacion completa — ADR-SC-4)
export type RefCotizacion = {
  id: string;
  estado: EstadoCotizacion;
  versionVigente: number | null;
  montoTotal: number | null;
};

// Ref ligera de la cotizacion "vigente" del listado.
// "vigente" = la mas reciente NO terminal (excluye CANCELADA/PERDIDA/VENCIDA);
// null si la SC no tiene ninguna cotizacion viva. Pensada para el deep-link del
// listado — NO derivar de totalCotizaciones (ese cuenta tambien las terminales).
export type RefCotizacionVigente = {
  id: string;
  estado: EstadoCotizacion;
  ejecutivo: EjecutivoRef;
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
  numeroSolicitud: number | null;
  codigoSolicitud: string | null;
  // Campos snapshot server-derived (disponibles desde backend v2)
  nombreSolicitante: string;
  totalCotizaciones: number;
  contactoSolicitante: ContactoSolicitante | null;
  cotizaciones: RefCotizacion[];
  registradoPor: EjecutivoRef | null;
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
  numeroSolicitud: number | null;
  codigoSolicitud: string | null;
  // Campos snapshot server-derived (disponibles desde backend v2)
  nombreSolicitante: string;
  totalCotizaciones: number;
  // Ref de la cotizacion viva mas reciente (o null). Clave del deep-link y de
  // "Tomado por" — NO usar totalCotizaciones para eso (incluye terminales).
  cotizacionVigente: RefCotizacionVigente | null;
  contactoSolicitante: ContactoSolicitante | null;
  registradoPor: EjecutivoRef | null;
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
