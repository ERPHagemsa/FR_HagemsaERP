"use client"

import Link from "next/link"
import { useState } from "react"
import {
  ArrowRight,
  Ban,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Database,
  FileDown,
  Layers3,
  History,
  MapPin,
  Network,
  Plus,
  ShieldCheck,
} from "lucide-react"

import { SiteHeader } from "@/compartido/componentes/site-header"
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert"
import { Badge } from "@/compartido/componentes/ui/badge"
import { Button } from "@/compartido/componentes/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card"
import { Skeleton } from "@/compartido/componentes/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table"

import {
  useCatalogoConfiguracionGeneralQuery,
  useEstadoBcConfiguracionGeneralQuery,
  useExportarConfiguracionGeneralQuery,
  useResumenDashboardConfiguracionGeneralQuery,
} from "../servicios/configuracion-general-queries"
import { ConfiguracionGeneralListadoPorTipoVista } from "../componentes/configuracion-general-listados"
import type {
  ConfiguracionGeneralResponse,
  ConsultarConfiguracionGeneralQuery,
  EstadoRegistro,
  ResumenConfiguracionGeneralResponse,
  TipoDatoMaestro,
} from "../tipos/configuracion-general"

const tipos: Array<{ value: "TODOS" | TipoDatoMaestro; label: string }> = [
  { value: "TODOS", label: "Tipo: todos" },
  { value: "CARGO", label: "Cargo" },
  { value: "UBICACION", label: "Ubicacion" },
  { value: "SEDE", label: "Sede" },
  { value: "AREA", label: "Area" },
  { value: "ALMACEN", label: "Almacen" },
  { value: "REGIMEN", label: "Regimen" },
  { value: "CUENTA", label: "Cuenta" },
  { value: "CONTRATO", label: "Contrato" },
]

// Slug de la ruta de registro de cada tipo (/configuracion/nuevo/<slug>).
const rutaNuevoPorTipo: Record<TipoDatoMaestro, string> = {
  UBICACION: "ubicacion",
  SEDE: "sede",
  AREA: "area",
  ALMACEN: "almacen",
  REGIMEN: "regimen",
  CUENTA: "cuenta",
  CONTRATO: "contrato",
  CARGO: "cargo",
}

// Secciones del menu de configuracion. Algunas agrupan dos tipos relacionados en
// una sola pantalla con un selector (sedes/areas, cuentas/contratos).
type SeccionConfiguracion = {
  titulo: string
  descripcion: string
  tipos: TipoDatoMaestro[]
}

export const seccionesConfiguracion = {
  ubicaciones: {
    titulo: "Ubicaciones",
    descripcion: "Lugares donde opera la empresa (plantas, minas, puertos, etc.).",
    tipos: ["UBICACION"],
  },
  "sedes-areas": {
    titulo: "Sedes y areas",
    descripcion: "Centros de trabajo y estructura organizacional por sede.",
    tipos: ["SEDE", "AREA"],
  },
  cargos: {
    titulo: "Cargos",
    descripcion: "Puestos de trabajo y cadena de mando por cargo superior.",
    tipos: ["CARGO"],
  },
  "cuentas-contratos": {
    titulo: "Cuentas y contratos",
    descripcion: "Cuentas de la empresa y los contratos que dependen de ellas.",
    tipos: ["CUENTA", "CONTRATO"],
  },
} satisfies Record<string, SeccionConfiguracion>

export type SeccionConfiguracionClave = keyof typeof seccionesConfiguracion

// Titulo (en plural) y descripcion corta de cada pantalla por tipo.
const tituloMaestro: Record<TipoDatoMaestro, string> = {
  UBICACION: "Ubicaciones",
  SEDE: "Sedes",
  AREA: "Areas",
  ALMACEN: "Almacenes",
  REGIMEN: "Regimenes",
  CUENTA: "Cuentas",
  CONTRATO: "Contratos",
  CARGO: "Cargos",
}

function obtenerMensajeError(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo completar la operacion."
}

function formatearFecha(fecha?: string | null) {
  if (!fecha) return "-"
  const valor = new Date(fecha)
  if (Number.isNaN(valor.getTime())) return fecha
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(valor)
}

function nombreTipo(tipo: TipoDatoMaestro) {
  return tipo.charAt(0) + tipo.slice(1).toLowerCase()
}

function etiquetaTipo(tipo: TipoDatoMaestro) {
  return tipos.find((item) => item.value === tipo)?.label ?? nombreTipo(tipo)
}

function eventoPrincipal(dato: ConfiguracionGeneralResponse) {
  const base = nombreTipo(dato.tipoDatoMaestro)

  if (dato.estadoRegistro === "ANULADO") return `${base} anulado`
  if (dato.estado === "INACTIVO") return `${base} inhabilitado`
  if (dato.fechaModificacion) return `${base} actualizado`
  return `${base} habilitado`
}

function detalleEspecifico(dato: ConfiguracionGeneralResponse) {
  if (dato.tipoDatoMaestro === "UBICACION") return dato.tipoUbicacion || dato.direccion || "-"
  if (dato.tipoDatoMaestro === "CARGO") return dato.cargoSuperiorNombre || "-"
  if (dato.tipoDatoMaestro === "SEDE") return dato.ubicacionNombre || "-"
  if (dato.tipoDatoMaestro === "AREA") return dato.gerenciaNombre || dato.sedeNombre || "-"
  if (dato.tipoDatoMaestro === "ALMACEN") return dato.sedeNombre || dato.ubicacionNombre || "-"
  if (dato.tipoDatoMaestro === "REGIMEN") return dato.regimenCodigo || "-"
  if (dato.tipoDatoMaestro === "CONTRATO") return dato.contratoPadreNombre || "-"
  return "-"
}

function etiquetaDetalleEspecifico(tipo: TipoDatoMaestro) {
  if (tipo === "UBICACION") return "Tipo / direccion"
  if (tipo === "CARGO") return "Reporta a"
  if (tipo === "SEDE") return "Ubicacion"
  if (tipo === "AREA") return "Gerencia / sede"
  if (tipo === "ALMACEN") return "Sede / ubicacion"
  if (tipo === "REGIMEN") return "Codigo regimen"
  if (tipo === "CONTRATO") return "Pertenece a"
  return "Detalle"
}

function textoEstadoConfiguracion(dato: ConfiguracionGeneralResponse) {
  if (dato.estadoRegistro === "ANULADO") return "Retirada"
  if (dato.estado === "INACTIVO") return "Pausada"
  return "Disponible"
}

function textoVigencia(estadoRegistro: EstadoRegistro) {
  return estadoRegistro === "ANULADO" ? "Retirada" : "Vigente"
}

function EstadoDatoBadge({ dato }: { dato: ConfiguracionGeneralResponse }) {
  const esAnulado = dato.estadoRegistro === "ANULADO"
  const esActivo = dato.estado === "ACTIVO" && !esAnulado

  return (
    <Badge
      variant={esAnulado ? "destructive" : "outline"}
      className="h-6 gap-1.5 rounded-full border-border bg-background px-2.5 text-[12px] font-medium text-foreground shadow-xs"
    >
      {esActivo ? (
        <CheckCircle2 className="size-3.5 text-emerald-500" />
      ) : (
        <Ban className="size-3.5 text-destructive" />
      )}
      {textoEstadoConfiguracion(dato)}
    </Badge>
  )
}

function TipoBadge({ tipo }: { tipo: TipoDatoMaestro }) {
  return (
    <Badge
      variant="outline"
      className="h-6 rounded-full border-border bg-background px-2.5 text-[12px] font-medium text-foreground shadow-xs"
    >
      {tituloMaestro[tipo]}
    </Badge>
  )
}

function MetricasMaestros({
  datos,
  total,
  historial,
  cargando,
}: {
  datos: ConfiguracionGeneralResponse[]
  total: number
  historial?: number
  cargando?: boolean
}) {
  const activosVigentes = datos.filter(
    (dato) => dato.estado === "ACTIVO" && dato.estadoRegistro === "ACTIVO",
  ).length
  const inactivos = datos.filter((dato) => dato.estado === "INACTIVO").length
  const anulados = datos.filter((dato) => dato.estadoRegistro === "ANULADO").length

  const metricas = [
    {
      etiqueta: "Configuraciones",
      valor: total || datos.length,
      detalle: "Ubicaciones, sedes, areas, cargos, cuentas y contratos.",
      icon: Database,
      contexto: "Total",
    },
    {
      etiqueta: "Activos vigentes",
      valor: activosVigentes,
      detalle: "Disponibles para los procesos que usan configuracion.",
      icon: CheckCircle2,
      contexto: "Operativos",
    },
    {
      etiqueta: "Inactivos / anulados",
      valor: inactivos + anulados,
      detalle: `${inactivos} inactivos y ${anulados} anulados en la consulta.`,
      icon: Ban,
      contexto: "Seguimiento",
    },
    {
      etiqueta: "Cambios",
      valor: historial ?? "-",
      detalle: "Movimientos registrados para seguimiento.",
      icon: History,
      contexto: "Historial",
    },
  ]

  return (
    <section className="grid gap-3 md:grid-cols-4">
      {metricas.map((metrica) => (
        <Card key={metrica.etiqueta} className="overflow-hidden border-border bg-card text-card-foreground shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
            <div className="min-w-0">
              <CardDescription className="truncate text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {metrica.etiqueta}
              </CardDescription>
              <CardTitle className="mt-2 text-3xl font-semibold tabular-nums tracking-normal">
                {cargando ? "-" : metrica.valor}
              </CardTitle>
            </div>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-background text-primary ring-1 ring-border">
              <metrica.icon className="size-4" />
            </span>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0">
            <p className="min-h-10 text-sm leading-5 text-muted-foreground">
              {metrica.detalle}
            </p>
            <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
              <span className="text-xs text-muted-foreground">{metrica.contexto}</span>
              <Badge
                variant="outline"
                className="h-6 shrink-0 rounded-full border-border bg-background px-2.5 text-[12px] font-medium text-foreground shadow-xs"
              >
                Control
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}

function TablaDatosMaestros({
  datos,
  cargando,
  onSelect,
}: {
  datos: ConfiguracionGeneralResponse[]
  cargando?: boolean
  onSelect?: (dato: ConfiguracionGeneralResponse) => void
}) {
  if (cargando) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (datos.length === 0) {
    return (
      <div className="px-4 py-10 text-center text-sm text-muted-foreground">
        No existen configuraciones para la consulta aplicada.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/70 hover:bg-muted/70">
            <TableHead>Tipo</TableHead>
            <TableHead className="w-16">#</TableHead>
            <TableHead>Codigo</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Detalle</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Registro</TableHead>
            <TableHead>Ultimo movimiento</TableHead>
            <TableHead>Modificacion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {datos.map((dato, index) => (
            <TableRow
              key={`${dato.id}-${dato.tipoDatoMaestro}-${dato.codigo}-${index}`}
              className={onSelect ? "cursor-pointer border-border/80" : "border-border/80"}
              onClick={() => onSelect?.(dato)}
            >
              <TableCell>
                <TipoBadge tipo={dato.tipoDatoMaestro} />
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {dato.id}
              </TableCell>
              <TableCell className="font-mono text-xs">{dato.codigo}</TableCell>
              <TableCell>
                <div className="flex min-w-56 flex-col">
                  <span className="font-medium">{dato.nombre}</span>
                  <span className="text-xs text-muted-foreground">
                    {dato.descripcion || "Sin descripcion"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex min-w-44 flex-col">
                  <span>{detalleEspecifico(dato)}</span>
                  <span className="text-xs text-muted-foreground">
                    {etiquetaDetalleEspecifico(dato.tipoDatoMaestro)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <EstadoDatoBadge dato={dato} />
              </TableCell>
              <TableCell>
                <Badge
                  variant={dato.estadoRegistro === "ACTIVO" ? "outline" : "destructive"}
                  className="h-6 rounded-full border-border bg-background px-2.5 text-[12px] font-medium text-foreground shadow-xs"
                >
                  {textoVigencia(dato.estadoRegistro)}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">{eventoPrincipal(dato)}</TableCell>
              <TableCell>
                <div className="flex min-w-40 flex-col">
                  <span>{formatearFecha(dato.fechaModificacion || dato.fechaCreacion)}</span>
                  <span className="text-xs text-muted-foreground">
                    {dato.usuarioModificacion || dato.usuarioCreacion}
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// Tira compacta de indicadores clave en una sola fila, sin tarjetas pesadas.
function ResumenStrip({
  cargando,
  resumen,
}: {
  cargando?: boolean
  resumen?: ResumenConfiguracionGeneralResponse
}) {
  const items = [
    { etiqueta: "Total", valor: resumen?.totalMaestros ?? 0 },
    { etiqueta: "Activos", valor: resumen?.activos ?? 0 },
    { etiqueta: "Listos para usar", valor: resumen?.vigentesConsumibles ?? 0 },
    {
      etiqueta: "Inactivos o anulados",
      valor: (resumen?.inactivos ?? 0) + (resumen?.anulados ?? 0),
    },
  ]

  return (
    <section className="grid grid-cols-2 divide-border rounded-xl border border-border bg-card shadow-sm sm:grid-cols-4 sm:divide-x">
      {items.map((item) => (
        <div key={item.etiqueta} className="flex flex-col gap-1 px-5 py-4">
          <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {item.etiqueta}
          </span>
          <span className="text-3xl font-semibold tabular-nums">
            {cargando ? "-" : item.valor}
          </span>
        </div>
      ))}
    </section>
  )
}

// Navegacion principal: una tarjeta clara por cada seccion de configuracion.
function SeccionesNav() {
  const claves = Object.keys(seccionesConfiguracion) as SeccionConfiguracionClave[]

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {claves.map((clave) => {
        const seccion = seccionesConfiguracion[clave]
        return (
          <Link
            key={clave}
            href={`/configuracion/${clave}`}
            className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/40"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
              <IconoMaestro tipo={seccion.tipos[0]} className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium">{seccion.titulo}</h3>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{seccion.descripcion}</p>
            </div>
          </Link>
        )
      })}
    </section>
  )
}

export function ConfiguracionGeneralDashboardVista() {
  const resumenQuery = useResumenDashboardConfiguracionGeneralQuery()
  const estadoQuery = useEstadoBcConfiguracionGeneralQuery()
  const resumen = resumenQuery.data ?? undefined

  const conexion = estadoQuery.isLoading
    ? "Verificando"
    : estadoQuery.error
      ? "No disponible"
      : "Disponible"

  return (
    <>
      <SiteHeader
        title="CS-Configuracion General"
        breadcrumbs={[{ title: "CS-Configuracion General" }]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight">Configuracion general</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Elige una seccion para administrar sus registros.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={estadoQuery.error ? "destructive" : "outline"}
                className="h-7 gap-1.5 rounded-full px-3"
              >
                <span
                  className={`size-2 rounded-full ${
                    estadoQuery.error ? "bg-destructive" : "bg-emerald-500"
                  }`}
                />
                {conexion}
              </Badge>
              <Button asChild variant="outline">
                <Link href="/configuracion/reportes">
                  <FileDown data-icon="inline-start" />
                  Reportes
                </Link>
              </Button>
              <Button asChild>
                <Link href="/configuracion/nuevo/ubicacion">
                  <Plus data-icon="inline-start" />
                  Nuevo
                </Link>
              </Button>
            </div>
          </section>

          {resumenQuery.error ? (
            <Alert variant="destructive">
              <AlertTitle>No se pudo cargar la informacion</AlertTitle>
              <AlertDescription>{obtenerMensajeError(resumenQuery.error)}</AlertDescription>
            </Alert>
          ) : null}

          <ResumenStrip resumen={resumen} cargando={resumenQuery.isLoading} />

          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Secciones
            </h2>
            <SeccionesNav />
          </div>
        </div>
      </main>
    </>
  )
}

// Icono propio de cada tipo de configuracion (se declara como componente para no
// crear componentes dentro del render).
function IconoMaestro({ tipo, className }: { tipo: TipoDatoMaestro; className?: string }) {
  switch (tipo) {
    case "UBICACION":
      return <MapPin className={className} />
    case "SEDE":
      return <Building2 className={className} />
    case "AREA":
      return <Network className={className} />
    case "ALMACEN":
      return <Layers3 className={className} />
    case "REGIMEN":
      return <CalendarClock className={className} />
    case "CARGO":
      return <ShieldCheck className={className} />
    case "CUENTA":
      return <BriefcaseBusiness className={className} />
    case "CONTRATO":
      return <ClipboardList className={className} />
    default:
      return <CalendarClock className={className} />
  }
}

/**
 * Pantalla dedicada a un solo tipo de configuracion (ubicaciones, sedes, areas,
 * etc.). Tiene su propia ruta y entrada en el sidebar, en vez de vivir como una
 * pestana dentro de una pantalla compartida. Reusa el listado por tipo, que ya
 * elige el endpoint especifico correcto.
 */
export function ConfiguracionGeneralSeccionVista({
  seccion,
}: {
  seccion: SeccionConfiguracionClave
}) {
  const config = seccionesConfiguracion[seccion]
  const tipos = config.tipos as TipoDatoMaestro[]
  const [activo, setActivo] = useState<TipoDatoMaestro>(tipos[0])
  const hayVarios = tipos.length > 1
  const singular = etiquetaTipo(activo).toLowerCase()
  const hrefNuevo = `/configuracion/nuevo/${rutaNuevoPorTipo[activo]}`

  return (
    <>
      <SiteHeader
        title={config.titulo}
        breadcrumbs={[
          { title: "CS-Configuracion General", href: "/configuracion" },
          { title: config.titulo },
        ]}
      />
      <main className="min-h-screen bg-muted/30 px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          {/* Banner de la seccion de configuracion: identidad visual propia. */}
          <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="flex flex-col gap-4 border-l-4 border-l-primary px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                  <IconoMaestro tipo={tipos[0]} className="size-6" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                    Configuracion general
                  </p>
                  <h1 className="text-xl font-semibold tracking-normal">{config.titulo}</h1>
                  <p className="mt-0.5 text-sm text-muted-foreground">{config.descripcion}</p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link href="/configuracion">
                    <ArrowRight className="size-4 rotate-180" data-icon="inline-start" />
                    Inicio
                  </Link>
                </Button>
                <Button asChild className="w-full sm:w-auto">
                  <Link href={hrefNuevo}>
                    <Plus data-icon="inline-start" />
                    Nuevo {singular}
                  </Link>
                </Button>
              </div>
            </div>

            {/* Selector cuando la seccion agrupa dos tipos (sedes/areas, cuentas/contratos). */}
            {hayVarios ? (
              <div className="border-t border-border bg-muted/30 px-5 py-3">
                <div className="inline-flex rounded-lg border border-border bg-background p-1">
                  {tipos.map((t) => {
                    const seleccionado = t === activo
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setActivo(t)}
                        className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                          seleccionado
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {tituloMaestro[t]}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </section>

          <ConfiguracionGeneralListadoPorTipoVista key={activo} tipo={activo} ocultarEncabezado />
        </div>
      </main>
    </>
  )
}

export function ConfiguracionGeneralReportesVista() {
  const [query] = useState<ConsultarConfiguracionGeneralQuery>({
    page: 1,
    pageSize: 50,
    sortBy: "fechaCreacion",
    sortOrder: "desc",
  })
  const catalogo = useCatalogoConfiguracionGeneralQuery(query)
  const exportacion = useExportarConfiguracionGeneralQuery(query, true)
  const datos = exportacion.data?.datos ?? catalogo.data?.datos ?? []
  const total =
    exportacion.data?.paginacion?.total ??
    catalogo.data?.paginacion?.total ??
    datos.length
  const disponibles = datos.filter(
    (dato) => dato.estado === "ACTIVO" && dato.estadoRegistro === "ACTIVO",
  ).length
  const pausadas = datos.filter(
    (dato) => dato.estado === "INACTIVO" && dato.estadoRegistro !== "ANULADO",
  ).length
  const retiradas = datos.filter((dato) => dato.estadoRegistro === "ANULADO").length
  const resumen = [
    {
      titulo: "Disponibles",
      valor: disponibles,
      detalle: "Listas para usarse en los procesos del sistema.",
      icon: CheckCircle2,
    },
    {
      titulo: "Pausadas",
      valor: pausadas,
      detalle: "Se conservan en consulta, pero no se usan para nuevas operaciones.",
      icon: Ban,
    },
    {
      titulo: "Retiradas",
      valor: retiradas,
      detalle: "Quedan como referencia historica y no aparecen como opciones activas.",
      icon: History,
    },
  ]

  return (
    <>
      <SiteHeader
        title="Reportes"
        breadcrumbs={[
          { title: "CS-Configuracion General", href: "/configuracion" },
          { title: "Reportes" },
        ]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-normal">Reportes de configuracion</h1>
            </div>
            <Button asChild className="w-full md:w-auto">
              <Link href="/configuracion/nuevo/ubicacion">
                <Plus data-icon="inline-start" />
                Nuevo
              </Link>
            </Button>
          </section>

          {exportacion.error ? (
            <Alert variant="destructive">
              <AlertTitle>No se pudo cargar la informacion</AlertTitle>
              <AlertDescription>{obtenerMensajeError(exportacion.error)}</AlertDescription>
            </Alert>
          ) : null}

          <MetricasMaestros datos={datos} total={total} cargando={exportacion.isLoading} />

          <section className="grid gap-3 md:grid-cols-3">
            {resumen.map((item) => (
              <Card key={item.titulo} className="border-border shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardDescription>{item.titulo}</CardDescription>
                    <CardTitle className="mt-2 text-3xl tabular-nums">
                      {exportacion.isLoading ? "-" : item.valor}
                    </CardTitle>
                  </div>
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-background text-primary ring-1 ring-border">
                    <item.icon className="size-4" />
                  </span>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.detalle}</p>
                </CardContent>
              </Card>
            ))}
          </section>

          <section>
            <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
              <div className="flex flex-col gap-3 border-b border-border px-4 py-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-base font-semibold">Configuraciones para revisar</h2>
                  <p className="text-sm text-muted-foreground">
                    Vista consolidada de maestros administrados por Configuracion General.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => void exportacion.refetch()}>
                  <FileDown className="size-4" />
                  Actualizar
                </Button>
              </div>
              <TablaDatosMaestros datos={datos} cargando={exportacion.isLoading} />
            </section>
          </section>
        </div>
      </main>
    </>
  )
}


