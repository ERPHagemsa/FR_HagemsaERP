"use client"

import { FormEvent, useMemo, useState } from "react"
import Link from "next/link"

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
  count: "Count",
  codigoInternoSap: "Codigo SAP",
  tipo: "Tipo",
  numeroDocumento: "Documento",
  razonSocial: "Razon social",
  nombreComercial: "Nombre comercial",
  direccion: "Direccion",
  contacto: "Contacto",
  correo: "Correo",
  numeroCelular: "Celular",
  estado: "Estado",
  estadoRegistro: "Estado registro",
  cargoNombre: "Cargo",
  sedeNombre: "Sede",
  areaNombre: "Departamento",
  contratoNombre: "Contrato",
  cuentaNombre: "Cuenta",
  motivoBaja: "Motivo baja",
  fechaBaja: "Fecha baja",
  motivoAnulacion: "Motivo anulacion",
  fechaAnulacion: "Fecha anulacion",
}

const camposOcultosAuditoria = new Set([
  "id",
  "cargoId",
  "sedeId",
  "areaId",
  "contratoId",
  "cuentaId",
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
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }

  if (accion === "ELIMINACION") {
    return "border-destructive/30 bg-destructive/10 text-destructive"
  }

  return "border-border bg-background text-foreground"
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
        "min-h-10 rounded-md border px-3 py-2 text-sm",
        tipo === "anterior" &&
          (cambio
            ? "border-destructive/25 bg-destructive/10 text-destructive"
            : "border-border bg-muted/30 text-muted-foreground"),
        tipo === "nuevo" &&
          (cambio
            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
            : "border-border bg-background text-foreground"),
      )}
    >
      <span className={cn("whitespace-pre-wrap break-words", cambio && "font-medium")}>
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
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Error de API</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-lg font-semibold">Movimientos del modulo</h2>
              <p className="text-sm text-muted-foreground">
                Auditoria general de registros, modificaciones y eliminaciones.
              </p>
            </div>

            <form
              className="flex flex-col gap-2 border-b border-border px-4 py-3 lg:flex-row lg:items-center"
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
                  <SelectTrigger className="w-full">
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
                    No existen eventos para el filtro aplicado.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/70 hover:bg-muted/70">
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
                          {item.count}
                        </TableCell>
                        <TableCell>{formatearFecha(item.fechaAccion)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.accion}</Badge>
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
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Error de API</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <section className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col gap-3 border-b border-border px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">{titulo}</h2>
                  {datosReferencia?.count ? (
                    <Badge variant="outline">#{String(datosReferencia.count)}</Badge>
                  ) : null}
                  {datosReferencia?.tipo ? (
                    <Badge variant="secondary">{String(datosReferencia.tipo)}</Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Auditoria de datos anteriores y nuevos para el registro seleccionado.
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/socio-negocios/listar">Volver al listado</Link>
              </Button>
            </div>

            <div className="grid gap-3 border-b border-border p-4 md:grid-cols-4">
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
              <Accordion
                type="multiple"
                defaultValue={registros[0] ? [registros[0].id] : []}
                className="m-4"
              >
                {registros.map((item) => {
                  const campos = obtenerCamposAuditoria(item)

                  return (
                    <AccordionItem key={item.id} value={item.id}>
                      <AccordionTrigger
                        className={cn(
                          "no-underline hover:no-underline",
                          item.accion === "ELIMINACION"
                            ? "bg-destructive/5"
                            : item.accion === "REGISTRO"
                              ? "bg-muted/50"
                              : "bg-muted/30",
                        )}
                      >
                        <div className="flex w-full flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline">#{item.count}</Badge>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "rounded-full",
                                  obtenerEstiloAccion(item.accion),
                                )}
                              >
                                {item.accion}
                              </Badge>
                            </div>
                            <p className="mt-2 text-sm font-medium">
                              {formatearFecha(item.fechaAccion)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Movimiento {item.id}
                            </p>
                          </div>
                          <div className="rounded-md border border-border bg-background px-3 py-2 text-sm">
                            <span className="text-muted-foreground">Usuario</span>
                            <p className="font-medium">{item.usuarioAccion || "-"}</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid gap-3">
                          <div className="grid gap-3 rounded-md bg-muted/30 px-3 py-2 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground md:grid-cols-[220px_1fr_1fr]">
                            <span>Campo</span>
                            <span>Anterior</span>
                            <span>Nuevo</span>
                          </div>
                          {campos.map((campo) => (
                            <div
                              key={`${item.id}-${campo.campo}`}
                              className={cn(
                                "grid gap-3 rounded-md border border-border p-3 md:grid-cols-[220px_1fr_1fr] md:items-start",
                                campo.cambio && "border-primary/20",
                              )}
                            >
                              <div className="flex min-h-10 items-center">
                                <span className="text-sm font-medium">
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
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium">
        {formatearValorAuditoria(value)}
      </p>
    </div>
  )
}
