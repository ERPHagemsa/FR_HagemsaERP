"use client";

import * as React from "react";

// Tabla de una seccion con el MISMO layout del PDF de cotizacion:
//   Ruta | Unidad | Descripcion | Monto total
// - Ruta: una sola celda combinada (rowspan) para toda la seccion (la ruta es de
//   la seccion; todas sus lineas la comparten).
// - Unidad: celda combinada por linea (cubre la linea + sus cargos).
// - Los cargos van como FILAS dentro de la misma tabla (no en un bloque aparte):
//   los de linea ocupan solo Descripcion + Monto; los de seccion ocupan las tres
//   primeras columnas (colspan) + Monto.
// - Ultima fila: SUB-TOTAL de la seccion.

const SIMBOLO: Record<string, string> = { PEN: "S/", USD: "US$" };

function formatear(monto: number, moneda: string): string {
  const simbolo = SIMBOLO[moneda] ?? "";
  return `${simbolo} ${monto.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export type CargoVista = { descripcion: string; monto: number };

export type LineaVista = {
  unidad: string;
  // Contenido de la celda Descripcion (titulo + cargas/detalle); lo arma cada caller.
  descripcion: React.ReactNode;
  montoTotal: number;
  cargos: CargoVista[];
};

export type SeccionVista = {
  ruta: string;
  lineas: LineaVista[];
  cargosSeccion: CargoVista[];
  subtotal: number;
};

export function TablaCotizacion({
  seccion,
  moneda,
}: {
  seccion: SeccionVista;
  moneda: string;
}) {
  const filasDeLinea = (l: LineaVista) => 1 + l.cargos.length;
  const totalFilasLineas = seccion.lineas.reduce((s, l) => s + filasDeLinea(l), 0);

  return (
    <table className="w-full border-collapse text-sm [&_td]:border [&_td]:border-border/60 [&_th]:border [&_th]:border-border/60">
      <colgroup>
        <col style={{ width: "21%" }} />
        <col style={{ width: "14%" }} />
        <col style={{ width: "50%" }} />
        <col style={{ width: "15%" }} />
      </colgroup>
      <thead>
        <tr className="bg-muted/40 text-xs uppercase text-muted-foreground">
          <th className="px-3 py-2 text-left font-medium">Ruta</th>
          <th className="px-3 py-2 text-left font-medium">Unidad</th>
          <th className="px-3 py-2 text-left font-medium">Descripcion</th>
          <th className="px-3 py-2 text-right font-medium">Monto total</th>
        </tr>
      </thead>
      <tbody>
        {seccion.lineas.map((linea, i) => (
          <React.Fragment key={i}>
            <tr className="align-top">
              {i === 0 && totalFilasLineas > 0 ? (
                <td
                  rowSpan={totalFilasLineas}
                  className="px-3 py-2 text-center align-middle font-medium text-muted-foreground"
                >
                  {seccion.ruta || "—"}
                </td>
              ) : null}
              <td
                rowSpan={filasDeLinea(linea)}
                className="px-3 py-2 text-center align-middle font-medium"
              >
                {linea.unidad || "—"}
              </td>
              <td className="px-3 py-2">{linea.descripcion}</td>
              <td className="whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums">
                {formatear(linea.montoTotal, moneda)}
              </td>
            </tr>
            {linea.cargos.map((c, j) => (
              <tr key={j} className="align-top">
                <td className="px-3 py-2 font-medium">{c.descripcion || "Cargo"}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right font-medium tabular-nums">
                  {formatear(c.monto, moneda)}
                </td>
              </tr>
            ))}
          </React.Fragment>
        ))}

        {/* Cargos a nivel seccion: descripcion a lo ancho (3 columnas) + monto */}
        {seccion.cargosSeccion.map((c, i) => (
          <tr key={`cs-${i}`} className="align-top">
            <td colSpan={3} className="px-3 py-2 font-medium">
              {c.descripcion || "Cargo"}
            </td>
            <td className="whitespace-nowrap px-3 py-2 text-right font-medium tabular-nums">
              {formatear(c.monto, moneda)}
            </td>
          </tr>
        ))}

        {/* Sub-total de la seccion */}
        <tr className="bg-muted/30">
          <td colSpan={2} className="border-0 bg-background" />
          <td className="px-3 py-2 text-right font-semibold">SUB - TOTAL</td>
          <td className="whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums">
            {formatear(seccion.subtotal, moneda)}
          </td>
        </tr>
      </tbody>
    </table>
  );
}
