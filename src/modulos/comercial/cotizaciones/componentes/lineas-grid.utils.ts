// Helpers presentacionales del bloque de contenido (grid de lineas + secciones).
// Pura UI: etiquetas, colores de badge, resumen de detalle, formateo de moneda
// y mapeo de errores por path → linea/seccion. Sin React.

import type { TipoLinea } from "../tipos/cotizaciones.tipos";
import type { DraftLinea, DraftSeccion } from "../servicios/cotizaciones-editor.utils";

export const TIPOS_LINEA: { valor: TipoLinea; etiqueta: string }[] = [
  { valor: "TRANSPORTE", etiqueta: "Transporte" },
  { valor: "ALQUILER_EQUIPO", etiqueta: "Alquiler de equipo" },
  { valor: "ALMACENAJE", etiqueta: "Almacenaje" },
  { valor: "AGENCIAMIENTO", etiqueta: "Agenciamiento" },
  { valor: "PERSONAL", etiqueta: "Personal" },
  { valor: "SERVICIO_AUXILIAR", etiqueta: "Servicio auxiliar" },
];

export function etiquetaTipo(tipo: TipoLinea): string {
  return TIPOS_LINEA.find((t) => t.valor === tipo)?.etiqueta ?? tipo;
}

// Clases de badge por tipo — color como senal rapida en la grilla.
export function claseBadgeTipo(tipo: TipoLinea): string {
  switch (tipo) {
    case "TRANSPORTE":
      return "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-300";
    case "ALQUILER_EQUIPO":
      return "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300";
    case "ALMACENAJE":
      return "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-300";
    case "PERSONAL":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300";
    case "AGENCIAMIENTO":
      return "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300";
    default:
      return "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-300";
  }
}

// Resumen compacto del detalle polimorfico, para la columna "Detalle" del grid.
export function resumenDetalle(linea: DraftLinea): string {
  switch (linea.tipoLinea) {
    case "TRANSPORTE": {
      const ruta = [linea.carga.origen, linea.carga.destino]
        .map((v) => v || "—")
        .join(" → ");
      const peso = linea.carga.pesoTn ? ` · ${linea.carga.pesoTn} Tn` : "";
      return ruta + peso;
    }
    case "ALQUILER_EQUIPO":
      return (
        [linea.equipo.equipoTipo, linea.equipo.marca].filter(Boolean).join(" · ") ||
        "Sin datos de equipo"
      );
    case "ALMACENAJE":
      return linea.almacenaje.areaM2
        ? `${linea.almacenaje.areaM2} m² · ${linea.almacenaje.periodoDias || "—"} dias`
        : "Sin datos de almacenaje";
    case "PERSONAL":
      return linea.personal.rol || "Sin rol";
    default:
      return "—";
  }
}

export function totalLinea(linea: DraftLinea): number {
  return (parseFloat(linea.cantidad) || 0) * (parseFloat(linea.precioUnitario) || 0);
}

const SIMBOLO: Record<string, string> = { PEN: "S/", USD: "US$" };

export function formatearMoneda(monto: number, moneda: string): string {
  const simbolo = SIMBOLO[moneda] ?? "";
  return `${simbolo} ${monto.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ---------------------------------------------------------------------------
// Mapeo de errores por path → (linea | seccion | cargos del bucket por defecto)
// ---------------------------------------------------------------------------
//
// Los errores llegan como Record<ruta, mensaje>. Dos fuentes:
//   - Cliente (validarBorrador): usa INDICE DRAFT — "secciones.{i}.lineas.{j}.cantidad".
//   - Backend 400 (class-validator): usa INDICE PAYLOAD — "lineas.{j}..." (bucket
//     por defecto colapsado a raiz) o "secciones.{k}.lineas.{j}...".
// Solo una fuente esta activa por vez (el cliente corta con return antes de enviar),
// asi que resolvemos por indice DRAFT (camino comun) y, ademas, las lineas de raiz
// ("lineas.{j}") contra el bucket por defecto. La resolucion por indice-payload de
// secciones explicitas en errores de servidor es best-effort (caso poco frecuente).

export type ErroresContenido = {
  porLinea: Record<string, Record<string, string>>; // claveLinea → { campo: mensaje }
  porSeccion: Record<string, Record<string, string>>; // claveSeccion → { nombre: mensaje }
  cargosDefecto: Record<string, string>; // "cargosAdicionales.{j}.{campo}" → mensaje
};

export function mapearErroresContenido(
  secciones: DraftSeccion[],
  errores: Record<string, string>
): ErroresContenido {
  const porLinea: Record<string, Record<string, string>> = {};
  const porSeccion: Record<string, Record<string, string>> = {};
  const cargosDefecto: Record<string, string> = {};

  const seccionDefecto = secciones.find((s) => s.esDefecto);
  const indiceDefecto = secciones.findIndex((s) => s.esDefecto);

  const agregarLinea = (linea: DraftLinea | undefined, campo: string, msg: string) => {
    if (!linea) return;
    (porLinea[linea.claveCliente] ??= {})[campo] = msg;
  };

  for (const [ruta, msg] of Object.entries(errores)) {
    // Linea de raiz (bucket por defecto colapsado): "lineas.{j}.{campo}"
    let m = ruta.match(/^lineas\.(\d+)\.(.+)$/);
    if (m) {
      agregarLinea(seccionDefecto?.lineas[Number(m[1])], m[2], msg);
      continue;
    }

    // Linea dentro de seccion (indice draft): "secciones.{i}.lineas.{j}.{campo}"
    m = ruta.match(/^secciones\.(\d+)\.lineas\.(\d+)\.(.+)$/);
    if (m) {
      const sec = secciones[Number(m[1])];
      agregarLinea(sec?.lineas[Number(m[2])], m[3], msg);
      continue;
    }

    // Nombre de seccion: "secciones.{i}.nombre"
    m = ruta.match(/^secciones\.(\d+)\.nombre$/);
    if (m) {
      const sec = secciones[Number(m[1])];
      if (sec) (porSeccion[sec.claveCliente] ??= {}).nombre = msg;
      continue;
    }

    // Cargos del bucket por defecto: "secciones.{indiceDefecto}.cargosAdicionales.{j}.{campo}"
    if (indiceDefecto >= 0) {
      const prefijo = `secciones.${indiceDefecto}.`;
      if (ruta.startsWith(prefijo + "cargosAdicionales.")) {
        cargosDefecto[ruta.slice(prefijo.length)] = msg;
        continue;
      }
    }
    // Cargos en raiz (forma servidor con bucket por defecto): "cargosAdicionales.{j}.{campo}"
    if (ruta.startsWith("cargosAdicionales.")) {
      cargosDefecto[ruta] = msg;
    }
  }

  return { porLinea, porSeccion, cargosDefecto };
}
