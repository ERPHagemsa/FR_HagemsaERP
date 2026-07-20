// Helpers presentacionales del bloque de contenido (grid de lineas + secciones).
// Pura UI: etiquetas, colores de badge, resumen de detalle, formateo de moneda
// y mapeo de errores por path → linea/seccion. Sin React.

import { formatearMoneda } from "@/compartido/utilidades/formato-moneda";

import type { TipoLinea } from "../tipos/cotizaciones.tipos";
import type { DraftLinea, DraftSeccion } from "../servicios/cotizaciones-editor.utils";
import { totalVentaLinea } from "../servicios/cotizaciones-editor.utils";

export { formatearMoneda };

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
      const n = linea.carga.cargas.length;
      const items = n > 0 ? ` · ${n} ${n === 1 ? "carga" : "cargas"}` : "";
      return ruta + items;
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

// Total de venta de la linea (precioVenta × cantidad), espejo de precioVentaTotal del backend.
export function totalLinea(linea: DraftLinea): number {
  return totalVentaLinea(linea);
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
  // claveSeccion → { "cargosAdicionales.{j}.{campo}": mensaje } — cargos POR seccion
  porSeccionCargos: Record<string, Record<string, string>>;
  cargosDefecto: Record<string, string>; // "cargosAdicionales.{j}.{campo}" → mensaje (bucket plano)
};

export function mapearErroresContenido(
  secciones: DraftSeccion[],
  errores: Record<string, string>
): ErroresContenido {
  const porLinea: Record<string, Record<string, string>> = {};
  const porSeccion: Record<string, Record<string, string>> = {};
  const porSeccionCargos: Record<string, Record<string, string>> = {};
  const cargosDefecto: Record<string, string> = {};

  const seccionDefecto = secciones.find((s) => s.esDefecto);

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

    // Cargo de linea (indice draft): "secciones.{i}.lineas.{k}.cargosAdicionales.{j}.{campo}"
    // ORDERING CRITICAL: este branch DEBE ir antes del matcher generico de linea (siguiente)
    // para que las claves de cargos no sean absorbidas por el regex de campo-de-linea.
    m = ruta.match(/^secciones\.(\d+)\.lineas\.(\d+)\.cargosAdicionales\.(\d+)\.(.+)$/);
    if (m) {
      const sec = secciones[Number(m[1])];
      const linea = sec?.lineas[Number(m[2])];
      if (linea) {
        // Clave relativa que EditorCargos espera dentro de su prop erroresCampo
        (porLinea[linea.claveCliente] ??= {})[`cargosAdicionales.${m[3]}.${m[4]}`] = msg;
      }
      continue;
    }

    // Item de carga (indice draft): "secciones.{i}.lineas.{k}.carga.cargas.{j}.{campo}"
    // ORDERING CRITICAL: antes del matcher generico de linea, igual que los cargos.
    m = ruta.match(/^secciones\.(\d+)\.lineas\.(\d+)\.carga\.cargas\.(\d+)\.(.+)$/);
    if (m) {
      const sec = secciones[Number(m[1])];
      const linea = sec?.lineas[Number(m[2])];
      if (linea) {
        // Clave relativa que EditorCargasFisicas espera dentro de su prop erroresCampo
        (porLinea[linea.claveCliente] ??= {})[`carga.cargas.${m[3]}.${m[4]}`] = msg;
      }
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

    // Cargos por seccion (indice draft): "secciones.{i}.cargosAdicionales.{j}.{campo}"
    m = ruta.match(/^secciones\.(\d+)\.cargosAdicionales\.(\d+)\.(.+)$/);
    if (m) {
      const sec = secciones[Number(m[1])];
      if (sec) {
        const clave = `cargosAdicionales.${m[2]}.${m[3]}`;
        (porSeccionCargos[sec.claveCliente] ??= {})[clave] = msg;
        if (sec.esDefecto) cargosDefecto[clave] = msg; // bucket plano (bottom block)
      }
      continue;
    }
    // Cargos en raiz (forma servidor con bucket por defecto): "cargosAdicionales.{j}.{campo}"
    if (ruta.startsWith("cargosAdicionales.")) {
      cargosDefecto[ruta] = msg;
      if (seccionDefecto) (porSeccionCargos[seccionDefecto.claveCliente] ??= {})[ruta] = msg;
    }
  }

  return { porLinea, porSeccion, porSeccionCargos, cargosDefecto };
}
