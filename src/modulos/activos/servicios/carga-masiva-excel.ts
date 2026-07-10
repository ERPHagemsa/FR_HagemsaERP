import * as XLSX from "xlsx";

import type { CatalogosActivos } from "../ganchos/use-catalogos-activos";
import type { CrearActivoPayload } from "../tipos/activo.tipos";
import type { FilaPrevisualizada } from "../tipos/carga-masiva.tipos";
import {
  COLUMNAS_POR_TIPO,
  ETIQUETA_TIPO_ACTIVO,
  VEHICULO_DEFECTO_POR_TIPO,
  opcionesCatalogo,
  type ColumnaCarga,
} from "./carga-masiva-columnas";
import {
  GRIS_SUAVE,
  NEGRO,
  agregarCabeceraCorporativa,
  bordeFino,
  descargarLibro,
  estilarFilaEncabezados,
  obtenerLogoBase64,
} from "./excel-estilo-hagemsa";

/**
 * Genera y descarga la plantilla Excel para un tipo de activo, con el estilo
 * corporativo del cliente (FT-AS-006): logo, titulo, encabezados negros.
 * Hoja 1 (Activos): cabecera corporativa + grupos equivalentes a las pestanas
 * del formulario + encabezados (con * en las obligatorias) + ejemplo en gris.
 * Hoja 2 (Instrucciones): guia de cada columna.
 *
 * El parser (`parsearArchivo`) encuentra la fila de encabezados
 * dinamicamente, asi que las plantillas viejas (encabezados en fila 1)
 * siguen funcionando.
 */
export async function descargarPlantilla(
  tipoActivoReferenciaId: number,
  catalogos: CatalogosActivos,
): Promise<void> {
  const columnas = COLUMNAS_POR_TIPO[tipoActivoReferenciaId];
  const { Workbook } = await import("exceljs");
  const libro = new Workbook();
  const logo = await obtenerLogoBase64();

  // --- Hoja Activos ---
  const hoja = libro.addWorksheet("Activos");
  const nCols = columnas.length;
  hoja.columns = columnas.map((columna) => ({
    width: Math.max(columna.encabezado.length + 4, 16),
  }));

  const filaSecciones = agregarCabeceraCorporativa(libro, hoja, {
    titulo: `Carga Masiva de Activos - ${ETIQUETA_TIPO_ACTIVO[tipoActivoReferenciaId]}`,
    metas: ["Plantilla oficial", "Campos con * son obligatorios", "Borrar la fila de ejemplo"],
    nCols,
    logoPngBase64: logo,
    tamanoTitulo: 18,
  });

  const filaEncabezados = filaSecciones + 1;
  agregarFilaSecciones(hoja, filaSecciones, columnas);

  // El parser quita los "*" al normalizar, asi que marcarlos es seguro.
  estilarFilaEncabezados(
    hoja,
    filaEncabezados,
    columnas.map((columna) =>
      columna.obligatorio ? `${columna.encabezado} *` : columna.encabezado,
    ),
  );

  const filaEjemplo = hoja.getRow(filaEncabezados + 1);
  columnas.forEach((columna, indice) => {
    const celda = filaEjemplo.getCell(indice + 1);
    celda.value = columna.ejemplo ?? null;
    celda.font = { name: "Arial", size: 9, italic: true, color: { argb: "FF666666" } };
    celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GRIS_SUAVE } };
    celda.border = bordeFino;
  });

  agregarListasDesplegables(hoja, libro, columnas, catalogos, filaEncabezados);

  // --- Hoja Instrucciones ---
  const instrucciones = libro.addWorksheet("Instrucciones");
  instrucciones.columns = [
    { width: 26 },
    { width: 12 },
    { width: 12 },
    { width: 44 },
    { width: 54 },
  ];
  estilarFilaEncabezados(
    instrucciones,
    1,
    ["Columna", "Obligatorio", "Tipo", "Valores permitidos", "Ayuda"],
    22,
  );
  columnas.forEach((columna, indice) => {
    const fila = instrucciones.getRow(indice + 2);
    const valores = [
      columna.encabezado,
      columna.obligatorio ? "SI" : "No",
      etiquetaTipo(columna),
      opcionesCatalogo(columna, catalogos).join(" | "),
      columna.ayuda ?? "",
    ];
    valores.forEach((valor, col) => {
      const celda = fila.getCell(col + 1);
      celda.value = valor || null;
      celda.font = {
        name: "Arial",
        size: 9,
        bold: col === 0,
        color: { argb: NEGRO },
      };
      celda.border = bordeFino;
      celda.alignment = { vertical: "middle", wrapText: col >= 3 };
    });
  });

  await descargarLibro(
    libro,
    `plantilla-carga-${ETIQUETA_TIPO_ACTIVO[tipoActivoReferenciaId].toLowerCase()}.xlsx`,
  );
}

type SeccionCarga =
  | "Base"
  | "Adquisicion"
  | "Vehiculo"
  | "Dimensiones"
  | "Control operativo"
  | "Combustible";

const CLAVES_ADQUISICION = new Set([
  "valorUnidad",
  "moneda",
  "proveedor",
  "numeroFactura",
  "fechaFactura",
]);
const CLAVES_DIMENSIONES = new Set(["alto", "ancho", "longitud"]);
const CLAVES_CONTROL = new Set([
  "estadoOperativo",
  "estadoCalibracionReferenciaId",
  "factorCorreccion",
]);
const CLAVES_COMBUSTIBLE = new Set(["capacidadTanqueGalones"]);

function seccionDeColumna(clave: string): SeccionCarga {
  if (CLAVES_ADQUISICION.has(clave)) return "Adquisicion";
  if (CLAVES_DIMENSIONES.has(clave)) return "Dimensiones";
  if (CLAVES_CONTROL.has(clave)) return "Control operativo";
  if (CLAVES_COMBUSTIBLE.has(clave)) return "Combustible";
  if (
    [
      "placa",
      "marca",
      "modelo",
      "anioFabricacion",
      "color",
      "serieChasis",
      "serieMotor",
      "claseVehiculoReferenciaId",
      "carroceriaReferenciaId",
      "ejes",
      "categoria",
      "claseEuroReferenciaId",
      "tipoTransmisionReferenciaId",
      "ratioCorona",
      "zonaRegistral",
      "tarjetaPropiedad",
      "tipoTarjetaPropiedad",
    ].includes(clave)
  ) {
    return "Vehiculo";
  }
  return "Base";
}

/** Dibuja una fila de grupos con la misma organizacion de las pestanas del formulario. */
function agregarFilaSecciones(
  hoja: import("exceljs").Worksheet,
  fila: number,
  columnas: ColumnaCarga[],
): void {
  hoja.getRow(fila).height = 24;
  let inicio = 0;

  while (inicio < columnas.length) {
    const seccion = seccionDeColumna(columnas[inicio].clave);
    let fin = inicio;
    while (
      fin + 1 < columnas.length &&
      seccionDeColumna(columnas[fin + 1].clave) === seccion
    ) {
      fin++;
    }

    if (fin > inicio) hoja.mergeCells(fila, inicio + 1, fila, fin + 1);
    const celda = hoja.getCell(fila, inicio + 1);
    celda.value = seccion;
    celda.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFC00000" } };
    celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF262626" } };
    celda.alignment = { horizontal: "center", vertical: "middle" };

    for (let columna = inicio + 1; columna <= fin + 1; columna++) {
      hoja.getCell(fila, columna).border = bordeFino;
      hoja.getCell(fila, columna).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF262626" },
      };
    }
    inicio = fin + 1;
  }
}

/**
 * Crea listas nativas de Excel con los catalogos activos. La validacion al
 * importar sigue siendo obligatoria: el archivo puede venir de otra fuente y
 * la compatibilidad Clase/Carroceria se valida fila por fila en `mapearFila`.
 */
function agregarListasDesplegables(
  hoja: import("exceljs").Worksheet,
  libro: import("exceljs").Workbook,
  columnas: ColumnaCarga[],
  catalogos: CatalogosActivos,
  filaEncabezados: number,
): void {
  const columnasConLista = columnas
    .map((columna, indice) => ({ columna, indice }))
    .filter(({ columna }) => columna.tipo === "opciones");

  if (!columnasConLista.length) return;

  const referencias = libro.addWorksheet("Catalogos", { state: "veryHidden" });
  referencias.columns = columnasConLista.map(() => ({ width: 34 }));

  columnasConLista.forEach(({ columna, indice }, columnaLista) => {
    const valores = opcionesCatalogo(columna, catalogos);
    if (!valores.length) return;

    referencias.getCell(1, columnaLista + 1).value = columna.encabezado;
    valores.forEach((valor, fila) => {
      referencias.getCell(fila + 2, columnaLista + 1).value = valor;
    });

    const letraReferencia = referencias.getColumn(columnaLista + 1).letter;
    const formula = `'Catalogos'!$${letraReferencia}$2:$${letraReferencia}$${valores.length + 1}`;
    for (let fila = filaEncabezados + 1; fila <= filaEncabezados + 1000; fila++) {
      hoja.getCell(fila, indice + 1).dataValidation = {
        type: "list",
        allowBlank: !columna.obligatorio,
        formulae: [formula],
        showErrorMessage: true,
        errorTitle: "Valor no permitido",
        error: `Seleccione un valor de la lista: ${columna.encabezado}.`,
      };
    }
  });
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
  tipoActivoReferenciaId: number,
  catalogos: CatalogosActivos,
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

  const columnas = COLUMNAS_POR_TIPO[tipoActivoReferenciaId];
  const filaEncabezados = encontrarFilaEncabezados(matriz, columnas);
  if (filaEncabezados < 0) {
    return [];
  }

  const encabezados = (matriz[filaEncabezados] as unknown[]).map((celda) =>
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

  for (let i = filaEncabezados + 1; i < matriz.length; i++) {
    const fila = matriz[i] as unknown[];
    if (esFilaVacia(fila)) continue;

    const previsualizada = mapearFila(
      fila,
      i + 1,
      tipoActivoReferenciaId,
      columnas,
      indicePorClave,
      catalogos,
    );
    filas.push(previsualizada);
  }

  return filas;
}

/**
 * Encuentra la fila de encabezados escaneando las primeras filas del archivo:
 * es la que mas coincidencias tiene con los encabezados esperados (minimo 2).
 * Necesario porque la plantilla oficial trae cabecera corporativa (logo y
 * titulo en las filas 1-3, encabezados en la 4), pero tambien deben seguir
 * funcionando plantillas viejas o archivos hechos a mano (encabezados en la
 * fila 1). Exportada solo para poder probarla.
 */
export function encontrarFilaEncabezados(
  matriz: unknown[][],
  columnas: ColumnaCarga[],
): number {
  const objetivos = new Set(
    columnas.map((columna) => normalizarEncabezado(columna.encabezado)),
  );
  const maxFilasAExplorar = Math.min(matriz.length, 10);
  let mejorFila = -1;
  let mejorPuntaje = 0;

  for (let i = 0; i < maxFilasAExplorar; i++) {
    const fila = matriz[i] as unknown[];
    const puntaje = fila.filter((celda) =>
      objetivos.has(normalizarEncabezado(String(celda ?? ""))),
    ).length;
    if (puntaje > mejorPuntaje) {
      mejorPuntaje = puntaje;
      mejorFila = i;
    }
  }

  return mejorPuntaje >= 2 ? mejorFila : -1;
}

function mapearFila(
  fila: unknown[],
  numeroFila: number,
  tipoActivoReferenciaId: number,
  columnas: ColumnaCarga[],
  indicePorClave: Map<string, number>,
  catalogos: CatalogosActivos,
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

    const { valor, error } = convertirValor(valorCrudo, columna, catalogos);
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

  if (tipoActivoReferenciaId === 1) {
    const claseVehiculoReferenciaId = vehiculo.claseVehiculoReferenciaId as
      | number
      | undefined;
    const carroceriaReferenciaId = vehiculo.carroceriaReferenciaId as
      | number
      | undefined;
    const carroceria = catalogos.carrocerias.find(
      (opcion) => opcion.id === carroceriaReferenciaId,
    );

    if (
      claseVehiculoReferenciaId &&
      carroceria &&
      carroceria.claseVehiculoReferenciaId !== claseVehiculoReferenciaId
    ) {
      errores.carroceriaReferenciaId =
        "La carroceria seleccionada no corresponde a la clase elegida";
    }
  }

  const activo: CrearActivoPayload = {
    codigo: String(base.codigo ?? ""),
    tipoActivoReferenciaId,
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
    const defecto = VEHICULO_DEFECTO_POR_TIPO[tipoActivoReferenciaId];
    const claseVehiculoReferenciaId =
      (vehiculo.claseVehiculoReferenciaId as number | undefined) ??
      (defecto
        ? catalogos.idPorNombre("CLASE_VEHICULO", defecto.claseVehiculo) ?? 0
        : 0);
    const estadoCalibracionReferenciaId =
      (vehiculo.estadoCalibracionReferenciaId as number | undefined) ??
      (defecto
        ? catalogos.idPorNombre("ESTADO_CALIBRACION", defecto.estadoCalibracion) ?? 0
        : 0);
    activo.vehiculo = {
      claseVehiculoReferenciaId,
      estadoCalibracionReferenciaId,
      ...vehiculo,
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
  catalogos: CatalogosActivos,
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
      if (!fecha) {
        return { error: "Fecha invalida (use AAAA-MM-DD o DD/MM/AAAA)" };
      }
      return { valor: fecha };
    }
    case "opciones": {
      if (columna.catalogo) {
        const id = catalogos.idPorNombre(columna.catalogo, valorCrudo);
        if (id === null) {
          return {
            error: `Use: ${opcionesCatalogo(columna, catalogos).join(", ")}`,
          };
        }
        return { valor: id };
      }
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

/**
 * Devuelve la fecha como "AAAA-MM-DD" o null si no es valida.
 * Acepta ISO ("2026-05-29", "2026/05/29"), formato peruano ("29/05/2026",
 * "29-05-2026") y fechas reales de Excel (que llegan ya como "AAAA-MM-DD"
 * desde `limpiar`). Rechaza fechas imposibles (ej. 31/02) para que salgan
 * marcadas en la previsualizacion y nunca lleguen al backend.
 */
function normalizarFecha(valor: string): string | null {
  const limpio = valor.trim();
  if (!limpio) return null;

  // ISO: AAAA-MM-DD o AAAA/MM/DD
  const iso = limpio.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (iso) return construirFecha(iso[1], iso[2], iso[3]);

  // Peruano: DD/MM/AAAA o DD-MM-AAAA
  const peruano = limpio.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (peruano) return construirFecha(peruano[3], peruano[2], peruano[1]);

  return null;
}

/** Valida que (anio, mes, dia) sea una fecha real y la formatea AAAA-MM-DD. */
function construirFecha(
  anioStr: string,
  mesStr: string,
  diaStr: string,
): string | null {
  const anio = Number(anioStr);
  const mes = Number(mesStr);
  const dia = Number(diaStr);
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;

  // El round-trip detecta dias inexistentes (31/02 se corre a marzo y falla).
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  if (
    fecha.getUTCFullYear() !== anio ||
    fecha.getUTCMonth() !== mes - 1 ||
    fecha.getUTCDate() !== dia
  ) {
    return null;
  }

  const mm = String(mes).padStart(2, "0");
  const dd = String(dia).padStart(2, "0");
  return `${anio}-${mm}-${dd}`;
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
