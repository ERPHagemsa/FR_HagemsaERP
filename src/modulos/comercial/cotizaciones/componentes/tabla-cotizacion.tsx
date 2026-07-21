"use client";

import * as React from "react";

import type { DraftLinea, DraftSeccion } from "../servicios/cotizaciones-editor.utils";

// Tabla de una seccion con el MISMO layout del PDF de cotizacion:
//   Ruta | Unidad | Descripcion | Monto total   (+ Acciones, opcional en edicion)
// - Ruta: una sola celda combinada (rowspan) para toda la seccion (la ruta es de
//   la seccion; todas sus lineas la comparten).
// - Unidad: celda combinada por linea (cubre la linea + sus cargos).
// - Los cargos van como FILAS dentro de la misma tabla (no en un bloque aparte):
//   los de linea ocupan solo Descripcion + Monto; los de seccion ocupan las tres
//   primeras columnas (colspan) + Monto.
// - Ultima fila: SUB-TOTAL de la seccion.
//
// La MISMA tabla se usa en modo lectura (pagina /comercial/cotizaciones/[id]) y en
// el modal de edicion (conAcciones): asi el diseño es identico en ambos lugares.

const SIMBOLO: Record<string, string> = { PEN: "S/", USD: "US$" };

function formatear(monto: number, moneda: string): string {
  const simbolo = SIMBOLO[moneda] ?? "";
  return `${simbolo} ${monto.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export type CargoVista = {
  nombre: string;              // qué cargo es (del catalogo)
  descripcion?: string | null; // texto libre opcional
  monto: number;
  // Cantidad del cargo (se muestra en la columna Cant. cuando `conPrecios`).
  cantidad?: number;
  // Solo con `conAcciones` en cargos de seccion: botones (editar/eliminar).
  acciones?: React.ReactNode;
};

export type LineaVista = {
  unidad: string;
  // Contenido de la celda Descripcion (titulo + cargas/detalle); lo arma cada caller.
  descripcion: React.ReactNode;
  montoTotal: number;
  cargos: CargoVista[];
  // Solo con `conPrecios`: cantidad, precio base por unidad y precio de venta por unidad.
  cantidad?: number;
  precioBase?: number;
  precioVenta?: number;
  // Solo en modo edicion: botones (editar/eliminar) para la columna Acciones,
  // resaltado de la fila en edicion y click sobre la fila para seleccionarla.
  acciones?: React.ReactNode;
  resaltada?: boolean;
  onSeleccionar?: () => void;
};

export type SeccionVista = {
  ruta: string;
  lineas: LineaVista[];
  cargosSeccion: CargoVista[];
  // `subtotal` es el BRUTO (antes de descuento). Cuando `descuentoPct` es > 0 la
  // tabla agrega las filas de descuento y neto; con 0 (o sin él) muestra solo el
  // SUB - TOTAL de siempre.
  subtotal: number;
  descuentoPct?: number;
  subtotalNeto?: number;
};

export function TablaCotizacion({
  seccion,
  moneda,
  conAcciones = false,
  conPrecios = false,
  mostrarRuta = true,
}: {
  seccion: SeccionVista;
  moneda: string;
  // Muestra una columna extra de Acciones y habilita el resaltado/seleccion de filas.
  conAcciones?: boolean;
  // Muestra columnas de Cantidad, Precio base y Precio de venta (por unidad).
  conPrecios?: boolean;
  // Muestra la columna Ruta. Se oculta en servicios no-transporte (sin origen/destino).
  mostrarRuta?: boolean;
}) {
  const filasDeLinea = (l: LineaVista) => 1 + l.cargos.length;
  const totalFilasLineas = seccion.lineas.reduce((s, l) => s + filasDeLinea(l), 0);
  // Columnas base: (Ruta) + Unidad + Descripcion + Monto (+ Cant/P.base/Venta con
  // precios, + Acciones). El grupo de precios se inserta entre Descripcion y Monto.
  const extraPrecios = conPrecios ? 3 : 0;
  const numColumnas = (mostrarRuta ? 4 : 3) + extraPrecios + (conAcciones ? 1 : 0);

  // La celda Ruta (rowspan) cubre TODAS las filas de la seccion: sus lineas (con
  // cargos de linea) Y los cargos de la seccion, para que estos ultimos queden
  // DENTRO de la ruta y no como un bloque aparte debajo. Null cuando no hay ruta.
  const filasRuta = totalFilasLineas + seccion.cargosSeccion.length;
  const celdaRuta = mostrarRuta ? (
    <td
      rowSpan={filasRuta}
      className="px-3 py-2 text-center align-middle font-medium text-muted-foreground"
    >
      {seccion.ruta || "—"}
    </td>
  ) : null;

  return (
    <table className="w-full border-collapse text-sm [&_td]:border [&_td]:border-border/60 [&_th]:border [&_th]:border-border/60">
      <colgroup>
        {mostrarRuta ? (
          <col style={{ width: conPrecios ? "15%" : conAcciones ? "19%" : "21%" }} />
        ) : null}
        <col style={{ width: conPrecios ? "11%" : conAcciones ? "13%" : "14%" }} />
        <col style={{ width: conPrecios ? "31%" : conAcciones ? "45%" : "50%" }} />
        {conPrecios ? (
          <>
            <col style={{ width: "8%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "11%" }} />
          </>
        ) : null}
        <col style={{ width: conPrecios ? "13%" : "15%" }} />
        {conAcciones ? <col style={{ width: "8%" }} /> : null}
      </colgroup>
      <thead>
        <tr className="bg-muted/40 text-xs uppercase text-muted-foreground">
          {mostrarRuta ? (
            <th className="px-3 py-2 text-left font-medium">Ruta</th>
          ) : null}
          <th className="px-3 py-2 text-left font-medium">Concepto</th>
          <th className="px-3 py-2 text-left font-medium">Descripcion</th>
          {conPrecios ? (
            <>
              <th className="px-3 py-2 text-right font-medium">Cant.</th>
              <th className="px-3 py-2 text-right font-medium">P. base</th>
              <th className="px-3 py-2 text-right font-medium">P. Venta</th>
            </>
          ) : null}
          <th className="px-3 py-2 text-right font-medium">Monto total</th>
          {conAcciones ? <th className="w-px px-3 py-2" /> : null}
        </tr>
      </thead>
      <tbody>
        {seccion.lineas.length === 0 ? (
          <tr>
            <td
              colSpan={numColumnas}
              className="px-3 py-6 text-center text-muted-foreground"
            >
              Sin lineas en esta seccion.
            </td>
          </tr>
        ) : (
          seccion.lineas.map((linea, i) => {
            const resaltado = linea.resaltada ? "bg-primary/5" : "";
            return (
              <React.Fragment key={i}>
                <tr
                  className={`align-top ${resaltado} ${
                    linea.onSeleccionar ? "cursor-pointer" : ""
                  }`}
                >
                  {i === 0 ? celdaRuta : null}
                  <td
                    rowSpan={filasDeLinea(linea)}
                    className="px-3 py-2 text-center align-middle font-medium"
                    onClick={linea.onSeleccionar}
                  >
                    {linea.unidad || "—"}
                  </td>
                  <td className="px-3 py-2" onClick={linea.onSeleccionar}>
                    {linea.descripcion}
                  </td>
                  {conPrecios ? (
                    <>
                      <td
                        className="whitespace-nowrap px-3 py-2 text-right tabular-nums"
                        onClick={linea.onSeleccionar}
                      >
                        {linea.cantidad ?? "—"}
                      </td>
                      <td
                        className="whitespace-nowrap px-3 py-2 text-right tabular-nums"
                        onClick={linea.onSeleccionar}
                      >
                        {linea.precioBase != null ? formatear(linea.precioBase, moneda) : "—"}
                      </td>
                      <td
                        className="whitespace-nowrap px-3 py-2 text-right tabular-nums"
                        onClick={linea.onSeleccionar}
                      >
                        {linea.precioVenta != null ? formatear(linea.precioVenta, moneda) : "—"}
                      </td>
                    </>
                  ) : null}
                  <td
                    className="whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums"
                    onClick={linea.onSeleccionar}
                  >
                    {formatear(linea.montoTotal, moneda)}
                  </td>
                  {conAcciones ? (
                    <td
                      rowSpan={filasDeLinea(linea)}
                      className="px-2 py-2 align-middle"
                    >
                      {linea.acciones}
                    </td>
                  ) : null}
                </tr>
                {linea.cargos.map((c, j) => (
                  <tr key={j} className={`align-top ${resaltado}`}>
                    <td colSpan={1} className="px-3 py-2">
                      <CeldaCargo cargo={c} />
                    </td>
                    {conPrecios ? (
                      <>
                        <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                          {c.cantidad ?? "—"}
                        </td>
                        <td colSpan={extraPrecios - 1} />
                      </>
                    ) : null}
                    <td className="whitespace-nowrap px-3 py-2 text-right font-medium tabular-nums">
                      {formatear(c.monto, moneda)}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            );
          })
        )}

        {/* Cargos a nivel seccion: quedan DENTRO de la ruta (la celda Ruta los
            cubre con su rowspan). Ocupan Unidad + Descripcion (colspan 2) + monto.
            Si la seccion no tiene lineas, la primera fila de cargo renderiza la Ruta. */}
        {seccion.cargosSeccion.map((c, i) => (
          <tr key={`cs-${i}`} className="align-top">
            {i === 0 && totalFilasLineas === 0 ? celdaRuta : null}
            <td colSpan={2} className="px-3 py-2">
              <CeldaCargo cargo={c} />
            </td>
            {conPrecios ? (
              <>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                  {c.cantidad ?? "—"}
                </td>
                <td colSpan={extraPrecios - 1} />
              </>
            ) : null}
            <td className="whitespace-nowrap px-3 py-2 text-right font-medium tabular-nums">
              {formatear(c.monto, moneda)}
            </td>
            {conAcciones ? (
              <td className="px-2 py-2 align-middle">{c.acciones}</td>
            ) : null}
          </tr>
        ))}

        {/* Sub-total de la seccion (bruto). Con descuento se convierte en la
            primera de tres filas: SUB - TOTAL → DESCUENTO → NETO. */}
        <FilaCierre
          etiqueta="SUB - TOTAL"
          monto={formatear(seccion.subtotal, moneda)}
          extraPrecios={extraPrecios}
          conAcciones={conAcciones}
        />
        {seccion.descuentoPct && seccion.subtotalNeto != null ? (
          <>
            <FilaCierre
              etiqueta={`DESCUENTO (${formatearPct(seccion.descuentoPct)})`}
              monto={`- ${formatear(seccion.subtotal - seccion.subtotalNeto, moneda)}`}
              extraPrecios={extraPrecios}
              conAcciones={conAcciones}
            />
            <FilaCierre
              etiqueta="NETO"
              monto={formatear(seccion.subtotalNeto, moneda)}
              extraPrecios={extraPrecios}
              conAcciones={conAcciones}
            />
          </>
        ) : null}
      </tbody>
    </table>
  );
}

// Porcentaje sin decimales de mas: "10%" y no "10.00%".
function formatearPct(pct: number): string {
  return `${Number(pct.toFixed(2))}%`;
}

// Una fila de cierre de seccion (SUB - TOTAL / DESCUENTO / NETO): misma grilla
// que las de datos para que la columna de monto quede alineada.
function FilaCierre({
  etiqueta,
  monto,
  extraPrecios,
  conAcciones,
}: {
  etiqueta: string;
  monto: string;
  extraPrecios: number;
  conAcciones?: boolean;
}) {
  return (
    <tr className="bg-muted/30">
      <td colSpan={2} className="border-0 bg-background" />
      <td colSpan={1 + extraPrecios} className="px-3 py-2 text-right font-semibold">
        {etiqueta}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums">
        {monto}
      </td>
      {conAcciones ? <td className="border-0 bg-background" /> : null}
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Helpers de vista compartidos (lectura y edicion) — asi el contenido de las
// celdas Ruta/Unidad/Descripcion es identico en la pagina y en el modal.
// ---------------------------------------------------------------------------

// Ruta legible de la seccion ("Origen → Destino") o "" si no tiene ruta.
export function rutaDeSeccion(seccion: DraftSeccion): string {
  return seccion.origen !== "" || seccion.destino !== ""
    ? `${seccion.origen || "—"} → ${seccion.destino || "—"}`
    : "";
}

// Unidad/recurso de la linea para la columna Unidad (igual que el PDF):
// tipoUnidadNombre (transporte), equipoTipo (equipo) o rol (personal).
export function unidadDeLinea(l: DraftLinea): string {
  switch (l.tipoLinea) {
    case "TRANSPORTE":
      return l.carga.tipoUnidadNombre;
    case "ALQUILER_EQUIPO":
      return l.equipo.equipoTipo;
    case "PERSONAL":
      return l.personal.rol;
    default:
      return "";
  }
}

// Celda de un cargo adicional: nombre (del catalogo) + descripcion libre como
// sub-linea cuando exista, igual que en el PDF.
function CeldaCargo({ cargo }: { cargo: CargoVista }) {
  const descripcion = cargo.descripcion?.trim();
  return (
    <div className="flex flex-col">
      <span className="font-medium">{cargo.nombre || "Cargo"}</span>
      {descripcion ? (
        <span className="text-sm text-muted-foreground">{descripcion}</span>
      ) : null}
    </div>
  );
}

// Item normalizado de la grilla de dimensiones. Comparten el editor (draft, strings)
// y la lectura (read model, numbers) mapeando cada uno a esta forma.
export type DimensionesCarga = {
  clave: string;
  nombre: string;
  largoM: number | null;
  anchoM: number | null;
  altoM: number | null;
  peso: number | null;
  unidadPeso: string;
};

// Valor de una dimension; "—" si no viene cargada (mantiene la columna alineada).
function valorDim(valor: number | null, unidad: string): string {
  return valor !== null ? `${valor} ${unidad}` : "—";
}

// Dimensiones de las cargas fisicas en una grilla de 8 columnas (4 pares
// etiqueta+valor) alineada tipo Excel: mantiene L/A/H/P alineados verticalmente
// entre todos los items. Layout UNICO usado tanto en edicion como en lectura.
export function GrillaDimensionesCargas({ items }: { items: DimensionesCarga[] }) {
  if (items.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <div className="grid grid-cols-[auto_auto_auto_auto_auto_auto_auto_auto] gap-x-1 gap-y-0.5 text-xs tabular-nums">
      {items.map((it, idx) => (
        <React.Fragment key={it.clave}>
          <span
            className={idx === 0 ? "col-span-8 font-medium" : "col-span-8 mt-1.5 font-medium"}
          >
            {it.nombre || "Carga"}
          </span>
          <span className="text-muted-foreground/70">L:</span>
          <span className="pr-3 text-right text-muted-foreground">{valorDim(it.largoM, "m")}</span>
          <span className="text-muted-foreground/70">A:</span>
          <span className="pr-3 text-right text-muted-foreground">{valorDim(it.anchoM, "m")}</span>
          <span className="text-muted-foreground/70">H:</span>
          <span className="pr-3 text-right text-muted-foreground">{valorDim(it.altoM, "m")}</span>
          <span className="text-muted-foreground/70">P:</span>
          <span className="text-right text-muted-foreground">
            {valorDim(it.peso, it.unidadPeso)}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

// Parsea un valor numerico del draft (string) a number | null ("" o invalido = null).
function numDesdeDraft(valor: string): number | null {
  if (valor.trim() === "") return null;
  const n = parseFloat(valor);
  return Number.isNaN(n) ? null : n;
}

// Celda Descripcion: titulo (descripcion de la linea) + cargas fisicas con sus
// dimensiones (solo transporte). Usa la MISMA grilla que la vista de lectura.
export function CeldaDescripcionLinea({ linea }: { linea: DraftLinea }) {
  const cargas = linea.tipoLinea === "TRANSPORTE" ? linea.carga.cargas : [];
  if (!linea.descripcion && cargas.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }
  const items: DimensionesCarga[] = cargas.map((c) => ({
    clave: c.claveCliente,
    nombre: c.nombre,
    largoM: numDesdeDraft(c.largoM),
    anchoM: numDesdeDraft(c.anchoM),
    altoM: numDesdeDraft(c.altoM),
    peso: numDesdeDraft(c.peso),
    unidadPeso: c.unidadPeso,
  }));
  return (
    <div className="flex flex-col gap-1">
      {linea.descripcion ? <span className="font-medium">{linea.descripcion}</span> : null}
      {cargas.length > 0 ? <GrillaDimensionesCargas items={items} /> : null}
    </div>
  );
}
