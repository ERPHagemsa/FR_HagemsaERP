import type * as React from "react";

/** Alineación del contenido de una columna. Por defecto "izquierda". */
export type AlineacionColumna = "izquierda" | "centro" | "derecha";

/**
 * Define una columna de la tabla de datos. La presentación es genérica:
 * cada pantalla describe qué encabezado mostrar y cómo renderizar la celda
 * a partir de una fila `T`.
 */
export type ColumnaTabla<T> = {
  /** Identificador único de la columna (se usa como key). */
  id: string;
  /** Texto o nodo del encabezado. */
  encabezado: React.ReactNode;
  /** Render del contenido de la celda para una fila. */
  celda: (fila: T) => React.ReactNode;
  /** Clase de ancho para `table-fixed` (ej: "w-[13%]"). */
  ancho?: string;
  /** Alineación del contenido. Por defecto "izquierda". */
  alineacion?: AlineacionColumna;
  /**
   * Columna ancla de la fila: se resalta a contraste pleno (`font-medium`).
   * El resto de columnas se atenúan por defecto (`text-muted-foreground`).
   * Marcar SOLO UNA por tabla (normalmente el nombre del registro). Para
   * devolver una columna no-ancla al contraste pleno (ej. montos), usar
   * `className: "text-foreground"` — gana sobre el atenuado por defecto.
   */
  principal?: boolean;
  /** Clase extra opcional aplicada al `th` y al `td`. */
  className?: string;
};

/**
 * Acción disponible en el menú `⋯` de una fila. Puede navegar (`href`) o
 * ejecutar un handler (`alSeleccionar`); definir solo una de las dos.
 */
export type AccionTabla<T> = {
  /** Texto visible en el menú. */
  etiqueta: string;
  /** Ícono opcional (lucide-react). */
  icono?: React.ComponentType<{ className?: string }>;
  /** Si se define, la acción es un enlace a esta ruta. */
  href?: (fila: T) => string;
  /** Handler de click; alternativa a `href`. */
  alSeleccionar?: (fila: T) => void;
  /** Marca visual de acción destructiva (rojo). */
  destructiva?: boolean;
  /** Oculta la acción para ciertas filas. */
  oculta?: (fila: T) => boolean;
};

/**
 * Estado de paginación. La tabla es presentacional: el backend ya pagina,
 * acá solo se muestran los controles y se avisa el cambio de página.
 */
export type PaginacionTabla = {
  pagina: number;
  porPagina: number;
  total: number;
  alCambiarPagina: (pagina: number) => void;
};
