"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { SiteHeader } from "@/compartido/componentes/site-header"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table"
import { Textarea } from "@/compartido/componentes/ui/textarea"
import { ApiError } from "@/compartido/api/axios"
import { cn } from "@/compartido/utilidades/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  ArchiveArrowDownIcon,
  ArchiveRestoreIcon,
  CancelCircleIcon,
  ChartUpIcon,
  CheckmarkCircle01Icon,
  Download01Icon,
  Edit02Icon,
  Loading03Icon,
  MoreVerticalCircle01Icon,
  Search01Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons"

import {
  useDarDeBajaSocioDeNegocioMutation,
  useExportarSociosDeNegocioQuery,
  useReactivarSocioDeNegocioMutation,
  useSociosDeNegocioQuery,
} from "../servicios/socio-negocios-queries"
import { PaginationControls } from "../componentes/pagination-controls"
import { SocioNegocioPageHeader } from "../componentes/socio-negocio-page-header"
import { condicionesLaborales } from "../tipos/socio-negocio"
import type {
  CondicionLaboral,
  ConsultarSociosDeNegocioQuery,
  ReporteSociosDeNegocioResponse,
  SocioDeNegocioResponse,
} from "../tipos/socio-negocio"

type SocioNegocioVistaProps = {
  titulo: string
  accionPrincipal?: string
  crearHref?: string
  filtros?: ConsultarSociosDeNegocioQuery
}

const estadoVariant = {
  ACTIVO: "outline",
  INACTIVO: "secondary",
} as const

const estadoRegistroVariant = {
  ACTIVO: "outline",
  ANULADO: "destructive",
} as const

const estadoClassName = {
  ACTIVO:
    "border-border bg-background text-foreground shadow-xs",
  INACTIVO:
    "border-border bg-background text-muted-foreground shadow-xs",
} as const

const estadoRegistroClassName = {
  ACTIVO:
    "border-border bg-background text-foreground shadow-xs",
  ANULADO:
    "border-border bg-background text-foreground shadow-xs",
} as const

const estadoIconClassName = {
  ACTIVO: "text-emerald-500",
  INACTIVO: "text-destructive",
} as const

const estadoRegistroIconClassName = {
  ACTIVO: "text-emerald-500",
  ANULADO: "text-destructive",
} as const

function etiquetaCondicionLaboral(condicion?: CondicionLaboral | null) {
  return (
    condicionesLaborales.find((item) => item.valor === condicion)?.etiqueta ??
    condicion ??
    "-"
  )
}

function obtenerMensajeError(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo completar la operacion."
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

type ErrorOperacion = {
  titulo: string
  descripcion: string
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
      <HugeiconsIcon
        data-icon="inline-start"
        icon={estado === "ACTIVO" ? CheckmarkCircle01Icon : Loading03Icon}
        strokeWidth={2}
        className={estadoIconClassName[estado]}
      />
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
      <HugeiconsIcon
        data-icon="inline-start"
        icon={estadoRegistro === "ACTIVO" ? CheckmarkCircle01Icon : Loading03Icon}
        strokeWidth={2}
        className={estadoRegistroIconClassName[estadoRegistro]}
      />
      {estadoRegistro}
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
    "border-border/80",
    inactivo && !anulado && "bg-muted/45 hover:bg-muted/65",
    anulado &&
      "border-l-4 border-l-destructive bg-destructive/5 text-muted-foreground hover:bg-destructive/10",
  )
}

function obtenerClaseContenidoSocio(socio: SocioDeNegocioResponse) {
  return socio.estadoRegistro === "ANULADO"
    ? "line-through decoration-destructive/70 decoration-2"
    : undefined
}

function AccionesSocio({
  socio,
  onActualizado,
  onMensaje,
  onError,
}: AccionesSocioProps) {
  const bajaMutation = useDarDeBajaSocioDeNegocioMutation(socio.id, {
    onSuccess: onActualizado,
  })
  const reactivarMutation = useReactivarSocioDeNegocioMutation(socio.id, {
    onSuccess: onActualizado,
  })
  const [accion, setAccion] = useState<"anular" | "reactivar" | null>(null)
  const [motivo, setMotivo] = useState("")
  const procesando = bajaMutation.isPending || reactivarMutation.isPending
  const puedeReactivar = socio.estado === "INACTIVO" || socio.estadoRegistro === "ANULADO"
  const requiereMotivo = accion === "anular"

  function abrirAccion(nuevaAccion: "anular" | "reactivar") {
    setMotivo(
      nuevaAccion === "anular"
        ? "Documento registrado incorrectamente"
        : socio.motivoBaja || "",
    )
    setAccion(nuevaAccion)
  }

  async function confirmarAccion() {
    try {
      if (accion === "anular") {
        await bajaMutation.mutateAsync({
          motivo: motivo.trim(),
          usuarioId: "admin",
          estadoRegistro: "ANULADO",
        })
        onMensaje(`${socio.razonSocial} fue borrado.`)
      }

      if (accion === "reactivar") {
        await reactivarMutation.mutateAsync({ usuarioId: "admin" })
        onMensaje(`${socio.razonSocial} fue reactivado.`)
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
            <HugeiconsIcon
              icon={procesando ? Loading03Icon : MoreVerticalCircle01Icon}
              strokeWidth={2}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href={`/socio-negocios/${socio.id}`}>
                <HugeiconsIcon data-icon="inline-start" icon={ViewIcon} strokeWidth={2} />
                Ver
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/socio-negocios/historial/${socio.id}`}>
                <HugeiconsIcon data-icon="inline-start" icon={ChartUpIcon} strokeWidth={2} />
                Auditar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              disabled={socio.estadoRegistro === "ANULADO" || procesando}
            >
              <Link href={`/socio-negocios/${socio.id}?modo=editar`}>
                <HugeiconsIcon data-icon="inline-start" icon={Edit02Icon} strokeWidth={2} />
                Editar
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
                <HugeiconsIcon
                  data-icon="inline-start"
                  icon={ArchiveArrowDownIcon}
                  strokeWidth={2}
                />
                Dar de baja
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={socio.estadoRegistro === "ANULADO" || procesando}
              onSelect={() => abrirAccion("anular")}
            >
              <HugeiconsIcon data-icon="inline-start" icon={CancelCircleIcon} strokeWidth={2} />
              Borrar
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!puedeReactivar || procesando}
              onSelect={() => abrirAccion("reactivar")}
            >
              <HugeiconsIcon
                data-icon="inline-start"
                icon={ArchiveRestoreIcon}
                strokeWidth={2}
              />
              Reactivar
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={accion !== null} onOpenChange={(open) => !open && setAccion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {accion === "anular" ? "Borrar registro" : "Reactivar socio"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {accion === "reactivar"
                ? `Confirma la reactivacion de ${socio.razonSocial}.`
                : accion === "anular"
                  ? "Tenga en cuenta que esta informacion no se podra recuperar."
                  : `Registra el motivo para ${socio.razonSocial}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-border bg-muted/40 p-3">
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
                      ? "Documento registrado incorrectamente"
                      : "Dejo de operar"
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
              variant={accion === "anular" ? "destructive" : "default"}
              disabled={procesando || (requiereMotivo && !motivo.trim())}
              onClick={(event) => {
                event.preventDefault()
                void confirmarAccion()
              }}
            >
              {procesando ? "Procesando..." : accion === "anular" ? "Borrar" : "Confirmar"}
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
  const cargando = sociosQuery.isLoading
  const error = sociosQuery.error ? obtenerMensajeError(sociosQuery.error) : null
  const tipoBloqueado = Boolean(filtros?.tipo)

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

      if (key === "tipo" && value !== "PERSONAL") {
        delete siguiente.condicionLaboral
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
            title="Listar socio de negocio"
            actions={
              crearHref ? (
                <Button asChild className="w-full sm:w-auto">
                  <Link href={crearHref}>
                    <HugeiconsIcon
                      data-icon="inline-start"
                      icon={Add01Icon}
                      strokeWidth={2}
                    />
                    {accionPrincipal}
                  </Link>
                </Button>
              ) : null
            }
          />

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

          <section className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">Socios registrados</h2>
              <p className="text-sm text-muted-foreground">
                Busca, revisa y gestiona clientes, proveedores y personal.
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-border/70 bg-card text-card-foreground">
              <div className="flex flex-col gap-3 border-b border-border px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
                <form
                  className="flex flex-col gap-2 lg:flex-row lg:items-center"
                  onSubmit={(event) => {
                    event.preventDefault()
                    aplicarFiltros()
                  }}
                >
                  <Field className="lg:w-56">
                    <InputGroup>
                      <InputGroupAddon>
                        <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
                      </InputGroupAddon>
                      <InputGroupInput
                        value={obtenerValorFiltro(filtrosFormulario, "razonSocial")}
                        placeholder="Buscar socio"
                        onChange={(event) =>
                          actualizarFiltro("razonSocial", event.target.value)
                        }
                      />
                    </InputGroup>
                  </Field>
                  <Field className="lg:w-40">
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
                  <Field className="lg:w-40">
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
                  <Field className="lg:w-40">
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
                  <Field className="lg:w-44">
                    <Select
                      value={filtrosFormulario.estadoRegistro ?? "TODOS"}
                      onValueChange={(value) =>
                        actualizarFiltro(
                          "estadoRegistro",
                          value as ConsultarSociosDeNegocioQuery["estadoRegistro"] | "TODOS",
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Registro" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="TODOS">Registro: todos</SelectItem>
                          <SelectItem value="ACTIVO">Vigentes</SelectItem>
                          <SelectItem value="ANULADO">Anulados</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field className="lg:w-56">
                    <Select
                      value={filtrosFormulario.condicionLaboral ?? "TODOS"}
                      disabled={filtrosFormulario.tipo !== "PERSONAL"}
                      onValueChange={(value) =>
                        actualizarFiltro(
                          "condicionLaboral",
                          value as ConsultarSociosDeNegocioQuery["condicionLaboral"] | "TODOS",
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Condicion laboral" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="TODOS">Condicion: todas</SelectItem>
                          {condicionesLaborales.map((condicion) => (
                            <SelectItem key={condicion.valor} value={condicion.valor}>
                              {condicion.etiqueta}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={sociosQuery.isFetching}>
                      <HugeiconsIcon
                        data-icon="inline-start"
                        icon={Search01Icon}
                        strokeWidth={2}
                      />
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
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={exportacionExcelQuery.isFetching}
                    onClick={() => void exportar("EXCEL")}
                  >
                    <HugeiconsIcon
                      data-icon="inline-start"
                      icon={Download01Icon}
                      strokeWidth={2}
                    />
                    {exportacionExcelQuery.isFetching ? "Descargando..." : "Excel"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={exportacionPdfQuery.isFetching}
                    onClick={() => void exportar("PDF")}
                  >
                    <HugeiconsIcon
                      data-icon="inline-start"
                      icon={Download01Icon}
                      strokeWidth={2}
                    />
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
                    No existen registros para el filtro aplicado.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/70 hover:bg-muted/70">
                      <TableHead className="w-10">Acciones</TableHead>
                      <TableHead className="text-right">#</TableHead>
                      <TableHead>Codigo SAP</TableHead>
                      <TableHead>Socio</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Condicion laboral</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Registro</TableHead>
                      <TableHead>Documento</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Celular</TableHead>
                      <TableHead>Cuenta</TableHead>
                      <TableHead>Creacion</TableHead>
                      <TableHead>Baja</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {socios.map((socio) => {
                      const claseContenido = obtenerClaseContenidoSocio(socio)

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
                          <span className={claseContenido}>{socio.count}</span>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          <span className={claseContenido}>{socio.codigoInternoSap}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex min-w-48 flex-col">
                            <span className={cn("font-medium", claseContenido)}>
                              {socio.razonSocial}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {socio.nombreComercial || "Sin nombre comercial"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="h-6 rounded-full border-border bg-background px-2.5 text-[12px] font-medium text-foreground shadow-xs"
                          >
                            {socio.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={claseContenido}>
                            {socio.tipo === "PERSONAL"
                              ? etiquetaCondicionLaboral(socio.condicionLaboral)
                              : "-"}
                          </span>
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
                          <span className={claseContenido}>{socio.numeroDocumento}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex min-w-44 flex-col">
                            <span className={claseContenido}>
                              {socio.contacto || "Sin contacto"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {socio.correo || "Sin correo"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={claseContenido}>{socio.numeroCelular || "-"}</span>
                        </TableCell>
                        <TableCell>
                          <span className={claseContenido}>
                            {socio.cuentaNombre || socio.cuenta || "-"}
                          </span>
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
                        <TableCell>
                          <div className="flex min-w-44 flex-col">
                            <span className={claseContenido}>
                              {socio.fechaBaja ? formatearFecha(socio.fechaBaja) : "-"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {socio.motivoBaja || "Sin baja registrada"}
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
