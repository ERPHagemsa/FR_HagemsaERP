"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
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
import {
  Building2,
  CircleDashed,
  Download,
  Filter,
  Package,
  Plus,
  Search,
  User,
} from "lucide-react"

import {
  useExportarSociosDeNegocioQuery,
  useSociosDeNegocioQuery,
} from "../servicios/socio-negocios-queries"
import { PaginationControls } from "../componentes/pagination-controls"
import { SocioNegocioPageHeader } from "../componentes/socio-negocio-page-header"
import { EstadoSincronizacionSapBadge } from "../componentes/estado-sincronizacion-sap-badge"
import type {
  ConsultarSociosDeNegocioQuery,
  ReporteSociosDeNegocioResponse,
} from "../tipos/socio-negocio"
import { puedeGestionarAsignacionesPersonal } from "../tipos/socio-negocio"
import { AccionesSocio } from "./socio-negocio-listado/acciones-socio"
import {
  EstadoRegistroBadge,
  EstadoSocioBadge,
  type ErrorOperacion,
  type SocioNegocioVistaProps,
  ResumenListado,
  descargarReporte,
  formatearFecha,
  limpiarFiltros,
  obtenerClaseContenidoSocio,
  obtenerClaseFilaSocio,
  obtenerFiltrosActivos,
  obtenerMensajeError,
  obtenerSiguienteAccion,
  obtenerValorFiltro,
} from "./socio-negocio-listado/utilidades"

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
                  <p className="mt-1 text-sm">Corrige, anula o reactiva desde acciones.</p>
                </div>
                <div className="rounded-lg border border-border bg-background p-3">
                  <p className="text-xs font-medium text-muted-foreground">3. Auditar</p>
                  <p className="mt-1 text-sm">Consulta historial y descarga reportes filtrados.</p>
                </div>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
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
