"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArchiveRestore,
  ArchiveX,
  BriefcaseBusiness,
  Ban,
  CheckCircle2,
  CircleDashed,
  CircleX,
  Clock,
  Eye,
  type LucideIcon,
  Loader2,
  MoreVertical,
  Pencil,
  SendHorizontal,
  TrendingUp,
} from "lucide-react"

import { ApiError } from "@/compartido/api/axios"
import { Badge } from "@/compartido/componentes/ui/badge"
import { Button } from "@/compartido/componentes/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/compartido/componentes/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/compartido/componentes/ui/dropdown-menu"
import { Field, FieldDescription, FieldLabel } from "@/compartido/componentes/ui/field"
import { Textarea } from "@/compartido/componentes/ui/textarea"
import { cn } from "@/compartido/utilidades/utils"

import { useSesion } from "@/modulos/autenticacion/ganchos/use-sesion"
import {
  useAprobarSocioDeNegocioMutation,
  useDarDeBajaSocioDeNegocioMutation,
  useReactivarSocioDeNegocioMutation,
  useRechazarSocioDeNegocioMutation,
} from "../servicios/socio-negocios-queries"
import {
  puedeGestionarAsignacionesPersonal,
  puedeReenviarAprobacionSocio,
  puedeResolverAprobacionSocio,
} from "../tipos/socio-negocio"
import type {
  EstadoAprobacion,
  EstadoRegistro,
  EstadoSocioDeNegocio,
  ReporteSociosDeNegocioResponse,
  TipoSocioDeNegocio,
} from "../tipos/socio-negocio"

export type ErrorOperacion = {
  titulo: string
  descripcion: string
}

/** Forma mínima que necesitan las acciones, común a empresa y personal. */
export type SocioAccionable = {
  id: number
  tipo: TipoSocioDeNegocio
  estado: EstadoSocioDeNegocio
  estadoRegistro: EstadoRegistro
  estadoAprobacion: EstadoAprobacion
  numeroDocumento?: string
  codigoInternoSap?: string | null
}

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
    return { titulo: "Solicitud invalida", descripcion: error.message }
  }

  if (error instanceof ApiError && error.status === 0) {
    return { titulo: "Sin conexion con el servidor", descripcion: error.message }
  }

  return {
    titulo: "No se pudo completar la operacion",
    descripcion: obtenerMensajeError(error),
  }
}

export function formatearFecha(fecha?: string | null) {
  if (!fecha) return "-"
  const valor = new Date(fecha)
  if (Number.isNaN(valor.getTime())) return fecha
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(valor)
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

export function limpiarFiltros<T extends object>(query: T): T {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => {
      if (value === undefined || value === null) return false
      if (typeof value === "string") return value.trim() !== ""
      return true
    }),
  ) as T
}

export function obtenerValorFiltro<T extends object>(filtros: T, key: keyof T) {
  const value = filtros[key]
  return typeof value === "string" ? value : ""
}

export function obtenerClaseFilaSocio(socio: {
  estado: EstadoSocioDeNegocio
  estadoRegistro: EstadoRegistro
}) {
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

export function obtenerClaseContenidoSocio(socio: { estadoRegistro: EstadoRegistro }) {
  return socio.estadoRegistro === "ANULADO"
    ? "line-through decoration-destructive/70 decoration-2"
    : undefined
}

export function EstadoSocioBadge({ estado }: { estado: EstadoSocioDeNegocio }) {
  return (
    <Badge
      variant="outline"
      className="h-6 gap-1.5 rounded-full border-border/70 bg-card px-2.5 text-[12px] font-medium text-foreground shadow-xs"
    >
      {estado === "ACTIVO" ? (
        <CheckCircle2 data-icon="inline-start" className="text-emerald-600 dark:text-emerald-400" />
      ) : (
        <CircleDashed data-icon="inline-start" className="text-muted-foreground" />
      )}
      {estado}
    </Badge>
  )
}

export function EstadoRegistroBadge({ estadoRegistro }: { estadoRegistro: EstadoRegistro }) {
  return (
    <Badge
      variant="outline"
      className="h-6 gap-1.5 rounded-full border-border/70 bg-card px-2.5 text-[12px] font-medium text-foreground shadow-xs"
    >
      {estadoRegistro === "ACTIVO" ? (
        <CheckCircle2 data-icon="inline-start" className="text-emerald-600 dark:text-emerald-400" />
      ) : (
        <CircleX data-icon="inline-start" className="text-destructive" />
      )}
      {estadoRegistro}
    </Badge>
  )
}

export function EstadoAprobacionBadge({ estado }: { estado: EstadoAprobacion }) {
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

/**
 * Menú de acciones por fila. Type-agnóstico: recibe la forma mínima del socio y el
 * nombre a mostrar (razón social o nombre completo según el listado).
 */
export function AccionesSocio({
  socio,
  nombre,
  onActualizado,
  onMensaje,
  onError,
}: {
  socio: SocioAccionable
  nombre: string
  onActualizado: () => void
  onMensaje: (mensaje: string) => void
  onError: (error: ErrorOperacion) => void
}) {
  const { usuario } = useSesion()
  const usuarioId = usuario?.nombreUsuario ?? ""
  const bajaMutation = useDarDeBajaSocioDeNegocioMutation(socio.id, {
    onSuccess: onActualizado,
  })
  const reactivarMutation = useReactivarSocioDeNegocioMutation(socio.id, {
    onSuccess: onActualizado,
  })
  const aprobarMutation = useAprobarSocioDeNegocioMutation(socio.id, {
    onSuccess: onActualizado,
  })
  const rechazarMutation = useRechazarSocioDeNegocioMutation(socio.id, {
    onSuccess: onActualizado,
  })
  const [accion, setAccion] = useState<"anular" | "rechazar" | "reactivar" | null>(null)
  const [motivo, setMotivo] = useState("")
  const procesando =
    bajaMutation.isPending ||
    reactivarMutation.isPending ||
    aprobarMutation.isPending ||
    rechazarMutation.isPending
  const registroAnulado = socio.estadoRegistro === "ANULADO"
  const puedeReactivar =
    socio.estado === "INACTIVO" && socio.estadoRegistro === "ACTIVO"
  const puedeGestionarAsignaciones = puedeGestionarAsignacionesPersonal(socio)
  const puedeResolverAprobacion = puedeResolverAprobacionSocio(socio)
  const puedeReenviarAprobacion = puedeReenviarAprobacionSocio(socio)
  const requiereMotivo = accion === "anular" || accion === "rechazar"
  const detalleHref = `/socio-negocios/${socio.id}?tipo=${socio.tipo}`
  const editarHref = `/socio-negocios/${socio.id}?tipo=${socio.tipo}&modo=editar`

  function abrirAccion(nuevaAccion: "anular" | "rechazar" | "reactivar") {
    setMotivo(nuevaAccion === "anular" ? "Documento registrado incorrectamente" : "")
    setAccion(nuevaAccion)
  }

  async function aprobar() {
    try {
      await aprobarMutation.mutateAsync({ usuarioId })
      onMensaje(`${nombre} fue aprobado.`)
    } catch (error) {
      onError(obtenerErrorOperacion(error))
    }
  }

  async function confirmarAccion() {
    try {
      if (accion === "anular") {
        await bajaMutation.mutateAsync({
          motivo: motivo.trim(),
          usuarioId,
          estadoRegistro: "ANULADO",
        })
        onMensaje(`${nombre} fue anulado.`)
      }

      if (accion === "rechazar") {
        await rechazarMutation.mutateAsync({ usuarioId, motivo: motivo.trim() })
        onMensaje(`${nombre} fue rechazado.`)
      }

      if (accion === "reactivar") {
        await reactivarMutation.mutateAsync({ usuarioId })
        onMensaje(`Se creo un nuevo registro pendiente para ${nombre}.`)
      }

      setAccion(null)
    } catch (error) {
      onError(obtenerErrorOperacion(error))
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Acciones" disabled={procesando}>
            {procesando ? <Loader2 className="animate-spin" /> : <MoreVertical />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href={detalleHref}>
                <Eye data-icon="inline-start" />
                Ver
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/socio-negocios/historial/${socio.id}`}>
                <TrendingUp data-icon="inline-start" />
                Auditar
              </Link>
            </DropdownMenuItem>
            {puedeGestionarAsignaciones ? (
              <DropdownMenuItem asChild disabled={procesando}>
                <Link href={`/socio-negocios/${socio.id}/asignaciones`}>
                  <BriefcaseBusiness data-icon="inline-start" />
                  Asignaciones
                </Link>
              </DropdownMenuItem>
            ) : null}
            {!registroAnulado ? (
              <>
                <DropdownMenuItem asChild disabled={procesando}>
                  <Link href={editarHref}>
                    <Pencil data-icon="inline-start" />
                    Editar datos
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  disabled={
                    socio.estado !== "ACTIVO" ||
                    socio.estadoRegistro !== "ACTIVO" ||
                    procesando
                  }
                >
                  <Link href={detalleHref}>
                    <ArchiveX data-icon="inline-start" />
                    Dar de baja
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {puedeResolverAprobacion ? (
                  <>
                    <DropdownMenuItem
                      disabled={procesando}
                      onSelect={() => void aprobar()}
                    >
                      <CheckCircle2 data-icon="inline-start" />
                      Aprobar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={procesando}
                      onSelect={() => abrirAccion("rechazar")}
                    >
                      <Ban data-icon="inline-start" />
                      Rechazar
                    </DropdownMenuItem>
                  </>
                ) : null}
                {puedeReenviarAprobacion ? (
                  <DropdownMenuItem asChild disabled={procesando}>
                    <Link href={`/socio-negocios/${socio.id}?tipo=${socio.tipo}&modo=corregir`}>
                      <SendHorizontal data-icon="inline-start" />
                      Corregir y reenviar
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem
                  disabled={procesando}
                  onSelect={() => abrirAccion("anular")}
                >
                  <CircleX data-icon="inline-start" />
                  Anular
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!puedeReactivar || procesando}
                  onSelect={() => abrirAccion("reactivar")}
                >
                  <ArchiveRestore data-icon="inline-start" />
                  Reactivar
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={accion !== null} onOpenChange={(open) => !open && setAccion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {accion === "anular"
                ? "Anular socio"
                : accion === "rechazar"
                  ? "Rechazar socio"
                  : "Reactivar socio"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {accion === "reactivar"
                ? `Confirma la reactivacion de ${nombre}.`
                : accion === "rechazar"
                  ? "El socio quedara inactivo. El motivo se registra en la auditoria."
                  : accion === "anular"
                    ? "El motivo quedara registrado en la auditoria del socio."
                    : `Registra el motivo para ${nombre}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
              <p className="font-medium">{nombre}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {[socio.codigoInternoSap, socio.numeroDocumento].filter(Boolean).join(" · ") || "-"}
              </p>
            </div>

            {requiereMotivo ? (
              <Field>
                <FieldLabel htmlFor={`motivo-${socio.id}`}>Motivo</FieldLabel>
                <Textarea
                  id={`motivo-${socio.id}`}
                  value={motivo}
                  onChange={(event) => setMotivo(event.target.value)}
                  placeholder="Registro creado por error"
                  disabled={procesando}
                />
                <FieldDescription>
                  Este motivo quedara asociado al movimiento del socio.
                </FieldDescription>
              </Field>
            ) : null}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={procesando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant={accion === "anular" || accion === "rechazar" ? "destructive" : "default"}
              disabled={procesando || (requiereMotivo && !motivo.trim())}
              onClick={(event) => {
                event.preventDefault()
                void confirmarAccion()
              }}
            >
              {procesando
                ? "Procesando..."
                : accion === "anular"
                  ? "Anular"
                  : accion === "rechazar"
                    ? "Rechazar"
                    : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
