import {
  CheckCircle2,
  CircleAlert,
  CircleDashed,
  CircleSlash,
  Clock,
  Loader2,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/compartido/componentes/ui/badge"
import { cn } from "@/compartido/utilidades/utils"

import type { EstadoSincronizacionSap } from "../tipos/socio-negocio"

type Config = {
  label: string
  icon: LucideIcon
  iconClassName: string
  spin?: boolean
}

const CONFIG: Record<EstadoSincronizacionSap, Config> = {
  NO_APLICA: {
    label: "No aplica",
    icon: CircleSlash,
    iconClassName: "text-muted-foreground",
  },
  NO_INICIADA: {
    label: "No iniciada",
    icon: CircleDashed,
    iconClassName: "text-muted-foreground",
  },
  PENDIENTE: {
    label: "Pendiente",
    icon: Clock,
    iconClassName: "text-amber-500 dark:text-amber-400",
  },
  PROCESANDO: {
    label: "Procesando",
    icon: Loader2,
    iconClassName: "text-amber-500 dark:text-amber-400",
    spin: true,
  },
  SINCRONIZADO: {
    label: "Sincronizado",
    icon: CheckCircle2,
    iconClassName: "text-emerald-600 dark:text-emerald-400",
  },
  FALLIDO: {
    label: "Fallido",
    icon: CircleAlert,
    iconClassName: "text-destructive",
  },
}

export function EstadoSincronizacionSapBadge({
  estado,
  ultimoError,
  className,
}: {
  estado: EstadoSincronizacionSap
  ultimoError?: string
  className?: string
}) {
  const config = CONFIG[estado] ?? CONFIG.NO_INICIADA
  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      title={estado === "FALLIDO" && ultimoError ? ultimoError : undefined}
      className={cn(
        "h-6 gap-1.5 rounded-full border-border/70 bg-card px-2.5 text-[12px] font-medium text-foreground shadow-xs",
        className,
      )}
    >
      <Icon
        data-icon="inline-start"
        className={cn(config.iconClassName, config.spin && "animate-spin")}
      />
      {config.label}
    </Badge>
  )
}
