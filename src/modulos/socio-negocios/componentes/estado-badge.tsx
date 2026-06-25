"use client"

import { Badge } from "@/compartido/componentes/ui/badge"
import { cn } from "@/compartido/utilidades/utils"

type Tono = "verde" | "ambar" | "rojo" | "gris" | "azul"

const CLASES_TONO: Record<Tono, string> = {
  verde:
    "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  ambar:
    "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
  rojo:
    "border-red-300 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300",
  azul:
    "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300",
  gris: "border-border bg-muted text-muted-foreground",
}

// Tono semántico por estado conocido del módulo (asignación, gestión operativa,
// disponibilidad y aprobación). Lo desconocido cae en gris neutro.
const TONO_POR_ESTADO: Record<string, Tono> = {
  VIGENTE: "verde",
  ACTIVO: "verde",
  DISPONIBLE: "verde",
  APROBADO: "verde",
  RESERVADO: "ambar",
  PENDIENTE_APROBACION: "ambar",
  PENDIENTE: "ambar",
  FINALIZADA: "gris",
  INACTIVO: "gris",
  NO_APLICA: "gris",
  NO_DISPONIBLE: "rojo",
  ANULADA: "rojo",
  ANULADO: "rojo",
  RECHAZADO: "rojo",
}

// Texto legible para estados con guion bajo.
const ETIQUETA_POR_ESTADO: Record<string, string> = {
  PENDIENTE_APROBACION: "Pendiente de aprobacion",
  NO_DISPONIBLE: "No disponible",
  NO_APLICA: "No aplica",
}

export function EstadoBadge({
  estado,
  className,
}: {
  estado?: string | null
  className?: string
}) {
  if (!estado) return null
  const tono = TONO_POR_ESTADO[estado] ?? "gris"
  const etiqueta = ETIQUETA_POR_ESTADO[estado] ?? estado
  return (
    <Badge variant="outline" className={cn("font-medium", CLASES_TONO[tono], className)}>
      {etiqueta}
    </Badge>
  )
}
