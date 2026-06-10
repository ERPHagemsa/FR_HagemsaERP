"use client"

import { useMemo } from "react"
import Link from "next/link"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/compartido/componentes/ui/chart"
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

import { SocioNegocioPageHeader } from "../componentes/socio-negocio-page-header"
import { useResumenSociosDeNegocioQuery } from "../servicios/socio-negocios-queries"
import { condicionesLaborales } from "../tipos/socio-negocio"
import type {
  CondicionLaboral,
  EstadoRegistro,
  EstadoSocioDeNegocio,
  ResumenSociosDeNegocioResponse,
  SocioDeNegocioResponse,
} from "../tipos/socio-negocio"

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

const tiposSocio = ["CLIENTE", "PROVEEDOR", "PERSONAL"] as const

function obtenerMensajeError(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo cargar el resumen."
}

function formatearFecha(fecha?: string) {
  if (!fecha) return "-"
  const valor = new Date(fecha)
  if (Number.isNaN(valor.getTime())) return fecha
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" }).format(valor)
}

function etiquetaCondicionLaboral(condicion?: CondicionLaboral | null) {
  return (
    condicionesLaborales.find((item) => item.valor === condicion)?.etiqueta ??
    condicion ??
    "-"
  )
}

function totalPorEstado(
  items: ResumenSociosDeNegocioResponse["porEstado"],
  estado: EstadoSocioDeNegocio,
) {
  return items.find((item) => item.estado === estado)?.total ?? 0
}

function totalPorEstadoRegistro(
  items: ResumenSociosDeNegocioResponse["porEstadoRegistro"],
  estadoRegistro: EstadoRegistro,
) {
  return items.find((item) => item.estadoRegistro === estadoRegistro)?.total ?? 0
}

function completarPorTipo(items: ResumenSociosDeNegocioResponse["porTipo"]) {
  return tiposSocio.map((tipo) => ({
    tipo,
    total: items.find((item) => item.tipo === tipo)?.total ?? 0,
    fill: `var(--color-${tipo})`,
  }))
}

function completarPorEstado(items: ResumenSociosDeNegocioResponse["porEstado"]) {
  return [
    {
      estado: "ACTIVOS",
      total: totalPorEstado(items, "ACTIVO"),
      fill: "var(--color-activos)",
    },
    {
      estado: "INACTIVOS",
      total: totalPorEstado(items, "INACTIVO"),
      fill: "var(--color-inactivos)",
    },
  ]
}

function completarMatrizTipoEstado(
  items: ResumenSociosDeNegocioResponse["porTipoYEstado"],
) {
  return tiposSocio.map((tipo) => {
    const activos = items.find(
      (item) =>
        item.tipo === tipo &&
        item.estado === "ACTIVO" &&
        item.estadoRegistro === "ACTIVO",
    )?.total ?? 0
    const inactivos = items.find(
      (item) =>
        item.tipo === tipo &&
        item.estado === "INACTIVO" &&
        item.estadoRegistro === "ACTIVO",
    )?.total ?? 0
    const anulados = items
      .filter((item) => item.tipo === tipo && item.estadoRegistro === "ANULADO")
      .reduce((acc, item) => acc + item.total, 0)

    return {
      tipo,
      activos,
      inactivos,
      anulados,
      total: activos + inactivos + anulados,
    }
  })
}

function MetricCard({
  detail,
  icon,
  label,
  loading,
  value,
}: {
  detail: string
  icon: Parameters<typeof HugeiconsIcon>[0]["icon"]
  label: string
  loading?: boolean
  value: number
}) {
  return (
    <Card className="border-border/60 bg-muted/25 shadow-none">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
        <div className="min-w-0">
          <CardDescription className="text-xs font-medium uppercase tracking-[0.08em]">
            {label}
          </CardDescription>
          <CardTitle className="mt-2 text-3xl font-semibold tabular-nums">
            {loading ? "-" : value}
          </CardTitle>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-background text-primary ring-1 ring-border/60">
          <HugeiconsIcon icon={icon} strokeWidth={2} />
        </span>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}

function ActionCard({
  description,
  href,
  label,
  title,
}: {
  description: string
  href: string
  label: string
  title: string
}) {
  return (
    <Card className="border-border/60 shadow-none">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button asChild variant="outline" size="sm" className="w-full justify-between">
          <Link href={href}>
            {label}
            <HugeiconsIcon data-icon="inline-end" icon={ArrowRight01Icon} strokeWidth={2} />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

function TablaRecientes({
  cargando,
  socios,
}: {
  cargando?: boolean
  socios: SocioDeNegocioResponse[]
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

  if (socios.length === 0) {
    return (
      <div className="px-4 py-10 text-center text-sm text-muted-foreground">
        No hay registros recientes.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/70 hover:bg-muted/70">
            <TableHead>Socio</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Condicion laboral</TableHead>
            <TableHead>Documento</TableHead>
            <TableHead>Referencia</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Creacion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {socios.map((socio) => (
            <TableRow key={socio.id}>
              <TableCell>
                <div className="flex min-w-56 flex-col">
                  <span className="font-medium">{socio.razonSocial}</span>
                  <span className="text-xs text-muted-foreground">
                    {socio.codigoInternoSap || socio.nombreComercial || "-"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{socio.tipo}</Badge>
              </TableCell>
              <TableCell>
                {socio.tipo === "PERSONAL"
                  ? etiquetaCondicionLaboral(socio.condicionLaboral)
                  : "-"}
              </TableCell>
              <TableCell>{socio.numeroDocumento}</TableCell>
              <TableCell>
                <div className="flex min-w-44 flex-col">
                  <span>{socio.cuentaNombre || socio.cuenta || "-"}</span>
                  <span className="text-xs text-muted-foreground">
                    {socio.areaNombre || socio.area || socio.sedeNombre || socio.sede || "Sin area"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={socio.estado === "ACTIVO" ? "outline" : "secondary"}>
                  {socio.estado}
                </Badge>
              </TableCell>
              <TableCell>{formatearFecha(socio.fechaCreacion)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
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
  const matrizTipoEstado = useMemo(
    () => completarMatrizTipoEstado(resumen?.porTipoYEstado ?? []),
    [resumen],
  )
  const vigentes = totalPorEstadoRegistro(resumen?.porEstadoRegistro ?? [], "ACTIVO")

  return (
    <>
      <SiteHeader
        title="Socio de Negocios"
        breadcrumbs={[{ title: "Socio de Negocio" }]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          <SocioNegocioPageHeader
            title="Socio de negocio"
            actions={
              <>
                <Button asChild variant="outline">
                  <Link href="/socio-negocios/listar">
                    <HugeiconsIcon data-icon="inline-start" icon={UserGroupIcon} strokeWidth={2} />
                    Listar
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/socio-negocios/nuevo?tipo=CLIENTE">
                    <HugeiconsIcon data-icon="inline-start" icon={Add01Icon} strokeWidth={2} />
                    Nuevo
                  </Link>
                </Button>
              </>
            }
          />

          {resumenQuery.error ? (
            <Alert variant="destructive">
              <AlertTitle>Error de API</AlertTitle>
              <AlertDescription>
                {obtenerMensajeError(resumenQuery.error)}
              </AlertDescription>
            </Alert>
          ) : null}

          <section className="grid gap-3 md:grid-cols-4">
            <MetricCard
              label="Total socios"
              value={resumen?.totalSocios ?? 0}
              detail="Clientes, proveedores y personal registrados."
              icon={UserGroupIcon}
              loading={resumenQuery.isLoading}
            />
            <MetricCard
              label="Operativos"
              value={resumen?.operativosActivos ?? 0}
              detail="Activos y vigentes para usar en operaciones."
              icon={CheckmarkCircle01Icon}
              loading={resumenQuery.isLoading}
            />
            <MetricCard
              label="Reactivables"
              value={resumen?.inactivosReactivables ?? 0}
              detail="Inactivos con registro vigente para reactivar."
              icon={ChartUpIcon}
              loading={resumenQuery.isLoading}
            />
            <MetricCard
              label="Anulados"
              value={resumen?.anulados ?? 0}
              detail="Retirados del maestro operativo por control."
              icon={Loading03Icon}
              loading={resumenQuery.isLoading}
            />
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <section className="flex flex-col gap-5">
              <section className="grid gap-3 md:grid-cols-3">
                <ActionCard
                  title="Clientes"
                  description="Registra y consulta clientes para operaciones comerciales."
                  href="/socio-negocios/nuevo?tipo=CLIENTE"
                  label="Nuevo cliente"
                />
                <ActionCard
                  title="Proveedores"
                  description="Gestiona terceros que abastecen servicios o recursos."
                  href="/socio-negocios/nuevo?tipo=PROVEEDOR"
                  label="Nuevo proveedor"
                />
                <ActionCard
                  title="Personal"
                  description="Usa cargo, sede, area y contrato desde el catalogo."
                  href="/socio-negocios/nuevo?tipo=PERSONAL"
                  label="Nuevo personal"
                />
              </section>

              <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                <Card className="border-border/60 shadow-none">
                  <CardHeader>
                    <CardTitle>Distribucion por tipo</CardTitle>
                    <CardDescription>Composicion actual del maestro.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={chartConfig}
                      className="aspect-auto h-[240px] w-full"
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
                          innerRadius={52}
                          outerRadius={82}
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
                        <div key={item.tipo} className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">{item.tipo}</span>
                          <span className="font-medium tabular-nums">{item.total}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60 shadow-none">
                  <CardHeader>
                    <CardTitle>Control por estado</CardTitle>
                    <CardDescription>Activos, inactivos y anulados por tipo.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/70 hover:bg-muted/70">
                          <TableHead>Tipo</TableHead>
                          <TableHead className="text-right">Activos</TableHead>
                          <TableHead className="text-right">Inactivos</TableHead>
                          <TableHead className="text-right">Anulados</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {matrizTipoEstado.map((item) => (
                          <TableRow key={item.tipo}>
                            <TableCell>
                              <Badge variant="outline">{item.tipo}</Badge>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{item.activos}</TableCell>
                            <TableCell className="text-right tabular-nums">{item.inactivos}</TableCell>
                            <TableCell className="text-right tabular-nums">{item.anulados}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </section>

              <section className="overflow-hidden rounded-xl border border-border/70 bg-card text-card-foreground">
                <div className="flex flex-col gap-3 border-b border-border px-4 py-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-base font-semibold">Ultimos socios agregados</h2>
                    <p className="text-sm text-muted-foreground">
                      Lectura rapida de los registros recientes del maestro.
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/socio-negocios/listar">
                      Ver listado
                      <HugeiconsIcon data-icon="inline-end" icon={ArrowRight01Icon} strokeWidth={2} />
                    </Link>
                  </Button>
                </div>
                <TablaRecientes
                  socios={registrosRecientes}
                  cargando={resumenQuery.isLoading}
                />
              </section>
            </section>

            <aside className="flex flex-col gap-4">
              <Card className="border-border/60 shadow-none">
                <CardHeader>
                  <CardTitle>Accesos rapidos</CardTitle>
                  <CardDescription>Operaciones frecuentes.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <Button asChild>
                    <Link href="/socio-negocios/nuevo?tipo=CLIENTE">
                      <HugeiconsIcon data-icon="inline-start" icon={Add01Icon} strokeWidth={2} />
                      Nuevo
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/socio-negocios/listar">
                      <HugeiconsIcon data-icon="inline-start" icon={UserGroupIcon} strokeWidth={2} />
                      Listar
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/socio-negocios/listar">
                      <HugeiconsIcon data-icon="inline-start" icon={FileExportIcon} strokeWidth={2} />
                      Descargar reportes
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/socio-negocios/historial">
                      <HugeiconsIcon data-icon="inline-start" icon={ChartUpIcon} strokeWidth={2} />
                      Historial
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-none">
                <CardHeader>
                  <CardTitle>Estado operativo</CardTitle>
                  <CardDescription>Relacion entre activos e inactivos.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[180px] w-full"
                  >
                    <BarChart data={dataPorEstado} layout="vertical">
                      <CartesianGrid horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="estado" hide />
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
                  <Separator className="my-4" />
                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Registros vigentes</span>
                      <span className="font-medium tabular-nums">{vigentes}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Operativos activos</span>
                      <span className="font-medium tabular-nums">
                        {resumen?.operativosActivos ?? 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-none">
                <CardHeader>
                  <CardTitle>Bajas recientes</CardTitle>
                  <CardDescription>Registros enviados a inactivo.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {bajasRecientes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay bajas recientes.</p>
                  ) : (
                    bajasRecientes.slice(0, 4).map((socio) => (
                      <div key={socio.id} className="rounded-md border border-border p-3">
                        <p className="truncate text-sm font-medium">{socio.razonSocial}</p>
                        {socio.tipo === "PERSONAL" ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Condicion laboral: {etiquetaCondicionLaboral(socio.condicionLaboral)}
                          </p>
                        ) : null}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatearFecha(socio.fechaBaja)} - {socio.motivoBaja || "Sin motivo"}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </aside>
          </section>
        </div>
      </main>
    </>
  )
}
