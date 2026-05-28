"use client"

import { FormEvent, useMemo, useState } from "react"

import { SiteHeader } from "@/compartido/componentes/site-header"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table"

import { PaginationControls } from "../componentes/pagination-controls"
import { useHistorialSociosDeNegocioQuery } from "../servicios/socio-negocios-queries"
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
                        <TableCell>{formatearFecha(item.fechaAccion)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.accion}</Badge>
                        </TableCell>
                        <TableCell>{item.usuarioAccion || "-"}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {item.idRegistro}
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
