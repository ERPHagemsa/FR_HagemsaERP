// Tipos del modulo Comercial / Cotizaciones (Epica 2, BC03).
// Solo declaraciones de tipo — sin imports de runtime.
// Nota: cotizaciones.schemas.ts cubre solo validaciones de SC/transiciones (enviar, nueva-version, perdida).
// La validacion del borrador vive en validarBorrador (cotizaciones-editor.utils.ts).

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

// --- LeadTime (nivel version) ---
export type LeadTime = {
  id: string;
  descripcion: string;
  diasMin: number;
  diasMax: number | null; // null = plazo exacto; presente = rango (diasMax >= diasMin)
  orden: number;
};

// --- CargoAdicional (nivel SECCION) ---
export type CargoAdicional = {
  id: string;
  descripcion: string;
  monto: number; // >= 0; SI suma al subtotal de la seccion
  orden: number;
};

// --- Standby (reshape, SOLO nivel version) ---
// Contrato 2026-06-06: sin campo unidad. monto = tarifa diaria (el standby siempre es por dia).
export type Standby = {
  id: string;
  descripcion: string;   // antes recurso
  monto: number;         // tarifa diaria
  porLinea: boolean;     // true = tarifa por linea por dia
  orden: number;
};

export type Seccion = {
  id: string;
  nombre: string | null;
  orden: number;
  subtotal: number;
  cargosAdicionales: CargoAdicional[]; // nuevos: suman al subtotal
};

export type Linea = {
  id: string;
  idModalidad: string;
  tipoLinea: TipoLinea;
  orden: number;
  descripcion: string; // nombre/identificacion de la linea (antes `concepto`)
  cantidad: number;
  precioUnitario: number;
  precioTotal: number; // calculado por el backend: precioUnitario × cantidad (solo lectura)
  idSeccion: string | null;
  carga?: CargaHijo;
  equipo?: EquipoHijo;
  almacenaje?: AlmacenajeHijo;
  personal?: PersonalHijo;
};

export type Version = {
  numeroVersion: number;
  moneda: Moneda;        // unica moneda de la version (antes era por linea)
  congelada: boolean;
  motivo: string | null;
  montoTotal: number | null; // suma de precioTotal de las lineas activas; calculado por el backend
  validezDias: number | null;
  fechaVencimiento: string | null;
  fechaEnvio: string | null;
  condiciones: string | null;
  notas: string | null;
  secciones: Seccion[];
  lineas: Linea[];
  standbys: Standby[];   // antes standbyTarifas; SOLO nivel version
  leadTimes: LeadTime[]; // nuevo; SOLO nivel version
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
// CRITICO: NUNCA enviar idSeccion, precioTotal ni totales (los calcula el backend).
// `precioUnitario` (requerido) y `cantidad` (opcional, default 1) SI se envian a nivel
// de linea; el backend calcula `precioTotal = precioUnitario × cantidad`.
// ---------------------------------------------------------------------------

// --- PayloadLeadTime (nivel version) ---
export type PayloadLeadTime = {
  descripcion: string;
  diasMin: number;
  diasMax?: number; // omitido = plazo exacto
  orden?: number;
};

// --- PayloadCargoAdicional (nivel seccion) ---
export type PayloadCargoAdicional = {
  descripcion: string;
  monto: number;
  orden?: number;
};

// --- PayloadStandby (nivel version; NUNCA en seccion) ---
// Contrato 2026-06-06: sin campo unidad (backend usa forbidNonWhitelisted).
export type PayloadStandby = {
  descripcion: string;
  monto: number;         // tarifa diaria
  porLinea?: boolean;    // default false; true = por linea por dia
  orden?: number;
};

// Hijos polimorficos del write model (sin id — el backend los re-crea)
export type PayloadCargaHijo = {
  largoM?: number;
  anchoM?: number;
  altoM?: number;
  pesoTn?: number;
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

// Linea sin idSeccion ni totales. `precioUnitario` (requerido, >=0) y `cantidad`
// (entero >=1, default 1) SI se envian — el backend calcula precioTotal = precioUnitario × cantidad.
// NUNCA enviar moneda ni cargos en linea — moneda es de version, cargos son de seccion.
export type PayloadLinea = {
  idModalidad: string;
  tipoLinea: TipoLinea;
  descripcion: string;
  precioUnitario: number;
  cantidad?: number;
  carga?: PayloadCargaHijo;
  equipo?: PayloadEquipoHijo;
  almacenaje?: PayloadAlmacenajeHijo;
  personal?: PayloadPersonalHijo;
};

// Seccion con lineas y cargosAdicionales anidados
// NUNCA incluir standbys en una seccion
export type PayloadSeccion = {
  nombre?: string;
  orden?: number;
  lineas?: PayloadLinea[];
  cargosAdicionales?: PayloadCargoAdicional[];
};

// Borrador: moneda + secciones + lineas raiz + standbys raiz + leadTimes raiz
// lineas[] raiz = items SIN seccion explícita
// standbys[] raiz = standbys de la version (informativo, no suman al total)
// leadTimes[] raiz = plazos de entrega de la version
export type PayloadBorrador = {
  moneda?: Moneda;       // default PEN en el backend
  secciones?: PayloadSeccion[];
  lineas?: PayloadLinea[];
  standbys?: PayloadStandby[];   // SOLO root (antes standbyTarifas)
  leadTimes?: PayloadLeadTime[]; // SOLO root
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
// Refinamientos por version vigente (validar en el consumidor):
//   - editar/enviar: exigen vigente NO congelada (es la editable).
//   - nuevaVersion: exige vigente SI congelada (solo se ramifica una version ya
//     enviada; en EN_REVISION la vigente es borrador sin enviar -> queda off).
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
