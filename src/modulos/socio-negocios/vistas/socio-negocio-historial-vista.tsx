"use client"

import { FormEvent, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, CirclePlus, Pencil, Search, Trash2 } from "lucide-react"

import { SiteHeader } from "@/compartido/componentes/site-header"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/compartido/componentes/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert"
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select"
import { Skeleton } from "@/compartido/componentes/ui/skeleton"
import { cn } from "@/compartido/utilidades/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table"

import { PaginationControls } from "../componentes/pagination-controls"
import { SocioNegocioPageHeader } from "../componentes/socio-negocio-page-header"
import {
  useHistorialSocioDeNegocioQuery,
  useHistorialSociosDeNegocioQuery,
  useSocioDeNegocioQuery,
} from "../servicios/socio-negocios-queries"
import type {
  AccionHistorialSocioDeNegocio,
  ConsultarHistorialSocioDeNegocioQuery,
  HistorialSocioDeNegocioResponse,
} from "../tipos/socio-negocio"

function obtenerMensajeError(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo cargar el historial."
}

function formatearFecha(fecha?: string) {
  if (!fecha) return "-"
  const valor = new Date(fecha)
  if (Number.isNaN(valor.getTime())) return fecha
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(valor)
}

function limpiarFiltros(
  query: ConsultarHistorialSocioDeNegocioQuery,
): ConsultarHistorialSocioDeNegocioQuery {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => {
      if (value === undefined || value === null) return false
      if (typeof value === "string") return value.trim() !== ""
      return true
    }),
  ) as ConsultarHistorialSocioDeNegocioQuery
}

function resumirCambios(historial: HistorialSocioDeNegocioResponse) {
  const nuevos = Object.keys(historial.datosNuevos ?? {})
  const anteriores = Object.keys(historial.datosAnteriores ?? {})
  const campos = Array.from(new Set([...anteriores, ...nuevos]))

  if (campos.length === 0) {
    return "-"
  }

  return campos.slice(0, 4).join(", ")
}

const etiquetasCampos: Record<string, string> = {
  codigoInternoSap: "Codigo SAP",
  tipo: "Tipo",
  numeroDocumento: "Documento",
  razonSocial: "Razon social",
  nombreComercial: "Nombre comercial",
  primerNombre: "Primer nombre",
  segundoNombre: "Segundo nombre",
  apellidoPaterno: "Apellido paterno",
  apellidoMaterno: "Apellido materno",
  direccion: "Direccion",
  contacto: "Contacto",
  correo: "Correo",
  numeroCelular: "Celular",
  estado: "Estado",
  estadoRegistro: "Estado registro",
  origen: "Origen",
  registroAnteriorId: "Registro anterior",
  motivoBaja: "Motivo baja",
  fechaBaja: "Fecha baja",
  motivoAnulacion: "Motivo anulacion",
  fechaAnulacion: "Fecha anulacion",
}

const camposOcultosAuditoria = new Set([
  "id",
  "usuarioBajaId",
  "usuarioAnulacionId",
])

function etiquetaCampo(campo: string) {
  return etiquetasCampos[campo] ?? campo
}

function formatearValorAuditoria(valor: unknown) {
  if (valor === undefined || valor === null || valor === "") return "-"
  if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}T/.test(valor)) {
    return formatearFecha(valor)
  }
  if (typeof valor === "object") {
    return JSON.stringify(valor)
  }
  return String(valor)
}

function obtenerCamposAuditoria(item: HistorialSocioDeNegocioResponse) {
  const anteriores = item.datosAnteriores ?? {}
  const nuevos = item.datosNuevos ?? {}
  return Array.from(new Set([...Object.keys(anteriores), ...Object.keys(nuevos)]))
    .filter((campo) => !camposOcultosAuditoria.has(campo))
    .map((campo) => ({
      campo,
      anterior: anteriores[campo],
      nuevo: nuevos[campo],
      cambio:
        formatearValorAuditoria(anteriores[campo]) !==
        formatearValorAuditoria(nuevos[campo]),
    }))
}

function obtenerEstiloAccion(accion: AccionHistorialSocioDeNegocio) {
  if (accion === "REGISTRO") {
    return "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
  }

  if (accion === "ELIMINACION") {
    return "border-destructive/30 bg-destructive/10 text-destructive"
  }

  return "border-primary/30 bg-primary/10 text-primary"
}

function obtenerEstiloCabeceraAccion(accion: AccionHistorialSocioDeNegocio) {
  if (accion === "REGISTRO") {
    return "border-l-emerald-500 bg-emerald-50/70 hover:bg-emerald-50 dark:border-l-emerald-400 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50"
  }

  if (accion === "ELIMINACION") {
    return "border-l-destructive bg-destructive/10 hover:bg-destructive/5"
  }

  return "border-l-primary bg-primary/10 hover:bg-primary/5"
}

function etiquetaAccion(accion: AccionHistorialSocioDeNegocio) {
  if (accion === "REGISTRO") return "Registro"
  if (accion === "MODIFICACION") return "Modificacion"
  return "Eliminacion"
}

function IconoAccion({ accion }: { accion: AccionHistorialSocioDeNegocio }) {
  if (accion === "REGISTRO") return <CirclePlus data-icon="inline-start" />
  if (accion === "ELIMINACION") return <Trash2 data-icon="inline-start" />
  return <Pencil data-icon="inline-start" />
}

function ValorDiff({
  tipo,
  valor,
  cambio,
}: {
  tipo: "anterior" | "nuevo"
  valor: unknown
  cambio: boolean
}) {
  const contenido = formatearValorAuditoria(valor)

  return (
    <div
      className={cn(
        "min-h-10 min-w-0 overflow-hidden rounded-md border px-3 py-2 text-sm",
        tipo === "anterior" &&
          (cambio
            ? "border-destructive/25 bg-destructive/10 text-destructive"
            : "border-border bg-muted/30 text-muted-foreground"),
        tipo === "nuevo" &&
          (cambio
            ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
            : "border-border bg-background text-foreground"),
      )}
    >
      <span className={cn("block whitespace-pre-wrap break-all", cambio && "font-medium")}>
        {cambio ? (tipo === "anterior" ? "- " : "+ ") : ""}
        {contenido}
      </span>
    </div>
  )
}

export function SocioNegocioHistorialVista() {
  const [paginaActual, setPaginaActual] = useState(1)
  const [registrosPorPagina, setRegistrosPorPagina] = useState(20)
  const [filtrosFormulario, setFiltrosFormulario] =
    useState<ConsultarHistorialSocioDeNegocioQuery>({})
  const [filtrosAplicados, setFiltrosAplicados] =
    useState<ConsultarHistorialSocioDeNegocioQuery>({})

  const query = useMemo(
    () => ({
      ...filtrosAplicados,
      page: paginaActual,
      pageSize: registrosPorPagina,
    }),
    [filtrosAplicados, paginaActual, registrosPorPagina],
  )

  const historialQuery = useHistorialSociosDeNegocioQuery(query)
  const registros = historialQuery.data?.datos ?? []
  const metaPaginacion = historialQuery.data?.paginacion
  const error = historialQuery.error ? obtenerMensajeError(historialQuery.error) : null

  function actualizarFiltro<K extends keyof ConsultarHistorialSocioDeNegocioQuery>(
    key: K,
    value: ConsultarHistorialSocioDeNegocioQuery[K] | "TODOS",
  ) {
    setFiltrosFormulario((actual) => {
      const siguiente = { ...actual }

      if (value === "TODOS" || value === "") {
        delete siguiente[key]
      } else {
        siguiente[key] = value as ConsultarHistorialSocioDeNegocioQuery[K]
      }

      return limpiarFiltros(siguiente)
    })
  }

  function aplicarFiltros(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPaginaActual(1)
    setFiltrosAplicados(limpiarFiltros(filtrosFormulario))
  }

  function limpiarBusqueda() {
    setPaginaActual(1)
    setFiltrosFormulario({})
    setFiltrosAplicados({})
  }

  return (
    <>
      <SiteHeader
        title="Historial de Socios"
        breadcrumbs={[
          { title: "Socio de Negocio", href: "/socio-negocios" },
          { title: "Historial" },
        ]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          <SocioNegocioPageHeader
            title="Historial de socios"
            description="Revisa movimientos del maestro, usuarios responsables y cambios principales."
            actions={
              <Button asChild variant="outline">
                <Link href="/socio-negocios">
                  <ArrowLeft data-icon="inline-start" />
                  Volver al inicio
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

          <section className="overflow-hidden rounded-xl border border-border/70 bg-card text-card-foreground">
            <div className="flex flex-col gap-1 border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold">Movimientos del modulo</h2>
              <p className="text-sm leading-5 text-muted-foreground">
                Auditoria general de registros, modificaciones y eliminaciones.
              </p>
            </div>

            <form
              className="flex flex-col gap-3 border-b border-border bg-muted/20 px-4 py-4 lg:flex-row lg:items-center"
              onSubmit={aplicarFiltros}
            >
              <Field className="lg:w-48">
                <Select
                  value={filtrosFormulario.accion ?? "TODOS"}
                  onValueChange={(value) =>
                    actualizarFiltro(
                      "accion",
                      value as AccionHistorialSocioDeNegocio | "TODOS",
                    )
                  }
                >
                  <SelectTrigger className="w-full" aria-label="Filtrar por accion">
                    <SelectValue placeholder="Accion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="TODOS">Accion: todas</SelectItem>
                      <SelectItem value="REGISTRO">Registro</SelectItem>
                      <SelectItem value="MODIFICACION">Modificacion</SelectItem>
                      <SelectItem value="ELIMINACION">Eliminacion</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field className="lg:w-48">
                <Input
                  value={filtrosFormulario.usuarioAccion ?? ""}
                  placeholder="Usuario"
                  onChange={(event) =>
                    actualizarFiltro("usuarioAccion", event.target.value)
                  }
                />
              </Field>
              <Field className="lg:w-44">
                <Input
                  type="date"
                  value={filtrosFormulario.fechaDesde ?? ""}
                  onChange={(event) =>
                    actualizarFiltro("fechaDesde", event.target.value)
                  }
                />
              </Field>
              <Field className="lg:w-44">
                <Input
                  type="date"
                  value={filtrosFormulario.fechaHasta ?? ""}
                  onChange={(event) =>
                    actualizarFiltro("fechaHasta", event.target.value)
                  }
                />
              </Field>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={historialQuery.isFetching}>
                  <Search data-icon="inline-start" />
                  {historialQuery.isFetching ? "Consultando..." : "Aplicar"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={limpiarBusqueda}>
                  Limpiar
                </Button>
              </div>
            </form>

            {historialQuery.isLoading ? (
              <div className="flex flex-col gap-3 p-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : registros.length === 0 ? (
              <Empty className="py-12">
                  <EmptyHeader>
                    <EmptyTitle>Sin movimientos</EmptyTitle>
                    <EmptyDescription>
                    No existen registros para el filtro aplicado.
                    </EmptyDescription>
                  </EmptyHeader>
              </Empty>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-background hover:bg-primary/5">
                      <TableHead className="text-right">#</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Accion</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Registro</TableHead>
                      <TableHead>Campos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registros.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-right font-medium tabular-nums">
                          {item.idRegistro}
                        </TableCell>
                        <TableCell>{formatearFecha(item.fechaAccion)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "gap-1.5 rounded-full",
                              obtenerEstiloAccion(item.accion),
                            )}
                          >
                            <IconoAccion accion={item.accion} />
                            {etiquetaAccion(item.accion)}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.usuarioAccion || "-"}</TableCell>
                        <TableCell>
                          <Button asChild variant="link" className="h-auto p-0 font-mono text-xs">
                            <Link href={`/socio-negocios/historial/${item.idRegistro}`}>
                              {item.idRegistro}
                            </Link>
                          </Button>
                        </TableCell>
                        <TableCell>{resumirCambios(item)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {registros.length > 0 && metaPaginacion ? (
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
          </section>
        </div>
      </main>
    </>
  )
}

export function SocioNegocioHistorialDetalleVista({ id }: { id: string }) {
  const [paginaActual, setPaginaActual] = useState(1)
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10)
  const query = useMemo(
    () => ({
      page: paginaActual,
      pageSize: registrosPorPagina,
    }),
    [paginaActual, registrosPorPagina],
  )
  const socioQuery = useSocioDeNegocioQuery(id)
  const historialQuery = useHistorialSocioDeNegocioQuery(id, query)
  const socio = socioQuery.data
  const registros = historialQuery.data?.datos ?? []
  const metaPaginacion = historialQuery.data?.paginacion
  const error = historialQuery.error
    ? obtenerMensajeError(historialQuery.error)
    : socioQuery.error
      ? obtenerMensajeError(socioQuery.error)
      : null
  const primerMovimiento = registros[0]
  const datosReferencia = socio ?? primerMovimiento?.datosNuevos
  const titulo =
    (datosReferencia?.razonSocial as string | undefined) ||
    (datosReferencia?.nombreComercial as string | undefined) ||
    "Socio de negocio"

  return (
    <>
      <SiteHeader
        title="Auditoria de socio"
        breadcrumbs={[
          { title: "Socio de Negocio", href: "/socio-negocios" },
          { title: "Historial", href: "/socio-negocios/historial" },
          { title: titulo },
        ]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          <SocioNegocioPageHeader
            title={titulo}
            description="Linea de tiempo con valores anteriores y nuevos para auditoria del registro."
            meta={
              <>
                {datosReferencia?.tipo ? (
                  <Badge variant="secondary">{String(datosReferencia.tipo)}</Badge>
                ) : null}
              </>
            }
            actions={
              <Button asChild variant="outline">
                <Link href="/socio-negocios/historial">
                  <ArrowLeft data-icon="inline-start" />
                  Volver al historial
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

          <section className="overflow-hidden rounded-xl border border-border/70 bg-card text-card-foreground">
            <div className="flex flex-col gap-1 border-b border-border px-5 py-4">
              <div className="min-w-0">
                <h2 className="text-base font-semibold">Movimientos del socio</h2>
                <p className="text-sm leading-5 text-muted-foreground">
                  Auditoria de datos anteriores y nuevos para el registro seleccionado.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-px overflow-hidden border-0 bg-border sm:grid-cols-2 md:grid-cols-4">
              <ResumenAuditoria label="Codigo SAP" value={datosReferencia?.codigoInternoSap} />
              <ResumenAuditoria label="Documento" value={datosReferencia?.numeroDocumento} />
              <ResumenAuditoria label="Estado" value={datosReferencia?.estado} />
              <ResumenAuditoria label="Registro" value={datosReferencia?.estadoRegistro} />
            </div>

            {historialQuery.isLoading || socioQuery.isLoading ? (
              <div className="flex flex-col gap-3 p-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : registros.length === 0 ? (
              <Empty className="py-12">
                <EmptyHeader>
                  <EmptyTitle>Sin auditoria</EmptyTitle>
                  <EmptyDescription>
                    No existen movimientos para este socio de negocio.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <Accordion type="multiple" className="m-4 flex w-auto flex-col gap-3 border-0">
                {registros.map((item) => {
                  const campos = obtenerCamposAuditoria(item)

                  return (
                    <AccordionItem
                      key={item.id}
                      value={item.id}
                      className="min-w-0 max-w-full overflow-hidden rounded-lg border border-primary/15 bg-background shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
                    >
                      <AccordionTrigger
                        className={cn(
                        "min-w-0 max-w-full overflow-hidden border-l-4 px-4 py-3 text-left no-underline transition-colors hover:bg-primary/5 hover:no-underline",
                          obtenerEstiloCabeceraAccion(item.accion),
                        )}
                      >
                        <div className="flex min-w-0 max-w-full flex-1 flex-col gap-3 pr-3 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "gap-1.5 rounded-full",
                                  obtenerEstiloAccion(item.accion),
                                )}
                              >
                                <IconoAccion accion={item.accion} />
                                {etiquetaAccion(item.accion)}
                              </Badge>
                              <span className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary transition-colors hover:border-primary/30 hover:bg-primary/10">
                                Click para abrir detalle
                              </span>
                            </div>
                            <p className="mt-2 text-sm font-medium">
                              {formatearFecha(item.fechaAccion)}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              Movimiento {item.id}
                            </p>
                          </div>
                          <div className="min-w-0 rounded-md border border-primary/15 bg-background px-3 py-2 text-sm md:max-w-xs transition-colors hover:border-primary/25 hover:bg-primary/5">
                            <span className="text-muted-foreground">Usuario</span>
                            <p className="truncate font-medium">{item.usuarioAccion || "-"}</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="min-w-0 max-w-full overflow-hidden">
                        <div className="grid min-w-0 max-w-full gap-3 overflow-hidden px-4 pb-4 pt-3">
                          <div className="grid min-w-0 gap-3 overflow-hidden rounded-md bg-primary/5 px-3 py-2 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground md:grid-cols-[minmax(120px,200px)_minmax(0,1fr)_minmax(0,1fr)]">
                            <span className="min-w-0 break-words">Campo</span>
                            <span className="min-w-0 break-words">Anterior</span>
                            <span className="min-w-0 break-words">Nuevo</span>
                          </div>
                          {campos.map((campo) => (
                            <div
                              key={`${item.id}-${campo.campo}`}
                              className={cn(
                                "grid min-w-0 max-w-full gap-3 overflow-hidden rounded-md border border-primary/15 p-3 transition-colors hover:border-primary/25 hover:bg-primary/5 md:grid-cols-[minmax(120px,200px)_minmax(0,1fr)_minmax(0,1fr)] md:items-start",
                                campo.cambio && "border-primary/30 bg-primary/5",
                              )}
                            >
                              <div className="flex min-h-10 min-w-0 items-center">
                                <span className="break-words text-sm font-medium">
                                  {etiquetaCampo(campo.campo)}
                                </span>
                              </div>
                              <ValorDiff
                                tipo="anterior"
                                valor={campo.anterior}
                                cambio={campo.cambio}
                              />
                              <ValorDiff
                                tipo="nuevo"
                                valor={campo.nuevo}
                                cambio={campo.cambio}
                              />
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            )}

            {registros.length > 0 && metaPaginacion ? (
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
          </section>
        </div>
      </main>
    </>
  )
}

function ResumenAuditoria({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="min-w-0 bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium">
        {formatearValorAuditoria(value)}
      </p>
    </div>
  )
}
