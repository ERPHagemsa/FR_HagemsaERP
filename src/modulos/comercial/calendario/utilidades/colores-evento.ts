// Paleta categorica para colorear los eventos del calendario POR EJECUTIVO.
// El color se asigna de forma determinista por hash del id del ejecutivo, asi el
// mismo ejecutivo mantiene su color entre meses y renders. Cada entrada trae las
// clases del chip (fondo/texto/hover, claro y oscuro) y el punto de la leyenda.
// Clases estaticas a proposito: Tailwind debe verlas literales para incluirlas.

export type ColorEvento = {
  chip: string;
  punto: string;
};

const PALETA: ColorEvento[] = [
  {
    chip: "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-500/20 dark:text-blue-200 dark:hover:bg-blue-500/30",
    punto: "bg-blue-500",
  },
  {
    chip: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-200 dark:hover:bg-emerald-500/30",
    punto: "bg-emerald-500",
  },
  {
    chip: "bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-200 dark:hover:bg-amber-500/30",
    punto: "bg-amber-500",
  },
  {
    chip: "bg-violet-100 text-violet-800 hover:bg-violet-200 dark:bg-violet-500/20 dark:text-violet-200 dark:hover:bg-violet-500/30",
    punto: "bg-violet-500",
  },
  {
    chip: "bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-500/20 dark:text-rose-200 dark:hover:bg-rose-500/30",
    punto: "bg-rose-500",
  },
  {
    chip: "bg-cyan-100 text-cyan-900 hover:bg-cyan-200 dark:bg-cyan-500/20 dark:text-cyan-200 dark:hover:bg-cyan-500/30",
    punto: "bg-cyan-500",
  },
  {
    chip: "bg-orange-100 text-orange-900 hover:bg-orange-200 dark:bg-orange-500/20 dark:text-orange-200 dark:hover:bg-orange-500/30",
    punto: "bg-orange-500",
  },
  {
    chip: "bg-teal-100 text-teal-900 hover:bg-teal-200 dark:bg-teal-500/20 dark:text-teal-200 dark:hover:bg-teal-500/30",
    punto: "bg-teal-500",
  },
];

/** Color estable de un ejecutivo (hash del id → indice de la paleta). */
export function colorEvento(idEjecutivo: string): ColorEvento {
  // Defensivo: si el feed aun no trae el id (backend sin recargar), color base.
  if (!idEjecutivo) return PALETA[0];

  let hash = 0;
  for (let i = 0; i < idEjecutivo.length; i++) {
    hash = (hash * 31 + idEjecutivo.charCodeAt(i)) >>> 0;
  }
  return PALETA[hash % PALETA.length];
}
