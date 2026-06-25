"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { SiteHeader } from "@/compartido/componentes/site-header"
import { ApiError } from "@/compartido/api/axios"
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert"
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
import { Badge } from "@/compartido/componentes/ui/badge"
import { Button } from "@/compartido/componentes/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/compartido/componentes/ui/dropdown-menu"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/compartido/componentes/ui/empty"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/compartido/componentes/ui/field"
import { Input } from "@/compartido/componentes/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/compartido/componentes/ui/input-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select"
import { Skeleton } from "@/compartido/componentes/ui/skeleton"
import { Textarea } from "@/compartido/componentes/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table"
import { cn } from "@/compartido/utilidades/utils"
import {
  BriefcaseBusiness,
  ArchiveRestore,
  ArchiveX,
  Ban,
  Building2,
  CheckCircle2,
  CircleDashed,
  CircleX,
  Clock,
  Download,
  Eye,
  Filter,
  type LucideIcon,
  MoreVertical,
  Package,
  Pencil,
  Plus,
  Search,
  SendHorizontal,
  TrendingUp,
  User,
  Loader2,
} from "lucide-react"

import {
  useAprobarSocioDeNegocioMutation,
  useDarDeBajaSocioDeNegocioMutation,
  useExportarSociosDeNegocioQuery,
  useReactivarSocioDeNegocioMutation,
  useRechazarSocioDeNegocioMutation,
  useSociosDeNegocioQuery,
} from "../servicios/socio-negocios-queries"
import { useSesion } from "@/modulos/autenticacion/ganchos/use-sesion"
import { PaginationControls } from "../componentes/pagination-controls"
import { SocioNegocioPageHeader } from "../componentes/socio-negocio-page-header"
import { EstadoSincronizacionSapBadge } from "../componentes/estado-sincronizacion-sap-badge"
import type {
  ConsultarSociosDeNegocioQuery,
  ReporteSociosDeNegocioResponse,
  SocioDeNegocioResponse,
} from "../tipos/socio-negocio"
import {
  puedeGestionarAsignacionesPersonal,
  puedeReenviarAprobacionSocio,
  puedeResolverAprobacionSocio,
} from "../tipos/socio-negocio"

type SocioNegocioVistaProps = {
  titulo: string
  accionPrincipal?: string
  crearHref?: string
  filtros?: ConsultarSociosDeNegocioQuery
}

type ErrorOperacion = {
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

function obtenerMensajeError(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo completar la operacion."
}

function obtenerErrorOperacion(error: unknown): ErrorOperacion {
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

function descargarReporte(reporte: ReporteSociosDeNegocioResponse) {
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

function formatearFecha(fecha?: string) {
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

function EstadoSocioBadge({
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

function EstadoRegistroBadge({
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

function EstadoAprobacionBadge({
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

type AccionesSocioProps = {
  socio: SocioDeNegocioResponse
  onActualizado: () => void
  onMensaje: (mensaje: string) => void
  onError: (error: ErrorOperacion) => void
}

function limpiarFiltros(query: ConsultarSociosDeNegocioQuery) {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => {
      if (value === undefined || value === null) return false
      if (typeof value === "string") return value.trim() !== ""
      return true
    }),
  ) as ConsultarSociosDeNegocioQuery
}

function obtenerValorFiltro(
  filtros: ConsultarSociosDeNegocioQuery,
  key: keyof ConsultarSociosDeNegocioQuery,
) {
  const value = filtros[key]
  return typeof value === "string" ? value : ""
}

function obtenerClaseFilaSocio(socio: SocioDeNegocioResponse) {
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

function obtenerClaseContenidoSocio(socio: SocioDeNegocioResponse) {
  return socio.estadoRegistro === "ANULADO"
    ? "line-through decoration-destructive/70 decoration-2"
    : undefined
}

function ResumenListado({
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

function obtenerFiltrosActivos(filtros: ConsultarSociosDeNegocioQuery) {
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

function obtenerSiguienteAccion(socio: SocioDeNegocioResponse) {
  if (socio.estadoRegistro === "ANULADO") return "Registro anulado"
  if (puedeResolverAprobacionSocio(socio)) return "Revisar aprobacion"
  if (puedeReenviarAprobacionSocio(socio)) return "Corregir y reenviar"
  if (puedeGestionarAsignacionesPersonal(socio)) return "Gestionar asignacion"
  if (socio.estado === "INACTIVO") return "Evaluar reactivacion"
  return "Operativo"
}

function AccionesSocio({
  socio,
  onActualizado,
  onMensaje,
  onError,
}: AccionesSocioProps) {
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

  function abrirAccion(nuevaAccion: "anular" | "rechazar" | "reactivar") {
    setMotivo(
      nuevaAccion === "anular"
        ? "Documento registrado incorrectamente"
        : "",
    )
    setAccion(nuevaAccion)
  }

  async function aprobar() {
    try {
      await aprobarMutation.mutateAsync({ usuarioId })
      onMensaje(`${socio.razonSocial} fue aprobado.`)
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
        onMensaje(`${socio.razonSocial} fue anulado.`)
      }

      if (accion === "rechazar") {
        await rechazarMutation.mutateAsync({ usuarioId, motivo: motivo.trim() })
        onMensaje(`${socio.razonSocial} fue rechazado.`)
      }

      if (accion === "reactivar") {
        await reactivarMutation.mutateAsync({ usuarioId })
        onMensaje(`Se creo un nuevo registro para ${socio.razonSocial}.`)
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
            {procesando ? (
              <Loader2 className="animate-spin" />
            ) : (
              <MoreVertical />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href={`/socio-negocios/${socio.id}`}>
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
                  <Link href={`/socio-negocios/${socio.id}?modo=editar`}>
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
                  <Link href={`/socio-negocios/${socio.id}`}>
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
                ? `Confirma la reactivacion de ${socio.razonSocial}.`
                : accion === "rechazar"
                  ? "El socio quedara inactivo. El motivo se registra en la auditoria."
                  : accion === "anular"
                    ? "El motivo quedara registrado en la auditoria del socio."
                    : `Registra el motivo para ${socio.razonSocial}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
              <p className="font-medium">{socio.razonSocial}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {socio.codigoInternoSap} · {socio.numeroDocumento}
              </p>
            </div>

            {requiereMotivo ? (
              <Field>
                <FieldLabel htmlFor={`motivo-${socio.id}`}>Motivo</FieldLabel>
                <Textarea
                  id={`motivo-${socio.id}`}
                  value={motivo}
                  onChange={(event) => setMotivo(event.target.value)}
                  placeholder={
                    accion === "anular"
                      ? "Registro creado por error"
                      : "Informacion incorrecta"
                  }
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
              variant={
                accion === "anular" || accion === "rechazar" ? "destructive" : "default"
              }
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

export function SocioNegocioVista({
  titulo,
  accionPrincipal = "Nuevo",
  crearHref,
  filtros,
}: SocioNegocioVistaProps) {
  const [reporteGenerado, setReporteGenerado] = useState<string | null>(null)
  const [mensajeOperacion, setMensajeOperacion] = useState<string | null>(null)
  const [errorOperacion, setErrorOperacion] = useState<ErrorOperacion | null>(null)
  const [paginaActual, setPaginaActual] = useState(1)
  const [registrosPorPagina, setRegistrosPorPagina] = useState(20)
  const [filtrosFormulario, setFiltrosFormulario] =
    useState<ConsultarSociosDeNegocioQuery>(() =>
      limpiarFiltros({
        ...filtros,
      }),
    )
  const [filtrosAplicados, setFiltrosAplicados] =
    useState<ConsultarSociosDeNegocioQuery>(() => filtrosFormulario)
  
  const filtrosConPaginacion = useMemo(() => ({
    ...filtrosAplicados,
    page: paginaActual,
    pageSize: registrosPorPagina,
  }), [filtrosAplicados, paginaActual, registrosPorPagina])
  
  const sociosQuery = useSociosDeNegocioQuery(filtrosConPaginacion)
  const exportacionExcelQuery = useExportarSociosDeNegocioQuery(
    {
      ...filtrosAplicados,
      formato: "EXCEL",
    },
    false
  )
  const exportacionPdfQuery = useExportarSociosDeNegocioQuery(
    {
      ...filtrosAplicados,
      formato: "PDF",
    },
    false
  )
  const socios = useMemo(() => Array.isArray(sociosQuery.data?.datos) ? sociosQuery.data.datos : [], [sociosQuery.data])
  const metaPaginacion = sociosQuery.data?.paginacion
  const conteoVisible = useMemo(
    () => ({
      clientes: socios.filter((socio) => socio.tipo === "CLIENTE").length,
      proveedores: socios.filter((socio) => socio.tipo === "PROVEEDOR").length,
      personal: socios.filter((socio) => socio.tipo === "PERSONAL").length,
    }),
    [socios],
  )
  const indicadoresOperacion = useMemo(
    () => ({
      pendientesAprobacion: socios.filter((socio) =>
        puedeResolverAprobacionSocio(socio),
      ).length,
      requierenCorreccion: socios.filter((socio) =>
        puedeReenviarAprobacionSocio(socio),
      ).length,
      pendientesSap: socios.filter((socio) =>
        socio.estadoSincronizacionSap === "PENDIENTE" ||
        socio.estadoSincronizacionSap === "FALLIDO",
      ).length,
    }),
    [socios],
  )
  const filtrosActivos = useMemo(
    () => obtenerFiltrosActivos(filtrosAplicados),
    [filtrosAplicados],
  )
  const cargando = sociosQuery.isLoading
  const error = sociosQuery.error ? obtenerMensajeError(sociosQuery.error) : null
  const tipoBloqueado = Boolean(filtros?.tipo)
  const totalResultados = metaPaginacion?.total ?? socios.length
  const textoResultados = metaPaginacion
    ? `Pagina ${metaPaginacion.pagina} de ${metaPaginacion.totalPaginas || 1}`
    : `${socios.length} visibles`

  async function exportar(formato: ReporteSociosDeNegocioResponse["formato"]) {
    setReporteGenerado(null)
    const resultado =
      formato === "PDF"
        ? await exportacionPdfQuery.refetch()
        : await exportacionExcelQuery.refetch()
    const reporte = resultado.data?.datos[0]

    if (reporte) {
      descargarReporte(reporte)
      setReporteGenerado(
        `${reporte.nombreArchivo} descargado en formato ${reporte.formato}.`
      )
    }
  }

  function actualizarFiltro<K extends keyof ConsultarSociosDeNegocioQuery>(
    key: K,
    value: ConsultarSociosDeNegocioQuery[K] | "TODOS",
  ) {
    setFiltrosFormulario((actual) => {
      const siguiente = { ...actual }

      if (value === "TODOS" || value === "") {
        delete siguiente[key]
      } else {
        siguiente[key] = value as ConsultarSociosDeNegocioQuery[K]
      }

      return limpiarFiltros({
        ...siguiente,
        ...(filtros?.tipo ? { tipo: filtros.tipo } : {}),
      })
    })
  }

  function aplicarFiltros() {
    setPaginaActual(1)
    setFiltrosAplicados(
      limpiarFiltros({
        ...filtrosFormulario,
        ...(filtros?.tipo ? { tipo: filtros.tipo } : {}),
      }),
    )
  }

  function limpiarBusqueda() {
    const filtrosBase = limpiarFiltros({
      ...filtros,
    })
    setPaginaActual(1)
    setFiltrosFormulario(filtrosBase)
    setFiltrosAplicados(filtrosBase)
  }

  return (
    <>
      <SiteHeader
        title={titulo}
        breadcrumbs={[
          { title: "Socio de Negocio", href: "/socio-negocios" },
          { title: titulo },
        ]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          <SocioNegocioPageHeader
            title="Listado de Socios de Negocio"
            description="Busca, filtra y opera el maestro de socios con una vista clara para trabajo diario."
            meta={
              <>
                <Badge variant="secondary">{totalResultados} registros</Badge>
                <Badge variant="outline">{textoResultados}</Badge>
                {filtrosActivos.length > 0 ? (
                  <Badge variant="outline">{filtrosActivos.length} filtros activos</Badge>
                ) : null}
              </>
            }
            actions={
              crearHref ? (
                <Button asChild className="w-full sm:w-auto">
                  <Link href={crearHref}>
                    <Plus data-icon="inline-start" />
                    {accionPrincipal}
                  </Link>
                </Button>
              ) : null
            }
            />

          <section className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-xl border border-primary/15 bg-card p-4 shadow-xs">
              <div className="flex flex-col gap-1">
                <h2 className="text-sm font-semibold">Flujo recomendado</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Registra o edita el socio, valida aprobaciones pendientes y usa el historial para auditar cada cambio.
                </p>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-background p-3">
                  <p className="text-xs font-medium text-muted-foreground">1. Buscar</p>
                  <p className="mt-1 text-sm">Filtra por nombre, documento, tipo o SAP.</p>
                </div>
                <div className="rounded-lg border border-border bg-background p-3">
                  <p className="text-xs font-medium text-muted-foreground">2. Resolver</p>
                  <p className="mt-1 text-sm">Aprueba, corrige, anula o reactiva desde acciones.</p>
                </div>
                <div className="rounded-lg border border-border bg-background p-3">
                  <p className="text-xs font-medium text-muted-foreground">3. Auditar</p>
                  <p className="mt-1 text-sm">Consulta historial y descarga reportes filtrados.</p>
                </div>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
              <ResumenListado icon={Clock} label="Por aprobar" value={indicadoresOperacion.pendientesAprobacion} />
              <ResumenListado icon={SendHorizontal} label="Por corregir" value={indicadoresOperacion.requierenCorreccion} />
              <ResumenListado icon={CircleDashed} label="SAP pendiente" value={indicadoresOperacion.pendientesSap} />
            </div>
          </section>

          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Error de API</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {reporteGenerado ? (
            <Alert>
              <AlertTitle>Reporte generado</AlertTitle>
              <AlertDescription>{reporteGenerado}</AlertDescription>
            </Alert>
          ) : null}

          {mensajeOperacion ? (
            <Alert>
              <AlertTitle>Operacion completada</AlertTitle>
              <AlertDescription>{mensajeOperacion}</AlertDescription>
            </Alert>
          ) : null}

          <section className="flex flex-col gap-4">
            <div className="overflow-hidden rounded-xl border border-border/70 bg-card text-card-foreground">
              <div className="flex flex-col gap-1 border-b border-border px-5 py-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-base font-semibold">Buscar y filtrar</h2>
                    <p className="text-sm leading-5 text-muted-foreground">
                      Combina criterios para encontrar rapidamente el registro que necesitas.
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3 lg:w-[400px]">
                    <ResumenListado icon={Building2} label="Clientes" value={conteoVisible.clientes} />
                    <ResumenListado icon={Package} label="Proveedores" value={conteoVisible.proveedores} />
                    <ResumenListado icon={User} label="Personal" value={conteoVisible.personal} />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 border-b border-border bg-muted/20 px-4 py-4">
                <form
                  className="grid gap-3 md:grid-cols-2 xl:grid-cols-6"
                  onSubmit={(event) => {
                    event.preventDefault()
                    aplicarFiltros()
                  }}
                >
                  <Field className="md:col-span-2 xl:col-span-2">
                    <InputGroup>
                      <InputGroupAddon>
                        <Search />
                      </InputGroupAddon>
                      <InputGroupInput
                        value={obtenerValorFiltro(filtrosFormulario, "razonSocial")}
                        placeholder="Razon social, nombre comercial o contacto"
                        onChange={(event) =>
                          actualizarFiltro("razonSocial", event.target.value)
                        }
                      />
                    </InputGroup>
                  </Field>
                  <Field>
                    <Input
                      value={obtenerValorFiltro(
                        filtrosFormulario,
                        "numeroDocumento",
                      )}
                      placeholder="RUC/DNI"
                      onChange={(event) =>
                        actualizarFiltro("numeroDocumento", event.target.value)
                      }
                    />
                  </Field>
                  <Field>
                    <Select
                      value={filtrosFormulario.tipo ?? "TODOS"}
                      disabled={tipoBloqueado}
                      onValueChange={(value) =>
                        actualizarFiltro(
                          "tipo",
                          value as ConsultarSociosDeNegocioQuery["tipo"] | "TODOS",
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="TODOS">Tipo: todos</SelectItem>
                          <SelectItem value="CLIENTE">Cliente</SelectItem>
                          <SelectItem value="PROVEEDOR">Proveedor</SelectItem>
                          <SelectItem value="PERSONAL">Personal</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <Select
                      value={filtrosFormulario.estado ?? "TODOS"}
                      onValueChange={(value) =>
                        actualizarFiltro(
                          "estado",
                          value as ConsultarSociosDeNegocioQuery["estado"] | "TODOS",
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="TODOS">Estado: todos</SelectItem>
                          <SelectItem value="ACTIVO">Activo</SelectItem>
                          <SelectItem value="INACTIVO">Inactivo</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <Select
                      value={filtrosFormulario.estadoRegistro ?? "ACTIVO"}
                      onValueChange={(value) =>
                        actualizarFiltro(
                          "estadoRegistro",
                          value as ConsultarSociosDeNegocioQuery["estadoRegistro"],
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Registro" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="ACTIVO">Vigentes</SelectItem>
                          <SelectItem value="ANULADO">Anulados</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <Select
                      value={filtrosFormulario.origen ?? "TODOS"}
                      onValueChange={(value) =>
                        actualizarFiltro(
                          "origen",
                          value as ConsultarSociosDeNegocioQuery["origen"] | "TODOS",
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Origen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="TODOS">Origen: todos</SelectItem>
                          <SelectItem value="MANUAL">Manual</SelectItem>
                          <SelectItem value="COMERCIAL">Comercial</SelectItem>
                          <SelectItem value="SAP">SAP</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <Select
                      value={filtrosFormulario.estadoSincronizacionSap ?? "TODOS"}
                      onValueChange={(value) =>
                        actualizarFiltro(
                          "estadoSincronizacionSap",
                          value as
                            | ConsultarSociosDeNegocioQuery["estadoSincronizacionSap"]
                            | "TODOS",
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sincronizacion SAP" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="TODOS">SAP: todas</SelectItem>
                          <SelectItem value="SINCRONIZADO">Sincronizado</SelectItem>
                          <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                          <SelectItem value="PROCESANDO">Procesando</SelectItem>
                          <SelectItem value="FALLIDO">Fallido</SelectItem>
                          <SelectItem value="NO_INICIADA">No iniciada</SelectItem>
                          <SelectItem value="NO_APLICA">No aplica</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <div className="flex flex-wrap gap-2 md:col-span-2 xl:col-span-2">
                    <Button type="submit" size="sm" disabled={sociosQuery.isFetching}>
                      <Search data-icon="inline-start" />
                      {sociosQuery.isFetching ? "Consultando..." : "Aplicar"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={limpiarBusqueda}
                    >
                      Limpiar
                    </Button>
                  </div>
                </form>
                <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Filter data-icon="inline-start" />
                    Filtros activos
                  </span>
                  {filtrosActivos.length > 0 ? (
                    filtrosActivos.map((filtro) => (
                      <Badge key={`${filtro.key}-${filtro.value}`} variant="secondary">
                        {filtro.label}: {filtro.value}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Sin filtros adicionales. Se muestran registros vigentes por defecto.
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
                  <span className="mr-auto text-sm text-muted-foreground">
                    Exporta el resultado filtrado para reportes o revision interna.
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={exportacionExcelQuery.isFetching}
                    onClick={() => void exportar("EXCEL")}
                  >
                    <Download data-icon="inline-start" />
                    {exportacionExcelQuery.isFetching ? "Descargando..." : "Excel"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={exportacionPdfQuery.isFetching}
                    onClick={() => void exportar("PDF")}
                  >
                    <Download data-icon="inline-start" />
                    {exportacionPdfQuery.isFetching ? "Descargando..." : "PDF"}
                  </Button>
              </div>
            </div>
            {cargando ? (
              <div className="flex flex-col gap-3 p-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : socios.length === 0 ? (
              <Empty className="py-12">
                <EmptyHeader>
                  <EmptyTitle>Sin socios de negocio</EmptyTitle>
                  <EmptyDescription>
                    No existen registros para el filtro aplicado. Limpia la busqueda o crea un nuevo socio si corresponde.
                  </EmptyDescription>
                </EmptyHeader>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={limpiarBusqueda}>
                    Limpiar busqueda
                  </Button>
                  {crearHref ? (
                    <Button asChild size="sm">
                      <Link href={crearHref}>
                        <Plus data-icon="inline-start" />
                        {accionPrincipal}
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </Empty>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-background hover:bg-transparent">
                      <TableHead className="w-10">Acciones</TableHead>
                      <TableHead className="text-right">ID</TableHead>
                      <TableHead>Codigo SAP</TableHead>
                      <TableHead>Socio</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Registro</TableHead>
                      <TableHead>Aprobacion</TableHead>
                      <TableHead>Asignacion vigente</TableHead>
                      <TableHead>Siguiente accion</TableHead>
                      <TableHead>Sincronizacion SAP</TableHead>
                      <TableHead>Origen</TableHead>
                      <TableHead>Documento</TableHead>
                      <TableHead>Creacion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {socios.map((socio) => {
                      const claseContenido = obtenerClaseContenidoSocio(socio)
                      const inactivo = socio.estado === "INACTIVO"
                      const anulado = socio.estadoRegistro === "ANULADO"
                      const puedeGestionarAsignaciones =
                        puedeGestionarAsignacionesPersonal(socio)
                      return (
                          <TableRow key={socio.id} className={obtenerClaseFilaSocio(socio)}>
                          <TableCell>
                            <AccionesSocio
                              socio={socio}
                              onActualizado={() => void sociosQuery.refetch()}
                              onMensaje={(mensaje) => {
                                setErrorOperacion(null)
                                setMensajeOperacion(mensaje)
                              }}
                              onError={(error) => {
                                setMensajeOperacion(null)
                                setErrorOperacion(error)
                              }}
                            />
                          </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          <span className={claseContenido}>{socio.id}</span>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          <span className={claseContenido}>{socio.codigoInternoSap}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex min-w-48 items-center gap-2">
                            {inactivo || anulado ? (
                              <span
                                className={cn(
                                  "size-2 shrink-0 rounded-full",
                                  anulado ? "bg-destructive" : "bg-destructive/60",
                                )}
                                aria-hidden
                                title={anulado ? "Registro anulado" : "Socio inactivo"}
                              />
                            ) : null}
                            <div className="flex min-w-0 flex-col">
                              <span className={cn("font-medium", claseContenido)}>
                                {socio.razonSocial}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {socio.nombreComercial || "Sin nombre comercial"}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="h-6 rounded-full border-border/70 bg-card px-2.5 text-[12px] font-medium text-foreground shadow-xs"
                          >
                            {socio.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={claseContenido}>
                            <EstadoSocioBadge estado={socio.estado} />
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={claseContenido}>
                            <EstadoRegistroBadge estadoRegistro={socio.estadoRegistro} />
                          </span>
                        </TableCell>
                        <TableCell>
                          <EstadoAprobacionBadge estado={socio.estadoAprobacion} />
                        </TableCell>
                        <TableCell>
                          {puedeGestionarAsignaciones ? (
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/socio-negocios/${socio.id}/asignaciones`}>
                                Ver asignaciones
                              </Link>
                            </Button>
                          ) : socio.tipo === "PERSONAL" ? (
                            <span className="text-sm text-muted-foreground">
                              No disponible
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">No aplica</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="whitespace-nowrap">
                            {obtenerSiguienteAccion(socio)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {socio.estadoSincronizacionSap ? (
                            <EstadoSincronizacionSapBadge
                              estado={socio.estadoSincronizacionSap}
                              ultimoError={socio.ultimoErrorSincronizacionSap}
                            />
                          ) : (
                            <span className="text-sm text-muted-foreground">No aplica</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{socio.origen}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className={claseContenido}>{socio.numeroDocumento}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex min-w-40 flex-col">
                            <span className={claseContenido}>
                              {formatearFecha(socio.fechaCreacion)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {socio.usuarioCreacion || "Sin usuario"}
                            </span>
                          </div>
                        </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            {socios.length > 0 && metaPaginacion ? (
              <PaginationControls
                meta={metaPaginacion}
                registrosPorPagina={registrosPorPagina}
                onPageChange={setPaginaActual}
                onPageSizeChange={(pageSize) => {
                  setRegistrosPorPagina(pageSize)
                  setPaginaActual(1)
                }}
              />
            ) : null}
            </div>
          </section>
        </div>
      </main>

      <AlertDialog
        open={errorOperacion !== null}
        onOpenChange={(open) => !open && setErrorOperacion(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{errorOperacion?.titulo}</AlertDialogTitle>
            <AlertDialogDescription>
              {errorOperacion?.descripcion}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorOperacion(null)}>
              Entendido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </>
  )
}
