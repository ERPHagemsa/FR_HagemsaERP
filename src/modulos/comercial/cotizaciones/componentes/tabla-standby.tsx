"use client";

// Tablita de STAND BY de una seccion. El stand-by es informativo: indica cuanto
// costaria por dia de espera de cada item (linea o cargo) — NO suma al total. Por eso
// va en su propia tabla, separada de las tablas de costo, para no confundir.

const SIMBOLO: Record<string, string> = { PEN: "S/", USD: "US$" };

function formatear(monto: number, moneda: string): string {
  const simbolo = SIMBOLO[moneda] ?? "";
  return `${simbolo} ${monto.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export type EntradaStandby = {
  concepto: string;
  // Etiqueta de origen del item (ej. "Linea", "Cargo"); opcional.
  tipo?: string;
  precio: number;
};

export function TablaStandby({
  entradas,
  moneda,
}: {
  entradas: EntradaStandby[];
  moneda: string;
}) {
  if (entradas.length === 0) return null;
  return (
    <div className="border-t border-border px-3 py-2">
      <p className="mb-1 text-xs text-muted-foreground">
        Stand by por dia — informativo, no suma al total
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th className="py-1 text-left font-medium">Concepto</th>
            <th className="py-1 text-right font-medium">Stand by / dia</th>
          </tr>
        </thead>
        <tbody>
          {entradas.map((e, i) => (
            <tr key={`${e.concepto}-${i}`} className="border-b border-border/50 last:border-0">
              <td className="py-1">
                {e.concepto || "—"}
                {e.tipo ? (
                  <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {e.tipo}
                  </span>
                ) : null}
              </td>
              <td className="py-1 text-right font-mono tabular-nums">
                {formatear(e.precio, moneda)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
