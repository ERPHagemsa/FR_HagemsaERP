// Transformaciones puras read-model ↔ draft ↔ write-model para el editor de borrador.
// NO importar nada de React ni de servicios aqui — solo tipos y logica pura.
//
// ADR-9: asimetria read↔write explícita.
//   Read model: PLANO  — lineas[] llevan idSeccion, secciones[] son cabeceras.
//   Write model: ANIDADO — lineas viven dentro de secciones[].lineas; el cliente NUNCA envia idSeccion.
// ADR-10: draft completo se reenvía siempre (replacement idempotente).
// ADR-D1: la seccion por defecto (nombre null) se modela explicitamente en el draft con esDefecto:true.
// ADR-D2 (revisado 2026-06): NO hay canal de lineas raiz. Toda seccion (incluida la
//   por defecto) se emite en secciones[]; la por defecto viaja SIN nombre (caso plano).

import type {
  CargaHijo,
  CargaItem,
  FuenteTipoUnidad,
  UnidadPeso,
  EquipoHijo,
  AlmacenajeHijo,
  UnidadPeriodo,
  PersonalHijo,
  Linea,
  CargoAdicional,
  TipoLinea,
  Moneda,
  UnidadCobro,
  Version,
  PayloadBorrador,
  PayloadLinea,
  PayloadSeccion,
  PayloadCargoAdicional,
  PayloadCargaHijo,
  PayloadCargaItem,
  PayloadEquipoHijo,
  PayloadAlmacenajeHijo,
  PayloadPersonalHijo,
} from "../tipos/cotizaciones.tipos";

// ---------------------------------------------------------------------------
// Tipos del draft client-side
// ---------------------------------------------------------------------------

export type DraftCargoAdicional = {
  claveCliente: string; // clave efimera UI
  nombre: string;       // qué cargo es (del catalogo, obligatorio)
  descripcion: string;  // texto libre opcional ("" = sin descripcion)
  unidadCobro: UnidadCobro; // unidad de cobro del cargo
  cantidad: string;          // input numerico como string (> 0)
  precioUnitario: string;    // input numerico como string (>= 0)
  standbyDia: string;        // stand-by por dia (input numerico como string; "" = sin stand-by)
  // Lead time del cargo (dias enteros). "" en diasMin = sin lead time; esRango
  // false => plazo exacto (no se emite max).
  leadTimeDiasMin: string;
  leadTimeDiasMax: string;
  leadTimeEsRango: boolean;
  // monto derivado: cantidad × precioUnitario — NO almacenar; calcular en el componente via montoCargo()
  orden: number;
};

// Item fisico del transporte (campos numericos como string para los inputs).
export type DraftCargaItem = {
  claveCliente: string; // clave efimera UI
  nombre: string;
  largoM: string;
  anchoM: string;
  altoM: string;
  peso: string;
  unidadPeso: UnidadPeso;
  orden: number;
};

export type DraftCargaHijo = {
  origen: string;
  destino: string;
  // IDs de ubicacion del maestro (BC-14) de la ruta. En lectura los resuelve el backend
  // (GET cotizacion); en sesion los siembra el picker de la seccion. SOLO alimentan el
  // precio sugerido: NUNCA se envian en el borrador (cargaAPayload manda solo texto). "" =
  // sin id (ruta a mano o cotizacion sin resolver aun) → el precio sugerido degrada.
  origenUbicacionId: string;
  destinoUbicacionId: string;
  // Snapshot del tipo de unidad elegido del maestro (select). fuenteTipoUnidad "" e
  // idTipoUnidad "" = sin seleccion (bloqueado por validarBorrador en TRANSPORTE). El
  // nombre se conserva para display; el backend lo recongela al guardar.
  fuenteTipoUnidad: FuenteTipoUnidad | "";
  idTipoUnidad: string;
  tipoUnidadNombre: string;
  cargas: DraftCargaItem[]; // 0..N items fisicos transportados
};

export type DraftEquipoHijo = {
  equipoTipo: string;
  marca: string;
  modelo: string;
  capacidad: string;
  horasMinimas: string;
  diasContratoMin: string;
};

export type DraftAlmacenajeHijo = {
  areaM2: string;
  periodo: string;
  unidadPeriodo: UnidadPeriodo | "";
  descripcion: string;
};

export type DraftPersonalHijo = {
  rol: string;
};

export type DraftLinea = {
  claveCliente: string;
  idModalidad: string;
  tipoLinea: TipoLinea;
  descripcion: string; // nombre/identificacion de la linea
  cantidad: string; // entero >=1
  precioBase: string; // requerido (>=0) — precio base de la empresa por unidad
  margenPct: string;  // requerido (0 <= x < 100) — margen sobre la venta en %; se precarga de la modalidad
  standbyDia: string; // stand-by por dia (input numerico como string; "" = sin stand-by); solo TRANSPORTE
  // Lead time (tiempo de transito de la ruta, en dias enteros); solo TRANSPORTE.
  // "" en diasMin = sin lead time; esRango false => plazo exacto (no se emite max).
  leadTimeDiasMin: string;
  leadTimeDiasMax: string; // "" = plazo exacto (no se emite)
  leadTimeEsRango: boolean; // UI toggle: false => plazo exacto; true => rango
  // Hijos polimorficos (solo uno se usa segun tipoLinea; los demas ignorados en armarPayload)
  carga: DraftCargaHijo;
  equipo: DraftEquipoHijo;
  almacenaje: DraftAlmacenajeHijo;
  personal: DraftPersonalHijo;
  cargosAdicionales: DraftCargoAdicional[]; // cargos a nivel de linea (arco exclusivo: linea XOR seccion)
};

export type DraftSeccion = {
  claveCliente: string; // seeded desde seccion.id del backend durante esta sesion
  esDefecto: boolean;   // true para la seccion por defecto (nombre null en el backend)
  nombre: string;
  // Ruta a nivel de SECCION (UX): se captura una sola vez en la seccion y todas sus
  // lineas de transporte la heredan (el backend la sigue persistiendo en cada LineaCarga).
  // Vacio = sin ruta (secciones de servicios no-transporte).
  origen: string;
  destino: string;
  // IDs del maestro de ubicaciones (BC-14) de la ruta, cuando se eligio del maestro.
  // SOLO alimentan el precio sugerido (lectura): NUNCA entran a armarPayloadBorrador. "" =
  // ruta escrita a mano o cotizacion vieja (sin id) → el precio sugerido degrada a "sin
  // sugerencia". No sobreviven al guardar/refetch (el write-model no los persiste).
  origenUbicacionId: string;
  destinoUbicacionId: string;
  orden: number;
  // Descuento comercial de la seccion, en %. 0 = sin descuento. Se aplica sobre
  // la venta; el backend recalcula el neto y el total.
  descuentoPct: number;
  lineas: DraftLinea[];
  cargosAdicionales: DraftCargoAdicional[];
};

export type DraftBorrador = {
  moneda: Moneda;            // nivel version
  validezDias: number;       // dias de validez de la cotizacion (default 10)
  secciones: DraftSeccion[]; // incluye la seccion por defecto (esDefecto:true) si existe
};

// Ruta de la seccion que heredan sus lineas de transporte. Lleva el texto (origen/destino)
// y los ids del maestro de ubicaciones para el precio sugerido; los ids son "" cuando la
// ruta se escribio a mano o viene de una cotizacion guardada (sin id).
export type RutaSeccion = {
  origen: string;
  destino: string;
  origenUbicacionId: string;
  destinoUbicacionId: string;
};

// ---------------------------------------------------------------------------
// Modo de servicio de la cotizacion (SOLO frontend)
// ---------------------------------------------------------------------------
// El "tipo de servicio" (tipoLinea) se persiste POR LINEA, pero en la UI la
// cotizacion se arranca eligiendo un modo global: TRANSPORTE (lineas de
// transporte) u OTROS (servicios no-transporte, por defecto alquiler de equipo).
// El modo NO se persiste: solo siembra la linea inicial y acota el selector de
// tipo de servicio por linea. En el flujo de edicion de una cotizacion ya
// existente no aplica (el modo llega undefined y el selector muestra todos).
export type ModoServicio = "TRANSPORTE" | "OTROS";

// Tipo de linea inicial segun el modo: TRANSPORTE → transporte; OTROS → alquiler
// de equipo (default de los servicios no-transporte).
export function tipoLineaInicial(modo: ModoServicio): TipoLinea {
  return modo === "TRANSPORTE" ? "TRANSPORTE" : "ALQUILER_EQUIPO";
}

// ---------------------------------------------------------------------------
// Valores por defecto para hijos polimorficos
// ---------------------------------------------------------------------------

function cargaVacia(): DraftCargaHijo {
  return {
    origen: "",
    destino: "",
    origenUbicacionId: "",
    destinoUbicacionId: "",
    fuenteTipoUnidad: "",
    idTipoUnidad: "",
    tipoUnidadNombre: "",
    cargas: [],
  };
}

export function cargaItemVacio(): DraftCargaItem {
  return {
    claveCliente: crypto.randomUUID(),
    nombre: "",
    largoM: "",
    anchoM: "",
    altoM: "",
    peso: "",
    unidadPeso: "TN",
    orden: 0,
  };
}

function equipoVacio(): DraftEquipoHijo {
  return {
    equipoTipo: "",
    marca: "",
    modelo: "",
    capacidad: "",
    horasMinimas: "",
    diasContratoMin: "",
  };
}

function almacenajeVacio(): DraftAlmacenajeHijo {
  return { areaM2: "", periodo: "", unidadPeriodo: "", descripcion: "" };
}

function personalVacio(): DraftPersonalHijo {
  return { rol: "" };
}

export function lineaVacia(tipoLinea: TipoLinea = "TRANSPORTE"): DraftLinea {
  return {
    claveCliente: crypto.randomUUID(),
    idModalidad: "",
    tipoLinea,
    descripcion: "",
    cantidad: "1",
    precioBase: "0",
    margenPct: "0",
    standbyDia: "",
    leadTimeDiasMin: "",
    leadTimeDiasMax: "",
    leadTimeEsRango: false,
    carga: cargaVacia(),
    equipo: equipoVacio(),
    almacenaje: almacenajeVacio(),
    personal: personalVacio(),
    cargosAdicionales: [],
  };
}

export function cargoAdicionalVacio(): DraftCargoAdicional {
  return {
    claveCliente: crypto.randomUUID(),
    nombre: "",
    descripcion: "",
    unidadCobro: "SERVICIO",
    cantidad: "1",
    precioUnitario: "0",
    standbyDia: "",
    leadTimeDiasMin: "",
    leadTimeDiasMax: "",
    leadTimeEsRango: false,
    orden: 0,
  };
}

/**
 * montoCargo — calcula el monto de un DraftCargoAdicional (cantidad × precioUnitario).
 * Funcion pura; usada por CargoDetalleModal/ListaCargos y por los subtotales del
 * editor para evitar derivar la formula.
 */
export function montoCargo(c: DraftCargoAdicional): number {
  return (parseFloat(c.cantidad) || 0) * (parseFloat(c.precioUnitario) || 0);
}

/**
 * precioVentaLinea — espejo del calculo del backend para mostrar el precio de venta
 * por unidad en la UI: precioBase / (1 − margenPct/100), redondeado a 2 decimales.
 * El margen se clampa a [0, 100): un margen >= 100 anularia el divisor (venta infinita),
 * asi que devolvemos 0 en ese caso (la validacion ya lo rechaza antes de enviar).
 */
export function precioVentaLinea(l: Pick<DraftLinea, "precioBase" | "margenPct">): number {
  const base = parseFloat(l.precioBase) || 0;
  const margen = parseFloat(l.margenPct) || 0;
  if (margen >= 100 || margen < 0) return 0;
  const venta = base / (1 - margen / 100);
  return Math.round(venta * 100) / 100;
}

/** totalVentaLinea — precioVenta × cantidad (espejo de precioVentaTotal del backend). */
export function totalVentaLinea(l: Pick<DraftLinea, "precioBase" | "margenPct" | "cantidad">): number {
  return precioVentaLinea(l) * (parseFloat(l.cantidad) || 0);
}

export function seccionVacia(esDefecto = false): DraftSeccion {
  return {
    claveCliente: crypto.randomUUID(),
    esDefecto,
    nombre: "",
    origen: "",
    destino: "",
    origenUbicacionId: "",
    destinoUbicacionId: "",
    orden: 0,
    descuentoPct: 0,
    lineas: [],
    cargosAdicionales: [],
  };
}

export function seccionDefectoVacia(): DraftSeccion {
  return seccionVacia(true);
}

/**
 * sincronizarRutaSeccion — propaga la ruta (origen/destino) de la seccion a la carga
 * de TODAS sus lineas de transporte. La seccion es la unica fuente de verdad de la ruta;
 * las lineas de transporte la heredan. Las lineas no-transporte quedan intactas.
 * Devuelve una nueva seccion (inmutable) lista para reemplazar a la anterior.
 */
export function sincronizarRutaSeccion(seccion: DraftSeccion): DraftSeccion {
  return {
    ...seccion,
    lineas: seccion.lineas.map((l) =>
      l.tipoLinea === "TRANSPORTE"
        ? {
            ...l,
            carga: {
              ...l.carga,
              origen: seccion.origen,
              destino: seccion.destino,
              // Los ids acompañan al texto: alimentan el precio sugerido y ademas
              // viajan al backend, que los usa para distinguir una ubicacion
              // elegida de un nombre escrito a mano.
              origenUbicacionId: seccion.origenUbicacionId,
              destinoUbicacionId: seccion.destinoUbicacionId,
            },
          }
        : l
    ),
  };
}

// ---------------------------------------------------------------------------
// derivarDraft: read model (PLANO) → DraftBorrador (client-side)
// Con migracion graceful de shapes viejos (ADR-D3)
// ---------------------------------------------------------------------------

function cargoAdicionalReadADraft(c: CargoAdicionalCompat): DraftCargoAdicional {
  // Migracion graceful: shapes viejos {descripcion, monto} sin unidadCobro/cantidad/precioUnitario.
  // Si faltan los campos nuevos, derivar precioUnitario de monto (con cantidad = 1)
  // para que cantidad × precioUnitario reproduzca el monto legado.
  const unidadCobro: UnidadCobro = c.unidadCobro ?? "SERVICIO";
  const cantidad = c.cantidad !== undefined ? String(c.cantidad) : "1";
  const precioUnitario = c.precioUnitario !== undefined
    ? String(c.precioUnitario)
    : String(c.monto ?? 0);
  return {
    claveCliente: c.id,
    // Compat: shapes viejos guardaban el nombre en `descripcion`. Si no hay
    // `nombre`, cae al `descripcion` legado; `descripcion` queda como texto libre.
    nombre: c.nombre ?? c.descripcion ?? "",
    descripcion: c.nombre != null ? c.descripcion ?? "" : "",
    unidadCobro,
    cantidad,
    precioUnitario,
    standbyDia: c.standbyDia != null ? String(c.standbyDia) : "",
    leadTimeDiasMin: c.leadTimeDiasMin != null ? String(c.leadTimeDiasMin) : "",
    leadTimeDiasMax: c.leadTimeDiasMax != null ? String(c.leadTimeDiasMax) : "",
    leadTimeEsRango: c.leadTimeDiasMax != null,
    orden: c.orden,
  };
}

// Migracion graceful (ADR-D3): el shape viejo de carga tenia las dimensiones y el peso
// aplastados en la raiz (largoM/anchoM/altoM/pesoTn) y no existia cargas[]. Si llega ese
// shape, lo envolvemos en un unico CargaItem para no perder datos de cotizaciones previas.
type CargaHijoCompat = CargaHijo & {
  largoM?: number | null;
  anchoM?: number | null;
  altoM?: number | null;
  pesoTn?: number | null;
};

function cargaItemReadADraft(c: CargaItem): DraftCargaItem {
  return {
    claveCliente: c.id,
    nombre: c.nombre ?? "",
    largoM: c.largoM !== null ? String(c.largoM) : "",
    anchoM: c.anchoM !== null ? String(c.anchoM) : "",
    altoM: c.altoM !== null ? String(c.altoM) : "",
    peso: c.peso !== null ? String(c.peso) : "",
    unidadPeso: c.unidadPeso ?? "TN",
    orden: c.orden,
  };
}

function cargaReadADraft(c: CargaHijoCompat): DraftCargaHijo {
  let cargas: DraftCargaItem[];
  if (Array.isArray(c.cargas) && c.cargas.length > 0) {
    cargas = c.cargas.map(cargaItemReadADraft);
  } else if (
    // Shape viejo: dimensiones/peso en la raiz, sin cargas[] → envolver en un item.
    (c.largoM ?? null) !== null ||
    (c.anchoM ?? null) !== null ||
    (c.altoM ?? null) !== null ||
    (c.pesoTn ?? null) !== null
  ) {
    const item = cargaItemVacio();
    item.nombre = "Carga 1";
    item.largoM = c.largoM != null ? String(c.largoM) : "";
    item.anchoM = c.anchoM != null ? String(c.anchoM) : "";
    item.altoM = c.altoM != null ? String(c.altoM) : "";
    item.peso = c.pesoTn != null ? String(c.pesoTn) : "";
    item.unidadPeso = "TN";
    cargas = [item];
  } else {
    cargas = [];
  }
  return {
    origen: c.origen ?? "",
    destino: c.destino ?? "",
    origenUbicacionId: c.origenUbicacionId ?? "",
    destinoUbicacionId: c.destinoUbicacionId ?? "",
    fuenteTipoUnidad: c.fuenteTipoUnidad ?? "",
    idTipoUnidad: c.idTipoUnidad ?? "",
    tipoUnidadNombre: c.tipoUnidadNombre ?? "",
    cargas,
  };
}

function equipoReadADraft(e: EquipoHijo): DraftEquipoHijo {
  return {
    equipoTipo: e.equipoTipo ?? "",
    marca: e.marca ?? "",
    modelo: e.modelo ?? "",
    capacidad: e.capacidad ?? "",
    horasMinimas: e.horasMinimas !== null ? String(e.horasMinimas) : "",
    diasContratoMin: e.diasContratoMin !== null ? String(e.diasContratoMin) : "",
  };
}

function almacenajeReadADraft(a: AlmacenajeHijo): DraftAlmacenajeHijo {
  return {
    areaM2: a.areaM2 !== null ? String(a.areaM2) : "",
    periodo: a.periodo !== null ? String(a.periodo) : "",
    unidadPeriodo: a.unidadPeriodo ?? "",
    descripcion: a.descripcion ?? "",
  };
}

function personalReadADraft(p: PersonalHijo): DraftPersonalHijo {
  return { rol: p.rol };
}

function lineaReadADraft(l: Linea): DraftLinea {
  return {
    claveCliente: l.id,
    idModalidad: l.idModalidad,
    tipoLinea: l.tipoLinea,
    descripcion: l.descripcion ?? "", // read model ahora puede venir null (descripcion opcional)
    cantidad: String(l.cantidad),
    precioBase: String(l.precioBase),
    margenPct: String(l.margenPct),
    standbyDia: l.standbyDia != null ? String(l.standbyDia) : "",
    leadTimeDiasMin: l.leadTimeDiasMin != null ? String(l.leadTimeDiasMin) : "",
    leadTimeDiasMax: l.leadTimeDiasMax != null ? String(l.leadTimeDiasMax) : "",
    leadTimeEsRango: l.leadTimeDiasMax != null,
    // Poblar el hijo correspondiente; el resto queda en valores por defecto
    carga: l.carga ? cargaReadADraft(l.carga) : cargaVacia(),
    equipo: l.equipo ? equipoReadADraft(l.equipo) : equipoVacio(),
    almacenaje: l.almacenaje ? almacenajeReadADraft(l.almacenaje) : almacenajeVacio(),
    personal: l.personal ? personalReadADraft(l.personal) : personalVacio(),
    // Cargos a nivel de linea: mapear con compat graceful; lineas legacy no tienen este campo.
    cargosAdicionales: (l.cargosAdicionales ?? []).map((c) => cargoAdicionalReadADraft(c as CargoAdicionalCompat)),
  };
}

// Migracion graceful para CargoAdicional: shapes anteriores solo tenian {id, descripcion, monto, orden}.
// Usamos un tipo interseccion con campos opcionales para la compat (patron StandbyCompat).
type CargoAdicionalCompat = Omit<CargoAdicional, "nombre" | "descripcion"> & {
  nombre?: string;             // ausente en shapes legacy (el nombre vivia en descripcion)
  descripcion?: string | null; // texto libre opcional
  unidadCobro?: UnidadCobro;
  cantidad?: number;
  precioUnitario?: number;
};

/**
 * derivarDraft — convierte la version vigente (read model PLANO) al DraftBorrador client-side.
 *
 * ADR-D1: introduce seccion por defecto (esDefecto:true) cuando hay lineas sin seccion explícita.
 * ADR-D3: migracion graceful de shapes viejos (cargos-por-linea → cargosAdicionales de seccion,
 *         moneda-por-linea → version.moneda). El stand-by viaja como standbyDia por linea/cargo.
 * ADR-D4: deteccion de seccion por defecto por nombre === null (NUNCA por idSeccion === null).
 */
export function derivarDraft(version: Version): DraftBorrador {
  // 1. Moneda: tomar de version; fallback PEN para shapes viejos
  const moneda: Moneda = version.moneda ?? "PEN";

  // 2. Crear DraftSeccion por cada Seccion del backend.
  // INVARIANTE: existe a lo sumo UN bucket por defecto (ADR-D1/D4). El modelo solo
  // admite UNA seccion plana (sin nombre) por version; si el backend devuelve varias
  // sin nombre colapsan en ese unico bucket (lineas + cargos). Las secciones CON
  // nombre conservan SUS lineas y SUS cargos: los cargos adicionales son POR SECCION
  // (cada seccion 0..N), nunca globales (API §4/§5.4; tabla cargo_adicional.idSeccion).
  const seccionesMap = new Map<string, DraftSeccion>(); // id backend → draft seccion
  const secciones: DraftSeccion[] = [];
  let defecto: DraftSeccion | null = null;

  // Bucket por defecto (seccion plana). Lazy.
  function asegurarDefecto(orden = 0): DraftSeccion {
    if (!defecto) {
      defecto = { ...seccionDefectoVacia(), orden };
      secciones.push(defecto);
    }
    return defecto;
  }

  for (const s of version.secciones) {
    const cargos = (s.cargosAdicionales ?? []).map(cargoAdicionalReadADraft);
    if (s.nombre === null) {
      // Caso plano: lineas y cargos van al unico bucket por defecto.
      const d = asegurarDefecto(s.orden);
      // El descuento del backend viaja en la sección plana; se conserva en el
      // bucket por defecto (que arranca en 0).
      d.descuentoPct = s.descuentoPct ?? 0;
      d.cargosAdicionales.push(...cargos);
      seccionesMap.set(s.id, d);
    } else {
      // Seccion con nombre: conserva SUS lineas y SUS cargos (cargos por seccion).
      // origen/destino se derivan de las lineas mas abajo (pase 3.5).
      const draftSeccion: DraftSeccion = {
        claveCliente: s.id,
        esDefecto: false,
        nombre: s.nombre,
        // Placeholder: la ruta y sus ids se derivan de las lineas en el pase 3.5.
        origen: "",
        destino: "",
        origenUbicacionId: "",
        destinoUbicacionId: "",
        orden: s.orden,
        descuentoPct: s.descuentoPct ?? 0,
        lineas: [],
        cargosAdicionales: cargos,
      };
      seccionesMap.set(s.id, draftSeccion);
      secciones.push(draftSeccion);
    }
  }

  // Ordenar secciones por orden ascendente
  secciones.sort((a, b) => a.orden - b.orden);

  // 3. Agrupar lineas por idSeccion; lineas sin seccion → bucket por defecto
  for (const l of version.lineas) {
    const draftLinea = lineaReadADraft(l);
    if (l.idSeccion && seccionesMap.has(l.idSeccion)) {
      seccionesMap.get(l.idSeccion)!.lineas.push(draftLinea);
    } else {
      asegurarDefecto().lineas.push(draftLinea);
    }
  }

  // 3.5 Ruta a nivel de seccion: se deriva de la primera linea de transporte con ruta.
  // (El backend guarda la ruta por linea; en la cotizacion todas las lineas de una
  // seccion comparten ruta, asi que tomar la primera con datos es suficiente.)
  for (const s of secciones) {
    const conRuta = s.lineas.find(
      (l) =>
        l.tipoLinea === "TRANSPORTE" &&
        (l.carga.origen !== "" || l.carga.destino !== "")
    );
    if (conRuta) {
      s.origen = conRuta.carga.origen;
      s.destino = conRuta.carga.destino;
      // Ids resueltos por el backend (read-model): habilitan el precio sugerido al editar.
      s.origenUbicacionId = conRuta.carga.origenUbicacionId;
      s.destinoUbicacionId = conRuta.carga.destinoUbicacionId;
    }
  }

  // El stand-by y el lead time ya no son arrays de version: viven como atributos
  // de cada linea (standbyDia y leadTimeDiasMin/leadTimeDiasMax).
  return { moneda, validezDias: version.validezDias ?? 10, secciones };
}

// ---------------------------------------------------------------------------
// armarPayloadBorrador: DraftBorrador → PayloadBorrador (write model ANIDADO)
// ---------------------------------------------------------------------------

function parseNumero(valor: string): number {
  const n = parseFloat(valor);
  return isNaN(n) ? 0 : n;
}

function cargaItemAPayload(c: DraftCargaItem): PayloadCargaItem {
  const payload: PayloadCargaItem = { nombre: c.nombre.trim() };
  if (c.largoM !== "") payload.largoM = parseNumero(c.largoM);
  if (c.anchoM !== "") payload.anchoM = parseNumero(c.anchoM);
  if (c.altoM !== "") payload.altoM = parseNumero(c.altoM);
  if (c.peso !== "") {
    payload.peso = parseNumero(c.peso);
    payload.unidadPeso = c.unidadPeso;
  }
  if (c.orden > 0) payload.orden = c.orden;
  return payload;
}

function cargaAPayload(c: DraftCargaHijo): PayloadCargaHijo {
  const payload: PayloadCargaHijo = {};
  if (c.origen !== "") payload.origen = c.origen;
  if (c.destino !== "") payload.destino = c.destino;
  // El id viaja SOLO si la ubicacion se eligio de las sugerencias: el modal lo
  // limpia al tipear. Su ausencia es informacion, no un descuido — le dice al
  // backend "esta no es necesariamente la que ya esta en el maestro", y por eso
  // abre una temporal a completar al ganar. Antes se descartaban aca y el backend
  // solo veia el nombre: como matcheaba por nombre (case-insensitive), escribir
  // "LIMA" reusaba la "Lima" del maestro con otra direccion.
  if (c.origenUbicacionId !== "") payload.origenUbicacionId = c.origenUbicacionId;
  if (c.destinoUbicacionId !== "") {
    payload.destinoUbicacionId = c.destinoUbicacionId;
  }
  // Snapshot del tipo de unidad: fuente + id opaco viajan juntos. El nombre NO se envia
  // (lo congela el backend). validarBorrador ya bloquea guardar sin seleccion en TRANSPORTE.
  if (c.fuenteTipoUnidad !== "" && c.idTipoUnidad !== "") {
    payload.fuenteTipoUnidad = c.fuenteTipoUnidad;
    payload.idTipoUnidad = c.idTipoUnidad;
  }
  // Descartar items totalmente vacios (sin nombre): el usuario agrego una fila y no la lleno.
  const cargas = c.cargas.filter((it) => it.nombre.trim() !== "");
  if (cargas.length > 0) payload.cargas = cargas.map(cargaItemAPayload);
  return payload;
}

function equipoAPayload(e: DraftEquipoHijo): PayloadEquipoHijo {
  const payload: PayloadEquipoHijo = {};
  if (e.equipoTipo !== "") payload.equipoTipo = e.equipoTipo;
  if (e.marca !== "") payload.marca = e.marca;
  if (e.modelo !== "") payload.modelo = e.modelo;
  if (e.capacidad !== "") payload.capacidad = e.capacidad;
  if (e.horasMinimas !== "") payload.horasMinimas = parseNumero(e.horasMinimas);
  if (e.diasContratoMin !== "") payload.diasContratoMin = parseNumero(e.diasContratoMin);
  return payload;
}

function almacenajeAPayload(a: DraftAlmacenajeHijo): PayloadAlmacenajeHijo {
  const payload: PayloadAlmacenajeHijo = {};
  if (a.areaM2 !== "") payload.areaM2 = parseNumero(a.areaM2);
  if (a.periodo !== "") payload.periodo = parseNumero(a.periodo);
  if (a.unidadPeriodo !== "") payload.unidadPeriodo = a.unidadPeriodo;
  if (a.descripcion.trim() !== "") payload.descripcion = a.descripcion.trim();
  return payload;
}

function personalAPayload(p: DraftPersonalHijo): PayloadPersonalHijo {
  return { rol: p.rol };
}

/**
 * Emite el hijo polimorfico correcto segun tipoLinea.
 * TRANSPORTE → carga; ALQUILER_EQUIPO → equipo; ALMACENAJE → almacenaje; PERSONAL → personal.
 * AGENCIAMIENTO / SERVICIO_AUXILIAR → sin hijo.
 * Emite precioBase (requerido, >=0), margenPct (requerido, 0<=x<100) y cantidad
 * (entero >=1); NUNCA emitir idSeccion, precioVenta, precioVentaTotal, subtotal ni
 * totales (los calcula el backend).
 * NUNCA emitir moneda en linea (moneda es de version).
 * cargosAdicionales a nivel linea: incluir cuando existen (contrato bc03).
 */
function lineaAPayload(l: DraftLinea): PayloadLinea {
  const base: PayloadLinea = {
    idModalidad: l.idModalidad,
    tipoLinea: l.tipoLinea,
    precioBase: parseNumero(l.precioBase),
    margenPct: parseNumero(l.margenPct),
    cantidad: l.cantidad !== "" ? parseNumero(l.cantidad) : 1,
  };

  // descripcion ahora es opcional: solo se emite si el usuario puso algo (trim).
  const descripcion = l.descripcion.trim();
  if (descripcion !== "") base.descripcion = descripcion;

  // stand-by por dia: solo se emite si el usuario puso un valor (vacio = sin stand-by).
  if (l.standbyDia.trim() !== "") base.standbyDia = parseNumero(l.standbyDia);

  // lead time: solo se emite si hay dias minimos; el maximo solo si es rango y no esta vacio.
  if (l.leadTimeDiasMin.trim() !== "") {
    base.leadTimeDiasMin = parseNumero(l.leadTimeDiasMin);
    if (l.leadTimeEsRango && l.leadTimeDiasMax.trim() !== "") {
      base.leadTimeDiasMax = parseNumero(l.leadTimeDiasMax);
    }
  }

  switch (l.tipoLinea) {
    case "TRANSPORTE":
      base.carga = cargaAPayload(l.carga);
      break;
    case "ALQUILER_EQUIPO":
      base.equipo = equipoAPayload(l.equipo);
      break;
    case "ALMACENAJE":
      base.almacenaje = almacenajeAPayload(l.almacenaje);
      break;
    case "PERSONAL":
      base.personal = personalAPayload(l.personal);
      break;
    // AGENCIAMIENTO y SERVICIO_AUXILIAR: sin hijo
  }

  // Cargos a nivel de linea (arco exclusivo: no deben coexistir con los de la seccion padre).
  if (l.cargosAdicionales.length > 0) {
    base.cargosAdicionales = l.cargosAdicionales.map(cargoAdicionalAPayload);
  }

  return base;
}

function cargoAdicionalAPayload(c: DraftCargoAdicional): PayloadCargoAdicional {
  // NUNCA emitir monto — el tipo PayloadCargoAdicional lo excluye estructuralmente.
  const payload: PayloadCargoAdicional = {
    nombre: c.nombre,
    unidadCobro: c.unidadCobro,
    cantidad: parseNumero(c.cantidad),
    precioUnitario: parseNumero(c.precioUnitario),
  };
  // descripcion es texto libre opcional: solo se envia si el usuario la lleno.
  if (c.descripcion.trim() !== "") payload.descripcion = c.descripcion.trim();
  // stand-by por dia: solo si el usuario puso un valor (vacio = sin stand-by).
  if (c.standbyDia.trim() !== "") payload.standbyDia = parseNumero(c.standbyDia);
  // lead time: solo si hay dias minimos; el maximo solo si es rango y no esta vacio.
  if (c.leadTimeDiasMin.trim() !== "") {
    payload.leadTimeDiasMin = parseNumero(c.leadTimeDiasMin);
    if (c.leadTimeEsRango && c.leadTimeDiasMax.trim() !== "") {
      payload.leadTimeDiasMax = parseNumero(c.leadTimeDiasMax);
    }
  }
  if (c.orden > 0) payload.orden = c.orden;
  return payload;
}

/**
 * seccionAPayload — convierte una DraftSeccion a su payload.
 *
 * Contrato 2026-06 (API-Cotizaciones.md §5.4): NO existe canal de lineas raiz.
 * Toda linea va dentro de secciones[].lineas; el caso "plano" (bucket por defecto)
 * es una seccion SIN nombre (se omite `nombre`).
 *
 * Se descarta solo el RUIDO: la seccion por defecto vacia, o una seccion sin nombre
 * y vacia. Una seccion CON nombre (creada a proposito por el usuario) se CONSERVA
 * aunque aun no tenga lineas — se crea primero y luego se le agrega contenido; si se
 * descartara, al reemplazar el borrador desapareceria tras el refetch.
 */
function seccionAPayload(s: DraftSeccion): PayloadSeccion | null {
  const vacia = s.lineas.length === 0 && s.cargosAdicionales.length === 0;
  if (vacia && (s.esDefecto || s.nombre.trim() === "")) {
    return null;
  }
  // La ruta vive en la seccion: la propagamos a la carga de cada linea de transporte
  // antes de emitir (el backend la persiste por linea). Asi es autoritativo aunque la
  // UI no haya sincronizado (ej. linea agregada sin pasar por el modal).
  const sincronizada = s.origen !== "" || s.destino !== "" ? sincronizarRutaSeccion(s) : s;
  const payload: PayloadSeccion = {};
  // La seccion por defecto (esDefecto) viaja sin nombre = seccion "plana".
  if (!sincronizada.esDefecto && sincronizada.nombre !== "") payload.nombre = sincronizada.nombre;
  if (sincronizada.orden > 0) payload.orden = sincronizada.orden;
  // Solo se envia si hay descuento: 0 es el default del backend, no hace falta.
  if (sincronizada.descuentoPct > 0) payload.descuentoPct = sincronizada.descuentoPct;
  if (sincronizada.lineas.length > 0) payload.lineas = sincronizada.lineas.map(lineaAPayload);
  if (sincronizada.cargosAdicionales.length > 0) {
    payload.cargosAdicionales = sincronizada.cargosAdicionales.map(cargoAdicionalAPayload);
  }
  return payload;
}

const UNIDADES_COBRO_VALIDAS: ReadonlySet<string> = new Set([
  "VIAJE", "DIA", "M2", "SERVICIO", "HORA", "TONELADA", "CONTENEDOR", "OTRO",
]);

function validarCargo(
  errores: Record<string, string>,
  c: DraftCargoAdicional,
  prefijo: string,
): void {
  if (c.nombre.trim() === "") {
    errores[`${prefijo}.nombre`] = "El nombre del cargo es obligatorio.";
  }
  if (!UNIDADES_COBRO_VALIDAS.has(c.unidadCobro)) {
    errores[`${prefijo}.unidadCobro`] = "La unidad de cobro es invalida.";
  }
  const cantidadNum = parseFloat(c.cantidad);
  if (isNaN(cantidadNum) || cantidadNum <= 0) {
    errores[`${prefijo}.cantidad`] = "La cantidad debe ser mayor a 0.";
  }
  const precioNum = parseFloat(c.precioUnitario);
  if (isNaN(precioNum) || precioNum < 0) {
    errores[`${prefijo}.precioUnitario`] = "El precio unitario debe ser >= 0.";
  }
  if (c.standbyDia.trim() !== "") {
    const sbNum = parseFloat(c.standbyDia);
    if (isNaN(sbNum) || sbNum < 0) {
      errores[`${prefijo}.standbyDia`] = "El stand-by debe ser >= 0.";
    }
  }
  // Lead time del cargo (opcional): si hay minimo, entero > 0; si es rango, el
  // maximo es obligatorio y entero >= minimo.
  if (c.leadTimeDiasMin.trim() !== "") {
    const ltMin = parseFloat(c.leadTimeDiasMin);
    if (isNaN(ltMin) || ltMin <= 0 || !Number.isInteger(ltMin)) {
      errores[`${prefijo}.leadTimeDiasMin`] =
        "El lead time minimo debe ser un entero de dias mayor a 0.";
    }
    if (c.leadTimeEsRango) {
      if (c.leadTimeDiasMax.trim() === "") {
        errores[`${prefijo}.leadTimeDiasMax`] = "Si es un rango, ingrese los dias maximos.";
      } else {
        const ltMax = parseFloat(c.leadTimeDiasMax);
        if (isNaN(ltMax) || !Number.isInteger(ltMax) || ltMax < ltMin) {
          errores[`${prefijo}.leadTimeDiasMax`] =
            "El lead time maximo debe ser un entero de dias >= al minimo.";
        }
      }
    }
  }
}

// Numeros opcionales de un item de carga: si vienen, deben ser >= 0.
const CAMPOS_NUM_CARGA: ReadonlyArray<keyof Pick<DraftCargaItem, "largoM" | "anchoM" | "altoM" | "peso">> = [
  "largoM", "anchoM", "altoM", "peso",
];

function validarCargaItem(
  errores: Record<string, string>,
  it: DraftCargaItem,
  prefijo: string,
): void {
  const tieneData =
    it.nombre.trim() !== "" ||
    CAMPOS_NUM_CARGA.some((c) => it[c] !== "");
  // Fila totalmente vacia: se descarta en el payload, no se valida.
  if (!tieneData) return;
  if (it.nombre.trim() === "") {
    errores[`${prefijo}.nombre`] = "El nombre de la carga es obligatorio.";
  }
  for (const campo of CAMPOS_NUM_CARGA) {
    const valor = it[campo];
    if (valor !== "") {
      const n = parseFloat(valor);
      if (isNaN(n) || n < 0) {
        errores[`${prefijo}.${campo}`] = "Debe ser un numero mayor o igual a 0.";
      }
    }
  }
}

/**
 * validarBorrador — validaciones client-side previas al envío.
 *
 * - Seccion con nombre obligatorio (EXCEPTO esDefecto — la seccion por defecto no exige nombre).
 * - CargoAdicional (seccion y linea): descripcion no vacia; unidadCobro valida; cantidad > 0; precioUnitario >= 0; standbyDia >= 0 si viene.
 * - Stand-by por linea/cargo: standbyDia >= 0 si viene.
 * - Lead time por linea: si hay diasMin, entero > 0; si es rango, diasMax entero >= diasMin.
 * - Moneda: requerida a nivel version.
 */
export function validarBorrador(draft: DraftBorrador): Record<string, string> {
  const errores: Record<string, string> = {};

  // Moneda
  if (!draft.moneda) {
    errores["moneda"] = "La moneda es obligatoria.";
  }

  // Secciones
  draft.secciones.forEach((s, i) => {
    // Solo las secciones no-defecto exigen nombre
    if (!s.esDefecto && s.nombre.trim() === "") {
      errores[`secciones.${i}.nombre`] = "El nombre de la seccion es obligatorio.";
    }
    // Ruta obligatoria si la seccion tiene lineas de TRANSPORTE (heredan la ruta
    // de la seccion). Los servicios no-transporte no llevan origen/destino.
    const tieneTransporte = s.lineas.some((l) => l.tipoLinea === "TRANSPORTE");
    if (tieneTransporte) {
      if (s.origen.trim() === "") {
        errores[`secciones.${i}.origen`] =
          "El origen es obligatorio para transporte.";
      }
      if (s.destino.trim() === "") {
        errores[`secciones.${i}.destino`] =
          "El destino es obligatorio para transporte.";
      }
    }
    // Lineas: cantidad debe ser un entero >= 1; cargos de la linea
    s.lineas.forEach((l, k) => {
      // Modalidad: obligatoria. El backend la valida como UUID; si va vacia (linea
      // nueva o tras cambiar el tipo de servicio, que resetea idModalidad) rechaza
      // TODO el borrador (guardado por reemplazo). La atajamos aca con mensaje claro.
      if (l.idModalidad.trim() === "") {
        errores[`secciones.${i}.lineas.${k}.idModalidad`] = "La modalidad es obligatoria.";
      }
      if (l.cantidad !== "") {
        const cantidadNum = parseFloat(l.cantidad);
        if (isNaN(cantidadNum) || cantidadNum < 1 || !Number.isInteger(cantidadNum)) {
          errores[`secciones.${i}.lineas.${k}.cantidad`] = "La cantidad debe ser un entero mayor o igual a 1.";
        }
      }
      // Precio base: requerido, >= 0
      const baseNum = parseFloat(l.precioBase);
      if (isNaN(baseNum) || baseNum < 0) {
        errores[`secciones.${i}.lineas.${k}.precioBase`] = "El precio base debe ser >= 0.";
      }
      // Margen: requerido, 0 <= x < 100 (el divisor 1 − margen/100 debe ser > 0)
      const margenNum = parseFloat(l.margenPct);
      if (isNaN(margenNum) || margenNum < 0 || margenNum >= 100) {
        errores[`secciones.${i}.lineas.${k}.margenPct`] = "El margen debe ser >= 0 y menor a 100.";
      }
      // Stand-by por dia (opcional): si viene, debe ser >= 0
      if (l.standbyDia.trim() !== "") {
        const sbNum = parseFloat(l.standbyDia);
        if (isNaN(sbNum) || sbNum < 0) {
          errores[`secciones.${i}.lineas.${k}.standbyDia`] = "El stand-by debe ser >= 0.";
        }
      }
      // Lead time por linea (opcional): si hay dias minimos, entero > 0 (el backend
      // no acepta 0); si es rango, el maximo es obligatorio y entero >= minimo.
      if (l.leadTimeDiasMin.trim() !== "") {
        const ltMin = parseFloat(l.leadTimeDiasMin);
        if (isNaN(ltMin) || ltMin <= 0 || !Number.isInteger(ltMin)) {
          errores[`secciones.${i}.lineas.${k}.leadTimeDiasMin`] =
            "El lead time minimo debe ser un entero de dias mayor a 0.";
        }
        if (l.leadTimeEsRango) {
          if (l.leadTimeDiasMax.trim() === "") {
            errores[`secciones.${i}.lineas.${k}.leadTimeDiasMax`] =
              "Si es un rango, ingrese los dias maximos.";
          } else {
            const ltMax = parseFloat(l.leadTimeDiasMax);
            if (isNaN(ltMax) || !Number.isInteger(ltMax) || ltMax < ltMin) {
              errores[`secciones.${i}.lineas.${k}.leadTimeDiasMax`] =
                "El lead time maximo debe ser un entero de dias >= al minimo.";
            }
          }
        }
      }
      // Items de carga (solo TRANSPORTE): nombre obligatorio, dimensiones/peso >= 0
      if (l.tipoLinea === "TRANSPORTE") {
        // Tipo de unidad: obligatorio. El backend exige fuenteTipoUnidad + idTipoUnidad en la
        // carga (@IsEnum + @IsString/@IsNotEmpty); sin seleccion rechaza TODO el borrador con
        // 400. La atajamos aca con mensaje claro.
        if (l.carga.idTipoUnidad.trim() === "" || l.carga.fuenteTipoUnidad === "") {
          errores[`secciones.${i}.lineas.${k}.carga.idTipoUnidad`] =
            "El tipo de unidad es obligatorio.";
        }
        l.carga.cargas.forEach((it, j) => {
          validarCargaItem(errores, it, `secciones.${i}.lineas.${k}.carga.cargas.${j}`);
        });
      }
      // Almacenaje: el periodo y su unidad van juntos (o ninguno). Uno sin el
      // otro es inconsistente (ej. "6" sin saber si son dias/meses).
      if (l.tipoLinea === "ALMACENAJE") {
        const periodoSet = l.almacenaje.periodo.trim() !== "";
        const unidadSet = l.almacenaje.unidadPeriodo !== "";
        if (periodoSet && !unidadSet) {
          errores[`secciones.${i}.lineas.${k}.almacenaje.unidadPeriodo`] =
            "Elegi la unidad del periodo.";
        } else if (unidadSet && !periodoSet) {
          errores[`secciones.${i}.lineas.${k}.almacenaje.periodo`] =
            "Indica el periodo.";
        }
      }
      // Cargos a nivel de linea
      l.cargosAdicionales.forEach((c, j) => {
        validarCargo(errores, c, `secciones.${i}.lineas.${k}.cargosAdicionales.${j}`);
      });
    });
    // Cargos adicionales de esta seccion
    s.cargosAdicionales.forEach((c, j) => {
      validarCargo(errores, c, `secciones.${i}.cargosAdicionales.${j}`);
    });
  });

  return errores;
}

/**
 * armarPayloadBorrador — convierte DraftBorrador al PayloadBorrador ANIDADO que acepta el backend.
 *
 * Contrato 2026-06: SOLO secciones[]; NO hay canal de lineas raiz. El bucket por
 * defecto se emite como seccion sin nombre (caso plano).
 * Nunca emite: claveCliente, idSeccion, precioVenta, precioVentaTotal, subtotal ni totales.
 * Nunca emite: moneda en linea, cargosAdicionales en raiz. El stand-by va como
 * standbyDia dentro de cada linea/cargo (no hay array de version).
 * El draft completo se re-envía siempre (replacement idempotente — ADR-10).
 */
export function armarPayloadBorrador(draft: DraftBorrador): PayloadBorrador {
  const payload: PayloadBorrador = {};

  // Moneda y dias de validez a nivel version
  payload.moneda = draft.moneda;
  payload.validezDias = draft.validezDias;

  // Solo secciones[] — toda linea va anidada en su seccion (no hay lineas raiz).
  const seccionesPayload = draft.secciones
    .map(seccionAPayload)
    .filter((s): s is PayloadSeccion => s !== null);

  if (seccionesPayload.length > 0) {
    payload.secciones = seccionesPayload;
  }

  return payload;
}
