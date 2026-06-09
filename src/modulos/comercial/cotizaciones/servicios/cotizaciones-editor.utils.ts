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
  EquipoHijo,
  AlmacenajeHijo,
  PersonalHijo,
  Linea,
  Standby,
  CargoAdicional,
  LeadTime,
  TipoLinea,
  Moneda,
  Version,
  PayloadBorrador,
  PayloadLinea,
  PayloadSeccion,
  PayloadStandby,
  PayloadLeadTime,
  PayloadCargoAdicional,
  PayloadCargaHijo,
  PayloadEquipoHijo,
  PayloadAlmacenajeHijo,
  PayloadPersonalHijo,
} from "../tipos/cotizaciones.tipos";

// ---------------------------------------------------------------------------
// Tipos del draft client-side
// ---------------------------------------------------------------------------

export type DraftLeadTime = {
  claveCliente: string; // clave efimera UI
  descripcion: string;
  diasMin: string;      // input numerico como string
  diasMax: string;      // "" = plazo exacto (no se emite diasMax)
  esRango: boolean;     // UI toggle: false => plazo exacto; true => rango
  orden: number;
};

export type DraftCargoAdicional = {
  claveCliente: string; // clave efimera UI
  descripcion: string;
  monto: string;        // input numerico como string (>=0)
  orden: number;
};

export type DraftCargaHijo = {
  largoM: string;
  anchoM: string;
  altoM: string;
  pesoTn: string;
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
  descripcion: string; // nombre/identificacion de la linea
  cantidad: string; // entero >=1
  precioUnitario: string; // requerido (>=0)
  // Hijos polimorficos (solo uno se usa segun tipoLinea; los demas ignorados en armarPayload)
  carga: DraftCargaHijo;
  equipo: DraftEquipoHijo;
  almacenaje: DraftAlmacenajeHijo;
  personal: DraftPersonalHijo;
};

// Contrato 2026-06-06: sin campo unidad. monto = tarifa diaria.
export type DraftStandby = {
  claveCliente: string;
  descripcion: string;
  monto: string;         // tarifa diaria (input numerico como string)
  porLinea: boolean;
  orden: number;
};

export type DraftSeccion = {
  claveCliente: string; // seeded desde seccion.id del backend durante esta sesion
  esDefecto: boolean;   // true para la seccion por defecto (nombre null en el backend)
  nombre: string;
  orden: number;
  lineas: DraftLinea[];
  cargosAdicionales: DraftCargoAdicional[];
};

export type DraftBorrador = {
  moneda: Moneda;            // nivel version
  secciones: DraftSeccion[]; // incluye la seccion por defecto (esDefecto:true) si existe
  standbys: DraftStandby[];  // nivel version
  leadTimes: DraftLeadTime[]; // nivel version
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
    descripcion: "",
    cantidad: "1",
    precioUnitario: "0",
    carga: cargaVacia(),
    equipo: equipoVacio(),
    almacenaje: almacenajeVacio(),
    personal: personalVacio(),
  };
}

export function standbyVacio(): DraftStandby {
  return {
    claveCliente: crypto.randomUUID(),
    descripcion: "",
    monto: "0",
    porLinea: false,
    orden: 0,
  };
}

export function leadTimeVacio(): DraftLeadTime {
  return {
    claveCliente: crypto.randomUUID(),
    descripcion: "",
    diasMin: "0",
    diasMax: "",
    esRango: false,
    orden: 0,
  };
}

export function cargoAdicionalVacio(): DraftCargoAdicional {
  return {
    claveCliente: crypto.randomUUID(),
    descripcion: "",
    monto: "0",
    orden: 0,
  };
}

export function seccionVacia(esDefecto = false): DraftSeccion {
  return {
    claveCliente: crypto.randomUUID(),
    esDefecto,
    nombre: "",
    orden: 0,
    lineas: [],
    cargosAdicionales: [],
  };
}

export function seccionDefectoVacia(): DraftSeccion {
  return seccionVacia(true);
}

// ---------------------------------------------------------------------------
// derivarDraft: read model (PLANO) → DraftBorrador (client-side)
// Con migracion graceful de shapes viejos (ADR-D3)
// ---------------------------------------------------------------------------

function cargoAdicionalReadADraft(c: CargoAdicional): DraftCargoAdicional {
  return {
    claveCliente: c.id,
    descripcion: c.descripcion,
    monto: String(c.monto),
    orden: c.orden,
  };
}

function leadTimeReadADraft(l: LeadTime): DraftLeadTime {
  return {
    claveCliente: l.id,
    descripcion: l.descripcion,
    diasMin: String(l.diasMin),
    diasMax: l.diasMax !== null ? String(l.diasMax) : "",
    esRango: l.diasMax !== null,
    orden: l.orden,
  };
}

function cargaReadADraft(c: CargaHijo): DraftCargaHijo {
  return {
    largoM: c.largoM !== null ? String(c.largoM) : "",
    anchoM: c.anchoM !== null ? String(c.anchoM) : "",
    altoM: c.altoM !== null ? String(c.altoM) : "",
    pesoTn: c.pesoTn !== null ? String(c.pesoTn) : "",
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
    descripcion: l.descripcion,
    cantidad: String(l.cantidad),
    precioUnitario: String(l.precioUnitario),
    // Poblar el hijo correspondiente; el resto queda en valores por defecto
    carga: l.carga ? cargaReadADraft(l.carga) : cargaVacia(),
    equipo: l.equipo ? equipoReadADraft(l.equipo) : equipoVacio(),
    almacenaje: l.almacenaje ? almacenajeReadADraft(l.almacenaje) : almacenajeVacio(),
    personal: l.personal ? personalReadADraft(l.personal) : personalVacio(),
  };
}

// Migracion graceful: el shape viejo del standby tenia recurso/tarifaDia/moneda/idSeccion.
// Usamos un tipo interseccion con campos opcionales del shape viejo para la compat.
type StandbyCompat = Standby & {
  recurso?: string;
  tarifaDia?: number;
};

function standbyReadADraft(s: StandbyCompat): DraftStandby {
  // Migracion: si llega con shape viejo (recurso/tarifaDia), mapear a nuevo
  const descripcion = s.descripcion || s.recurso || "";
  const monto = s.monto !== undefined ? s.monto : (s.tarifaDia ?? 0);
  return {
    claveCliente: s.id,
    descripcion,
    monto: String(monto),
    porLinea: s.porLinea ?? false,
    orden: s.orden,
  };
}

/**
 * derivarDraft — convierte la version vigente (read model PLANO) al DraftBorrador client-side.
 *
 * ADR-D1: introduce seccion por defecto (esDefecto:true) cuando hay lineas sin seccion explícita.
 * ADR-D3: migracion graceful de shapes viejos (cargos-por-linea → cargosAdicionales de seccion,
 *         moneda-por-linea → version.moneda, standby viejo → nuevo shape).
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
      d.cargosAdicionales.push(...cargos);
      seccionesMap.set(s.id, d);
    } else {
      // Seccion con nombre: conserva SUS lineas y SUS cargos (cargos por seccion).
      const draftSeccion: DraftSeccion = {
        claveCliente: s.id,
        esDefecto: false,
        nombre: s.nombre,
        orden: s.orden,
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

  // 4. Standbys: leer version.standbys (nuevo) con compat para shape viejo
  // El tipo Version ya usa standbys; la compat cubre cotizaciones en memoria con shape antiguo.
  const standbysRaw = version.standbys ?? [];
  const standbys: DraftStandby[] = standbysRaw.map((s) => standbyReadADraft(s as StandbyCompat));

  // 5. LeadTimes: nuevo campo; leadTimeDias escalar viejo se descarta (no hay mapeo sensato)
  const leadTimes: DraftLeadTime[] = (version.leadTimes ?? []).map(leadTimeReadADraft);

  return { moneda, secciones, standbys, leadTimes };
}

// ---------------------------------------------------------------------------
// armarPayloadBorrador: DraftBorrador → PayloadBorrador (write model ANIDADO)
// ---------------------------------------------------------------------------

function parseNumero(valor: string): number {
  const n = parseFloat(valor);
  return isNaN(n) ? 0 : n;
}

function cargaAPayload(c: DraftCargaHijo): PayloadCargaHijo {
  const payload: PayloadCargaHijo = {};
  if (c.largoM !== "") payload.largoM = parseNumero(c.largoM);
  if (c.anchoM !== "") payload.anchoM = parseNumero(c.anchoM);
  if (c.altoM !== "") payload.altoM = parseNumero(c.altoM);
  if (c.pesoTn !== "") payload.pesoTn = parseNumero(c.pesoTn);
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
 * Emite precioUnitario (requerido, >=0) y cantidad (entero >=1); NUNCA emitir
 * idSeccion, precioTotal, subtotal ni totales (los calcula el backend).
 * NUNCA emitir moneda ni cargos en linea.
 */
function lineaAPayload(l: DraftLinea): PayloadLinea {
  const base: PayloadLinea = {
    idModalidad: l.idModalidad,
    tipoLinea: l.tipoLinea,
    descripcion: l.descripcion,
    precioUnitario: parseNumero(l.precioUnitario),
    cantidad: l.cantidad !== "" ? parseNumero(l.cantidad) : 1,
  };

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
    descripcion: s.descripcion,
    monto: parseNumero(s.monto),
    porLinea: s.porLinea,
    orden: s.orden,
  };
}

function leadTimeAPayload(l: DraftLeadTime): PayloadLeadTime {
  const payload: PayloadLeadTime = {
    descripcion: l.descripcion,
    diasMin: parseNumero(l.diasMin),
  };
  // diasMax solo si esRango y el campo no esta vacio
  if (l.esRango && l.diasMax !== "") {
    payload.diasMax = parseNumero(l.diasMax);
  }
  if (l.orden > 0) payload.orden = l.orden;
  return payload;
}

function cargoAdicionalAPayload(c: DraftCargoAdicional): PayloadCargoAdicional {
  const payload: PayloadCargoAdicional = {
    descripcion: c.descripcion,
    monto: parseNumero(c.monto),
  };
  if (c.orden > 0) payload.orden = c.orden;
  return payload;
}

/**
 * seccionAPayload — convierte una DraftSeccion a su payload.
 *
 * Contrato 2026-06 (API-Cotizaciones.md §5.4): NO existe canal de lineas raiz.
 * Toda linea va dentro de secciones[].lineas; el caso "plano" (bucket por defecto)
 * es una seccion SIN nombre (se omite `nombre`). Se descartan secciones vacias
 * (sin lineas ni cargos) para no enviar ruido.
 */
function seccionAPayload(s: DraftSeccion): PayloadSeccion | null {
  if (s.lineas.length === 0 && s.cargosAdicionales.length === 0) {
    return null;
  }
  const payload: PayloadSeccion = {};
  // La seccion por defecto (esDefecto) viaja sin nombre = seccion "plana".
  if (!s.esDefecto && s.nombre !== "") payload.nombre = s.nombre;
  if (s.orden > 0) payload.orden = s.orden;
  if (s.lineas.length > 0) payload.lineas = s.lineas.map(lineaAPayload);
  if (s.cargosAdicionales.length > 0) {
    payload.cargosAdicionales = s.cargosAdicionales.map(cargoAdicionalAPayload);
  }
  return payload;
}

/**
 * validarBorrador — validaciones client-side previas al envío.
 *
 * - Seccion con nombre obligatorio (EXCEPTO esDefecto — la seccion por defecto no exige nombre).
 * - LeadTime: descripcion no vacia; diasMax >= diasMin cuando esRango.
 * - CargoAdicional: descripcion no vacia; monto >= 0.
 * - Standby: descripcion no vacia; monto >= 0.
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
    // Lineas: cantidad debe ser un entero >= 1
    s.lineas.forEach((l, j) => {
      if (l.cantidad !== "") {
        const cantidadNum = parseFloat(l.cantidad);
        if (isNaN(cantidadNum) || cantidadNum < 1 || !Number.isInteger(cantidadNum)) {
          errores[`secciones.${i}.lineas.${j}.cantidad`] = "La cantidad debe ser un entero mayor o igual a 1.";
        }
      }
    });
    // Cargos adicionales de esta seccion
    s.cargosAdicionales.forEach((c, j) => {
      if (c.descripcion.trim() === "") {
        errores[`secciones.${i}.cargosAdicionales.${j}.descripcion`] = "La descripcion del cargo es obligatoria.";
      }
      const montoNum = parseFloat(c.monto);
      if (isNaN(montoNum) || montoNum < 0) {
        errores[`secciones.${i}.cargosAdicionales.${j}.monto`] = "El monto debe ser >= 0.";
      }
    });
  });

  // Lead times
  draft.leadTimes.forEach((l, i) => {
    if (l.descripcion.trim() === "") {
      errores[`leadTimes.${i}.descripcion`] = "La descripcion del lead time es obligatoria.";
    }
    const minNum = parseFloat(l.diasMin);
    if (isNaN(minNum) || minNum < 0) {
      errores[`leadTimes.${i}.diasMin`] = "Los dias minimos deben ser >= 0.";
    }
    if (l.esRango && l.diasMax !== "") {
      const maxNum = parseFloat(l.diasMax);
      if (isNaN(maxNum) || maxNum < minNum) {
        errores[`leadTimes.${i}.diasMax`] = "Los dias maximos deben ser >= dias minimos.";
      }
    }
  });

  // Standbys
  draft.standbys.forEach((s, i) => {
    if (s.descripcion.trim() === "") {
      errores[`standbys.${i}.descripcion`] = "La descripcion del standby es obligatoria.";
    }
    const montoNum = parseFloat(s.monto);
    if (isNaN(montoNum) || montoNum < 0) {
      errores[`standbys.${i}.monto`] = "El monto debe ser >= 0.";
    }
  });

  return errores;
}

/**
 * armarPayloadBorrador — convierte DraftBorrador al PayloadBorrador ANIDADO que acepta el backend.
 *
 * Contrato 2026-06: SOLO secciones[]; NO hay canal de lineas raiz. El bucket por
 * defecto se emite como seccion sin nombre (caso plano).
 * Nunca emite: claveCliente, idSeccion, precioTotal, subtotal ni totales.
 * Nunca emite: moneda en linea, cargosAdicionales en raiz, standbys en secciones.
 * El draft completo se re-envía siempre (replacement idempotente — ADR-10).
 */
export function armarPayloadBorrador(draft: DraftBorrador): PayloadBorrador {
  const payload: PayloadBorrador = {};

  // Moneda nivel version
  payload.moneda = draft.moneda;

  // Solo secciones[] — toda linea va anidada en su seccion (no hay lineas raiz).
  const seccionesPayload = draft.secciones
    .map(seccionAPayload)
    .filter((s): s is PayloadSeccion => s !== null);

  if (seccionesPayload.length > 0) {
    payload.secciones = seccionesPayload;
  }

  // Standbys nivel version (NUNCA en secciones)
  if (draft.standbys.length > 0) {
    payload.standbys = draft.standbys.map(standbyAPayload);
  }

  // LeadTimes nivel version
  if (draft.leadTimes.length > 0) {
    payload.leadTimes = draft.leadTimes.map(leadTimeAPayload);
  }

  return payload;
}
