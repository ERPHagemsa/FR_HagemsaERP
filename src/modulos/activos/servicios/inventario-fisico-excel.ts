import type ExcelJS from "exceljs";

import type {
  InventarioFisico,
  InventarioFisicoDetalle,
} from "../tipos/activo.tipos";
import {
  NEGRO,
  VERDE_COD,
  agregarCabeceraCorporativa,
  bordeFino,
  descargarLibro,
  estilarFilaEncabezados,
  obtenerLogoBase64,
} from "./excel-estilo-hagemsa";

const ETIQUETA_REVISION: Record<string, string> = {
  PENDIENTE: "Pendiente",
  ENCONTRADO: "Encontrado",
  FALTANTE: "Faltante",
  OBSERVADO: "Observado",
  NO_APLICA: "No aplica",
};

function formatearFechaHora(valor: string | null): string {
  if (!valor) return "";
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime())
    ? ""
    : fecha.toLocaleString("es-PE", { hour12: false });
}

function formatearAsignacionFlota(
  codigo?: string | null,
  nombre?: string | null
) {
  return [codigo, nombre].filter(Boolean).join(" - ") || "Sin asignacion";
}

const ENCABEZADOS = [
  "ITEM",
  "Codigo",
  "Placa",
  "Unidad",
  "Tipo",
  "Carroceria",
  "Estado activo",
  "Condicion",
  "Calibracion",
  "Ubicacion esperada",
  "Cuenta",
  "Contrato",
  "Estado revision",
  "Ubicacion encontrada",
  "Observacion",
  "Usuario revision",
  "Fecha revision",
];

const ANCHOS = [7, 13, 11, 22, 12, 16, 12, 13, 12, 18, 10, 10, 13, 18, 24, 14, 17];

// Columnas centradas (1-based): ITEM, tipo, estados, condicion, calibracion,
// cuenta/contrato, estado revision y fecha.
const COLUMNAS_CENTRADAS = new Set([1, 5, 7, 8, 9, 11, 12, 13, 17]);

/**
 * Descarga el inventario fisico como .xlsx para trabajar offline en ruta
 * (requerimiento reunion 2026-07-02: en campo se cae el internet y revisan
 * con la lista en Excel). Exporta los `detalles` YA FILTRADOS por la bandeja
 * (busqueda, estado de revision y fecha de revision desde/hasta), asi el
 * usuario decide que se lleva: pendientes, faltantes, todo, etc.
 *
 * Desde 2026-07-08 usa el estilo corporativo del cliente (FT-AS-006):
 * logo, titulo, encabezados negros con autofiltro, columna Codigo en verde
 * y panel congelado. Ver `excel-estilo-hagemsa.ts`.
 *
 * Las columnas Cuenta y Contrato son solo lectura y vienen enriquecidas desde
 * BC-04 Flota en la pantalla de inventario. Si Flota no devuelve coincidencia,
 * viajan vacias sin bloquear el archivo offline.
 */
export async function construirLibroInventario(
  inventario: InventarioFisico,
  detalles: InventarioFisicoDetalle[],
  logoPngBase64: string | null
): Promise<ExcelJS.Workbook> {
  const { Workbook } = await import("exceljs");
  const libro = new Workbook();
  const hoja = libro.addWorksheet("Inventario", {
    views: [{ state: "frozen", ySplit: 4 }],
  });

  hoja.columns = ANCHOS.map((ancho) => ({ width: ancho }));
  const nCols = ENCABEZADOS.length;

  const filaEncabezados = agregarCabeceraCorporativa(libro, hoja, {
    titulo: `Inventario Físico ${inventario.codigo}`,
    metas: [
      inventario.codigo,
      `Estado: ${inventario.estado}`,
      `Apertura: ${formatearFechaHora(inventario.fechaApertura).slice(0, 10) || "-"}`,
    ],
    nCols,
    logoPngBase64,
    tamanoTitulo: 20,
  });

  estilarFilaEncabezados(hoja, filaEncabezados, ENCABEZADOS);
  hoja.autoFilter = {
    from: { row: filaEncabezados, column: 1 },
    to: { row: filaEncabezados, column: nCols },
  };

  detalles.forEach((detalle, indice) => {
    const valores: Array<string | number> = [
      indice + 1,
      detalle.codigoActivo,
      detalle.placa ?? "",
      [detalle.marca, detalle.modelo].filter(Boolean).join(" ") ||
        (detalle.descripcionActivo ?? ""),
      detalle.tipoActivo ?? "",
      detalle.carroceria ?? "",
      detalle.estadoActivo ?? "",
      detalle.estadoOperativo ?? "",
      detalle.estadoCalibracion ?? "",
      detalle.ubicacionEsperada ?? "",
      formatearAsignacionFlota(detalle.cuentaCodigo, detalle.cuentaNombre),
      formatearAsignacionFlota(detalle.contratoCodigo, detalle.contratoNombre),
      ETIQUETA_REVISION[detalle.estadoRevision] ?? detalle.estadoRevision,
      detalle.ubicacionEncontrada ?? "",
      detalle.observacion ?? "",
      detalle.usuarioRevision ?? "",
      formatearFechaHora(detalle.fechaRevision),
    ];

    const fila = hoja.getRow(indice + filaEncabezados + 1);
    valores.forEach((valor, col) => {
      const celda = fila.getCell(col + 1);
      celda.value = valor === "" ? null : valor;
      celda.font = { name: "Arial", size: 9, color: { argb: NEGRO } };
      celda.border = bordeFino;
      celda.alignment = COLUMNAS_CENTRADAS.has(col + 1)
        ? { horizontal: "center", vertical: "middle" }
        : { vertical: "middle" };
      if (col === 1) {
        // columna Codigo resaltada en verde, como la columna COD del cliente
        celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: VERDE_COD } };
      }
    });
  });

  // --- Hoja Resumen ---
  const resumen = libro.addWorksheet("Resumen");
  resumen.columns = [{ width: 22 }, { width: 40 }];
  const filasResumen: Array<[string, string | number]> = [
    ["Inventario", inventario.codigo],
    ["Descripcion", inventario.descripcion ?? inventario.nombre],
    ["Estado", inventario.estado],
    ["Fecha apertura", formatearFechaHora(inventario.fechaApertura)],
    ["Fecha cierre", formatearFechaHora(inventario.fechaCierre)],
    ["Activos exportados", detalles.length],
    ["Exportado el", formatearFechaHora(new Date().toISOString())],
  ];
  filasResumen.forEach(([etiqueta, valor], indice) => {
    const fila = resumen.getRow(indice + 1);
    const celdaEtiqueta = fila.getCell(1);
    celdaEtiqueta.value = etiqueta;
    celdaEtiqueta.font = { name: "Arial", size: 9, bold: true, color: { argb: "FFFFFFFF" } };
    celdaEtiqueta.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NEGRO } };
    celdaEtiqueta.border = bordeFino;
    const celdaValor = fila.getCell(2);
    celdaValor.value = valor;
    celdaValor.font = { name: "Arial", size: 9 };
    celdaValor.border = bordeFino;
  });

  return libro;
}

export async function exportarInventarioFisicoExcel(
  inventario: InventarioFisico,
  detalles: InventarioFisicoDetalle[]
) {
  const logo = await obtenerLogoBase64();
  const libro = await construirLibroInventario(inventario, detalles, logo);
  const hoy = new Date().toISOString().slice(0, 10);
  await descargarLibro(libro, `inventario-${inventario.codigo}-${hoy}.xlsx`);
}
