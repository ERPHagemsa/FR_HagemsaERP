// Tipos del modulo Comercial / Cotizaciones (Epica 2, BC03).
// Solo declaraciones de tipo — sin imports de runtime (zod va en cotizaciones.schemas.ts).

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type OrigenTipo = "PROSPECTO" | "CLIENTE";

export type CanalEntrada = "CORREO" | "PRESENCIAL" | "LLAMADA" | "OTRO";

export type TipoLinea =
  | "TRANSPORTE"
  | "ALQUILER_EQUIPO"
  | "ALMACENAJE"
  | "AGENCIAMIENTO"
  | "PERSONAL"
  | "SERVICIO_AUXILIAR";

export type TipoCargo =
  | "DESMOVILIZACION"
  | "MOVILIZACION"
  | "ESCOLTA"
  | "HOSPEDAJE"
  | "VIATICOS"
  | "RECARGO"
  | "OTRO";

export type Moneda = "PEN" | "USD";

export type EstadoCotizacion =
  | "BORRADOR"
  | "ENVIADA"
  | "EN_REVISION"
  | "GANADA"
  | "PERDIDA"
  | "CANCELADA"
  | "VENCIDA";

export type EstadoModalidad = "ACTIVA" | "INACTIVA";

export type TipoModalidad = "SPOT" | "PROYECTO" | "OTRO";

export type UnidadCobro =
  | "VIAJE"
  | "DIA"
  | "M2"
  | "SERVICIO"
  | "HORA"
  | "TONELADA"
  | "CONTENEDOR"
  | "OTRO";

// ---------------------------------------------------------------------------
// Entidades de lectura (read model — shape plano que devuelve el backend)
// ---------------------------------------------------------------------------

export type CargaHijo = {
  id: string;
  largoM: number | null;
  anchoM: number | null;
  altoM: number | null;
  pesoTn: number | null;
  tipoCarga: string | null;
  origen: string | null;
  destino: string | null;
  tipoVehiculo: string | null;
};

export type EquipoHijo = {
  id: string;
  equipoTipo: string | null;
  marca: string | null;
  modelo: string | null;
  capacidad: string | null;
  horasMinimas: number | null;
  diasContratoMin: number | null;
};

export type AlmacenajeHijo = {
  id: string;
  areaM2: number | null;
  periodoDias: number | null;
};

export type PersonalHijo = {
  id: string;
  rol: string;
};

export type Cargo = {
  id: string;
  tipoCargo: TipoCargo;
  concepto: string;
  monto: number;
  esContingente: boolean;
  orden: number;
};

export type Seccion = {
  id: string;
  nombre: string | null;
  orden: number;
  subtotal: number;
};

export type Standby = {
  id: string;
  recurso: string;
  tarifaDia: number;
  moneda: Moneda;
  orden: number;
  idSeccion: string | null;
};

export type Linea = {
  id: string;
  idModalidad: string;
  tipoLinea: TipoLinea;
  orden: number;
  concepto: string;
  descripcion: string | null;
  moneda: Moneda;
  cantidad: number;
  precioUnitario: number | null;
  costo: number;
  precio: number;
  margen: number;
  idSeccion: string | null;
  cargos: Cargo[];
  carga?: CargaHijo;
  equipo?: EquipoHijo;
  almacenaje?: AlmacenajeHijo;
  personal?: PersonalHijo;
};

export type Version = {
  numeroVersion: number;
  congelada: boolean;
  motivo: string | null;
  costoTotal: number;
  montoTotal: number;
  margenTotal: number;
  validezDias: number | null;
  fechaVencimiento: string | null;
  fechaEnvio: string | null;
  leadTimeDias: number | null;
  condiciones: string | null;
  notas: string | null;
  secciones: Seccion[];
  lineas: Linea[];
  standbyTarifas: Standby[];
};

export type Cotizacion = {
  id: string;
  origenTipo: OrigenTipo;
  origenId: string;
  contactoOrigenId: string;
  estado: EstadoCotizacion;
  motivoPerdida: string | null;
  idEjecutivoResponsable: string;
  solicitudClienteId: string | null;
  versionVigente: number | null;
  versiones: Version[];
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaModificacion: string | null;
};

export type Modalidad = {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  tipoLinea: TipoLinea;
  tipo: TipoModalidad;
  unidadCobro: UnidadCobro;
  estado: EstadoModalidad;
  tarifaBaseReferencial: number | null;
  moneda: Moneda | null;
  margenObjetivo: number | null;
  requiereAprobacion: boolean;
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaModificacion: string | null;
};

// ---------------------------------------------------------------------------
// Paginacion propia (NO reutiliza RespuestaPaginada de compartido — forma distinta)
// ---------------------------------------------------------------------------

export type RespuestaPaginadaCotizaciones = {
  data: Cotizacion[];
  total: number;
  pagina: number;
  porPagina: number;
};

export type RespuestaPaginadaModalidades = {
  data: Modalidad[];
  total: number;
  pagina: number;
  porPagina: number;
};

// ---------------------------------------------------------------------------
// Filtros para listados
// ---------------------------------------------------------------------------

export type FiltrosCotizaciones = {
  estado?: EstadoCotizacion;
  origenTipo?: OrigenTipo;
  idEjecutivoResponsable?: string;
  busqueda?: string;
  pagina?: number;
  porPagina?: number;
};

export type FiltrosModalidades = {
  estado?: EstadoModalidad;
  tipo?: TipoModalidad;
  tipoLinea?: TipoLinea;
  busqueda?: string;
  pagina?: number;
  porPagina?: number;
};

// ---------------------------------------------------------------------------
// DTOs de escritura (write model — anidado, lo que acepta el backend)
// CRITICO: NUNCA enviar idSeccion, margen ni totales (los calcula el backend).
// `cantidad` y `precioUnitario` SI se envian a nivel de linea (desglose N x P/u).
// ---------------------------------------------------------------------------

export type PayloadCargo = {
  tipoCargo: TipoCargo;
  concepto: string;
  monto: number;
  esContingente?: boolean;
  orden?: number;
};

// Hijos polimorficos del write model (sin id — el backend los re-crea)
export type PayloadCargaHijo = {
  largoM?: number;
  anchoM?: number;
  altoM?: number;
  pesoTn?: number;
  tipoCarga?: string;
  origen?: string;
  destino?: string;
  tipoVehiculo?: string;
};

export type PayloadEquipoHijo = {
  equipoTipo?: string;
  marca?: string;
  modelo?: string;
  capacidad?: string;
  horasMinimas?: number;
  diasContratoMin?: number;
};

export type PayloadAlmacenajeHijo = {
  areaM2?: number;
  periodoDias?: number;
};

export type PayloadPersonalHijo = {
  rol: string; // requerido si se envia el objeto
};

// Linea sin idSeccion, margen ni totales. `cantidad` (entero >=1) y
// `precioUnitario` (informativo) SI se envian — desglose "N x P/u".
export type PayloadLinea = {
  idModalidad: string;
  tipoLinea: TipoLinea;
  concepto: string;
  moneda: Moneda;
  cantidad?: number;
  precioUnitario?: number;
  costo: number;
  precio: number;
  carga?: PayloadCargaHijo;
  equipo?: PayloadEquipoHijo;
  almacenaje?: PayloadAlmacenajeHijo;
  personal?: PayloadPersonalHijo;
  cargos?: PayloadCargo[];
};

// Standby sin idSeccion
export type PayloadStandby = {
  recurso: string;
  tarifaDia: number;
  moneda: Moneda;
  orden?: number;
};

// Seccion con sus lineas y standby anidados
export type PayloadSeccion = {
  nombre?: string;
  orden?: number;
  lineas?: PayloadLinea[];
  standbyTarifas?: PayloadStandby[];
};

// Borrador: secciones + lineas raiz + standby raiz
// lineas[] raiz = items SIN seccion; standbyTarifas[] raiz = standby SIN seccion
export type PayloadBorrador = {
  secciones?: PayloadSeccion[];
  lineas?: PayloadLinea[];
  standbyTarifas?: PayloadStandby[];
};

// SC y transiciones — union discriminada por origenTipo
// PROSPECTO requiere contactoOrigenId; CLIENTE requiere tipoDocumento + numeroDocumento
// (backend resuelve el contacto y el nombre via BC-01).
export type PayloadRegistrarSCProspecto = {
  origenTipo: "PROSPECTO";
  origenId: string;
  contactoOrigenId: string;
  canalEntrada: CanalEntrada;
  descripcionServicio: string;
  fechaRequerida?: string;
  observaciones?: string;
};

export type TipoDocumento = "RUC" | "DNI" | "CE";

export type PayloadRegistrarSCCliente = {
  origenTipo: "CLIENTE";
  origenId: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  canalEntrada: CanalEntrada;
  descripcionServicio: string;
  fechaRequerida?: string;
  observaciones?: string;
};

export type PayloadRegistrarSC = PayloadRegistrarSCProspecto | PayloadRegistrarSCCliente;

export type PayloadEnviar = {
  validezDias?: number; // default 10 (DELTA 3)
};

export type PayloadNuevaVersion = {
  motivo: string;
};

export type PayloadPerdida = {
  motivoPerdida: string;
};

// ---------------------------------------------------------------------------
// Helper: acciones permitidas por estado (UI gating)
// ---------------------------------------------------------------------------

export type AccionesPermitidas = {
  editar: boolean;
  enviar: boolean;
  nuevaVersion: boolean;
  ganar: boolean;
  perder: boolean;
  cancelar: boolean;
};

// Estado-machine UI gating: centraliza que acciones estan disponibles por estado.
// editar ademas exige que la version vigente no este congelada (validar en el consumidor).
export function accionesPermitidas(estado: EstadoCotizacion): AccionesPermitidas {
  switch (estado) {
    case "BORRADOR":
      return { editar: true, enviar: true, nuevaVersion: false, ganar: false, perder: false, cancelar: true };
    case "ENVIADA":
      return { editar: false, enviar: false, nuevaVersion: true, ganar: true, perder: true, cancelar: false };
    case "EN_REVISION":
      return { editar: true, enviar: true, nuevaVersion: true, ganar: true, perder: true, cancelar: false };
    case "GANADA":
    case "PERDIDA":
    case "CANCELADA":
    case "VENCIDA":
      return { editar: false, enviar: false, nuevaVersion: false, ganar: false, perder: false, cancelar: false };
  }
}
