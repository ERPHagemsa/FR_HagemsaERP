"use client";

// Tablita de LEAD TIME de una seccion. El lead time es informativo: indica el
// tiempo de transito de la ruta de cada linea de transporte — NO suma al total.
// Va en su propia tabla, debajo del stand-by, con el mismo estilo.

export type EntradaLeadTime = {
  // Rotulo del lead time: la ruta de la linea (origen -> destino) o el nombre del cargo.
  concepto: string;
  // Etiqueta de origen del item (ej. "Linea", "Cargo de seccion"); opcional.
  tipo?: string;
  // Plazo ya formateado (ej. "3 dias", "5-7 dias").
  plazo: string;
};

// Deduplica entradas con el MISMO concepto y plazo: dos rutas identicas con el
// mismo transito no deben mostrarse repetidas. Se conserva la primera aparicion.
function deduplicar(entradas: EntradaLeadTime[]): EntradaLeadTime[] {
  const vistos = new Set<string>();
  const unicas: EntradaLeadTime[] = [];
  for (const e of entradas) {
    const clave = `${e.concepto} ${e.plazo}`;
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    unicas.push(e);
  }
  return unicas;
}

export function TablaLeadTime({ entradas }: { entradas: EntradaLeadTime[] }) {
  const unicas = deduplicar(entradas);
  if (unicas.length === 0) return null;
  return (
    <div className="border-t border-border px-3 py-2">
      <p className="mb-1 text-xs text-muted-foreground">
        Lead time — informativo, no suma al total
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th className="py-1 text-left font-medium">Concepto</th>
            <th className="py-1 text-right font-medium">Plazo</th>
          </tr>
        </thead>
        <tbody>
          {unicas.map((e, i) => (
            <tr key={`${e.concepto}-${i}`} className="border-b border-border/50 last:border-0">
              <td className="py-1">
                {e.concepto || "—"}
                {e.tipo ? (
                  <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {e.tipo}
                  </span>
                ) : null}
              </td>
              <td className="py-1 text-right tabular-nums">{e.plazo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
