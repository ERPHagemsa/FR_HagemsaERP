"use client"

import { useState } from "react"
import { Ban, CheckCircle2, Pencil, Plus } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert"
import { Badge } from "@/compartido/componentes/ui/badge"
import { Button } from "@/compartido/componentes/ui/button"
import { Dialog } from "@/compartido/componentes/ui/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/compartido/componentes/ui/empty"
import { Field } from "@/compartido/componentes/ui/field"
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

import {
  useActivarConfiguracionLaboralPersonalMutation,
  useActivarTipoTareoPersonalMutation,
  useConfiguracionesLaboralesPersonalQuery,
  useInactivarConfiguracionLaboralPersonalMutation,
  useInactivarTipoTareoPersonalMutation,
  useTiposTareoPersonalQuery,
} from "../../servicios/tareo-personal-queries"
import type {
  ConfiguracionLaboralPersonalResponse,
  EstadoMaestroTareo,
  TipoTareoPersonalResponse,
} from "../../tipos/tareo-personal"
import {
  ConfiguracionLaboralDialog,
  EstadoMaestroBadge,
  TipoTareoDialog,
} from "./dialogos"
import { etiquetaForma, formatearFecha, obtenerMensajeError } from "./utilidades"

// --- Tab: Tipos de tareo -------------------------------------------------------

export function TiposTareoTab() {
  const [estado, setEstado] = useState<EstadoMaestroTareo | "TODOS">("TODOS")
  const [dialogo, setDialogo] = useState<
    { modo: "crear" } | { modo: "editar"; tipo: TipoTareoPersonalResponse } | null
  >(null)
  const query = useTiposTareoPersonalQuery(
    estado === "TODOS" ? undefined : { estado },
  )
  const tipos = query.data ?? []

  function cerrar(actualizado: boolean) {
    setDialogo(null)
    if (actualizado) void query.refetch()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Field className="sm:max-w-48">
          <Select value={estado} onValueChange={(v) => setEstado(v as EstadoMaestroTareo | "TODOS")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="TODOS">Estado: todos</SelectItem>
                <SelectItem value="ACTIVO">Activos</SelectItem>
                <SelectItem value="INACTIVO">Inactivos</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Button onClick={() => setDialogo({ modo: "crear" })}>
          <Plus data-icon="inline-start" />
          Nuevo tipo
        </Button>
      </div>

      {query.error ? (
        <Alert variant="destructive">
          <AlertTitle>Error de API</AlertTitle>
          <AlertDescription>{obtenerMensajeError(query.error)}</AlertDescription>
        </Alert>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground">
        {query.isLoading ? (
          <div className="flex flex-col gap-3 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : tipos.length === 0 ? (
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyTitle>Sin tipos de tareo</EmptyTitle>
              <EmptyDescription>Crea el primer tipo para poder configurar el tareo.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/70 hover:bg-muted/70">
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Codigo</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Forma</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Modificacion</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tipos.map((tipo) => (
                  <TableRow key={tipo.id} className="border-border/80">
                    <TableCell className="font-mono text-xs text-muted-foreground">{tipo.id}</TableCell>
                    <TableCell className="font-mono text-xs">{tipo.codigo}</TableCell>
                    <TableCell>
                      <div className="flex min-w-44 flex-col">
                        <span className="font-medium">{tipo.nombre}</span>
                        <span className="text-xs text-muted-foreground">
                          {tipo.descripcion || "Sin descripcion"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{etiquetaForma(tipo.forma)}</Badge>
                    </TableCell>
                    <TableCell>
                      <EstadoMaestroBadge estado={tipo.estado} />
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatearFecha(tipo.fechaModificacion || tipo.fechaCreacion)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDialogo({ modo: "editar", tipo })}
                        >
                          <Pencil data-icon="inline-start" />
                          Editar
                        </Button>
                        <CambiarEstadoTipoBtn tipo={tipo} onActualizado={() => void query.refetch()} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={dialogo !== null} onOpenChange={(open) => !open && setDialogo(null)}>
        {dialogo ? (
          <TipoTareoDialog
            modo={dialogo.modo}
            tipo={dialogo.modo === "editar" ? dialogo.tipo : undefined}
            onClose={cerrar}
          />
        ) : null}
      </Dialog>
    </div>
  )
}

function CambiarEstadoTipoBtn({
  tipo,
  onActualizado,
}: {
  tipo: TipoTareoPersonalResponse
  onActualizado: () => void
}) {
  const { usuario } = useSesion()
  const activarMutation = useActivarTipoTareoPersonalMutation(tipo.id)
  const inactivarMutation = useInactivarTipoTareoPersonalMutation(tipo.id)
  const pendiente = activarMutation.isPending || inactivarMutation.isPending
  const activo = tipo.estado === "ACTIVO"

  async function cambiar() {
    try {
      if (activo) {
        await inactivarMutation.mutateAsync({ usuarioId: usuario?.nombreUsuario })
      } else {
        await activarMutation.mutateAsync({ usuarioId: usuario?.nombreUsuario })
      }
    } finally {
      // El error de negocio (ej. 409 al inactivar con configuraciones activas) se
      // muestra arriba en el siguiente refetch; aqui solo refrescamos.
      onActualizado()
    }
  }

  return (
    <Button size="sm" variant={activo ? "ghost" : "secondary"} disabled={pendiente} onClick={() => void cambiar()}>
      {activo ? <Ban data-icon="inline-start" /> : <CheckCircle2 data-icon="inline-start" />}
      {activo ? "Inactivar" : "Activar"}
    </Button>
  )
}

// --- Tab: Configuraciones laborales --------------------------------------------

export function ConfiguracionesLaboralesTab() {
  const [tipoTareoId, setTipoTareoId] = useState<string>("TODOS")
  const [estado, setEstado] = useState<EstadoMaestroTareo | "TODOS">("TODOS")
  const [dialogo, setDialogo] = useState<
    | { modo: "crear" }
    | { modo: "editar"; configuracion: ConfiguracionLaboralPersonalResponse }
    | null
  >(null)

  const tiposQuery = useTiposTareoPersonalQuery()
  const tipos = tiposQuery.data ?? []
  const tiposActivos = tipos.filter((item) => item.estado === "ACTIVO")
  const tipoPorId = new Map(tipos.map((item) => [item.id, item]))

  const query = useConfiguracionesLaboralesPersonalQuery({
    ...(tipoTareoId !== "TODOS" ? { tipoTareoId } : {}),
    ...(estado !== "TODOS" ? { estado } : {}),
  })
  const configuraciones = query.data ?? []

  function cerrar(actualizado: boolean) {
    setDialogo(null)
    if (actualizado) void query.refetch()
  }

  function detalleConfiguracion(config: ConfiguracionLaboralPersonalResponse) {
    if (config.regimenCodigo) {
      return `${config.regimenCodigo} · ${config.regimenPatron ?? "-"} (${config.diasTrabajo ?? "-"}x${config.diasDescanso ?? "-"})`
    }
    if (config.horarioCodigo) {
      return `${config.horarioCodigo} · ${config.horaInicio ?? "-"}-${config.horaFin ?? "-"}`
    }
    if (config.turnoCodigo) {
      return `${config.turnoCodigo} · ${config.turnoNombre ?? ""}`.trim()
    }
    return "-"
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Field className="sm:max-w-56">
            <Select value={tipoTareoId} onValueChange={setTipoTareoId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tipo de tareo" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="TODOS">Tipo: todos</SelectItem>
                  {tipos.map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.codigo} - {item.nombre}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field className="sm:max-w-48">
            <Select value={estado} onValueChange={(v) => setEstado(v as EstadoMaestroTareo | "TODOS")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="TODOS">Estado: todos</SelectItem>
                  <SelectItem value="ACTIVO">Activos</SelectItem>
                  <SelectItem value="INACTIVO">Inactivos</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Button onClick={() => setDialogo({ modo: "crear" })} disabled={tiposActivos.length === 0}>
          <Plus data-icon="inline-start" />
          Nueva configuracion
        </Button>
      </div>

      {tiposActivos.length === 0 && !tiposQuery.isLoading ? (
        <Alert>
          <AlertTitle>Primero crea un tipo de tareo activo</AlertTitle>
          <AlertDescription>
            Cada configuracion laboral pertenece a un tipo. Ve a la pestaña &quot;Tipos de tareo&quot;
            y crea (o activa) al menos uno.
          </AlertDescription>
        </Alert>
      ) : null}

      {query.error ? (
        <Alert variant="destructive">
          <AlertTitle>Error de API</AlertTitle>
          <AlertDescription>{obtenerMensajeError(query.error)}</AlertDescription>
        </Alert>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground">
        {query.isLoading ? (
          <div className="flex flex-col gap-3 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : configuraciones.length === 0 ? (
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyTitle>Sin configuraciones laborales</EmptyTitle>
              <EmptyDescription>No hay configuraciones para el filtro aplicado.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/70 hover:bg-muted/70">
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Codigo</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Detalle</TableHead>
                  <TableHead>Reglas</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configuraciones.map((config) => {
                  const tipo = tipoPorId.get(config.tipoTareoId)
                  return (
                    <TableRow key={config.id} className="border-border/80">
                      <TableCell className="font-mono text-xs text-muted-foreground">{config.id}</TableCell>
                      <TableCell className="font-mono text-xs">{config.codigo}</TableCell>
                      <TableCell>
                        <div className="flex min-w-44 flex-col">
                          <span className="font-medium">{config.nombre}</span>
                          <span className="text-xs text-muted-foreground">
                            {config.descripcion || "Sin descripcion"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {tipo ? `${tipo.codigo}` : "Sin tipo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{detalleConfiguracion(config)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {config.esTurnoNocturno ? (
                            <Badge variant="secondary" className="text-[10px]">Nocturno</Badge>
                          ) : null}
                          {config.permiteTrabajoFeriado ? (
                            <Badge variant="secondary" className="text-[10px]">Feriado</Badge>
                          ) : null}
                          {config.permiteHorasExtra ? (
                            <Badge variant="secondary" className="text-[10px]">H. extra</Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <EstadoMaestroBadge estado={config.estado} />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDialogo({ modo: "editar", configuracion: config })}
                          >
                            <Pencil data-icon="inline-start" />
                            Editar
                          </Button>
                          <CambiarEstadoConfigBtn
                            configuracion={config}
                            onActualizado={() => void query.refetch()}
                          />
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
          <ConfiguracionLaboralDialog
            modo={dialogo.modo}
            configuracion={dialogo.modo === "editar" ? dialogo.configuracion : undefined}
            tiposActivos={tiposActivos}
            onClose={cerrar}
          />
        ) : null}
      </Dialog>
    </div>
  )
}

function CambiarEstadoConfigBtn({
  configuracion,
  onActualizado,
}: {
  configuracion: ConfiguracionLaboralPersonalResponse
  onActualizado: () => void
}) {
  const { usuario } = useSesion()
  const activarMutation = useActivarConfiguracionLaboralPersonalMutation(configuracion.id)
  const inactivarMutation = useInactivarConfiguracionLaboralPersonalMutation(configuracion.id)
  const pendiente = activarMutation.isPending || inactivarMutation.isPending
  const activo = configuracion.estado === "ACTIVO"

  async function cambiar() {
    try {
      if (activo) {
        await inactivarMutation.mutateAsync({ usuarioId: usuario?.nombreUsuario })
      } else {
        await activarMutation.mutateAsync({ usuarioId: usuario?.nombreUsuario })
      }
    } finally {
      onActualizado()
    }
  }

  return (
    <Button size="sm" variant={activo ? "ghost" : "secondary"} disabled={pendiente} onClick={() => void cambiar()}>
      {activo ? <Ban data-icon="inline-start" /> : <CheckCircle2 data-icon="inline-start" />}
      {activo ? "Inactivar" : "Activar"}
    </Button>
  )
}
