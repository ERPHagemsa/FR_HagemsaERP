"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Download, Plus, Search } from "lucide-react"

import { SiteHeader } from "@/compartido/componentes/site-header"
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/compartido/componentes/ui/alert-dialog"
import { Badge } from "@/compartido/componentes/ui/badge"
import { Button } from "@/compartido/componentes/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/compartido/componentes/ui/empty"
import { Field } from "@/compartido/componentes/ui/field"
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
import { cn } from "@/compartido/utilidades/utils"

import { PaginationControls } from "../componentes/pagination-controls"
import { SocioNegocioPageHeader } from "../componentes/socio-negocio-page-header"
import { EstadoSincronizacionSapBadge } from "../componentes/estado-sincronizacion-sap-badge"
import {
  AccionesSocio,
  EstadoAprobacionBadge,
  EstadoRegistroBadge,
  EstadoSocioBadge,
  type ErrorOperacion,
  descargarReporte,
  formatearFecha,
  limpiarFiltros,
  obtenerClaseContenidoSocio,
  obtenerClaseFilaSocio,
  obtenerMensajeError,
  obtenerValorFiltro,
} from "../componentes/socio-listado-comun"
import {
  useClientesSociosDeNegocioQuery,
  useExportarSociosDeNegocioQuery,
} from "../servicios/socio-negocios-queries"
import type {
  ConsultarSociosDeNegocioQuery,
  ReporteSociosDeNegocioResponse,
} from "../tipos/socio-negocio"

export function ClientesListadoVista() {
  const [reporteGenerado, setReporteGenerado] = useState<string | null>(null)
  const [mensajeOperacion, setMensajeOperacion] = useState<string | null>(null)
  const [errorOperacion, setErrorOperacion] = useState<ErrorOperacion | null>(null)
  const [paginaActual, setPaginaActual] = useState(1)
  const [registrosPorPagina, setRegistrosPorPagina] = useState(20)

  const filtrosBase: ConsultarSociosDeNegocioQuery = useMemo(
    () => ({ estado: "ACTIVO", estadoRegistro: "ACTIVO", sortBy: "fechaCreacion", sortOrder: "desc" }),
    [],
  )
  const [filtrosFormulario, setFiltrosFormulario] =
    useState<ConsultarSociosDeNegocioQuery>(() => limpiarFiltros({ ...filtrosBase }))
  const [filtrosAplicados, setFiltrosAplicados] =
    useState<ConsultarSociosDeNegocioQuery>(() => filtrosFormulario)

  const filtrosConPaginacion = useMemo(
    () => ({ ...filtrosAplicados, page: paginaActual, pageSize: registrosPorPagina }),
    [filtrosAplicados, paginaActual, registrosPorPagina],
  )

  const clientesQuery = useClientesSociosDeNegocioQuery(filtrosConPaginacion)
  const exportacionExcelQuery = useExportarSociosDeNegocioQuery(
    { ...filtrosAplicados, tipo: "CLIENTE", formato: "EXCEL" },
    false,
  )
  const exportacionPdfQuery = useExportarSociosDeNegocioQuery(
    { ...filtrosAplicados, tipo: "CLIENTE", formato: "PDF" },
    false,
  )

  const clientes = useMemo(
    () => (Array.isArray(clientesQuery.data?.datos) ? clientesQuery.data.datos : []),
    [clientesQuery.data],
  )
  const metaPaginacion = clientesQuery.data?.paginacion
  const cargando = clientesQuery.isLoading
  const error = clientesQuery.error ? obtenerMensajeError(clientesQuery.error) : null

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
      return limpiarFiltros(siguiente)
    })
  }

  function aplicarFiltros() {
    setPaginaActual(1)
    setFiltrosAplicados(limpiarFiltros({ ...filtrosFormulario }))
  }

  function limpiarBusqueda() {
    const base = limpiarFiltros({ ...filtrosBase })
    setPaginaActual(1)
    setFiltrosFormulario(base)
    setFiltrosAplicados(base)
  }

  async function exportar(formato: ReporteSociosDeNegocioResponse["formato"]) {
    setReporteGenerado(null)
    const resultado =
      formato === "PDF" ? await exportacionPdfQuery.refetch() : await exportacionExcelQuery.refetch()
    const reporte = resultado.data?.datos[0]
    if (reporte) {
      descargarReporte(reporte)
      setReporteGenerado(`${reporte.nombreArchivo} descargado en formato ${reporte.formato}.`)
    }
  }

  return (
    <>
      <SiteHeader
        title="Listado de clientes"
        breadcrumbs={[{ title: "Socio de Negocio", href: "/socio-negocios" }, { title: "Clientes" }]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          <SocioNegocioPageHeader
            title="Listado de clientes"
            description="Listado de clientes del maestro de socios de negocio."
            meta={
              metaPaginacion ? (
                <Badge variant="secondary">{metaPaginacion.total} registros</Badge>
              ) : null
            }
            actions={
              <Button asChild className="w-full sm:w-auto">
                <Link href="/socio-negocios/nuevo?tipo=CLIENTE">
                  <Plus data-icon="inline-start" />
                  Nuevo cliente
                </Link>
              </Button>
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

          <section className="flex flex-col gap-4">
            <div className="overflow-hidden rounded-xl border border-border/70 bg-card text-card-foreground">
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
                        placeholder="Buscar por razon social"
                        onChange={(event) => actualizarFiltro("razonSocial", event.target.value)}
                      />
                    </InputGroup>
                  </Field>
                  <Field>
                    <Input
                      value={obtenerValorFiltro(filtrosFormulario, "numeroDocumento")}
                      placeholder="RUC/DNI"
                      onChange={(event) => actualizarFiltro("numeroDocumento", event.target.value)}
                    />
                  </Field>
                  <Field>
                    <Input
                      value={obtenerValorFiltro(filtrosFormulario, "codigoInternoSap")}
                      placeholder="Codigo SAP"
                      onChange={(event) => actualizarFiltro("codigoInternoSap", event.target.value)}
                    />
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
                          value as ConsultarSociosDeNegocioQuery["estadoSincronizacionSap"] | "TODOS",
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
                    <Button type="submit" size="sm" disabled={clientesQuery.isFetching}>
                      <Search data-icon="inline-start" />
                      {clientesQuery.isFetching ? "Consultando..." : "Aplicar"}
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={limpiarBusqueda}>
                      Limpiar
                    </Button>
                  </div>
                </form>
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
              ) : clientes.length === 0 ? (
                <Empty className="py-12">
                  <EmptyHeader>
                    <EmptyTitle>Sin clientes</EmptyTitle>
                    <EmptyDescription>No existen registros para el filtro aplicado.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-background hover:bg-transparent">
                        <TableHead className="w-10">Acciones</TableHead>
                        <TableHead className="text-right">ID</TableHead>
                        <TableHead>Codigo SAP</TableHead>
                        <TableHead>Razon social</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Registro</TableHead>
                        <TableHead>Aprobacion</TableHead>
                        <TableHead>Sincronizacion SAP</TableHead>
                        <TableHead>Origen</TableHead>
                        <TableHead>Documento</TableHead>
                        <TableHead>Creacion</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientes.map((cliente) => {
                        const claseContenido = obtenerClaseContenidoSocio(cliente)
                        const inactivo = cliente.estado === "INACTIVO"
                        const anulado = cliente.estadoRegistro === "ANULADO"
                        return (
                          <TableRow key={cliente.id} className={obtenerClaseFilaSocio(cliente)}>
                            <TableCell>
                              <AccionesSocio
                                socio={cliente}
                                nombre={cliente.razonSocial || cliente.numeroDocumento}
                                onActualizado={() => void clientesQuery.refetch()}
                                onMensaje={(mensaje) => {
                                  setErrorOperacion(null)
                                  setMensajeOperacion(mensaje)
                                }}
                                onError={(err) => {
                                  setMensajeOperacion(null)
                                  setErrorOperacion(err)
                                }}
                              />
                            </TableCell>
                            <TableCell className="text-right font-medium tabular-nums">
                              <span className={claseContenido}>{cliente.id}</span>
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              <span className={claseContenido}>{cliente.codigoInternoSap || "-"}</span>
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
                                    title={anulado ? "Registro anulado" : "Cliente inactivo"}
                                  />
                                ) : null}
                                <div className="flex min-w-0 flex-col">
                                  <span className={cn("font-medium", claseContenido)}>
                                    {cliente.razonSocial || "Sin razon social"}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {cliente.nombreComercial || "Sin nombre comercial"}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className={claseContenido}>
                                <EstadoSocioBadge estado={cliente.estado} />
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={claseContenido}>
                                <EstadoRegistroBadge estadoRegistro={cliente.estadoRegistro} />
                              </span>
                            </TableCell>
                            <TableCell>
                              <EstadoAprobacionBadge estado={cliente.estadoAprobacion} />
                            </TableCell>
                            <TableCell>
                              <EstadoSincronizacionSapBadge
                                estado={cliente.estadoSincronizacionSap ?? "NO_APLICA"}
                                ultimoError={cliente.ultimoErrorSincronizacionSap}
                              />
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{cliente.origen}</Badge>
                            </TableCell>
                            <TableCell>
                              <span className={claseContenido}>{cliente.numeroDocumento}</span>
                            </TableCell>
                            <TableCell>
                              <span className={claseContenido}>
                                {formatearFecha(cliente.fechaCreacion)}
                              </span>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {clientes.length > 0 && metaPaginacion ? (
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
            <AlertDialogDescription>{errorOperacion?.descripcion}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorOperacion(null)}>Entendido</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
