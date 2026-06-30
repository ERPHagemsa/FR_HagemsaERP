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

// Buckets del pipeline de cotizaciones (filtran el listado y son la
// contraparte 1:1 de los KPIs de /resumen). Comparten predicado con el backend
// (fuente unica de verdad), por eso el numero del KPI === filas del bucket.
//   enPreparacion → BORRADOR + EN_REVISION
//   enviadas      → ENVIADA
//   ganadas       → GANADA
//   perdidas      → PERDIDA + VENCIDA + CANCELADA
export type BucketCotizacion =
  | "enPreparacion"
  | "enviadas"
  | "ganadas"
  | "perdidas";

// Ref del ejecutivo (snapshot { id, nombre }). id = AuthContext.accountId
// (no es un correo); sin token MVP = { id: "mvp-sin-auth", nombre: "Usuario MVP" }.
export type EjecutivoRef = {
  id: string;
  nombre: string;
};

// Item de la lista GET /cotizaciones/ejecutivos — ejecutivos que tienen cotizaciones.
// Respuesta en array pelado (sin envelope de paginacion).
export type EjecutivoResponsableOpcion = {
  id: string;
  nombre: string;
};

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

export type UnidadPeso = "TN" | "KG";

// Item fisico transportado. Contrato API §4 (2026-06-15): una linea de TRANSPORTE
// lleva 0..N items dentro de carga.cargas[]; cada uno con su nombre, dimensiones y peso.
export type CargaItem = {
  id: string;
  nombre: string;
  largoM: number | null;
  anchoM: number | null;
  altoM: number | null;
  peso: number | null;
  unidadPeso: UnidadPeso | null;
  orden: number;
};

// Sugerencia de carga para autocompletado (API §5.3.1). Subset clonable de CargaItem:
// SIN id ni orden. Es una lectura GLOBAL (busca sobre cargas de cualquier cotizacion,
// no filtra por ejecutivo) y deduplica por nombre trayendo la mas reciente.
// Todas las dimensiones pueden venir null; el front las clona y el usuario las edita.
export type SugerenciaCarga = {
  nombre: string;
  largoM: number | null;
  anchoM: number | null;
  altoM: number | null;
  peso: number | null;
  unidadPeso: UnidadPeso | null;
};

// Precio sugerido para una linea de TRANSPORTE (API §5.3.2). Lectura: a partir del
// historico de cotizaciones que salieron al cliente y matchean modalidad + ruta + carga,
// devuelve la mediana (monto) y el rango tipico p25-p75 (montoMin-montoMax).
// Sin comparables: monto/montoMin/montoMax = null y muestras = 0 (NO es error).
export type ParamsPrecioSugerido = {
  modalidadId: string;   // UUID de la modalidad (implica el tipo de linea)
  origen: string;        // texto plano; el backend normaliza para el match
  destino: string;       // texto plano; el backend normaliza para el match
  moneda: Moneda;        // PEN | USD — no se mezclan, cada moneda tiene su estadistica
  pesoTotal: number;     // TN, > 0 — REQUERIDO (no se cotiza transporte sin saber el peso).
                         // Define el rango de peso de los comparables (±15% default)
  toleranciaPeso?: number; // fraccion (0, 1); fuera de rango el backend usa 0.15
  // Alcance por cliente (opcional, ambos juntos): acota la sugerencia al historial de ese
  // cliente; si no tiene historial cae a mercado (alcance "mercado"). Sin estos, siempre mercado.
  clienteTipo?: OrigenTipo; // PROSPECTO | CLIENTE
  clienteId?: string;       // UUID del cliente/prospecto a acotar
};

// Evidencia: una cotizacion historica que alimento la estadistica. El backend la capea a 10
// (ordenadas por fecha desc), pero la estadistica usa TODAS las `muestras`, no solo estas.
export type ComparablePrecioSugerido = {
  cotizacionId: string;
  tipoVehiculo: string | null;
  precioVenta: number;      // precio de venta cotizado historicamente (lo que se cobro)
  margenPct: number;        // margen sobre venta con el que se cotizo ese comparable
  fecha: string;            // ISO
  estado: EstadoCotizacion; // nunca BORRADOR ni CANCELADA (solo las que salieron al cliente)
  ejecutivo: string;
};

export type AlcancePrecioSugerido = "cliente" | "mercado";

export type PrecioSugerido = {
  monto: number | null;    // mediana del precio de venta historico; null sin comparables
  montoMin: number | null; // percentil 25 (piso del rango tipico)
  montoMax: number | null; // percentil 75 (techo del rango tipico)
  muestras: number;        // cantidad de lineas historicas que respaldan la estadistica; 0 = sin sugerencia
  moneda: Moneda;          // espeja la del query
  alcance: AlcancePrecioSugerido; // "cliente" si salio del historial del cliente; "mercado" si general/fallback
  ajustadoPorPeso: boolean; // true = solo comparables dentro del rango de peso; false = referencia aproximada de la ruta
  comparables: ComparablePrecioSugerido[]; // evidencia (capeada a 10); [] sin comparables
};

// El transporte de la linea: ruta + vehiculo + los items fisicos que mueve.
// Antes era un objeto plano con dimensiones unicas; ahora las dimensiones bajan a cargas[].
export type CargaHijo = {
  id: string;
  origen: string | null;
  destino: string | null;
  tipoVehiculo: string | null;
  cargas: CargaItem[];
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

// --- CargoAdicional (nivel SECCION o LINEA) ---
// monto: calculado por el backend (cantidad × precioUnitario); SOLO LECTURA — nunca se envia.
export type CargoAdicional = {
  id: string;
  descripcion: string;
  unidadCobro: UnidadCobro;
  cantidad: number;   // > 0
  precioUnitario: number; // >= 0
  monto: number;     // backend-calculated; READ-ONLY
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
  descripcion: string | null; // nombre/identificacion de la linea (opcional; en TRANSPORTE suele venir null)
  cantidad: number;
  precioBase: number;       // precio base de la empresa por unidad (input, >= 0)
  margenPct: number;        // margen sobre la venta en % (input, 0 <= x < 100)
  precioVenta: number;      // calculado por el backend: precioBase / (1 − margenPct/100), 2 decimales (solo lectura)
  precioVentaTotal: number; // calculado por el backend: precioVenta × cantidad (solo lectura)
  idSeccion: string | null;
  carga?: CargaHijo;
  equipo?: EquipoHijo;
  almacenaje?: AlmacenajeHijo;
  personal?: PersonalHijo;
  cargosAdicionales?: CargoAdicional[]; // cargos a nivel de linea (optional — legacy safe)
};

export type Version = {
  numeroVersion: number;
  moneda: Moneda;        // unica moneda de la version (antes era por linea)
  congelada: boolean;
  motivo: string | null;
  montoBase: number | null;  // Σ (precioBase × cantidad) de las lineas activas (total sin margen); calculado por el backend
  montoTotal: number | null; // Σ subtotal de las secciones activas (total de venta, con margen); calculado por el backend. Ganancia = montoTotal − montoBase
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
  origenNombre: string;
  contactoOrigenId: string;
  estado: EstadoCotizacion;
  motivoPerdida: string | null;
  ejecutivoResponsable: EjecutivoRef;
  solicitudClienteId: string | null;
  numeroCotizacion: number | null;
  anioCotizacion: number | null;
  codigoCotizacion: string | null;
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
  margenPct: number | null;
  moneda: Moneda | null;
  requiereAprobacion: boolean;
  documentacionRequerida: string[];
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaModificacion: string | null;
};

// CotizacionResumen — listado (GET /cotizaciones, API §5.2). Plano, sin versiones[].

export type CotizacionResumen = {
  id: string;
  codigoCotizacion: string | null;
  numeroCotizacion: number | null;
  anioCotizacion: number | null;
  estado: EstadoCotizacion;
  motivoPerdida: string | null;
  origenTipo: OrigenTipo;
  origenId: string;
  origenNombre: string;
  ejecutivoResponsable: EjecutivoRef;
  solicitudClienteId: string | null;
  moneda: Moneda | null;
  montoTotal: number | null;
  versionVigente: number | null;
  totalVersiones: number;
  fechaEnvio: string | null;
  fechaVencimiento: string | null;
  fechaCreacion: string;
  fechaModificacion: string | null;
};

// ---------------------------------------------------------------------------
// KPIs del pipeline (GET /cotizaciones/resumen)
// ---------------------------------------------------------------------------

// Contadores agregados del pipeline. Invariante backend:
//   enPreparacion + enviadas + ganadas + perdidas === total
export type ResumenCotizaciones = {
  total: number;
  enPreparacion: number;
  enviadas: number;
  ganadas: number;
  perdidas: number;
};

// ---------------------------------------------------------------------------
// Paginacion propia (NO reutiliza RespuestaPaginada de compartido — forma distinta)
// ---------------------------------------------------------------------------

export type RespuestaPaginadaCotizaciones = {
  data: CotizacionResumen[];
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
  // `bucket` y `estado` son mutuamente excluyentes en el backend (400 si van
  // juntos). La UI usa `bucket` (KPIs clicables); `estado` queda por compat.
  bucket?: BucketCotizacion;
  origenTipo?: OrigenTipo;
  idEjecutivoResponsable?: string;
  busqueda?: string;
  pagina?: number;
  porPagina?: number;
};

// Filtros de contexto que acepta /resumen (no pagina ni filtra por estado/bucket:
// los KPIs siempre cuentan todo el pipeline bajo el mismo contexto de busqueda).
export type FiltrosResumenCotizaciones = Pick<
  FiltrosCotizaciones,
  "origenTipo" | "idEjecutivoResponsable" | "busqueda"
>;

export type FiltrosModalidades = {
  estado?: EstadoModalidad;
  tipo?: TipoModalidad;
  tipoLinea?: TipoLinea;
  busqueda?: string;
  pagina?: number;
  porPagina?: number;
};

// ---------------------------------------------------------------------------
// Catalogo de cargos adicionales
// ---------------------------------------------------------------------------

export type EstadoCatalogoCargoAdicional = "ACTIVO" | "INACTIVO";

export type CatalogoCargoAdicional = {
  id: string;
  nombre: string;
  descripcion: string | null;
  estado: EstadoCatalogoCargoAdicional;
};

// forma propia (igual que RespuestaPaginadaModalidades, NO el RespuestaPaginada de compartido)
export type RespuestaPaginadaCatalogosCargoAdicional = {
  data: CatalogoCargoAdicional[];
  total: number;
  pagina: number;
  porPagina: number;
};

// ---------------------------------------------------------------------------
// DTOs de escritura — Modalidades
// ---------------------------------------------------------------------------

export type PayloadCrearModalidad = {
  codigo: string;
  nombre: string;
  tipoLinea: TipoLinea;
  unidadCobro: UnidadCobro;
  descripcion?: string;
  tipo?: TipoModalidad;
  tarifaBaseReferencial?: number;
  margenPct?: number;
  moneda?: Moneda;
  requiereAprobacion?: boolean;
  documentacionRequerida?: string[];
};

export type PayloadActualizarModalidad = Partial<PayloadCrearModalidad>;

export type FiltrosCatalogosCargoAdicional = {
  estado?: EstadoCatalogoCargoAdicional;
  busqueda?: string;
  pagina?: number;
  porPagina?: number;
};

// ---------------------------------------------------------------------------
// Catalogo de condiciones de cotizacion
// ---------------------------------------------------------------------------

export type EstadoCatalogoCondicion = "ACTIVO" | "INACTIVO";

export type CategoriaCondicion = "CONSIDERACIONES_SERVICIO" | "TARIFAS_INCLUYEN";

export type ParametroCondicion = {
  nombre: string;
  fuente: "AUTO" | "MANUAL";
  tipoEntrada?: "ENUM" | "TEXTO";
  opciones?: string[];
};

export type CatalogoCondicion = {
  id: string;
  titulo: string;
  texto: string;
  categoria: CategoriaCondicion;
  parametros: ParametroCondicion[];
  esConstante: boolean;
  ordenSugerido: number;
  estado: EstadoCatalogoCondicion;
};

export type RespuestaPaginadaCatalogosCondicion = {
  data: CatalogoCondicion[];
  total: number;
  pagina: number;
  porPagina: number;
};

export type FiltrosCatalogosCondicion = {
  estado?: EstadoCatalogoCondicion;
  categoria?: CategoriaCondicion;
  busqueda?: string;
  pagina?: number;
  porPagina?: number;
};

// ---------------------------------------------------------------------------
// DTOs de escritura (write model — anidado, lo que acepta el backend)
// CRITICO: NUNCA enviar idSeccion, precioVenta, precioVentaTotal ni totales (los calcula el backend).
// `precioBase` y `margenPct` (ambos requeridos) y `cantidad` (opcional, default 1) SI se envian a
// nivel de linea; el backend calcula `precioVenta = precioBase / (1 − margenPct/100)` y
// `precioVentaTotal = precioVenta × cantidad`.
// ---------------------------------------------------------------------------

// --- PayloadLeadTime (nivel version) ---
export type PayloadLeadTime = {
  descripcion: string;
  diasMin: number;
  diasMax?: number; // omitido = plazo exacto
  orden?: number;
};

// --- PayloadCargoAdicional (nivel seccion o linea) ---
// NUNCA incluir monto — el backend lo calcula (cantidad × precioUnitario).
// El tipo estructuralmente excluye monto para que el compilador rechace cualquier asignacion accidental.
export type PayloadCargoAdicional = {
  descripcion: string;
  unidadCobro: UnidadCobro;
  cantidad: number;
  precioUnitario: number;
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
// Item fisico del request: nombre requerido (no vacio); dimensiones y peso opcionales.
export type PayloadCargaItem = {
  nombre: string;
  largoM?: number;
  anchoM?: number;
  altoM?: number;
  peso?: number;
  unidadPeso?: UnidadPeso;
  orden?: number;
};

export type PayloadCargaHijo = {
  origen?: string;
  destino?: string;
  tipoVehiculo?: string;
  cargas?: PayloadCargaItem[];
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

// Linea sin idSeccion ni totales. `precioBase` (requerido, >=0), `margenPct` (requerido,
// 0 <= x < 100) y `cantidad` (entero >=1, default 1) SI se envian — el backend calcula
// precioVenta = precioBase / (1 − margenPct/100) y precioVentaTotal = precioVenta × cantidad.
// NUNCA enviar moneda en linea — moneda es de version.
// cargosAdicionales a nivel linea: ahora permitidos (contrato bc03).
export type PayloadLinea = {
  idModalidad: string;
  tipoLinea: TipoLinea;
  descripcion?: string; // opcional; el backend convierte vacio/espacios a null
  precioBase: number;
  margenPct: number;
  cantidad?: number;
  carga?: PayloadCargaHijo;
  equipo?: PayloadEquipoHijo;
  almacenaje?: PayloadAlmacenajeHijo;
  personal?: PayloadPersonalHijo;
  cargosAdicionales?: PayloadCargoAdicional[];
};

// Seccion con lineas y cargosAdicionales anidados
// NUNCA incluir standbys en una seccion
export type PayloadSeccion = {
  nombre?: string;
  orden?: number;
  lineas?: PayloadLinea[];
  cargosAdicionales?: PayloadCargoAdicional[];
};

// Borrador: moneda + secciones + standbys raiz + leadTimes raiz.
// Contrato 2026-06-08 (§5.4): NO existe canal de lineas raiz — toda linea va
// dentro de secciones[].lineas; el caso "plano" es una seccion sin nombre.
// standbys[] raiz = standbys de la version (informativo, no suman al total)
// leadTimes[] raiz = plazos de entrega de la version
export type PayloadBorrador = {
  moneda?: Moneda;       // default PEN en el backend
  secciones?: PayloadSeccion[];
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

export function etiquetaCodigoCotizacion(
  cotizacion: { codigoCotizacion: string | null; estado: EstadoCotizacion }
): string {
  if (cotizacion.codigoCotizacion) return cotizacion.codigoCotizacion;
  return cotizacion.estado === "BORRADOR" ? "Borrador" : "—";
}
