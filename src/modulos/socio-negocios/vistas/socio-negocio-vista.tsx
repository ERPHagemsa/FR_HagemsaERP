"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { SiteHeader } from "@/compartido/componentes/site-header"
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert"
import { Badge } from "@/compartido/componentes/ui/badge"
import { Button } from "@/compartido/componentes/ui/button"
import { Checkbox } from "@/compartido/componentes/ui/checkbox"
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
  DropdownMenuTrigger,
} from "@/compartido/componentes/ui/dropdown-menu"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/compartido/componentes/ui/empty"
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
  ChartUpIcon,
  CheckmarkCircle01Icon,
  Download01Icon,
  Loading03Icon,
  MoreVerticalCircle01Icon,
  Search01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"

import {
  useExportarSociosDeNegocioQuery,
  useSociosDeNegocioQuery,
} from "../servicios/socio-negocios-queries"
import type {
  ConsultarSociosDeNegocioQuery,
  FormatoExportacionSocios,
} from "../tipos/socio-negocio"

type Metrica = {
  etiqueta: string
  valor: string
  detalle: string
}

type SocioNegocioVistaProps = {
  titulo: string
  etiqueta: string
  accionPrincipal?: string
  crearHref?: string
  metricas: Metrica[]
  filtros?: ConsultarSociosDeNegocioQuery
  formatoExportacion?: FormatoExportacionSocios
}

const estadoVariant = {
  ACTIVO: "default",
  INACTIVO: "secondary",
} as const

function obtenerVisualMetrica(etiqueta: string, index: number) {
  const texto = etiqueta.toLowerCase()

  if (index === 0) {
    return {
      icon: UserGroupIcon,
      iconClassName: "bg-primary-foreground/15 text-primary-foreground ring-primary-foreground/20",
      cardClassName: "border-primary bg-primary text-primary-foreground",
      descriptionClassName: "text-primary-foreground/75",
      detailClassName: "text-primary-foreground/80",
      badgeClassName:
        "border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground",
      badge: "Total",
    }
  }

  if (texto.includes("activo")) {
    return {
      icon: CheckmarkCircle01Icon,
      iconClassName: "bg-primary/10 text-primary ring-primary/15",
      cardClassName: "border-border bg-card text-card-foreground",
      descriptionClassName: "text-muted-foreground",
      detailClassName: "text-muted-foreground",
      badgeClassName: "border-primary/20 bg-primary/5 text-primary",
      badge: "Operativo",
    }
  }

  if (
    texto.includes("inactivo") ||
    texto.includes("observ") ||
    texto.includes("baja") ||
    texto.includes("pendiente")
  ) {
    return {
      icon: Loading03Icon,
      iconClassName: "bg-muted text-foreground ring-border",
      cardClassName: "border-border bg-card text-card-foreground",
      descriptionClassName: "text-muted-foreground",
      detailClassName: "text-muted-foreground",
      badgeClassName: "border-border bg-muted text-foreground",
      badge: "Seguimiento",
    }
  }

  if (texto.includes("export") || texto.includes("formato")) {
    return {
      icon: Download01Icon,
      iconClassName: "bg-primary/10 text-primary ring-primary/15",
      cardClassName: "border-border bg-card text-card-foreground",
      descriptionClassName: "text-muted-foreground",
      detailClassName: "text-muted-foreground",
      badgeClassName: "border-primary/20 bg-primary/5 text-primary",
      badge: "Reporte",
    }
  }

  return {
    icon: ChartUpIcon,
    iconClassName: "bg-accent text-accent-foreground ring-border",
    cardClassName: "border-border bg-card text-card-foreground",
    descriptionClassName: "text-muted-foreground",
    detailClassName: "text-muted-foreground",
    badgeClassName: "border-border bg-accent text-accent-foreground",
    badge: "Control",
  }
}

function obtenerMensajeError(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo completar la operacion."
}

export function SocioNegocioVista({
  titulo,
  etiqueta,
  accionPrincipal = "Nuevo registro",
  crearHref,
  metricas,
  filtros,
  formatoExportacion = "EXCEL",
}: SocioNegocioVistaProps) {
  const [hydrated, setHydrated] = useState(false)
  const [reporteGenerado, setReporteGenerado] = useState<string | null>(null)
  const sociosQuery = useSociosDeNegocioQuery(filtros)
  const exportacionQuery = useExportarSociosDeNegocioQuery(
    {
      ...filtros,
      formato: formatoExportacion,
    },
    false
  )
  const socios = sociosQuery.data ?? []
  const cargando = sociosQuery.isLoading
  const error = sociosQuery.error ? obtenerMensajeError(sociosQuery.error) : null

  useEffect(() => {
    setHydrated(true)
  }, [])

  const metricasVista = useMemo(() => {
    const activos = socios.filter((socio) => socio.estado === "ACTIVO").length
    const inactivos = socios.filter((socio) => socio.estado === "INACTIVO").length

    if (!sociosQuery.data) {
      return metricas
    }

    return [
      {
        etiqueta: "Registros consultados",
        valor: String(socios.length),
        detalle: "Resultado recibido desde /socios-de-negocio.",
      },
      {
        etiqueta: "Activos",
        valor: String(activos),
        detalle: "Socios en estado ACTIVO para el filtro aplicado.",
      },
      {
        etiqueta: "Inactivos",
        valor: String(inactivos),
        detalle: "Socios en estado INACTIVO para el filtro aplicado.",
      },
    ]
  }, [metricas, socios, sociosQuery.data])

  async function exportar() {
    setReporteGenerado(null)
    const resultado = await exportacionQuery.refetch()

    if (resultado.data) {
      setReporteGenerado(
        `${resultado.data.nombreArchivo} generado en formato ${resultado.data.formato}.`
      )
    }
  }

  if (!hydrated) {
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
            <Skeleton className="h-28 w-full" />
            <section className="grid gap-4 md:grid-cols-3">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </section>
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
      </>
    )
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

          <section className="grid gap-4 md:grid-cols-3">
            {metricasVista.map((metrica, index) => {
              const visual = obtenerVisualMetrica(metrica.etiqueta, index)

              return (
              <Card key={metrica.etiqueta} className={visual.cardClassName}>
                <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
                  <div className="flex flex-col gap-1">
                    <CardDescription className={visual.descriptionClassName}>
                      {metrica.etiqueta}
                    </CardDescription>
                    <CardTitle className="text-3xl">{metrica.valor}</CardTitle>
                  </div>
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-lg ring-1 ${visual.iconClassName}`}
                  >
                    <HugeiconsIcon icon={visual.icon} strokeWidth={2} />
                  </span>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-3">
                  <p className={`text-sm leading-5 ${visual.detailClassName}`}>
                    {metrica.detalle}
                  </p>
                  <Badge
                    variant="outline"
                    className={`shrink-0 ${visual.badgeClassName}`}
                  >
                    {visual.badge}
                  </Badge>
                </CardContent>
              </Card>
            )})}
          </section>

          <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground">
            <div className="flex flex-col gap-3 border-b border-border px-4 py-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-base font-semibold">Socios de negocio</h2>
                <p className="text-sm text-muted-foreground">{etiqueta}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={sociosQuery.isFetching}
                  onClick={() => void sociosQuery.refetch()}
                >
                  <HugeiconsIcon
                    data-icon="inline-start"
                    icon={Search01Icon}
                    strokeWidth={2}
                  />
                  {sociosQuery.isFetching ? "Consultando..." : "Consultar"}
                </Button>
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
                    disabled={exportacionQuery.isFetching}
                    onClick={() => void exportar()}
                  >
                    <HugeiconsIcon
                      data-icon="inline-start"
                      icon={Download01Icon}
                      strokeWidth={2}
                    />
                    {exportacionQuery.isFetching ? "Exportando..." : "Exportar"}
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
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-10">
                      <Checkbox aria-label="Seleccionar todos" />
                    </TableHead>
                    <TableHead>Codigo SAP</TableHead>
                    <TableHead>Socio</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Celular</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {socios.map((socio) => (
                    <TableRow key={socio.id}>
                      <TableCell>
                        <Checkbox aria-label={`Seleccionar ${socio.razonSocial}`} />
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {socio.codigoInternoSap}
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-48 flex-col">
                          <span className="font-medium">{socio.razonSocial}</span>
                          <span className="text-xs text-muted-foreground">
                            {socio.nombreComercial || "Sin nombre comercial"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{socio.tipo}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={estadoVariant[socio.estado]}>
                          {socio.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>{socio.numeroDocumento}</TableCell>
                      <TableCell>
                        <div className="flex min-w-44 flex-col">
                          <span>{socio.contacto || "Sin contacto"}</span>
                          <span className="text-xs text-muted-foreground">
                            {socio.correo || "Sin correo"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{socio.numeroCelular || "-"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Acciones">
                              <HugeiconsIcon
                                icon={MoreVerticalCircle01Icon}
                                strokeWidth={2}
                              />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuGroup>
                              <DropdownMenuItem>Ver ficha</DropdownMenuItem>
                              <DropdownMenuItem>Modificar</DropdownMenuItem>
                              <DropdownMenuItem>Dar de baja</DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>
        </div>
      </main>
    </>
  )
}
