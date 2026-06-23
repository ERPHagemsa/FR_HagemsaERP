import * as XLSX from "xlsx";

import type {
  CrearActivoPayload,
  PlantillaInventario,
  TipoActivo,
} from "../tipos/activo.tipos";
import type { FilaPrevisualizada } from "../tipos/carga-masiva.tipos";
import {
  COLUMNAS_POR_TIPO,
  ETIQUETA_TIPO_ACTIVO,
  PLANTILLA_INVENTARIO_DEFECTO,
  type ColumnaCarga,
} from "./carga-masiva-columnas";

/**
 * Genera y descarga la plantilla Excel para un tipo de activo.
 * Hoja 1 (Activos): encabezados + una fila de ejemplo.
 * Hoja 2 (Instrucciones): guia de cada columna.
 */
export function descargarPlantilla(tipo: TipoActivo): void {
  const columnas = COLUMNAS_POR_TIPO[tipo];
  const libro = XLSX.utils.book_new();

  const encabezados = columnas.map((columna) => columna.encabezado);
  const ejemplo = columnas.map((columna) => columna.ejemplo ?? "");
  const hojaActivos = XLSX.utils.aoa_to_sheet([encabezados, ejemplo]);
  hojaActivos["!cols"] = columnas.map((columna) => ({
    wch: Math.max(columna.encabezado.length + 2, 16),
  }));
  XLSX.utils.book_append_sheet(libro, hojaActivos, "Activos");

  const filasInstruccion = [
    ["Columna", "Obligatorio", "Tipo", "Valores permitidos", "Ayuda"],
    ...columnas.map((columna) => [
      columna.encabezado,
      columna.obligatorio ? "SI" : "No",
      etiquetaTipo(columna),
      columna.opciones?.join(" | ") ?? "",
      columna.ayuda ?? "",
    ]),
  ];
  const hojaInstrucciones = XLSX.utils.aoa_to_sheet(filasInstruccion);
  hojaInstrucciones["!cols"] = [
    { wch: 24 },
    { wch: 12 },
    { wch: 12 },
    { wch: 40 },
    { wch: 50 },
  ];
  XLSX.utils.book_append_sheet(libro, hojaInstrucciones, "Instrucciones");

  XLSX.writeFile(
    libro,
    `plantilla-carga-${ETIQUETA_TIPO_ACTIVO[tipo].toLowerCase()}.xlsx`,
  );
}

function etiquetaTipo(columna: ColumnaCarga): string {
  switch (columna.tipo) {
    case "numero":
      return "Numero";
    case "entero":
      return "Entero";
    case "fecha":
      return "Fecha";
    case "opciones":
      return "Lista";
    default:
      return "Texto";
  }
}

/**
 * Lee un archivo Excel/CSV y lo convierte en filas previsualizadas con
 * validacion local. No crea nada: solo prepara los datos para la revision.
 */
export async function parsearArchivo(
  archivo: File,
  tipo: TipoActivo,
): Promise<FilaPrevisualizada[]> {
  const buffer = await archivo.arrayBuffer();
  const libro = XLSX.read(buffer, { type: "array", cellDates: true });
  const hoja = libro.Sheets[libro.SheetNames[0]];
  const matriz = XLSX.utils.sheet_to_json<unknown[]>(hoja, {
    header: 1,
    blankrows: false,
    defval: "",
  });

  if (matriz.length < 2) {
    return [];
  }

  const columnas = COLUMNAS_POR_TIPO[tipo];
  const encabezados = (matriz[0] as unknown[]).map((celda) =>
    normalizarEncabezado(String(celda ?? "")),
  );

  // Mapea cada columna esperada al indice real en el archivo.
  const indicePorClave = new Map<string, number>();
  for (const columna of columnas) {
    const objetivo = normalizarEncabezado(columna.encabezado);
    const indice = encabezados.findIndex((texto) => texto === objetivo);
    if (indice >= 0) {
      indicePorClave.set(columna.clave, indice);
    }
  }

  const filas: FilaPrevisualizada[] = [];

  for (let i = 1; i < matriz.length; i++) {
    const fila = matriz[i] as unknown[];
    if (esFilaVacia(fila)) continue;

    const previsualizada = mapearFila(
      fila,
      i + 1,
      tipo,
      columnas,
      indicePorClave,
    );
    filas.push(previsualizada);
  }

  return filas;
}

function mapearFila(
  fila: unknown[],
  numeroFila: number,
  tipo: TipoActivo,
  columnas: ColumnaCarga[],
  indicePorClave: Map<string, number>,
): FilaPrevisualizada {
  const errores: Record<string, string> = {};
  const valoresCrudos: Record<string, string> = {};
  const base: Record<string, unknown> = {};
  const vehiculo: Record<string, unknown> = {};
  let tieneDatosVehiculo = false;

  for (const columna of columnas) {
    const indice = indicePorClave.get(columna.clave);
    const valorCrudo =
      indice === undefined ? "" : limpiar(fila[indice]);
    valoresCrudos[columna.clave] = valorCrudo;

    if (!valorCrudo) {
      if (columna.obligatorio) {
        errores[columna.clave] = "Requerido";
      }
      continue;
    }

    const { valor, error } = convertirValor(valorCrudo, columna);
    if (error) {
      errores[columna.clave] = error;
      continue;
    }

    if (columna.destino === "base") {
      base[columna.clave] = valor;
    } else {
      vehiculo[columna.clave] = valor;
      tieneDatosVehiculo = true;
    }
  }

  const activo: CrearActivoPayload = {
    codigo: String(base.codigo ?? ""),
    tipoActivo: tipo,
    descripcion: String(base.descripcion ?? ""),
    ubicacion: String(base.ubicacion ?? ""),
    estadoActivo:
      (base.estadoActivo as CrearActivoPayload["estadoActivo"]) ?? "ACTIVO",
    observacion: base.observacion ? String(base.observacion) : undefined,
    valorUnidad:
      base.valorUnidad !== undefined ? (base.valorUnidad as number) : undefined,
    moneda: base.moneda ? String(base.moneda) : undefined,
    proveedor: base.proveedor ? String(base.proveedor) : undefined,
    numeroFactura: base.numeroFactura
      ? String(base.numeroFactura)
      : undefined,
    fechaFactura: base.fechaFactura ? String(base.fechaFactura) : undefined,
  };

  if (tieneDatosVehiculo) {
    activo.vehiculo = {
      ...vehiculo,
      plantillaInventario: PLANTILLA_INVENTARIO_DEFECTO[
        tipo
      ] as PlantillaInventario,
    };
  }

  return {
    fila: numeroFila,
    activo,
    valoresCrudos,
    errores,
    esValida: Object.keys(errores).length === 0,
  };
}

function convertirValor(
  valorCrudo: string,
  columna: ColumnaCarga,
): { valor?: unknown; error?: string } {
  switch (columna.tipo) {
    case "numero": {
      const numero = Number(valorCrudo.replace(",", "."));
      if (Number.isNaN(numero)) return { error: "No es un numero valido" };
      return { valor: numero };
    }
    case "entero": {
      const entero = Number(valorCrudo);
      if (!Number.isInteger(entero)) return { error: "Debe ser un entero" };
      return { valor: entero };
    }
    case "fecha": {
      const fecha = normalizarFecha(valorCrudo);
      if (!fecha) return { error: "Fecha invalida (use AAAA-MM-DD)" };
      return { valor: fecha };
    }
    case "opciones": {
      const normalizado = valorCrudo.trim().toUpperCase();
      if (columna.opciones && !columna.opciones.includes(normalizado)) {
        return {
          error: `Use: ${columna.opciones.join(", ")}`,
        };
      }
      return { valor: normalizado };
    }
    default:
      return { valor: valorCrudo.trim() };
  }
}

function normalizarFecha(valor: string): string | null {
  // Acepta "2026-05-29", "2026/05/29" o una fecha ya formateada por SheetJS.
  const limpio = valor.trim();
  const iso = limpio.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) {
    const [, anio, mes, dia] = iso;
    return `${anio}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
  }
  const fecha = new Date(limpio);
  if (Number.isNaN(fecha.getTime())) return null;
  return fecha.toISOString().slice(0, 10);
}

function limpiar(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  if (valor instanceof Date) return valor.toISOString().slice(0, 10);
  return String(valor).trim();
}

function esFilaVacia(fila: unknown[]): boolean {
  return fila.every((celda) => limpiar(celda) === "");
}

function normalizarEncabezado(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\*/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
