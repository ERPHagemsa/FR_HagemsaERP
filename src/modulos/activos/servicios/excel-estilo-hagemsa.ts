import type ExcelJS from "exceljs";

/**
 * Estilo corporativo compartido de los Excel del modulo Activos, calibrado
 * contra el reporte oficial del cliente FT-AS-006/008 (capturas 2026-07-08):
 * logo HAGEMSA arriba-izquierda, titulo grande negro sobre blanco, cajas de
 * codigo/version/pagina a la derecha, encabezados con fondo NEGRO y texto
 * blanco, bordes finos grises. Lo usan el reporte maestro, el Excel de
 * Inventario Fisico y la plantilla de carga masiva.
 */

export const NEGRO = "FF000000";
export const BLANCO = "FFFFFFFF";
export const VERDE_COD = "FF92D050"; // verde de la columna COD del reporte original
export const GRIS_BORDE = "FF808080";
export const GRIS_SUAVE = "FFF2F2F2";

export const bordeFino: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: GRIS_BORDE } },
  bottom: { style: "thin", color: { argb: GRIS_BORDE } },
  left: { style: "thin", color: { argb: GRIS_BORDE } },
  right: { style: "thin", color: { argb: GRIS_BORDE } },
};

/**
 * El logo del ERP (`public/logo/logo.svg`) es un PNG embebido en base64
 * dentro de un wrapper SVG; se extrae el PNG para incrustarlo en el Excel.
 */
export function extraerPngBase64DeSvg(svg: string): string | null {
  const match = svg.match(/data:image\/png;base64,([A-Za-z0-9+/=\s]+?)"/);
  return match ? match[1].replace(/\s+/g, "") : null;
}

export async function obtenerLogoBase64(): Promise<string | null> {
  try {
    const res = await fetch("/logo/logo.svg");
    if (!res.ok) return null;
    return extraerPngBase64DeSvg(await res.text());
  } catch {
    return null;
  }
}

export type CabeceraCorporativa = {
  titulo: string;
  /** Lineas de la caja superior derecha, ej. ["FT-AS-006", "Versión 01", "Página 1 de 1"]. */
  metas: string[];
  /** Cantidad de columnas de la tabla (define hasta donde llegan los merges). */
  nCols: number;
  logoPngBase64: string | null;
  /** Tamano de fuente del titulo. Default 24 (reportes); usar menos si el titulo es largo. */
  tamanoTitulo?: number;
};

/**
 * Dibuja las filas 1-3: bloque de logo (A1:C3), titulo fusionado y cajas de
 * metadatos a la derecha. Devuelve la fila donde debe ir el encabezado (4).
 */
export function agregarCabeceraCorporativa(
  libro: ExcelJS.Workbook,
  hoja: ExcelJS.Worksheet,
  cabecera: CabeceraCorporativa
): number {
  const { titulo, metas, nCols, logoPngBase64 } = cabecera;

  hoja.getRow(1).height = 26;
  hoja.getRow(2).height = 26;
  hoja.getRow(3).height = 26;

  const colMeta = Math.max(nCols - 1, 5);
  hoja.mergeCells(1, 1, 3, 3); // bloque logo
  hoja.mergeCells(1, 4, 3, colMeta - 1); // titulo
  for (let fila = 1; fila <= 3; fila++) {
    hoja.mergeCells(fila, colMeta, fila, nCols > colMeta ? nCols : colMeta + 1);
  }

  const celdaLogo = hoja.getCell(1, 1);
  celdaLogo.border = bordeFino;

  const celdaTitulo = hoja.getCell(1, 4);
  celdaTitulo.value = titulo;
  celdaTitulo.font = {
    name: "Arial",
    size: cabecera.tamanoTitulo ?? 24,
    bold: true,
    color: { argb: NEGRO },
  };
  celdaTitulo.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
  celdaTitulo.border = bordeFino;

  metas.slice(0, 3).forEach((texto, indice) => {
    const celda = hoja.getCell(indice + 1, colMeta);
    celda.value = texto;
    celda.font = { name: "Arial", size: 9, bold: indice === 0 };
    celda.alignment = { horizontal: "center", vertical: "middle" };
    celda.border = bordeFino;
  });

  if (logoPngBase64) {
    const imagenId = libro.addImage({
      base64: logoPngBase64,
      extension: "png",
    });
    // proporción del logo original 1520x1024, ajustado al bloque A1:C3
    hoja.addImage(imagenId, {
      tl: { col: 0.3, row: 0.2 },
      ext: { width: 130, height: 88 },
    });
  } else {
    celdaLogo.value = "HAGEMSA";
    celdaLogo.font = {
      name: "Arial",
      size: 14,
      bold: true,
      color: { argb: "FFC00000" },
    };
    celdaLogo.alignment = { horizontal: "center", vertical: "middle" };
  }

  return 4;
}

/** Pinta una fila de encabezados: fondo negro, texto blanco, centrado con wrap. */
export function estilarFilaEncabezados(
  hoja: ExcelJS.Worksheet,
  numeroFila: number,
  textos: string[],
  altura = 34
) {
  const fila = hoja.getRow(numeroFila);
  fila.height = altura;
  textos.forEach((texto, indice) => {
    const celda = fila.getCell(indice + 1);
    celda.value = texto;
    celda.font = { name: "Arial", size: 9, bold: true, color: { argb: BLANCO } };
    celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NEGRO } };
    celda.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    celda.border = bordeFino;
  });
}

/** Descarga el libro como .xlsx en el navegador. */
export async function descargarLibro(libro: ExcelJS.Workbook, nombre: string) {
  const buffer = await libro.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nombre;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
