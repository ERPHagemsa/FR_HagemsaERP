"use client"

import { ApiError } from "@/compartido/api/axios"
import { Badge } from "@/compartido/componentes/ui/badge"
import { cn } from "@/compartido/utilidades/utils"
import {
  CheckCircle2,
  CircleDashed,
  CircleX,
  Clock,
  type LucideIcon,
} from "lucide-react"

import type {
  ConsultarSociosDeNegocioQuery,
  ReporteSociosDeNegocioResponse,
  SocioDeNegocioResponse,
} from "../../tipos/socio-negocio"
import {
  puedeGestionarAsignacionesPersonal,
  puedeReenviarAprobacionSocio,
  puedeResolverAprobacionSocio,
} from "../../tipos/socio-negocio"

export type SocioNegocioVistaProps = {
  titulo: string
  accionPrincipal?: string
  crearHref?: string
  filtros?: ConsultarSociosDeNegocioQuery
}

export type ErrorOperacion = {
  titulo: string
  descripcion: string
}

const estadoVariant = {
  ACTIVO: "outline",
  INACTIVO: "outline",
} as const

const estadoRegistroVariant = {
  ACTIVO: "outline",
  ANULADO: "outline",
} as const

const estadoClassName = {
  ACTIVO: "border-border/70 bg-card text-foreground shadow-xs",
  INACTIVO: "border-border/70 bg-card text-foreground shadow-xs",
} as const

const estadoRegistroClassName = {
  ACTIVO: "border-border/70 bg-card text-foreground shadow-xs",
  ANULADO: "border-border/70 bg-card text-foreground shadow-xs",
} as const

const estadoIconClassName = {
  ACTIVO: "text-emerald-600 dark:text-emerald-400",
  INACTIVO: "text-muted-foreground",
} as const

const estadoRegistroIconClassName = {
  ACTIVO: "text-emerald-600 dark:text-emerald-400",
  ANULADO: "text-destructive",
} as const

export function obtenerMensajeError(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo completar la operacion."
}

export function obtenerErrorOperacion(error: unknown): ErrorOperacion {
  if (error instanceof ApiError && error.status === 409) {
    return {
      titulo: "Operacion no permitida",
      descripcion:
        error.message ||
        "El socio tiene un conflicto de estado o ya existe una operacion equivalente.",
    }
  }

  if (error instanceof ApiError && (error.status === 400 || error.status === 422)) {
    return {
      titulo: "Solicitud invalida",
      descripcion: error.message,
    }
  }

  if (error instanceof ApiError && error.status === 0) {
    return {
      titulo: "Sin conexion con el servidor",
      descripcion: error.message,
    }
  }

  return {
    titulo: "No se pudo completar la operacion",
    descripcion: obtenerMensajeError(error),
  }
}

function tipoMimeReporte(formato: ReporteSociosDeNegocioResponse["formato"]) {
  return formato === "PDF"
    ? "application/pdf"
    : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
}

export function descargarReporte(reporte: ReporteSociosDeNegocioResponse) {
  const enlace = document.createElement("a")
  const contenido = reporte.contenido
  const url = contenido.startsWith("data:")
    ? contenido
    : `data:${tipoMimeReporte(reporte.formato)};base64,${contenido}`

  enlace.href = url
  enlace.download = reporte.nombreArchivo
  enlace.style.display = "none"
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
}

export function formatearFecha(fecha?: string) {
  if (!fecha) {
    return "-"
  }

  const valor = new Date(fecha)

  if (Number.isNaN(valor.getTime())) {
    return fecha
  }

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(valor)
}

export function EstadoSocioBadge({
  estado,
}: {
  estado: SocioDeNegocioResponse["estado"]
}) {
  return (
    <Badge
      variant={estadoVariant[estado]}
      className={`h-6 gap-1.5 rounded-full px-2.5 text-[12px] font-medium ${estadoClassName[estado]}`}
    >
      {estado === "ACTIVO" ? (
        <CheckCircle2 data-icon="inline-start" className={estadoIconClassName[estado]} />
      ) : (
        <CircleDashed data-icon="inline-start" className={estadoIconClassName[estado]} />
      )}
      {estado}
    </Badge>
  )
}

export function EstadoRegistroBadge({
  estadoRegistro,
}: {
  estadoRegistro: SocioDeNegocioResponse["estadoRegistro"]
}) {
  return (
      <Badge
      variant={estadoRegistroVariant[estadoRegistro]}
      className={`h-6 gap-1.5 rounded-full px-2.5 text-[12px] font-medium ${estadoRegistroClassName[estadoRegistro]}`}
    >
      {estadoRegistro === "ACTIVO" ? (
        <CheckCircle2 data-icon="inline-start" className={estadoRegistroIconClassName[estadoRegistro]} />
      ) : (
        <CircleX data-icon="inline-start" className={estadoRegistroIconClassName[estadoRegistro]} />
      )}
      {estadoRegistro}
    </Badge>
  )
}

export function EstadoAprobacionBadge({
  estado,
}: {
  estado: SocioDeNegocioResponse["estadoAprobacion"]
}) {
  const baseClase =
    "h-6 gap-1.5 rounded-full border-border/70 bg-card px-2.5 text-[12px] font-medium text-foreground shadow-xs"

  if (estado === "APROBADO") {
    return (
      <Badge variant="outline" className={baseClase}>
        <CheckCircle2 data-icon="inline-start" className="text-emerald-600 dark:text-emerald-400" />
        Aprobado
      </Badge>
    )
  }

  if (estado === "PENDIENTE_APROBACION") {
    return (
      <Badge variant="outline" className={baseClase}>
        <Clock data-icon="inline-start" className="text-amber-500 dark:text-amber-400" />
        Pendiente
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className={baseClase}>
      <CircleX data-icon="inline-start" className="text-destructive" />
      No aprobado
    </Badge>
  )
}

export function limpiarFiltros(query: ConsultarSociosDeNegocioQuery) {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => {
      if (value === undefined || value === null) return false
      if (typeof value === "string") return value.trim() !== ""
      return true
    }),
  ) as ConsultarSociosDeNegocioQuery
}

export function obtenerValorFiltro(
  filtros: ConsultarSociosDeNegocioQuery,
  key: keyof ConsultarSociosDeNegocioQuery,
) {
  const value = filtros[key]
  return typeof value === "string" ? value : ""
}

export function obtenerClaseFilaSocio(socio: SocioDeNegocioResponse) {
  const inactivo = socio.estado === "INACTIVO"
  const anulado = socio.estadoRegistro === "ANULADO"

  return cn(
    "border-border/80 hover:bg-transparent",
    inactivo && !anulado &&
      "border-l-4 border-l-muted-foreground/40 bg-muted/45 hover:bg-muted/45",
    anulado &&
      "border-l-4 border-l-destructive bg-destructive/5 text-muted-foreground hover:bg-destructive/5",
  )
}

export function obtenerClaseContenidoSocio(socio: SocioDeNegocioResponse) {
  return socio.estadoRegistro === "ANULADO"
    ? "line-through decoration-destructive/70 decoration-2"
    : undefined
}

export function ResumenListado({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: number
}) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-background p-3">
      <div className="flex items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold tabular-nums">{value}</p>
        </div>
      </div>
    </div>
  )
}

export function obtenerFiltrosActivos(filtros: ConsultarSociosDeNegocioQuery) {
  const etiquetas: Partial<Record<keyof ConsultarSociosDeNegocioQuery, string>> = {
    razonSocial: "Socio",
    numeroDocumento: "Documento",
    tipo: "Tipo",
    estado: "Estado",
    estadoRegistro: "Registro",
    estadoAprobacion: "Aprobacion",
    origen: "Origen",
    estadoSincronizacionSap: "SAP",
  }

  return Object.entries(filtros)
    .filter(([key, value]) => {
      if (key === "page" || key === "pageSize") return false
      if (value === undefined || value === null || value === "") return false
      return key in etiquetas
    })
    .map(([key, value]) => ({
      key,
      label: etiquetas[key as keyof ConsultarSociosDeNegocioQuery] ?? key,
      value: String(value).replaceAll("_", " "),
    }))
}

export function obtenerSiguienteAccion(socio: SocioDeNegocioResponse) {
  if (socio.estadoRegistro === "ANULADO") return "Registro anulado"
  if (puedeResolverAprobacionSocio(socio)) return "Revisar aprobacion"
  if (puedeReenviarAprobacionSocio(socio)) return "Corregir y reenviar"
  if (puedeGestionarAsignacionesPersonal(socio)) return "Gestionar asignacion"
  if (socio.estado === "INACTIVO") return "Evaluar reactivacion"
  return "Operativo"
}
