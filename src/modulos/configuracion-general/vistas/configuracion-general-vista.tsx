"use client"

import Link from "next/link"
import { useState } from "react"
import {
  ArrowRight,
  Ban,
  BriefcaseBusiness,
  Building2,
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
  Warehouse,
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
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/compartido/componentes/ui/tabs"
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
import {
  ConfiguracionGeneralAlmacenesListarVista,
  ConfiguracionGeneralAreasListarVista,
  ConfiguracionGeneralCargosListarVista,
  ConfiguracionGeneralContratosListarVista,
  ConfiguracionGeneralCuentasListarVista,
  ConfiguracionGeneralListadoPorTipoVista,
  ConfiguracionGeneralSedesListarVista,
  ConfiguracionGeneralUbicacionesListarVista,
} from "../componentes/configuracion-general-listados"
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
  { value: "CUENTA", label: "Cuenta" },
  { value: "CONTRATO", label: "Contrato" },
]

const tiposConsumibles: TipoDatoMaestro[] = ["CARGO", "SEDE", "AREA", "CUENTA", "CONTRATO"]

type GrupoRegistro = "base" | "organizacion" | "comercial" | "cargos"

const modulosConfiguracion: Array<{
  dependencia: string
  grupo: GrupoRegistro
  icon: typeof Database
  orden: number
  tipo: TipoDatoMaestro
}> = [
  {
    orden: 1,
    tipo: "UBICACION",
    grupo: "base",
    icon: MapPin,
    dependencia: "Define el punto fisico o logistico.",
  },
  {
    orden: 2,
    tipo: "SEDE",
    grupo: "organizacion",
    icon: Building2,
    dependencia: "Requiere una ubicacion activa.",
  },
  {
    orden: 3,
    tipo: "AREA",
    grupo: "organizacion",
    icon: Network,
    dependencia: "Requiere sede; si es area, tambien gerencia.",
  },
  {
    orden: 4,
    tipo: "ALMACEN",
    grupo: "organizacion",
    icon: Warehouse,
    dependencia: "Requiere ubicacion; sede es opcional.",
  },
  {
    orden: 5,
    tipo: "CUENTA",
    grupo: "comercial",
    icon: BriefcaseBusiness,
    dependencia: "Independiente.",
  },
  {
    orden: 6,
    tipo: "CONTRATO",
    grupo: "comercial",
    icon: ClipboardList,
    dependencia: "Cuenta asociada opcional.",
  },
  {
    orden: 7,
    tipo: "CARGO",
    grupo: "cargos",
    icon: ShieldCheck,
    dependencia: "Independiente; cargo superior opcional.",
  },
]

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
  if (dato.tipoDatoMaestro === "SEDE") return dato.ubicacionId || "-"
  if (dato.tipoDatoMaestro === "AREA") return dato.sedeId || "-"
  if (dato.tipoDatoMaestro === "ALMACEN") return dato.ubicacionId || "-"
  if (dato.tipoDatoMaestro === "CUENTA") return `Nivel ${dato.nivelCuentaContrato ?? 1}`
  if (dato.tipoDatoMaestro === "CONTRATO") return `Nivel ${dato.nivelCuentaContrato ?? "-"}`
  return "-"
}

function etiquetaDetalleEspecifico(tipo: TipoDatoMaestro) {
  if (tipo === "UBICACION") return "Tipo / direccion"
  if (tipo === "SEDE") return "Ubicacion"
  if (tipo === "AREA") return "Sede"
  if (tipo === "ALMACEN") return "Ubicacion"
  if (tipo === "CUENTA") return "Nivel"
  if (tipo === "CONTRATO") return "Nivel"
  return "Dato especifico"
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
      {tipo}
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

function formatearCount(count?: number | null) {
  return typeof count === "number" ? String(count) : "-"
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
      detalle: "Ubicacion, Sede, Area, Almacen, Cargo, Cuenta y Contrato consultados.",
      icon: Database,
      contexto: "Catalogo",
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
      contexto: "Trazabilidad",
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
      etiqueta: "Maestros",
      valor: resumen?.totalMaestros ?? 0,
      detalle: "Total gobernado por Configuracion General.",
      icon: Database,
      contexto: "Gobierno",
    },
    {
      etiqueta: "Activos",
      valor: resumen?.activos ?? 0,
      detalle: "Registros habilitados para consumo interno.",
      icon: ShieldCheck,
      contexto: "Estado",
    },
    {
      etiqueta: "Consumibles",
      valor: resumen?.vigentesConsumibles ?? 0,
      detalle: "Activos y vigentes para otros bounded contexts.",
      icon: CheckCircle2,
      contexto: "Catalogo",
    },
    {
      etiqueta: "Retenidos",
      valor: (resumen?.inactivos ?? 0) + (resumen?.anulados ?? 0),
      detalle: `${resumen?.inactivos ?? 0} inactivos y ${resumen?.anulados ?? 0} anulados.`,
      icon: History,
      contexto: "Control",
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
  const datos = resumen?.porTipoDatoMaestro ?? []
  const totalBase = Math.max(...datos.map((item) => item.total), 1)
  const datosOrdenados = [...datos].sort((a, b) =>
    a.tipoDatoMaestro.localeCompare(b.tipoDatoMaestro),
  )

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold">Cobertura del catalogo</h2>
          <p className="text-sm text-muted-foreground">
            Lectura por tipo de maestro y disponibilidad para consumo.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/configuracion/listar">
            Ver listado
            <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
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
            <div key={item.tipoDatoMaestro} className="grid gap-2 rounded-md border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <TipoBadge tipo={item.tipoDatoMaestro} />
                  {tiposConsumibles.includes(item.tipoDatoMaestro) ? (
                    <Badge variant="secondary">Consumible</Badge>
                  ) : (
                    <Badge variant="outline">Base</Badge>
                  )}
                </div>
                <span className="text-sm font-medium tabular-nums">
                  {item.vigentesConsumibles}/{item.total}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.max((item.total / totalBase) * 100, 3)}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>Activos: {item.activos}</span>
                <span>Inactivos: {item.inactivos}</span>
                <span>Anulados: {item.anulados}</span>
              </div>
            </div>
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
        <CardTitle>Estado y consumo</CardTitle>
        <CardDescription>Disponibilidad del servicio y vigencia del catalogo.</CardDescription>
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
      titulo: "Catalogos consumibles",
      descripcion: "Listado activo de cargos, ubicaciones, sedes, areas, cuentas y contratos.",
      href: "/configuracion/listar",
      accion: "Ver catalogo",
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
      descripcion: "Registra el punto fisico o logistico que luego usaran sedes y almacenes.",
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
          Sigue esta secuencia para que los maestros aparezcan correctamente en las asignaciones.
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

function TabsListadoMaestros({
  tipoActivo,
  onTipoChange,
}: {
  onTipoChange: (tipo: "TODOS" | TipoDatoMaestro) => void
  tipoActivo: "TODOS" | TipoDatoMaestro
}) {
  return (
    <Tabs
      value={tipoActivo}
      onValueChange={(value) => onTipoChange(value as "TODOS" | TipoDatoMaestro)}
      className="gap-0"
    >
      <div className="border-b border-border px-4 py-3">
        <TabsList className="w-full justify-start overflow-x-auto" variant="line">
          <TabsTrigger value="TODOS">Todos</TabsTrigger>
          {modulosConfiguracion.map((modulo) => {
            const Icon = modulo.icon

            return (
              <TabsTrigger key={modulo.tipo} value={modulo.tipo}>
                <Icon data-icon="inline-start" />
                {etiquetaTipo(modulo.tipo)}
              </TabsTrigger>
            )
          })}
        </TabsList>
      </div>
    </Tabs>
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
            <TableHead>Dato especifico</TableHead>
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
                {formatearCount(dato.count)}
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
              <Button asChild variant="outline">
                <Link href="/configuracion/listar">
                  <Database data-icon="inline-start" />
                  Listar
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
                  <Dato label="Uso" value="Ubicaciones, sedes, areas, almacenes, cargos, cuentas y contratos" />
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
                  <Button asChild variant="outline">
                    <Link href="/configuracion/listar">
                      <Database data-icon="inline-start" />
                      Listar
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

export function ConfiguracionGeneralListadoVista() {
  const [tipoActivo, setTipoActivo] = useState<"TODOS" | TipoDatoMaestro>("UBICACION")

  function renderListado() {
    if (tipoActivo === "UBICACION") return <ConfiguracionGeneralUbicacionesListarVista />
    if (tipoActivo === "SEDE") return <ConfiguracionGeneralSedesListarVista />
    if (tipoActivo === "AREA") return <ConfiguracionGeneralAreasListarVista />
    if (tipoActivo === "ALMACEN") return <ConfiguracionGeneralAlmacenesListarVista />
    if (tipoActivo === "CUENTA") return <ConfiguracionGeneralCuentasListarVista />
    if (tipoActivo === "CONTRATO") return <ConfiguracionGeneralContratosListarVista />
    if (tipoActivo === "CARGO") return <ConfiguracionGeneralCargosListarVista />
    return <ConfiguracionGeneralListadoPorTipoVista tipo="TODOS" />
  }

  return (
    <>
      <SiteHeader
        title="Configuraciones"
        breadcrumbs={[
          { title: "CS-Configuracion General", href: "/configuracion" },
          { title: "Configuraciones" },
        ]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-normal">Listar configuracion general</h1>
            </div>
            <Button asChild className="w-full md:w-auto">
              <Link href="/configuracion/nuevo/ubicacion">
                <Plus data-icon="inline-start" />
                Nuevo
              </Link>
            </Button>
          </section>

          <section>
            <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
              <div className="border-b border-border px-4 py-3">
                <h2 className="text-base font-semibold">Maestros</h2>
                <p className="text-sm text-muted-foreground">
                  Selecciona un maestro para consultar, buscar y exportar sus registros.
                </p>
              </div>
              <TabsListadoMaestros
                tipoActivo={tipoActivo}
                onTipoChange={setTipoActivo}
              />
            </section>
          </section>
          {renderListado()}
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
                    Vista consolidada de ubicaciones, sedes, areas, almacenes, cargos, cuentas y contratos.
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


