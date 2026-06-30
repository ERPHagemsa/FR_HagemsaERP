// Tipos locales compartidos por las partes del formulario de activos
// (extraidos de activo-formulario.tsx para reducir el tamano del archivo).

export type RegistroResumenData = Record<string, Array<[string, unknown]>>;

export type ActivoTab =
  | "base"
  | "adquisicion"
  | "vehiculo"
  | "equipamiento"
  | "dimensiones"
  | "control"
  | "combustible"
  | "documentos";
