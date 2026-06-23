import type { TipoActivo } from "../tipos/activo.tipos";

/**
 * Configuracion de columnas de la plantilla de carga masiva.
 *
 * Cada tipo de activo abre distintas pestanas en el formulario, por eso la
 * plantilla solo trae las columnas que aplican a ese tipo. `destino` indica si
 * el valor va al payload base del activo o al sub-objeto `vehiculo` (que agrupa
 * datos vehiculares, dimensiones, equipamiento, control y combustible).
 */
export type TipoColumna =
  | "texto"
  | "numero"
  | "entero"
  | "fecha"
  | "opciones";

export type ColumnaCarga = {
  clave: string;
  encabezado: string;
  obligatorio: boolean;
  tipo: TipoColumna;
  destino: "base" | "vehiculo";
  opciones?: string[];
  ejemplo?: string;
  ayuda?: string;
};

// Columnas comunes a TODOS los tipos (pestanas Base + Adquisicion).
const COLUMNAS_BASE: ColumnaCarga[] = [
  {
    clave: "codigo",
    encabezado: "Codigo*",
    obligatorio: true,
    tipo: "texto",
    destino: "base",
    ejemplo: "ACT-000901",
    ayuda: "Codigo unico del activo. Obligatorio.",
  },
  {
    clave: "descripcion",
    encabezado: "Descripcion*",
    obligatorio: true,
    tipo: "texto",
    destino: "base",
    ejemplo: "Camioneta Toyota Hilux",
    ayuda: "Nombre o descripcion del activo. Obligatorio.",
  },
  {
    clave: "ubicacion",
    encabezado: "Ubicacion*",
    obligatorio: true,
    tipo: "texto",
    destino: "base",
    ejemplo: "Arequipa - Base principal",
    ayuda: "Sede o ubicacion del activo. Obligatorio.",
  },
  {
    clave: "estadoActivo",
    encabezado: "Estado",
    obligatorio: false,
    tipo: "opciones",
    destino: "base",
    opciones: ["ACTIVO", "INACTIVO", "SINIESTRADO"],
    ejemplo: "ACTIVO",
    ayuda: "Si se deja vacio se asume ACTIVO.",
  },
  {
    clave: "observacion",
    encabezado: "Observacion",
    obligatorio: false,
    tipo: "texto",
    destino: "base",
    ayuda: "Comentario opcional.",
  },
  {
    clave: "valorUnidad",
    encabezado: "Valor",
    obligatorio: false,
    tipo: "numero",
    destino: "base",
    ejemplo: "125000.50",
    ayuda: "Valor de compra. Numero, sin simbolo de moneda.",
  },
  {
    clave: "moneda",
    encabezado: "Moneda",
    obligatorio: false,
    tipo: "opciones",
    destino: "base",
    opciones: ["PEN", "USD"],
    ejemplo: "PEN",
    ayuda: "PEN = soles, USD = dolares. Default PEN.",
  },
  {
    clave: "proveedor",
    encabezado: "Proveedor",
    obligatorio: false,
    tipo: "texto",
    destino: "base",
    ejemplo: "Proveedor Logistico SAC",
  },
  {
    clave: "numeroFactura",
    encabezado: "Numero factura",
    obligatorio: false,
    tipo: "texto",
    destino: "base",
    ejemplo: "F001-000123",
  },
  {
    clave: "fechaFactura",
    encabezado: "Fecha factura",
    obligatorio: false,
    tipo: "fecha",
    destino: "base",
    ejemplo: "2026-05-29",
    ayuda: "Formato AAAA-MM-DD.",
  },
];

// Columnas vehiculares principales (placa, motor, chasis, etc.).
const COLUMNAS_VEHICULO_IDENTIDAD: ColumnaCarga[] = [
  {
    clave: "placa",
    encabezado: "Placa",
    obligatorio: false,
    tipo: "texto",
    destino: "vehiculo",
    ejemplo: "BTZ-750",
  },
  {
    clave: "marca",
    encabezado: "Marca",
    obligatorio: false,
    tipo: "texto",
    destino: "vehiculo",
    ejemplo: "TOYOTA",
  },
  {
    clave: "modelo",
    encabezado: "Modelo",
    obligatorio: false,
    tipo: "texto",
    destino: "vehiculo",
    ejemplo: "HILUX",
  },
  {
    clave: "anioFabricacion",
    encabezado: "Anio fabricacion",
    obligatorio: false,
    tipo: "entero",
    destino: "vehiculo",
    ejemplo: "2023",
  },
  {
    clave: "color",
    encabezado: "Color",
    obligatorio: false,
    tipo: "texto",
    destino: "vehiculo",
    ejemplo: "BLANCO",
  },
  {
    clave: "serieChasis",
    encabezado: "Serie chasis",
    obligatorio: false,
    tipo: "texto",
    destino: "vehiculo",
    ejemplo: "8AJKA3CD7P3108239",
  },
  {
    clave: "serieMotor",
    encabezado: "Serie motor",
    obligatorio: false,
    tipo: "texto",
    destino: "vehiculo",
    ejemplo: "1GDG366863",
  },
];

// Carroceria, ejes, categoria, clase Euro, transmision, ratio corona.
const COLUMNAS_VEHICULO_TECNICO: ColumnaCarga[] = [
  {
    clave: "carroceria",
    encabezado: "Carroceria",
    obligatorio: false,
    tipo: "texto",
    destino: "vehiculo",
    ejemplo: "PICK UP",
  },
  {
    clave: "ejes",
    encabezado: "Ejes",
    obligatorio: false,
    tipo: "entero",
    destino: "vehiculo",
    ejemplo: "2",
  },
  {
    clave: "categoria",
    encabezado: "Categoria",
    obligatorio: false,
    tipo: "texto",
    destino: "vehiculo",
    ejemplo: "N1",
  },
  {
    clave: "claseEuro",
    encabezado: "Clase Euro",
    obligatorio: false,
    tipo: "opciones",
    destino: "vehiculo",
    opciones: ["EURO_1", "EURO_2", "EURO_3", "EURO_4", "EURO_5"],
    ejemplo: "EURO_5",
  },
  {
    clave: "tipoTransmision",
    encabezado: "Transmision",
    obligatorio: false,
    tipo: "opciones",
    destino: "vehiculo",
    opciones: [
      "AUTOMATICA",
      "AUTOMATIZADA",
      "MECANICA_10_VELOCIDADES",
      "MECANICA_13_VELOCIDADES",
      "MECANICA_18_VELOCIDADES",
    ],
    ejemplo: "MECANICA_18_VELOCIDADES",
  },
  {
    clave: "ratioCorona",
    encabezado: "Ratio corona",
    obligatorio: false,
    tipo: "numero",
    destino: "vehiculo",
    ejemplo: "4.88",
    ayuda: "Decimal menor a 10, hasta 2 decimales.",
  },
];

// Dimensiones fisicas.
const COLUMNAS_DIMENSIONES: ColumnaCarga[] = [
  {
    clave: "alto",
    encabezado: "Alto (m)",
    obligatorio: false,
    tipo: "numero",
    destino: "vehiculo",
    ejemplo: "1.815",
  },
  {
    clave: "ancho",
    encabezado: "Ancho (m)",
    obligatorio: false,
    tipo: "numero",
    destino: "vehiculo",
    ejemplo: "1.855",
  },
  {
    clave: "longitud",
    encabezado: "Longitud (m)",
    obligatorio: false,
    tipo: "numero",
    destino: "vehiculo",
    ejemplo: "5.325",
  },
];

// Control operativo + combustible.
const COLUMNAS_CONTROL: ColumnaCarga[] = [
  {
    clave: "estadoOperativo",
    encabezado: "Estado operativo",
    obligatorio: false,
    tipo: "opciones",
    destino: "vehiculo",
    opciones: ["OPERATIVO", "MANTENIMIENTO", "NO_OPERATIVO"],
    ejemplo: "OPERATIVO",
  },
  {
    clave: "estadoCalibracion",
    encabezado: "Estado calibracion",
    obligatorio: false,
    tipo: "opciones",
    destino: "vehiculo",
    opciones: ["CALIBRADA", "NO_CALIBRADA", "PENDIENTE", "OBSERVADA"],
    ejemplo: "NO_CALIBRADA",
  },
  {
    clave: "factorCorreccion",
    encabezado: "Factor correccion",
    obligatorio: false,
    tipo: "numero",
    destino: "vehiculo",
    ejemplo: "1.08",
  },
];

const COLUMNAS_COMBUSTIBLE: ColumnaCarga[] = [
  {
    clave: "capacidadTanqueGalones",
    encabezado: "Capacidad tanque (gal)",
    obligatorio: false,
    tipo: "numero",
    destino: "vehiculo",
    ejemplo: "21",
    ayuda: "Capacidad de diesel en galones.",
  },
];

/**
 * Columnas finales por tipo de activo. Refleja las pestanas que abre cada tipo
 * en el formulario (ver TABS_POR_TIPO_ACTIVO en activo-formulario.tsx).
 */
export const COLUMNAS_POR_TIPO: Record<TipoActivo, ColumnaCarga[]> = {
  VEHICULO: [
    ...COLUMNAS_BASE,
    ...COLUMNAS_VEHICULO_IDENTIDAD,
    ...COLUMNAS_VEHICULO_TECNICO,
    ...COLUMNAS_DIMENSIONES,
    ...COLUMNAS_CONTROL,
    ...COLUMNAS_COMBUSTIBLE,
  ],
  EQUIPO: [
    ...COLUMNAS_BASE,
    ...COLUMNAS_VEHICULO_IDENTIDAD,
    ...COLUMNAS_DIMENSIONES,
    ...COLUMNAS_CONTROL,
  ],
  DISPOSITIVO: [
    ...COLUMNAS_BASE,
    {
      clave: "marca",
      encabezado: "Marca",
      obligatorio: false,
      tipo: "texto",
      destino: "vehiculo",
      ejemplo: "GARMIN",
    },
    {
      clave: "modelo",
      encabezado: "Modelo",
      obligatorio: false,
      tipo: "texto",
      destino: "vehiculo",
      ejemplo: "GPS-500",
    },
    {
      clave: "serieChasis",
      encabezado: "Serie",
      obligatorio: false,
      tipo: "texto",
      destino: "vehiculo",
    },
    ...COLUMNAS_CONTROL.filter((columna) => columna.clave === "estadoOperativo"),
  ],
  HERRAMIENTA: [
    ...COLUMNAS_BASE,
    ...COLUMNAS_CONTROL.filter((columna) => columna.clave === "estadoOperativo"),
  ],
  OTRO: [...COLUMNAS_BASE],
};

/**
 * Plantilla de inventario por defecto cuando el tipo tiene datos vehiculares
 * pero el Excel no la especifica. VEHICULO usa CAMION como base generica.
 */
export const PLANTILLA_INVENTARIO_DEFECTO: Record<TipoActivo, string> = {
  VEHICULO: "CAMION",
  EQUIPO: "EQUIPO_LIVIANO",
  DISPOSITIVO: "EQUIPO_LIVIANO",
  HERRAMIENTA: "EQUIPO_LIVIANO",
  OTRO: "EQUIPO_LIVIANO",
};

export const ETIQUETA_TIPO_ACTIVO: Record<TipoActivo, string> = {
  VEHICULO: "Vehiculo",
  EQUIPO: "Equipo",
  HERRAMIENTA: "Herramienta",
  DISPOSITIVO: "Dispositivo",
  OTRO: "Otro",
};
