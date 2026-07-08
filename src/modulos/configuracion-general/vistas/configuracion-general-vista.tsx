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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card"
import { Separator } from "@/compartido/componentes/ui/separator"
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
  { value: "CUENTA", label: "Cuenta" },
  { value: "CONTRATO", label: "Contrato" },
]

// Slug de la ruta de registro de cada tipo (/configuracion/nuevo/<slug>).
const rutaNuevoPorTipo: Record<TipoDatoMaestro, string> = {
  UBICACION: "ubicacion",
  SEDE: "sede",
  AREA: "area",
  CUENTA: "cuenta",
  CONTRATO: "contrato",
  CARGO: "cargo",
}

// Ruta de la pantalla (seccion) que contiene cada tipo. Sedes y areas comparten
// pantalla; cuentas y contratos tambien.
const rutaListadoPorTipo: Record<TipoDatoMaestro, string> = {
  UBICACION: "/configuracion/ubicaciones",
  SEDE: "/configuracion/sedes-areas",
  AREA: "/configuracion/sedes-areas",
  CUENTA: "/configuracion/cuentas-contratos",
  CONTRATO: "/configuracion/cuentas-contratos",
  CARGO: "/configuracion/sedes-areas",
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
    titulo: "Sedes, areas y cargos",
    descripcion: "Centros de trabajo, las areas dentro de cada uno y los cargos que pertenecen a esas areas.",
    tipos: ["SEDE", "AREA", "CARGO"],
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
  if (dato.tipoDatoMaestro === "CONTRATO") return dato.contratoPadreNombre || "-"
  return "-"
}

function etiquetaDetalleEspecifico(tipo: TipoDatoMaestro) {
  if (tipo === "UBICACION") return "Tipo / direccion"
  if (tipo === "CARGO") return "Reporta a"
  if (tipo === "SEDE") return "Ubicacion"
  if (tipo === "AREA") return "Gerencia / sede"
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

function Dato({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid gap-1">
      <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </span>
      <span className="break-words text-sm">{value || "-"}</span>
    </div>
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

function MetricasResumenDashboard({
  cargando,
  resumen,
}: {
  cargando?: boolean
  resumen?: ResumenConfiguracionGeneralResponse
}) {
  const metricas = [
    {
      etiqueta: "Configuraciones",
      valor: resumen?.totalMaestros ?? 0,
      detalle: "Total de registros administrados en esta seccion.",
      icon: Database,
      contexto: "Total",
    },
    {
      etiqueta: "Activos",
      valor: resumen?.activos ?? 0,
      detalle: "Registros listos para usarse en el sistema.",
      icon: ShieldCheck,
      contexto: "Estado",
    },
    {
      etiqueta: "Listos para usar",
      valor: resumen?.vigentesConsumibles ?? 0,
      detalle: "Registros activos y vigentes, disponibles para el resto del sistema.",
      icon: CheckCircle2,
      contexto: "Disponibles",
    },
    {
      etiqueta: "Inactivos o anulados",
      valor: (resumen?.inactivos ?? 0) + (resumen?.anulados ?? 0),
      detalle: `${resumen?.inactivos ?? 0} inactivos y ${resumen?.anulados ?? 0} anulados.`,
      icon: History,
      contexto: "Seguimiento",
    },
  ]

  return (
    <section className="grid gap-3 md:grid-cols-4">
      {metricas.map((metrica) => (
        <Card key={metrica.etiqueta} className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
            <div className="min-w-0">
              <CardDescription className="text-xs font-medium uppercase tracking-[0.08em]">
                {metrica.etiqueta}
              </CardDescription>
              <CardTitle className="mt-2 text-3xl font-semibold tabular-nums">
                {cargando ? "-" : metrica.valor}
              </CardTitle>
            </div>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-background text-primary ring-1 ring-border">
              <metrica.icon className="size-4" />
            </span>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0">
            <p className="text-sm text-muted-foreground">{metrica.detalle}</p>
            <div className="flex items-center justify-between gap-3">
              <Badge variant="secondary">{metrica.contexto}</Badge>
              <span className="text-xs text-muted-foreground">Resumen</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}

function ResumenPorTipoDashboard({
  cargando,
  resumen,
}: {
  cargando?: boolean
  resumen?: ResumenConfiguracionGeneralResponse
}) {
  const datos = (resumen?.porTipoDatoMaestro ?? []).filter(
    (item) => rutaListadoPorTipo[item.tipoDatoMaestro] !== undefined,
  )
  const datosOrdenados = [...datos].sort((a, b) =>
    a.tipoDatoMaestro.localeCompare(b.tipoDatoMaestro),
  )

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold">Resumen por tipo</h2>
          <p className="text-sm text-muted-foreground">
            Cantidad de registros por tipo. Toca uno para abrir su pantalla.
          </p>
        </div>
      </div>
      <div className="grid gap-3 p-4 md:grid-cols-2">
        {cargando ? (
          <>
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </>
        ) : datosOrdenados.length > 0 ? (
          datosOrdenados.map((item) => (
            <Link
              key={item.tipoDatoMaestro}
              href={rutaListadoPorTipo[item.tipoDatoMaestro]}
              className="group grid gap-2 rounded-md border border-border p-3 transition-colors hover:border-primary/40 hover:bg-muted/40"
            >
              <div className="flex items-center justify-between gap-2">
                <TipoBadge tipo={item.tipoDatoMaestro} />
                <span className="flex items-baseline gap-1 tabular-nums">
                  <span className="text-lg font-semibold">{item.total}</span>
                  <span className="text-xs text-muted-foreground">registros</span>
                  <ArrowRight className="ml-1 size-3.5 self-center text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.max((item.activos / Math.max(item.total, 1)) * 100, 3)}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="text-emerald-600 dark:text-emerald-400">Activos: {item.activos}</span>
                <span>Inactivos: {item.inactivos}</span>
                <span>Anulados: {item.anulados}</span>
              </div>
            </Link>
          ))
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground md:col-span-2">
            No hay datos de resumen disponibles.
          </div>
        )}
      </div>
    </section>
  )
}

function EstadoResumenDashboard({
  estadoServicio,
  resumen,
}: {
  estadoServicio?: "cargando" | "disponible" | "no-disponible"
  resumen?: ResumenConfiguracionGeneralResponse
}) {
  const estados = resumen?.porEstado ?? []
  const registros = resumen?.porEstadoRegistro ?? []

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle>Estado del servicio</CardTitle>
        <CardDescription>Disponibilidad del servicio y de los registros.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Servicio</span>
          <Badge variant={estadoServicio === "no-disponible" ? "destructive" : "outline"}>
            {estadoServicio === "cargando"
              ? "Verificando"
              : estadoServicio === "no-disponible"
                ? "No disponible"
                : "Disponible"}
          </Badge>
        </div>
        <Separator />
        <div className="grid gap-3">
          {estados.map((item) => (
            <div key={item.estado} className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">{item.estado}</span>
              <span className="font-medium tabular-nums">{item.total}</span>
            </div>
          ))}
          {registros.map((item) => (
            <div key={item.estadoRegistro} className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Registro {item.estadoRegistro}</span>
              <span className="font-medium tabular-nums">{item.total}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function FlujosConfiguracionGeneral() {
  const flujos = [
    {
      titulo: "Ubicaciones",
      descripcion: "Punto de partida de la estructura: lugares donde opera la empresa.",
      href: "/configuracion/ubicaciones",
      accion: "Abrir",
      icon: Layers3,
    },
    {
      titulo: "Registrar maestro",
      descripcion: "Crear cada maestro siguiendo el orden operativo recomendado.",
      href: "/configuracion/nuevo/ubicacion",
      accion: "Nuevo",
      icon: Plus,
    },
    {
      titulo: "Reportes",
      descripcion: "Vista consolidada para revisar disponibilidad y estados.",
      href: "/configuracion/reportes",
      accion: "Ver reportes",
      icon: FileDown,
    },
  ]

  return (
    <section className="grid gap-3 md:grid-cols-3">
      {flujos.map((flujo) => (
        <Card key={flujo.titulo} className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="text-base">{flujo.titulo}</CardTitle>
              <CardDescription>{flujo.descripcion}</CardDescription>
            </div>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-background text-primary ring-1 ring-border">
              <flujo.icon className="size-4" />
            </span>
          </CardHeader>
          <CardFooter>
            <Button asChild variant="outline" size="sm" className="w-full justify-between">
              <Link href={flujo.href}>
                {flujo.accion}
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </section>
  )
}

function OrdenRegistroConfiguracionGeneral() {
  const pasos = [
    {
      titulo: "1. Ubicacion",
      descripcion: "Registra el punto fisico o logistico que luego usaran sedes.",
    },
    {
      titulo: "2. Sede, area y almacen",
      descripcion: "Sede usa ubicacion; area usa sede; almacen usa ubicacion y sede opcional.",
    },
    {
      titulo: "3. Cuenta",
      descripcion: "Registra cuentas independientes para asociarlas luego cuando un contrato lo requiera.",
    },
    {
      titulo: "4. Contrato",
      descripcion: "Se registra separado y puede vincularse opcionalmente a una cuenta activa.",
    },
  ]

  return (
    <section className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold">Orden recomendado de registro</h2>
        <p className="text-sm text-muted-foreground">
          Sigue esta secuencia para que los registros aparezcan correctamente en las asignaciones.
        </p>
      </div>
      <div className="grid md:grid-cols-4">
        {pasos.map((paso, index) => (
          <div
            key={paso.titulo}
            className={`flex flex-col gap-2 p-4 ${index > 0 ? "border-t border-border md:border-l md:border-t-0" : ""}`}
          >
            <Badge variant="outline" className="w-fit">
              {paso.titulo}
            </Badge>
            <p className="text-sm text-muted-foreground">{paso.descripcion}</p>
          </div>
        ))}
      </div>
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

export function ConfiguracionGeneralDashboardVista() {
  const resumenQuery = useResumenDashboardConfiguracionGeneralQuery()
  const estadoQuery = useEstadoBcConfiguracionGeneralQuery()
  const resumen = resumenQuery.data ?? undefined
  const estadoServicio = estadoQuery.isLoading
    ? "cargando"
    : estadoQuery.error
      ? "no-disponible"
      : "disponible"

  return (
    <>
      <SiteHeader
        title="CS-Configuracion General"
        breadcrumbs={[{ title: "CS-Configuracion General" }]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-normal">Configuracion general</h1>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
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

          <MetricasResumenDashboard resumen={resumen} cargando={resumenQuery.isLoading} />

          <FlujosConfiguracionGeneral />

          <OrdenRegistroConfiguracionGeneral />

          <section className="grid gap-5 xl:grid-cols-[1fr_340px]">
            <ResumenPorTipoDashboard resumen={resumen} cargando={resumenQuery.isLoading} />

            <aside className="flex flex-col gap-3">
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Estado del servicio</CardTitle>
                  <CardDescription>Disponibilidad actual del servicio de configuracion.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm">
                  <Dato
                    label="Conexion"
                    value={
                      estadoQuery.isLoading
                        ? "Verificando"
                        : estadoQuery.error
                          ? "No disponible"
                          : "Disponible"
                    }
                  />
                  <Dato label="Uso" value="Ubicaciones, sedes, areas, cargos, cuentas y contratos" />
                </CardContent>
              </Card>
              <EstadoResumenDashboard resumen={resumen} estadoServicio={estadoServicio} />
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Accesos rapidos</CardTitle>
                  <CardDescription>Operaciones frecuentes del modulo.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <Button asChild>
                    <Link href="/configuracion/nuevo/ubicacion">
                      <Plus data-icon="inline-start" />
                      Nuevo
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/configuracion/reportes">
                      <FileDown data-icon="inline-start" />
                      Ver reportes
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </aside>
          </section>
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
                    Vista consolidada de ubicaciones, sedes, areas, cargos, cuentas y contratos.
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


