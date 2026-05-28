"use client"

import { useMemo } from "react"
import Link from "next/link"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"

import { SiteHeader } from "@/compartido/componentes/site-header"
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert"
import { Badge } from "@/compartido/componentes/ui/badge"
import { Button } from "@/compartido/componentes/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/compartido/componentes/ui/chart"
import { Skeleton } from "@/compartido/componentes/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  ArrowRight01Icon,
  ChartUpIcon,
  CheckmarkCircle01Icon,
  FileExportIcon,
  Loading03Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"

import { useResumenSociosDeNegocioQuery } from "../servicios/socio-negocios-queries"
import type {
  EstadoSocioDeNegocio,
  ResumenSociosDeNegocioResponse,
  SocioDeNegocioResponse,
  TipoSocioDeNegocio,
} from "../tipos/socio-negocio"

const DIAS_ALTAS_RECIENTES = 8

const chartConfig = {
  total: {
    label: "Total",
    color: "var(--primary)",
  },
  activos: {
    label: "Activos",
    color: "var(--primary)",
  },
  inactivos: {
    label: "Inactivos",
    color: "var(--muted-foreground)",
  },
  CLIENTE: {
    label: "Clientes",
    color: "var(--primary)",
  },
  PROVEEDOR: {
    label: "Proveedores",
    color: "var(--chart-2)",
  },
  PERSONAL: {
    label: "Personal",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

function obtenerMensajeError(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo cargar el resumen."
}

function formatearFecha(fecha?: string) {
  if (!fecha) return "-"
  const valor = new Date(fecha)
  if (Number.isNaN(valor.getTime())) return fecha
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" }).format(valor)
}

function completarPorTipo(items: ResumenSociosDeNegocioResponse["porTipo"]) {
  return (["CLIENTE", "PROVEEDOR", "PERSONAL"] as TipoSocioDeNegocio[]).map((tipo) => ({
    tipo,
    total: items.find((item) => item.tipo === tipo)?.total ?? 0,
    fill: `var(--color-${tipo})`,
  }))
}

function completarPorEstado(items: ResumenSociosDeNegocioResponse["porEstado"]) {
  return [
    {
      estado: "ACTIVOS",
      total: obtenerTotalEstado(items, "ACTIVO"),
      fill: "var(--color-activos)",
    },
    {
      estado: "INACTIVOS",
      total: obtenerTotalEstado(items, "INACTIVO"),
      fill: "var(--color-inactivos)",
    },
  ]
}

function obtenerTotalEstado(
  items: ResumenSociosDeNegocioResponse["porEstado"],
  estado: EstadoSocioDeNegocio,
) {
  return items.find((item) => item.estado === estado)?.total ?? 0
}

function crearFechaLocal(fecha: string) {
  const [year, month, day] = fecha.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function formatearFechaIsoLocal(fecha: Date) {
  const year = fecha.getFullYear()
  const month = String(fecha.getMonth() + 1).padStart(2, "0")
  const day = String(fecha.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function agruparPorFecha(socios: SocioDeNegocioResponse[]) {
  const conteo = socios.reduce<Record<string, number>>((acc, socio) => {
    const fecha = socio.fechaCreacion?.slice(0, 10)
    if (!fecha) return acc
    acc[fecha] = (acc[fecha] ?? 0) + 1
    return acc
  }, {})

  const fechas = Object.keys(conteo).sort((a, b) => a.localeCompare(b))
  const fechaFinal = fechas.length > 0 ? crearFechaLocal(fechas[fechas.length - 1]) : new Date()
  const fechaInicial = new Date(fechaFinal)
  fechaInicial.setDate(fechaInicial.getDate() - (DIAS_ALTAS_RECIENTES - 1))

  return Array.from({ length: DIAS_ALTAS_RECIENTES }, (_, index) => {
    const fecha = new Date(fechaInicial)
    fecha.setDate(fechaInicial.getDate() + index)
    const fechaIso = formatearFechaIsoLocal(fecha)

    return {
      fecha: fechaIso,
      total: conteo[fechaIso] ?? 0,
    }
  })
}

export function SocioNegocioDashboardVista() {
  const resumenQuery = useResumenSociosDeNegocioQuery()
  const resumen = resumenQuery.data
  const registrosRecientes = useMemo(
    () => resumen?.registrosRecientes ?? [],
    [resumen],
  )
  const bajasRecientes = useMemo(() => resumen?.bajasRecientes ?? [], [resumen])
  const dataPorTipo = useMemo(
    () => completarPorTipo(resumen?.porTipo ?? []),
    [resumen],
  )
  const dataPorEstado = useMemo(
    () => completarPorEstado(resumen?.porEstado ?? []),
    [resumen],
  )
  const dataPorFecha = useMemo(
    () => agruparPorFecha(registrosRecientes),
    [registrosRecientes],
  )

  return (
    <>
      <SiteHeader
        title="Socio de Negocios"
        breadcrumbs={[{ title: "Socio de Negocio" }]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          {resumenQuery.error ? (
            <Alert variant="destructive">
              <AlertTitle>Error de API</AlertTitle>
              <AlertDescription>
                {obtenerMensajeError(resumenQuery.error)}
              </AlertDescription>
            </Alert>
          ) : null}

          <section className="grid gap-3 md:grid-cols-4">
            {[
              {
                label: "Total socios",
                value: resumen?.totalSocios ?? 0,
                detail: "Registros disponibles en el maestro.",
                icon: UserGroupIcon,
              },
              {
                label: "Operativos activos",
                value: resumen?.operativosActivos ?? 0,
                detail: "Activos y disponibles para operar.",
                icon: CheckmarkCircle01Icon,
              },
              {
                label: "Reactivables",
                value: resumen?.inactivosReactivables ?? 0,
                detail: "Inactivos con registro activo.",
                icon: ChartUpIcon,
              },
              {
                label: "Anulados",
                value: resumen?.anulados ?? 0,
                detail: "Registros anulados por control.",
                icon: Loading03Icon,
              },
            ].map((item) => (
              <Card key={item.label} className="border-border shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
                  <div>
                    <CardDescription className="text-xs font-medium uppercase tracking-[0.08em]">
                      {item.label}
                    </CardDescription>
                    <CardTitle className="mt-2 text-3xl font-semibold tabular-nums">
                      {resumenQuery.isLoading ? "-" : item.value}
                    </CardTitle>
                  </div>
                  <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                  </span>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.detail}</p>
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle>Altas recientes</CardTitle>
                <CardDescription>
                  Evolucion de registros segun fecha de creacion.
                </CardDescription>
                <CardAction>
                  <Badge variant="outline">Ultimos {DIAS_ALTAS_RECIENTES} dias</Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="aspect-auto h-[260px] w-full"
                >
                  <AreaChart data={dataPorFecha}>
                    <defs>
                      <linearGradient id="fillSocios" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="var(--color-total)"
                          stopOpacity={0.85}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-total)"
                          stopOpacity={0.08}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="fecha"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      minTickGap={24}
                      tickFormatter={(value) => value.slice(5)}
                    />
                    <YAxis hide allowDecimals={false} domain={[0, "dataMax + 1"]} />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Area
                      dataKey="total"
                      type="natural"
                      fill="url(#fillSocios)"
                      stroke="var(--color-total)"
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle>Distribucion</CardTitle>
                <CardDescription>Tipo de socio de negocio consultado.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="aspect-auto h-[260px] w-full"
                >
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie
                      data={dataPorTipo}
                      dataKey="total"
                      nameKey="tipo"
                      innerRadius={56}
                      outerRadius={86}
                      paddingAngle={4}
                    >
                      {dataPorTipo.map((entry) => (
                        <Cell key={entry.tipo} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="grid gap-2 text-sm">
                  {dataPorTipo.map((item) => (
                    <div
                      key={item.tipo}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="text-muted-foreground">{item.tipo}</span>
                      <span className="font-medium tabular-nums">{item.total}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-5 xl:grid-cols-[1fr_340px]">
            <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
              <div className="flex flex-col gap-3 border-b border-border px-4 py-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-base font-semibold">Ultimos socios agregados</h2>
                  <p className="text-sm text-muted-foreground">
                    Registros recientes del maestro de socios de negocio.
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/socio-negocios/listar">
                    Ver listado
                    <HugeiconsIcon
                      data-icon="inline-end"
                      icon={ArrowRight01Icon}
                      strokeWidth={2}
                    />
                  </Link>
                </Button>
              </div>
              {resumenQuery.isLoading ? (
                <div className="flex flex-col gap-3 p-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/70 hover:bg-muted/70">
                        <TableHead>Socio</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Documento</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Creacion</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {registrosRecientes.map((socio) => (
                        <TableRow key={socio.id}>
                          <TableCell>
                            <div className="flex min-w-52 flex-col">
                              <span className="font-medium">{socio.razonSocial}</span>
                              <span className="text-xs text-muted-foreground">
                                {socio.nombreComercial || socio.codigoInternoSap}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{socio.tipo}</Badge>
                          </TableCell>
                          <TableCell>{socio.numeroDocumento}</TableCell>
                          <TableCell>
                            <Badge
                              variant={socio.estado === "ACTIVO" ? "outline" : "secondary"}
                            >
                              {socio.estado}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatearFecha(socio.fechaCreacion)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>

            <aside className="flex flex-col gap-3">
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Bajas recientes</CardTitle>
                  <CardDescription>
                    Socios inactivos enviados por el resumen del BC.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {bajasRecientes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay bajas recientes.</p>
                  ) : (
                    bajasRecientes.slice(0, 4).map((socio) => (
                      <div
                        key={socio.id}
                        className="rounded-md border border-border bg-background p-3"
                      >
                        <p className="truncate text-sm font-medium">{socio.razonSocial}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatearFecha(socio.fechaBaja)} · {socio.motivoBaja || "Sin motivo"}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Estado operativo</CardTitle>
                  <CardDescription>
                    Lectura rapida de socios activos e inactivos.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[180px] w-full"
                  >
                    <BarChart data={dataPorEstado} layout="vertical">
                      <CartesianGrid horizontal={false} />
                      <XAxis type="number" hide />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="line" />}
                      />
                      <Bar dataKey="total" radius={6}>
                        {dataPorEstado.map((entry) => (
                          <Cell key={entry.estado} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Accesos rapidos</CardTitle>
                  <CardDescription>
                    Operaciones frecuentes del modulo.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <Button asChild>
                    <Link href="/socio-negocios/nuevo">
                      <HugeiconsIcon
                        data-icon="inline-start"
                        icon={Add01Icon}
                        strokeWidth={2}
                      />
                      Registrar socio
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/socio-negocios/reportes">
                      <HugeiconsIcon
                        data-icon="inline-start"
                        icon={FileExportIcon}
                        strokeWidth={2}
                      />
                      Ver reportes
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/socio-negocios/historial">
                      <HugeiconsIcon
                        data-icon="inline-start"
                        icon={ChartUpIcon}
                        strokeWidth={2}
                      />
                      Historial
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/socio-negocios/listar">
                      <HugeiconsIcon
                        data-icon="inline-start"
                        icon={UserGroupIcon}
                        strokeWidth={2}
                      />
                      Listar socios
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
