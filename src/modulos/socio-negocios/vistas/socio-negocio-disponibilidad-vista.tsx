"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Ban, CalendarRange, Pencil, Plus } from "lucide-react"

import { ApiError } from "@/compartido/api/axios"
import { obtenerUsuarioAuditoria } from "@/compartido/autenticacion/usuario-auditoria"
import { SiteHeader } from "@/compartido/componentes/site-header"
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert"
import { Badge } from "@/compartido/componentes/ui/badge"
import { Button } from "@/compartido/componentes/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/compartido/componentes/ui/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/compartido/componentes/ui/empty"
import { Field, FieldDescription, FieldLabel } from "@/compartido/componentes/ui/field"
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

import { useSesion } from "@/modulos/autenticacion/ganchos/use-sesion"

import { SocioNegocioPageHeader } from "../componentes/socio-negocio-page-header"
import { useSocioDeNegocioQuery } from "../servicios/socio-negocios-queries"
import { useAsignacionesPorPersonalQuery } from "../servicios/asignaciones-personal-queries"
import { useOpcionesFormularioAsignacionQuery } from "../servicios/asignaciones-personal-queries"
import {
  useAnularDisponibilidadPersonalMutation,
  useCrearDisponibilidadPersonalMutation,
  useDisponibilidadesPorPersonalQuery,
  useModificarDisponibilidadPersonalMutation,
} from "../servicios/disponibilidad-personal-queries"
import type {
  DisponibilidadPersonalConfiguradaResponse,
  EstadoDisponibilidadPersonal,
  OrigenDisponibilidadPersonal,
} from "../tipos/disponibilidad-personal"
import type { OpcionCatalogoFormulario } from "../tipos/asignacion-personal"

function obtenerMensajeError(error: unknown) {
  if (error instanceof ApiError) {
    const mensajes = error.errores?.map((item) => item.mensaje).filter(Boolean)
    if (mensajes?.length) return mensajes.join(" ")
  }
  if (error instanceof Error) return error.message
  return "No se pudo completar la operacion."
}

function formatearFecha(fecha?: string | null) {
  if (!fecha) return "-"
  const valor = new Date(fecha)
  if (Number.isNaN(valor.getTime())) return String(fecha)
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" }).format(valor)
}

function soloFecha(fecha?: string | null) {
  if (!fecha) return ""
  return String(fecha).slice(0, 10)
}

function fechaApi(fecha: string) {
  return new Date(`${fecha}T00:00:00.000Z`).toISOString()
}

function etiqueta(codigo: string, catalogo: OpcionCatalogoFormulario[]) {
  return catalogo.find((item) => item.codigo === codigo)?.nombre ?? codigo
}

// --- Dialogo crear/editar ------------------------------------------------------

function DisponibilidadDialog({
  modo,
  personalId,
  asignacionVigenteId,
  disponibilidad,
  estados,
  origenes,
  onClose,
}: {
  modo: "crear" | "editar"
  personalId: number | string
  asignacionVigenteId?: number | string
  disponibilidad?: DisponibilidadPersonalConfiguradaResponse
  estados: OpcionCatalogoFormulario[]
  origenes: OpcionCatalogoFormulario[]
  onClose: (actualizado: boolean) => void
}) {
  const { usuario } = useSesion()
  const [estadoDisponibilidad, setEstadoDisponibilidad] = useState<string>(
    disponibilidad?.estadoDisponibilidad ?? "",
  )
  const [origen, setOrigen] = useState<string>(disponibilidad?.origen ?? "MANUAL")
  const [motivo, setMotivo] = useState(disponibilidad?.motivo ?? "")
  const [observacion, setObservacion] = useState(disponibilidad?.observacion ?? "")
  const [vigenteDesde, setVigenteDesde] = useState(soloFecha(disponibilidad?.vigenteDesde))
  const [vigenteHasta, setVigenteHasta] = useState(soloFecha(disponibilidad?.vigenteHasta))
  const [error, setError] = useState<string | null>(null)

  const crearMutation = useCrearDisponibilidadPersonalMutation()
  const modificarMutation = useModificarDisponibilidadPersonalMutation(disponibilidad?.id ?? 0)
  const pendiente = crearMutation.isPending || modificarMutation.isPending

  async function guardar() {
    if (!estadoDisponibilidad) {
      setError("Selecciona el estado de disponibilidad.")
      return
    }
    if (!motivo.trim()) {
      setError("El motivo es obligatorio.")
      return
    }
    if (vigenteHasta && vigenteDesde && vigenteHasta < vigenteDesde) {
      setError("La fecha final no puede ser anterior a la inicial.")
      return
    }

    try {
      setError(null)
      if (modo === "crear") {
        if (!asignacionVigenteId) {
          setError("El personal necesita una asignacion vigente para registrar disponibilidad.")
          return
        }
        await crearMutation.mutateAsync({
          personalId,
          asignacionPersonalId: asignacionVigenteId,
          estadoDisponibilidad: estadoDisponibilidad as EstadoDisponibilidadPersonal,
          origen: (origen || "MANUAL") as OrigenDisponibilidadPersonal,
          motivo: motivo.trim(),
          observacion: observacion.trim() || undefined,
          vigenteDesde: vigenteDesde ? fechaApi(vigenteDesde) : undefined,
          vigenteHasta: vigenteHasta ? fechaApi(vigenteHasta) : null,
          usuarioId: obtenerUsuarioAuditoria(usuario),
        })
      } else {
        await modificarMutation.mutateAsync({
          estadoDisponibilidad: estadoDisponibilidad as EstadoDisponibilidadPersonal,
          origen: (origen || "MANUAL") as OrigenDisponibilidadPersonal,
          motivo: motivo.trim(),
          observacion: observacion.trim() || null,
          vigenteDesde: vigenteDesde ? fechaApi(vigenteDesde) : undefined,
          vigenteHasta: vigenteHasta ? fechaApi(vigenteHasta) : null,
          usuarioId: obtenerUsuarioAuditoria(usuario),
        })
      }
      onClose(true)
    } catch (err) {
      setError(obtenerMensajeError(err))
    }
  }

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>
          {modo === "crear" ? "Nueva disponibilidad" : "Editar disponibilidad"}
        </DialogTitle>
        <DialogDescription>
          Registra un periodo previsto del personal (vacaciones, permiso, descanso, etc.). Es
          informativo: no reemplaza la asistencia real.
        </DialogDescription>
      </DialogHeader>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudo guardar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Estado *</FieldLabel>
            <Select value={estadoDisponibilidad || ""} onValueChange={setEstadoDisponibilidad}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {estados.map((item) => (
                    <SelectItem key={item.codigo} value={item.codigo}>
                      {item.nombre}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Origen</FieldLabel>
            <Select value={origen || "MANUAL"} onValueChange={setOrigen}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Origen" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {origenes.map((item) => (
                    <SelectItem key={item.codigo} value={item.codigo}>
                      {item.nombre}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field>
          <FieldLabel>Motivo *</FieldLabel>
          <Input
            value={motivo}
            placeholder="Ej. Vacaciones programadas 2026"
            onChange={(e) => setMotivo(e.target.value)}
          />
        </Field>

        <Field>
          <FieldLabel>Observacion</FieldLabel>
          <Input
            value={observacion}
            placeholder="Opcional"
            onChange={(e) => setObservacion(e.target.value)}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Vigente desde</FieldLabel>
            <Input type="date" value={vigenteDesde} onChange={(e) => setVigenteDesde(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>Vigente hasta</FieldLabel>
            <Input
              type="date"
              value={vigenteHasta}
              min={vigenteDesde || undefined}
              onChange={(e) => setVigenteHasta(e.target.value)}
            />
            <FieldDescription>Dejalo vacio si es indefinida.</FieldDescription>
          </Field>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onClose(false)} disabled={pendiente}>
          Cancelar
        </Button>
        <Button type="button" onClick={() => void guardar()} disabled={pendiente}>
          {pendiente ? "Guardando..." : "Guardar"}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

// --- Boton anular --------------------------------------------------------------

function AnularDisponibilidadBtn({
  disponibilidad,
  onActualizado,
}: {
  disponibilidad: DisponibilidadPersonalConfiguradaResponse
  onActualizado: () => void
}) {
  const { usuario } = useSesion()
  const anularMutation = useAnularDisponibilidadPersonalMutation(disponibilidad.id)

  async function anular() {
    try {
      await anularMutation.mutateAsync({ usuarioId: obtenerUsuarioAuditoria(usuario) })
    } finally {
      onActualizado()
    }
  }

  if (disponibilidad.estadoRegistro === "ANULADO") return null

  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={anularMutation.isPending}
      onClick={() => void anular()}
    >
      <Ban data-icon="inline-start" />
      Anular
    </Button>
  )
}

// --- Seccion -------------------------------------------------------------------

function DisponibilidadSeccion({ personalId }: { personalId: number | string }) {
  const asignacionesQuery = useAsignacionesPorPersonalQuery(personalId)
  const opcionesQuery = useOpcionesFormularioAsignacionQuery()
  const disponibilidadesQuery = useDisponibilidadesPorPersonalQuery(personalId)

  const [dialogo, setDialogo] = useState<
    { modo: "crear" } | { modo: "editar"; disponibilidad: DisponibilidadPersonalConfiguradaResponse } | null
  >(null)

  const asignaciones = asignacionesQuery.data ?? []
  const asignacionVigente =
    asignaciones.find((item) => item.estado === "VIGENTE") ?? asignaciones[0]
  const estados = opcionesQuery.data?.estadosDisponibilidad ?? []
  const origenes = opcionesQuery.data?.origenesDisponibilidad ?? []
  const disponibilidades = disponibilidadesQuery.data ?? []

  function cerrar(actualizado: boolean) {
    setDialogo(null)
    if (actualizado) void disponibilidadesQuery.refetch()
  }

  const cargando =
    asignacionesQuery.isLoading || opcionesQuery.isLoading || disponibilidadesQuery.isLoading

  if (cargando) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (!asignacionVigente) {
    return (
      <Alert>
        <AlertTitle>El personal aun no tiene asignacion</AlertTitle>
        <AlertDescription>
          La disponibilidad se registra sobre la asignacion del personal. Crea primero su asignacion
          y vuelve a esta pantalla.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Periodos previstos del personal. La disponibilidad toma como referencia la asignacion
          vigente.
        </p>
        <Button onClick={() => setDialogo({ modo: "crear" })}>
          <Plus data-icon="inline-start" />
          Nueva disponibilidad
        </Button>
      </div>

      {disponibilidadesQuery.error ? (
        <Alert variant="destructive">
          <AlertTitle>Error de API</AlertTitle>
          <AlertDescription>{obtenerMensajeError(disponibilidadesQuery.error)}</AlertDescription>
        </Alert>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground">
        {disponibilidades.length === 0 ? (
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyTitle>Sin disponibilidades registradas</EmptyTitle>
              <EmptyDescription>
                Registra el primer periodo previsto (vacaciones, permiso, descanso, etc.).
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/70 hover:bg-muted/70">
                  <TableHead>Estado</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Vigencia</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disponibilidades.map((item) => {
                  const anulada = item.estadoRegistro === "ANULADO"
                  return (
                    <TableRow key={item.id} className="border-border/80">
                      <TableCell>
                        <Badge variant="outline">
                          {etiqueta(item.estadoDisponibilidad, estados)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-44 flex-col">
                          <span className="font-medium">{item.motivo || "-"}</span>
                          {item.observacion ? (
                            <span className="text-xs text-muted-foreground">{item.observacion}</span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatearFecha(item.vigenteDesde)}
                        {item.vigenteHasta ? ` - ${formatearFecha(item.vigenteHasta)}` : " - indefinida"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {etiqueta(item.origen, origenes)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={anulada ? "destructive" : "secondary"}>
                          {anulada ? "Anulada" : "Activa"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {!anulada ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDialogo({ modo: "editar", disponibilidad: item })}
                              >
                                <Pencil data-icon="inline-start" />
                                Editar
                              </Button>
                              <AnularDisponibilidadBtn
                                disponibilidad={item}
                                onActualizado={() => void disponibilidadesQuery.refetch()}
                              />
                            </>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={dialogo !== null} onOpenChange={(open) => !open && setDialogo(null)}>
        {dialogo ? (
          <DisponibilidadDialog
            modo={dialogo.modo}
            personalId={personalId}
            asignacionVigenteId={asignacionVigente.id}
            disponibilidad={dialogo.modo === "editar" ? dialogo.disponibilidad : undefined}
            estados={estados}
            origenes={origenes}
            onClose={cerrar}
          />
        ) : null}
      </Dialog>
    </div>
  )
}

// --- Vista principal -----------------------------------------------------------

export function SocioNegocioDisponibilidadVista({ id }: { id: string }) {
  const socioQuery = useSocioDeNegocioQuery(id)
  const socio = socioQuery.data
  const esPersonal = socio?.tipo === "PERSONAL"

  const nombreSocio = socio
    ? socio.tipo === "PERSONAL"
      ? socio.nombreCompleto ||
        [socio.primerNombre, socio.apellidoPaterno, socio.apellidoMaterno]
          .filter(Boolean)
          .join(" ") ||
        socio.numeroDocumento
      : socio.razonSocial || socio.nombreComercial || socio.numeroDocumento
    : ""

  return (
    <>
      <SiteHeader
        title="Disponibilidad del personal"
        breadcrumbs={[
          { title: "Socio de Negocio", href: "/socio-negocios" },
          { title: "Personal", href: "/socio-negocios/personal" },
          { title: "Ver", href: `/socio-negocios/${id}?tipo=PERSONAL` },
          { title: "Disponibilidad" },
        ]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          {socioQuery.isLoading ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-9 w-64" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : null}

          {socioQuery.error ? (
            <Alert variant="destructive">
              <AlertTitle>Error de API</AlertTitle>
              <AlertDescription>{obtenerMensajeError(socioQuery.error)}</AlertDescription>
            </Alert>
          ) : null}

          {socio ? (
            <>
              <SocioNegocioPageHeader
                title={
                  <span className="flex items-center gap-2">
                    <CalendarRange className="size-6 text-primary" />
                    Disponibilidad de {nombreSocio}
                  </span>
                }
                description={`${socio.numeroDocumento} · Registra los periodos previstos (vacaciones, permiso, descanso, etc.).`}
                actions={
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/socio-negocios/${id}?tipo=PERSONAL`}>
                      <ArrowLeft data-icon="inline-start" />
                      Volver al socio
                    </Link>
                  </Button>
                }
              />

              {esPersonal ? (
                <DisponibilidadSeccion personalId={socio.id} />
              ) : (
                <Alert>
                  <AlertTitle>Disponibilidad no disponible</AlertTitle>
                  <AlertDescription>
                    Solo el personal tiene disponibilidad. Este socio es de tipo {socio.tipo}.
                  </AlertDescription>
                </Alert>
              )}
            </>
          ) : null}
        </div>
      </main>
    </>
  )
}
