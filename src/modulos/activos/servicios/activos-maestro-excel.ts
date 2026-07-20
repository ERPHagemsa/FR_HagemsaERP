import type ExcelJS from "exceljs";

import type { Activo } from "../tipos/activo.tipos";
import {
  NEGRO,
  VERDE_COD,
  agregarCabeceraCorporativa,
  bordeFino,
  descargarLibro,
  estilarFilaEncabezados,
  obtenerLogoBase64,
} from "./excel-estilo-hagemsa";

/**
 * Reporte Excel "Base de Activos Vehiculares" con el MISMO estilo visual del
 * documento oficial del cliente FT-AS-006/008 (capturas 2026-07-08). El
 * estilo compartido vive en `excel-estilo-hagemsa.ts`; aqui solo el layout
 * propio del reporte: columnas, autofiltro, freeze y columna COD en verde.
 *
 * Usa `exceljs` (unico que soporta imagenes, autofiltro y freeze panes)
 * cargado con import dinamico para no engordar el bundle inicial.
 */

type Resolutores = {
  tipoActivo: (id: number | null | undefined) => string;
  calibracion: (id: number | null | undefined) => string;
};

const ENCABEZADOS = [
  "ITEM",
  "COD",
  "Placa",
  "Año de fab",
  "Años de Antigüedad",
  "Color del vehiculo",
  "Marca",
  "Modelo",
  "Clase",
  "Carroceria",
  "Categoria",
  "Número de motor",
  "Serie Chasis",
  "Suspensión",
  "Estado",
  "Condicion",
  "Calibracion",
  "Zona Registral De Vehiculo",
  "EJE",
  "RUEDAS",
  "LARGO",
  "ALTO",
  "ANCHO",
  "PESO BRUTO (KG)",
  "PESO NETO (KG)",
  "CARGA UTIL (KG)",
  "Ubicacion",
];

const ANCHOS = [7, 13, 11, 9, 12, 16, 14, 20, 14, 18, 10, 18, 20, 12, 13, 14, 13, 18, 6, 8, 8, 8, 8, 16, 16, 16, 24];

// Columnas centradas (1-based): ITEM, año, antiguedad, categoria, estado,
// condicion, calibracion, zona, eje y dimensiones.
const COLUMNAS_CENTRADAS = new Set([1, 4, 5, 11, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26]);

/** Arma el libro completo. Separado del download para poder probarlo en Node. */
export async function construirLibroMaestro(
  activos: Activo[],
  resolutores: Resolutores,
  logoPngBase64: string | null
): Promise<ExcelJS.Workbook> {
  const { Workbook } = await import("exceljs");
  const libro = new Workbook();
  const hoja = libro.addWorksheet("BASE DE DATOS", {
    views: [{ state: "frozen", ySplit: 4 }],
  });

  hoja.columns = ANCHOS.map((ancho) => ({ width: ancho }));
  const nCols = ENCABEZADOS.length;
  const anioActual = new Date().getFullYear();

  const filaEncabezados = agregarCabeceraCorporativa(libro, hoja, {
    titulo: "Base de Activos Vehiculares",
    metas: ["FT-AS-006", "Versión 01", "Página 1 de 1"],
    nCols,
    logoPngBase64,
  });

  estilarFilaEncabezados(hoja, filaEncabezados, ENCABEZADOS);
  hoja.autoFilter = {
    from: { row: filaEncabezados, column: 1 },
    to: { row: filaEncabezados, column: nCols },
  };

  activos.forEach((activo, indice) => {
    const v = activo.vehiculo;
    const valores: Array<string | number> = [
      indice + 1,
      activo.codigo,
      v?.placa ?? "",
      v?.anioFabricacion ?? "",
      v?.anioFabricacion ? anioActual - v.anioFabricacion : "",
      v?.color ?? "",
      v?.marca ?? "",
      v?.modelo ?? "",
      v?.claseVehiculoReferenciaNombre ?? "",
      v?.carroceriaReferenciaNombre ?? v?.carroceria ?? "",
      v?.categoria ?? "",
      v?.serieMotor ?? "",
      v?.serieChasis ?? "",
      v?.tipoSuspension ?? "",
      activo.estadoRegistro === false ? "ANULADO" : activo.estadoActivo,
      v?.estadoOperativo ?? "",
      resolutores.calibracion(v?.estadoCalibracionReferenciaId),
      v?.zonaRegistral ?? "",
      v?.ejes ?? "",
      v?.cantidadRuedas ?? "",
      v?.longitud ?? "",
      v?.alto ?? "",
      v?.ancho ?? "",
      v?.pesoBruto ?? "",
      v?.pesoNeto ?? "",
      v?.cargaUtil ?? "",
      activo.ubicacion,
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
        // columna COD resaltada en verde, como el reporte original
        celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: VERDE_COD } };
      }
    });
  });

  return libro;
}

export async function exportarMaestroActivosExcel(
  activos: Activo[],
  resolutores: Resolutores
) {
  const logo = await obtenerLogoBase64();
  const libro = await construirLibroMaestro(activos, resolutores, logo);
  const hoy = new Date().toISOString().slice(0, 10);
  await descargarLibro(libro, `FT-AS-006-base-activos-vehiculares-${hoy}.xlsx`);
}
