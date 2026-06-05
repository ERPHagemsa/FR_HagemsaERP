// Transformaciones puras read-model ↔ draft ↔ write-model para el editor de borrador.
// NO importar nada de React ni de servicios aqui — solo tipos y logica pura.
//
// ADR-9: asimetria read↔write explícita.
//   Read model: PLANO  — lineas[] llevan idSeccion, secciones[] son cabeceras.
//   Write model: ANIDADO — lineas viven dentro de secciones[].lineas; el cliente NUNCA envia idSeccion.
// ADR-10: draft completo se reenvía siempre (replacement idempotente).

import type {
  Cargo,
  CargaHijo,
  EquipoHijo,
  AlmacenajeHijo,
  PersonalHijo,
  Linea,
  Standby,
  TipoCargo,
  TipoLinea,
  Moneda,
  Version,
  PayloadBorrador,
  PayloadLinea,
  PayloadSeccion,
  PayloadStandby,
  PayloadCargo,
  PayloadCargaHijo,
  PayloadEquipoHijo,
  PayloadAlmacenajeHijo,
  PayloadPersonalHijo,
} from "../tipos/cotizaciones.tipos";

// ---------------------------------------------------------------------------
// Tipos del draft client-side
// ---------------------------------------------------------------------------

export type DraftCargo = {
  claveCliente: string; // clave efimera UI
  tipoCargo: TipoCargo;
  concepto: string;
  monto: number;
  esContingente: boolean;
  orden: number;
};

export type DraftCargaHijo = {
  largoM: string;
  anchoM: string;
  altoM: string;
  pesoTn: string;
  tipoCarga: string;
  origen: string;
  destino: string;
  tipoVehiculo: string;
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
  periodoDias: string;
};

export type DraftPersonalHijo = {
  rol: string;
};

export type DraftLinea = {
  claveCliente: string;
  idModalidad: string;
  tipoLinea: TipoLinea;
  concepto: string;
  moneda: Moneda;
  cantidad: string; // entero >=1; nº de unidades de la linea
  precioUnitario: string; // informativo (N x P/u); "" = sin valor
  costo: string; // string para el input
  precio: string;
  esAlternativa: boolean;
  cargos: DraftCargo[];
  // Hijos polimorficos (solo uno se usa segun tipoLinea; los demas ignorados en armarPayload)
  carga: DraftCargaHijo;
  equipo: DraftEquipoHijo;
  almacenaje: DraftAlmacenajeHijo;
  personal: DraftPersonalHijo;
};

export type DraftStandby = {
  claveCliente: string;
  recurso: string;
  tarifaDia: string;
  moneda: Moneda;
  orden: number;
};

export type DraftSeccion = {
  claveCliente: string; // seeded desde seccion.id del backend durante esta sesion
  nombre: string;
  orden: number;
  lineas: DraftLinea[];
  standby: DraftStandby[];
};

export type DraftBorrador = {
  secciones: DraftSeccion[];
  lineasSinSeccion: DraftLinea[];
  standbySinSeccion: DraftStandby[];
};

// ---------------------------------------------------------------------------
// Valores por defecto para hijos polimorficos
// ---------------------------------------------------------------------------

function cargaVacia(): DraftCargaHijo {
  return {
    largoM: "",
    anchoM: "",
    altoM: "",
    pesoTn: "",
    tipoCarga: "",
    origen: "",
    destino: "",
    tipoVehiculo: "",
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
  return { areaM2: "", periodoDias: "" };
}

function personalVacio(): DraftPersonalHijo {
  return { rol: "" };
}

export function lineaVacia(tipoLinea: TipoLinea = "TRANSPORTE"): DraftLinea {
  return {
    claveCliente: crypto.randomUUID(),
    idModalidad: "",
    tipoLinea,
    concepto: "",
    moneda: "PEN",
    cantidad: "1",
    precioUnitario: "",
    costo: "0",
    precio: "0",
    esAlternativa: false,
    cargos: [],
    carga: cargaVacia(),
    equipo: equipoVacio(),
    almacenaje: almacenajeVacio(),
    personal: personalVacio(),
  };
}

export function standbyVacio(): DraftStandby {
  return {
    claveCliente: crypto.randomUUID(),
    recurso: "",
    tarifaDia: "0",
    moneda: "PEN",
    orden: 0,
  };
}

export function seccionVacia(): DraftSeccion {
  return {
    claveCliente: crypto.randomUUID(),
    nombre: "",
    orden: 0,
    lineas: [],
    standby: [],
  };
}

export function cargoVacio(): DraftCargo {
  return {
    claveCliente: crypto.randomUUID(),
    tipoCargo: "OTRO",
    concepto: "",
    monto: 0,
    esContingente: false,
    orden: 0,
  };
}

// ---------------------------------------------------------------------------
// derivarDraft: read model (PLANO) → DraftBorrador (client-side)
// ---------------------------------------------------------------------------

function cargoReadADraft(c: Cargo): DraftCargo {
  return {
    claveCliente: c.id,
    tipoCargo: c.tipoCargo,
    concepto: c.concepto,
    monto: c.monto,
    esContingente: c.esContingente,
    orden: c.orden,
  };
}

function cargaReadADraft(c: CargaHijo): DraftCargaHijo {
  return {
    largoM: c.largoM !== null ? String(c.largoM) : "",
    anchoM: c.anchoM !== null ? String(c.anchoM) : "",
    altoM: c.altoM !== null ? String(c.altoM) : "",
    pesoTn: c.pesoTn !== null ? String(c.pesoTn) : "",
    tipoCarga: c.tipoCarga ?? "",
    origen: c.origen ?? "",
    destino: c.destino ?? "",
    tipoVehiculo: c.tipoVehiculo ?? "",
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
    periodoDias: a.periodoDias !== null ? String(a.periodoDias) : "",
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
    concepto: l.concepto,
    moneda: l.moneda,
    cantidad: String(l.cantidad),
    precioUnitario: l.precioUnitario !== null ? String(l.precioUnitario) : "",
    costo: String(l.costo),
    precio: String(l.precio),
    esAlternativa: l.esAlternativa,
    cargos: l.cargos.map(cargoReadADraft),
    // Poblar el hijo correspondiente; el resto queda en valores por defecto
    carga: l.carga ? cargaReadADraft(l.carga) : cargaVacia(),
    equipo: l.equipo ? equipoReadADraft(l.equipo) : equipoVacio(),
    almacenaje: l.almacenaje ? almacenajeReadADraft(l.almacenaje) : almacenajeVacio(),
    personal: l.personal ? personalReadADraft(l.personal) : personalVacio(),
  };
}

function standbyReadADraft(s: Standby): DraftStandby {
  return {
    claveCliente: s.id,
    recurso: s.recurso,
    tarifaDia: String(s.tarifaDia),
    moneda: s.moneda,
    orden: s.orden,
  };
}

/**
 * derivarDraft — convierte la version vigente (read model PLANO) al DraftBorrador client-side.
 *
 * 1. Por cada Seccion del read crear un DraftSeccion con claveCliente = seccion.id.
 * 2. Agrupar lineas[] por idSeccion → bucket seccion.lineas; idSeccion null → lineasSinSeccion.
 * 3. Idem para standbyTarifas[] → seccion.standby o standbySinSeccion.
 * 4. Descartar cantidad/precioUnitario/margen/subtotal/totales.
 */
export function derivarDraft(version: Version): DraftBorrador {
  // Indice de secciones por id del backend
  const seccionesMap = new Map<string, DraftSeccion>();
  const secciones: DraftSeccion[] = [];

  for (const s of version.secciones) {
    const draftSeccion: DraftSeccion = {
      claveCliente: s.id,
      nombre: s.nombre ?? "",
      orden: s.orden,
      lineas: [],
      standby: [],
    };
    seccionesMap.set(s.id, draftSeccion);
    secciones.push(draftSeccion);
  }

  // Ordenar secciones por orden ascendente
  secciones.sort((a, b) => a.orden - b.orden);

  const lineasSinSeccion: DraftLinea[] = [];
  for (const l of version.lineas) {
    const draftLinea = lineaReadADraft(l);
    if (l.idSeccion && seccionesMap.has(l.idSeccion)) {
      seccionesMap.get(l.idSeccion)!.lineas.push(draftLinea);
    } else {
      lineasSinSeccion.push(draftLinea);
    }
  }

  const standbySinSeccion: DraftStandby[] = [];
  for (const s of version.standbyTarifas) {
    const draftSb = standbyReadADraft(s);
    if (s.idSeccion && seccionesMap.has(s.idSeccion)) {
      seccionesMap.get(s.idSeccion)!.standby.push(draftSb);
    } else {
      standbySinSeccion.push(draftSb);
    }
  }

  return { secciones, lineasSinSeccion, standbySinSeccion };
}

// ---------------------------------------------------------------------------
// armarPayloadBorrador: DraftBorrador → PayloadBorrador (write model ANIDADO)
// ---------------------------------------------------------------------------

function parseNumero(valor: string): number {
  const n = parseFloat(valor);
  return isNaN(n) ? 0 : n;
}

function cargoAPayload(c: DraftCargo): PayloadCargo {
  return {
    tipoCargo: c.tipoCargo,
    concepto: c.concepto,
    monto: c.monto,
    esContingente: c.esContingente,
    orden: c.orden,
  };
}

function cargaAPayload(c: DraftCargaHijo): PayloadCargaHijo {
  const payload: PayloadCargaHijo = {};
  if (c.largoM !== "") payload.largoM = parseNumero(c.largoM);
  if (c.anchoM !== "") payload.anchoM = parseNumero(c.anchoM);
  if (c.altoM !== "") payload.altoM = parseNumero(c.altoM);
  if (c.pesoTn !== "") payload.pesoTn = parseNumero(c.pesoTn);
  if (c.tipoCarga !== "") payload.tipoCarga = c.tipoCarga;
  if (c.origen !== "") payload.origen = c.origen;
  if (c.destino !== "") payload.destino = c.destino;
  if (c.tipoVehiculo !== "") payload.tipoVehiculo = c.tipoVehiculo;
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
  if (a.periodoDias !== "") payload.periodoDias = parseNumero(a.periodoDias);
  return payload;
}

function personalAPayload(p: DraftPersonalHijo): PayloadPersonalHijo {
  return { rol: p.rol };
}

/**
 * Emite el hijo polimorfico correcto segun tipoLinea.
 * TRANSPORTE → carga; ALQUILER_EQUIPO → equipo; ALMACENAJE → almacenaje; PERSONAL → personal.
 * AGENCIAMIENTO / SERVICIO_AUXILIAR → sin hijo.
 * Emite cantidad (entero >=1) y precioUnitario (solo si tiene valor); NUNCA
 * emitir idSeccion, margen, subtotal ni totales (los calcula el backend).
 */
function lineaAPayload(l: DraftLinea): PayloadLinea {
  const base: PayloadLinea = {
    idModalidad: l.idModalidad,
    tipoLinea: l.tipoLinea,
    concepto: l.concepto,
    moneda: l.moneda,
    cantidad: l.cantidad !== "" ? parseNumero(l.cantidad) : 1,
    costo: parseNumero(l.costo),
    precio: parseNumero(l.precio),
    esAlternativa: l.esAlternativa,
  };

  if (l.precioUnitario !== "") {
    base.precioUnitario = parseNumero(l.precioUnitario);
  }

  if (l.cargos.length > 0) {
    base.cargos = l.cargos.map(cargoAPayload);
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

  return base;
}

function standbyAPayload(s: DraftStandby): PayloadStandby {
  return {
    recurso: s.recurso,
    tarifaDia: parseNumero(s.tarifaDia),
    moneda: s.moneda,
    orden: s.orden,
  };
}

function seccionAPayload(s: DraftSeccion): PayloadSeccion {
  const payload: PayloadSeccion = {};
  if (s.nombre !== "") payload.nombre = s.nombre;
  if (s.orden > 0) payload.orden = s.orden;
  if (s.lineas.length > 0) payload.lineas = s.lineas.map(lineaAPayload);
  if (s.standby.length > 0) payload.standbyTarifas = s.standby.map(standbyAPayload);
  return payload;
}

/**
 * armarPayloadBorrador — convierte DraftBorrador al PayloadBorrador ANIDADO que acepta el backend.
 *
 * Nunca emite: claveCliente, idSeccion, margen, precioUnitario, cantidad, subtotal ni totales.
 * El draft completo se re-envía siempre (replacement idempotente — ADR-10).
 */
export function armarPayloadBorrador(draft: DraftBorrador): PayloadBorrador {
  const payload: PayloadBorrador = {};

  if (draft.secciones.length > 0) {
    payload.secciones = draft.secciones.map(seccionAPayload);
  }

  if (draft.lineasSinSeccion.length > 0) {
    payload.lineas = draft.lineasSinSeccion.map(lineaAPayload);
  }

  if (draft.standbySinSeccion.length > 0) {
    payload.standbyTarifas = draft.standbySinSeccion.map(standbyAPayload);
  }

  return payload;
}
