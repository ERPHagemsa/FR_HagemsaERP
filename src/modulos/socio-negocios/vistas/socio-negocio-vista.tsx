"use client"

import { type FormEvent, useMemo, useState } from "react"
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card"
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
  UserGroupIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons"

import {
  useDarDeBajaSocioDeNegocioMutation,
  useExportarSociosDeNegocioQuery,
  useModificarSocioDeNegocioMutation,
  useReactivarSocioDeNegocioMutation,
  useSociosDeNegocioQuery,
} from "../servicios/socio-negocios-queries"
import { PaginationControls } from "../componentes/pagination-controls"
import type {
  ConsultarSociosDeNegocioQuery,
  ModificarSocioDeNegocioRequest,
  ReporteSociosDeNegocioResponse,
  SocioDeNegocioResponse,
} from "../tipos/socio-negocio"

type SocioNegocioVistaProps = {
  titulo: string
  etiqueta: string
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

function obtenerVisualMetrica(etiqueta: string, index: number) {
  const texto = etiqueta.toLowerCase()

  if (texto.includes("activo") || texto.includes("vigente")) {
    return {
      icon: CheckmarkCircle01Icon,
      iconClassName:
        "bg-background text-emerald-500 ring-border",
      cardClassName: "border-border bg-card text-card-foreground shadow-sm",
      descriptionClassName: "text-muted-foreground",
      detailClassName: "text-muted-foreground",
      badgeClassName:
        "border-border bg-background text-foreground shadow-xs",
      badge: "Operativo",
      contexto: "Disponibles",
    }
  }

  if (
    texto.includes("inactivo") ||
    texto.includes("anulado") ||
    texto.includes("observ") ||
    texto.includes("baja") ||
    texto.includes("pendiente")
  ) {
    return {
      icon: Loading03Icon,
      iconClassName:
        "bg-background text-amber-500 ring-border",
      cardClassName: "border-border bg-card text-card-foreground shadow-sm",
      descriptionClassName: "text-muted-foreground",
      detailClassName: "text-muted-foreground",
      badgeClassName:
        "border-border bg-background text-foreground shadow-xs",
      badge: "Seguimiento",
      contexto: "Requieren revision",
    }
  }

  if (texto.includes("export") || texto.includes("formato") || texto.includes("campos")) {
    return {
      icon: Download01Icon,
      iconClassName:
        "bg-background text-sky-500 ring-border",
      cardClassName: "border-border bg-card text-card-foreground shadow-sm",
      descriptionClassName: "text-muted-foreground",
      detailClassName: "text-muted-foreground",
      badgeClassName:
        "border-border bg-background text-foreground shadow-xs",
      badge: "Reporte",
      contexto: "Exportable",
    }
  }

  if (index === 0) {
    return {
      icon: UserGroupIcon,
      iconClassName: "bg-background text-primary ring-border",
      cardClassName: "border-border bg-card text-card-foreground shadow-sm",
      descriptionClassName: "text-muted-foreground",
      detailClassName: "text-muted-foreground",
      badgeClassName: "border-border bg-background text-foreground shadow-xs",
      badge: "Total",
      contexto: "Consulta actual",
    }
  }

  return {
    icon: ChartUpIcon,
    iconClassName: "bg-background text-primary ring-border",
    cardClassName: "border-border bg-card text-card-foreground shadow-sm",
    descriptionClassName: "text-muted-foreground",
    detailClassName: "text-muted-foreground",
    badgeClassName: "border-border bg-background text-foreground shadow-xs",
    badge: "Control",
    contexto: "Control operativo",
  }
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

function obtenerTextoFormulario(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim()
}

function esTexto(valor: string | null | undefined): valor is string {
  return Boolean(valor)
}

function formarNombreCompletoPersonal(formData: FormData) {
  return [
    obtenerTextoFormulario(formData, "primerNombre"),
    obtenerTextoFormulario(formData, "segundoNombre"),
    obtenerTextoFormulario(formData, "apellidoPaterno"),
    obtenerTextoFormulario(formData, "apellidoMaterno"),
  ]
    .filter(esTexto)
    .join(" ")
}

function formarNombreComercialPersonal(formData: FormData) {
  return [
    obtenerTextoFormulario(formData, "primerNombre"),
    obtenerTextoFormulario(formData, "apellidoPaterno"),
  ]
    .filter(esTexto)
    .join(" ")
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

function DatoFicha({
  label,
  value,
}: {
  label: string
  value?: string | number | null
}) {
  return (
    <div className="min-w-0 rounded-md border border-border bg-background p-3">
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium">{value || "-"}</p>
    </div>
  )
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
  const modificarMutation = useModificarSocioDeNegocioMutation(socio.id, {
    onSuccess: onActualizado,
  })
  const reactivarMutation = useReactivarSocioDeNegocioMutation(socio.id, {
    onSuccess: onActualizado,
  })
  const [accion, setAccion] = useState<"baja" | "anular" | "reactivar" | null>(null)
  const [modificarAbierto, setModificarAbierto] = useState(false)
  const [fichaAbierta, setFichaAbierta] = useState(false)
  const [motivo, setMotivo] = useState("")
  const procesando =
    bajaMutation.isPending || modificarMutation.isPending || reactivarMutation.isPending
  const puedeDarBaja = socio.estado === "ACTIVO" && socio.estadoRegistro === "ACTIVO"
  const puedeReactivar = socio.estado === "INACTIVO" || socio.estadoRegistro === "ANULADO"
  const requiereMotivo = accion === "baja" || accion === "anular"
  const partesRazonSocial = socio.razonSocial.split(/\s+/).filter(Boolean)
  const primerNombreInicial = socio.primerNombre || partesRazonSocial[0] || ""
  const segundoNombreInicial = socio.segundoNombre || ""
  const apellidoPaternoInicial =
    socio.apellidoPaterno || partesRazonSocial.at(-2) || ""
  const apellidoMaternoInicial =
    socio.apellidoMaterno || partesRazonSocial.at(-1) || ""

  function abrirAccion(nuevaAccion: "baja" | "anular" | "reactivar") {
    setMotivo(
      nuevaAccion === "anular"
        ? "Documento registrado incorrectamente"
        : socio.motivoBaja || "",
    )
    setAccion(nuevaAccion)
  }

  async function confirmarAccion() {
    try {
      if (accion === "baja") {
        await bajaMutation.mutateAsync({
          motivo: motivo.trim(),
          usuarioId: "admin",
          estadoRegistro: "ACTIVO",
        })
        onMensaje(`${socio.razonSocial} fue dado de baja.`)
      }

      if (accion === "anular") {
        await bajaMutation.mutateAsync({
          motivo: motivo.trim(),
          usuarioId: "admin",
          estadoRegistro: "ANULADO",
        })
        onMensaje(`${socio.razonSocial} fue anulado.`)
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

  async function modificarSocio(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const esPersonal = socio.tipo === "PERSONAL"
    const razonSocial = esPersonal
      ? formarNombreCompletoPersonal(formData)
      : obtenerTextoFormulario(formData, "razonSocial")
    const nombreComercial = esPersonal
      ? formarNombreComercialPersonal(formData)
      : obtenerTextoFormulario(formData, "nombreComercial")
    const payload: ModificarSocioDeNegocioRequest = {
      razonSocial,
      nombreComercial,
      direccion: obtenerTextoFormulario(formData, "direccion"),
      contacto: esPersonal ? nombreComercial : obtenerTextoFormulario(formData, "contacto"),
      correo: obtenerTextoFormulario(formData, "correo"),
      numeroCelular: obtenerTextoFormulario(formData, "numeroCelular"),
      usuarioId: "admin",
    }

    if (esPersonal) {
      payload.primerNombre = obtenerTextoFormulario(formData, "primerNombre")
      payload.segundoNombre = obtenerTextoFormulario(formData, "segundoNombre") || undefined
      payload.apellidoPaterno = obtenerTextoFormulario(formData, "apellidoPaterno")
      payload.apellidoMaterno = obtenerTextoFormulario(formData, "apellidoMaterno")
    }

    try {
      await modificarMutation.mutateAsync(payload)
      setModificarAbierto(false)
      onMensaje(`${socio.razonSocial} fue modificado.`)
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
            <DropdownMenuItem onSelect={() => setFichaAbierta(true)}>
              <HugeiconsIcon data-icon="inline-start" icon={ViewIcon} strokeWidth={2} />
              Ver ficha
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/socio-negocios/historial/${socio.id}`}>
                <HugeiconsIcon data-icon="inline-start" icon={ChartUpIcon} strokeWidth={2} />
                Auditar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={socio.estadoRegistro === "ANULADO" || procesando}
              onSelect={() => setModificarAbierto(true)}
            >
              <HugeiconsIcon data-icon="inline-start" icon={Edit02Icon} strokeWidth={2} />
              Modificar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={!puedeDarBaja || procesando}
              onSelect={() => abrirAccion("baja")}
            >
              <HugeiconsIcon
                data-icon="inline-start"
                icon={ArchiveArrowDownIcon}
                strokeWidth={2}
              />
              Dar de baja
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={socio.estadoRegistro === "ANULADO" || procesando}
              onSelect={() => abrirAccion("anular")}
            >
              <HugeiconsIcon data-icon="inline-start" icon={CancelCircleIcon} strokeWidth={2} />
              Anular
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

      <AlertDialog
        open={fichaAbierta}
        onOpenChange={(open) => !open && setFichaAbierta(false)}
      >
        <AlertDialogContent className="max-w-4xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Ficha del socio de negocio</AlertDialogTitle>
            <AlertDialogDescription>
              Datos vigentes del registro #{socio.count}.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-4">
              <DatoFicha label="Count" value={socio.count} />
              <DatoFicha label="Tipo" value={socio.tipo} />
              <DatoFicha label="Estado" value={socio.estado} />
              <DatoFicha label="Registro" value={socio.estadoRegistro} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <DatoFicha label="Razon social" value={socio.razonSocial} />
              <DatoFicha label="Nombre comercial" value={socio.nombreComercial} />
              <DatoFicha label="Codigo SAP" value={socio.codigoInternoSap} />
              <DatoFicha label="Documento" value={socio.numeroDocumento} />
              <DatoFicha label="Direccion" value={socio.direccion} />
              <DatoFicha label="Contacto" value={socio.contacto} />
              <DatoFicha label="Correo" value={socio.correo} />
              <DatoFicha label="Celular" value={socio.numeroCelular} />
              <DatoFicha label="Departamento" value={socio.areaNombre || socio.area} />
              <DatoFicha label="Cargo" value={socio.cargoNombre || socio.cargo} />
              <DatoFicha label="Cuenta" value={socio.cuentaNombre || socio.cuenta} />
              <DatoFicha label="Creacion" value={formatearFecha(socio.fechaCreacion)} />
            </div>
          </div>

          <AlertDialogFooter>
            <Button asChild variant="outline">
              <Link href={`/socio-negocios/historial/${socio.id}`}>
                <HugeiconsIcon data-icon="inline-start" icon={ChartUpIcon} strokeWidth={2} />
                Auditar
              </Link>
            </Button>
            <AlertDialogAction onClick={() => setFichaAbierta(false)}>
              Cerrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={accion !== null} onOpenChange={(open) => !open && setAccion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {accion === "baja"
                ? "Dar de baja socio"
                : accion === "anular"
                  ? "Anular registro"
                  : "Reactivar socio"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {accion === "reactivar"
                ? `Confirma la reactivacion de ${socio.razonSocial}.`
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
              {procesando ? "Procesando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={modificarAbierto}
        onOpenChange={(open) => !open && setModificarAbierto(false)}
      >
        <AlertDialogContent className="max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Modificar socio de negocio</AlertDialogTitle>
            <AlertDialogDescription>
              El tipo, documento y codigo SAP no se modifican. Si el documento esta mal,
              anula el registro por error y crea uno nuevo.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <form id={`modificar-${socio.id}`} onSubmit={(event) => void modificarSocio(event)}>
            <div className="grid gap-4">
              <div className="grid gap-3 rounded-xl border border-border bg-muted/40 p-3 md:grid-cols-3">
                <Field>
                  <FieldLabel>Tipo</FieldLabel>
                  <Input value={socio.tipo} readOnly />
                </Field>
                <Field>
                  <FieldLabel>Documento</FieldLabel>
                  <Input value={socio.numeroDocumento} readOnly />
                </Field>
                <Field>
                  <FieldLabel>Codigo SAP</FieldLabel>
                  <Input value={socio.codigoInternoSap || "-"} readOnly />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {socio.tipo === "PERSONAL" ? (
                  <>
                    <Field>
                      <FieldLabel htmlFor={`primerNombre-${socio.id}`}>Primer nombre</FieldLabel>
                      <Input
                        id={`primerNombre-${socio.id}`}
                        name="primerNombre"
                        defaultValue={primerNombreInicial}
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor={`segundoNombre-${socio.id}`}>Segundo nombre</FieldLabel>
                      <Input
                        id={`segundoNombre-${socio.id}`}
                        name="segundoNombre"
                        defaultValue={segundoNombreInicial}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor={`apellidoPaterno-${socio.id}`}>
                        Apellido paterno
                      </FieldLabel>
                      <Input
                        id={`apellidoPaterno-${socio.id}`}
                        name="apellidoPaterno"
                        defaultValue={apellidoPaternoInicial}
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor={`apellidoMaterno-${socio.id}`}>
                        Apellido materno
                      </FieldLabel>
                      <Input
                        id={`apellidoMaterno-${socio.id}`}
                        name="apellidoMaterno"
                        defaultValue={apellidoMaternoInicial}
                        required
                      />
                    </Field>
                  </>
                ) : (
                  <>
                    <Field className="md:col-span-2">
                      <FieldLabel htmlFor={`razonSocial-${socio.id}`}>Razon social</FieldLabel>
                      <Input
                        id={`razonSocial-${socio.id}`}
                        name="razonSocial"
                        defaultValue={socio.razonSocial}
                        required
                      />
                    </Field>
                    <Field className="md:col-span-2">
                      <FieldLabel htmlFor={`nombreComercial-${socio.id}`}>
                        Nombre comercial
                      </FieldLabel>
                      <Input
                        id={`nombreComercial-${socio.id}`}
                        name="nombreComercial"
                        defaultValue={socio.nombreComercial}
                        required
                      />
                    </Field>
                  </>
                )}
                <Field className="md:col-span-2">
                  <FieldLabel htmlFor={`direccion-${socio.id}`}>Direccion</FieldLabel>
                  <Input
                    id={`direccion-${socio.id}`}
                    name="direccion"
                    defaultValue={socio.direccion}
                    required
                  />
                </Field>
                {socio.tipo !== "PERSONAL" ? (
                  <Field>
                    <FieldLabel htmlFor={`contacto-${socio.id}`}>Contacto</FieldLabel>
                    <Input
                      id={`contacto-${socio.id}`}
                      name="contacto"
                      defaultValue={socio.contacto}
                    />
                  </Field>
                ) : null}
                <Field>
                  <FieldLabel htmlFor={`correo-${socio.id}`}>Correo</FieldLabel>
                  <Input
                    id={`correo-${socio.id}`}
                    name="correo"
                    type="email"
                    defaultValue={socio.correo}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`numeroCelular-${socio.id}`}>Celular</FieldLabel>
                  <Input
                    id={`numeroCelular-${socio.id}`}
                    name="numeroCelular"
                    defaultValue={socio.numeroCelular}
                  />
                </Field>
              </div>
            </div>
          </form>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={modificarMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={modificarMutation.isPending}
              onClick={(event) => {
                event.preventDefault()
                const form = document.getElementById(
                  `modificar-${socio.id}`,
                ) as HTMLFormElement | null
                form?.requestSubmit()
              }}
            >
              {modificarMutation.isPending ? "Guardando..." : "Guardar cambios"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function SocioNegocioVista({
  titulo,
  etiqueta,
  accionPrincipal = "Nuevo registro",
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

  const metricasVista = useMemo(() => {
    const activosRegistrados = socios.filter(
      (socio) => socio.estado === "ACTIVO" && socio.estadoRegistro === "ACTIVO"
    ).length
    const inactivos = socios.filter((socio) => socio.estado === "INACTIVO").length
    const anulados = socios.filter((socio) => socio.estadoRegistro === "ANULADO").length

    return [
      {
        etiqueta: "Registros consultados",
        valor: String(socios.length),
        detalle: "Resultado recibido segun el filtro aplicado.",
      },
      {
        etiqueta: "Activos registrados",
        valor: String(activosRegistrados),
        detalle: "Socios disponibles para operar y sin anulacion.",
      },
      {
        etiqueta: "Inactivos / anulados",
        valor: String(inactivos + anulados),
        detalle: `${inactivos} inactivos y ${anulados} anulados en la consulta.`,
      },
    ]
  }, [socios])

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

          <section className="grid gap-3 md:grid-cols-3">
            {metricasVista.map((metrica, index) => {
              const visual = obtenerVisualMetrica(metrica.etiqueta, index)

              return (
                <Card
                  key={metrica.etiqueta}
                  className={`overflow-hidden ${visual.cardClassName}`}
                >
                  <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
                    <div className="min-w-0">
                      <CardDescription
                        className={`truncate text-xs font-medium uppercase tracking-[0.08em] ${visual.descriptionClassName}`}
                      >
                        {metrica.etiqueta}
                      </CardDescription>
                      <CardTitle className="mt-2 text-3xl font-semibold tabular-nums tracking-normal">
                        {metrica.valor}
                      </CardTitle>
                    </div>
                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded-md ring-1 ${visual.iconClassName}`}
                    >
                      <HugeiconsIcon icon={visual.icon} strokeWidth={2} />
                    </span>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3 pt-0">
                    <p className={`min-h-10 text-sm leading-5 ${visual.detailClassName}`}>
                      {metrica.detalle}
                    </p>
                    <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                      <span className="text-xs text-muted-foreground">
                        {visual.contexto}
                      </span>
                      <Badge
                        variant="outline"
                        className={`h-6 shrink-0 gap-1.5 rounded-full px-2.5 text-[12px] font-medium ${visual.badgeClassName}`}
                      >
                        <HugeiconsIcon
                          data-icon="inline-start"
                          icon={visual.icon}
                          strokeWidth={2}
                        />
                        {visual.badge}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">Socios de negocio</h2>
              <p className="text-sm text-muted-foreground">{etiqueta}</p>
            </div>

            <div className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
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
                {crearHref ? (
                  <Button asChild size="sm">
                    <Link href={crearHref}>
                      <HugeiconsIcon
                        data-icon="inline-start"
                        icon={Add01Icon}
                        strokeWidth={2}
                      />
                      {accionPrincipal}
                    </Link>
                  </Button>
                ) : null}
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
