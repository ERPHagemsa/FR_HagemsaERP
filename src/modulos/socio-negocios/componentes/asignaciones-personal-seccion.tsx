"use client"

import { useState } from "react"
import { ArchiveX, History, Pencil, Plus } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/compartido/componentes/ui/alert-dialog"
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
import { Skeleton } from "@/compartido/componentes/ui/skeleton"
import { cn } from "@/compartido/utilidades/utils"

import { useSesion } from "@/modulos/autenticacion/ganchos/use-sesion"

import {
  useAsignacionesPorPersonalQuery,
  useHistorialAsignacionPersonalQuery,
  useModificarAsignacionPersonalMutation,
} from "../servicios/asignaciones-personal-queries"
import { useLineaHistoricaPersonalQuery } from "../servicios/socio-negocios-queries"
import type { AsignacionPersonalResponse } from "../tipos/asignacion-personal"
import type { AsignacionPersonalResumen } from "../tipos/socio-negocio"
import { AprobacionesCuentasContratosSeccion } from "./aprobaciones-cuentas-contratos-seccion"
import { EstadoBadge } from "./estado-badge"
import { JerarquiaCuentasContratos } from "./jerarquia-cuentas-contratos"
import { AsignacionFormulario } from "./asignaciones-personal/asignacion-formulario"
import { formatearFecha, obtenerMensajeError } from "./asignaciones-personal/utilidades"

const ETIQUETAS_HISTORIAL_ASIGNACION = {
  ASIGNACION_CREADA: "Asignacion creada",
  ASIGNACION_MODIFICADA: "Cargo, ubicacion o vigencia modificados",
  CUENTAS_CONTRATOS_REEMPLAZADOS: "Cuentas y contrato cambiados",
  ASIGNACION_FINALIZADA: "Asignacion finalizada",
  ASIGNACION_ANULADA: "Asignacion anulada",
} as const

function HistorialAsignacionDialog({
  asignacion,
  onClose,
}: {
  asignacion: AsignacionPersonalResponse
  onClose: () => void
}) {
  const historialQuery = useHistorialAsignacionPersonalQuery(asignacion.id)
  const historial = historialQuery.data ?? []

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>Historial de la asignacion</DialogTitle>
        <DialogDescription>
          Revisa cambios de cargo, ubicacion, vigencia, cuentas y contrato.
        </DialogDescription>
      </DialogHeader>

      {historialQuery.error ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudo cargar el historial</AlertTitle>
          <AlertDescription>{obtenerMensajeError(historialQuery.error)}</AlertDescription>
        </Alert>
      ) : historialQuery.isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : historial.length === 0 ? (
        <Empty className="py-10">
          <EmptyHeader>
            <EmptyTitle>Sin movimientos registrados</EmptyTitle>
            <EmptyDescription>Esta asignacion aun no tiene cambios en su historial.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {historial.map((evento) => (
            <div key={evento.id} className="rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">
                    {ETIQUETAS_HISTORIAL_ASIGNACION[evento.accion]}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatearFecha(evento.fechaAccion)} · {evento.usuarioAccion}
                  </p>
                </div>
                {evento.accion === "CUENTAS_CONTRATOS_REEMPLAZADOS" ? (
                  <Badge variant="secondary">Cambio contractual</Badge>
                ) : null}
              </div>
              {evento.datosAnteriores || evento.datosNuevos ? (
                <details className="mt-3 text-sm">
                  <summary className="cursor-pointer font-medium text-muted-foreground">
                    Ver detalle registrado
                  </summary>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="min-w-0 rounded-md bg-muted/30 p-3">
                      <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                        Antes
                      </p>
                      <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs">
                        {JSON.stringify(evento.datosAnteriores ?? null, null, 2)}
                      </pre>
                    </div>
                    <div className="min-w-0 rounded-md bg-muted/30 p-3">
                      <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                        Despues
                      </p>
                      <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs">
                        {JSON.stringify(evento.datosNuevos ?? null, null, 2)}
                      </pre>
                    </div>
                  </div>
                </details>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

function AsignacionCard({
  asignacion,
  onActualizado,
  soloLectura = false,
}: {
  asignacion: AsignacionPersonalResponse
  onActualizado: () => void
  soloLectura?: boolean
}) {
  const puedeEditar = !soloLectura && asignacion.estado === "VIGENTE"
  // El editor arranca CERRADO: al abrir la asignacion se ve primero el resumen de
  // cuentas/contratos y su panel de aprobacion (con las firmas pendientes). Editar
  // es una accion explicita via boton, no el estado por defecto; de lo contrario el
  // form tapaba la aprobacion y no habia forma de intuir que habia algo que aprobar.
  const [editorAbierto, setEditorAbierto] = useState(false)
  const [confirmarAnulacion, setConfirmarAnulacion] = useState(false)
  const [errorAnulacion, setErrorAnulacion] = useState<string | null>(null)
  const [historialAbierto, setHistorialAbierto] = useState(false)
  const relacionVigente = asignacion.cuentasContratos.filter((item) => item.estado === "VIGENTE")
  const noVigente = asignacion.estado !== "VIGENTE"
  // Cuentas/contratos aun pendientes de aprobacion: se muestra en la cabecera para
  // que el pendiente sea evidente sin abrir el panel de aprobacion.
  const pendientesAprobacion = asignacion.cuentasContratos.filter(
    (item) => item.estadoAprobacion === "PENDIENTE_APROBACION",
  ).length
  const { usuario } = useSesion()
  const anularMutation = useModificarAsignacionPersonalMutation(asignacion.id, {
    onSuccess: onActualizado,
  })

  function cerrarEditor(actualizado: boolean) {
    if (actualizado) {
      onActualizado()
    } else {
      setEditorAbierto(false)
    }
  }

  async function anularAsignacion() {
    if (!usuario?.nombreUsuario) {
      setErrorAnulacion("No se pudo identificar al usuario de la sesion.")
      return
    }

    try {
      setErrorAnulacion(null)
      await anularMutation.mutateAsync({
        estado: "ANULADA",
        vigenteHasta: new Date().toISOString(),
        usuarioId: usuario.nombreUsuario,
      })
      setConfirmarAnulacion(false)
    } catch (error) {
      setErrorAnulacion(obtenerMensajeError(error))
    }
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border bg-card",
        noVigente ? "border-destructive/30 bg-destructive/5" : "border-border",
      )}
    >
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <EstadoBadge estado={asignacion.estado} />
          {pendientesAprobacion > 0 ? (
            <Badge variant="outline" className="border-amber-500/40 text-amber-600">
              {pendientesAprobacion} cuenta/contrato por aprobar
            </Badge>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {puedeEditar ? (
            <Button size="sm" variant="outline" onClick={() => setEditorAbierto((prev) => !prev)}>
              <Pencil data-icon="inline-start" />
              {editorAbierto ? "Ocultar edicion" : "Modificar asignacion"}
            </Button>
          ) : null}
          {puedeEditar ? (
            <Button size="sm" variant="outline" onClick={() => setConfirmarAnulacion(true)}>
              <ArchiveX data-icon="inline-start" />
              Anular asignacion
            </Button>
          ) : null}
          <Button size="sm" variant="outline" onClick={() => setHistorialAbierto(true)}>
            <History data-icon="inline-start" />
            Ver historial
          </Button>
        </div>
      </div>

      <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Cargo", value: asignacion.cargoNombre },
          { label: "Sede", value: asignacion.sedeNombre },
          { label: "Area", value: asignacion.areaNombre },
          { label: "Jefe", value: asignacion.jefeNombre },
          { label: "Tipo de horario", value: asignacion.tipoTareoNombre },
          {
            label: "Configuracion del horario",
            value:
              asignacion.configuracionLaboralNombre ??
              asignacion.regimenNombre ??
              asignacion.horarioNombre ??
              asignacion.turnoNombre,
          },
          // Hora entrada/salida del turno/horario. Solo se muestra si el snapshot
          // trae horas (las formas POR_REGIMEN no las usan y llegan vacias).
          ...(asignacion.horaInicio || asignacion.horaFin
            ? [
                {
                  label: "Horario",
                  value: [asignacion.horaInicio, asignacion.horaFin]
                    .filter(Boolean)
                    .join(" - "),
                },
              ]
            : []),
          {
            label: "En la posicion desde",
            value: `${formatearFecha(asignacion.vigenteDesde)}${
              asignacion.vigenteHasta ? ` - ${formatearFecha(asignacion.vigenteHasta)}` : " - actual"
            }`,
          },
        ].map((dato) => (
          <div key={dato.label} className="bg-card p-3">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {dato.label}
            </p>
            <p className="mt-1 truncate text-sm font-medium">{dato.value || "-"}</p>
          </div>
        ))}
      </div>

      {soloLectura || !editorAbierto ? (
        <div className="border-t border-border px-4 py-4">
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">Cuenta y contrato asignado</p>
              <p className="text-xs text-muted-foreground">
                Cada cuenta puede tener un contrato asociado de forma opcional.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={relacionVigente.length > 0 ? "secondary" : "outline"}>
                {relacionVigente.length > 0 ? "Asignado" : "Sin asignar"}
              </Badge>
              {puedeEditar ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setEditorAbierto(true)}
                >
                  <Pencil data-icon="inline-start" />
                  Modificar cuenta/contrato
                </Button>
              ) : null}
            </div>
          </div>

          {relacionVigente.length > 0 ? (
            <JerarquiaCuentasContratos items={relacionVigente} />
          ) : (
            <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              Esta asignacion todavia no tiene cuentas registradas.
            </div>
          )}
        </div>
      ) : null}

      {puedeEditar && editorAbierto ? (
        <div className="border-t border-border p-4">
          <AsignacionFormulario
            key={`editar-${asignacion.id}-${asignacion.fechaModificacion}`}
            modo="editar"
            asignacion={asignacion}
            personalId={asignacion.personalId}
            onClose={cerrarEditor}
          />
        </div>
      ) : null}

      {!editorAbierto ? (
        <AprobacionesCuentasContratosSeccion
          asignacion={asignacion}
          soloLectura={soloLectura || noVigente}
          onActualizado={onActualizado}
        />
      ) : null}

      <Dialog open={historialAbierto} onOpenChange={setHistorialAbierto}>
        {historialAbierto ? (
          <HistorialAsignacionDialog
            asignacion={asignacion}
            onClose={() => setHistorialAbierto(false)}
          />
        ) : null}
      </Dialog>

      <AlertDialog open={confirmarAnulacion} onOpenChange={setConfirmarAnulacion}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anular asignacion vigente</AlertDialogTitle>
            <AlertDialogDescription>
              Usa esta accion solo si la asignacion fue creada por error. La asignacion quedara
              anulada, se conservara en el historial y el personal podra recibir una nueva
              asignacion vigente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {errorAnulacion ? (
            <Alert variant="destructive">
              <AlertTitle>No se pudo anular</AlertTitle>
              <AlertDescription>{errorAnulacion}</AlertDescription>
            </Alert>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={anularMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={anularMutation.isPending}
              onClick={(event) => {
                event.preventDefault()
                void anularAsignacion()
              }}
            >
              {anularMutation.isPending ? "Anulando..." : "Anular asignacion"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export function AsignacionesPersonalSeccion({
  personalId,
  titulo = "Asignaciones, cuentas y contratos",
  descripcion = "Asignaciones de cargo, estructura organizacional, cuentas y contratos del personal.",
  permitirCrear = true,
  soloLectura = false,
  vacioDescripcion,
}: {
  personalId: string | number
  titulo?: string
  descripcion?: string
  permitirCrear?: boolean
  soloLectura?: boolean
  vacioTitulo?: string
  vacioDescripcion?: string
}) {
  const [crearAbierto, setCrearAbierto] = useState(false)
  const asignacionesQuery = useAsignacionesPorPersonalQuery(personalId)
  const asignaciones = asignacionesQuery.data ?? []
  // Regla de negocio: un PERSONAL solo puede tener UNA asignacion VIGENTE
  // (unicidad por personal_id en el backend). Si ya tiene una vigente, la via es
  // editar la existente, no crear otra. Las cuentas/contratos sí son varios,
  // pero viven dentro de esa única asignación.
  const asignacionVigente = asignaciones.find((item) => item.estado === "VIGENTE")
  const asignacionesHistoricas = asignaciones.filter((item) => item.estado !== "VIGENTE")
  const yaTieneAsignacion = Boolean(asignacionVigente)
  const puedeCrear = permitirCrear && !soloLectura && !yaTieneAsignacion
  // Para reutilizar: la asignacion mas reciente (aunque ya no este vigente)
  // sirve como plantilla al crear una nueva.
  const ultimaAsignacion =
    asignaciones.length > 0
      ? [...asignaciones].sort((a, b) =>
          (b.fechaModificacion ?? b.fechaCreacion).localeCompare(
            a.fechaModificacion ?? a.fechaCreacion,
          ),
        )[0]
      : undefined
  // Reingreso: cada recontratacion crea un registro nuevo (personalId nuevo) sin
  // asignacion propia. Si este registro aun no tiene ninguna, consultamos la
  // linea historica y tomamos la ultima asignacion del registro anterior para
  // ofrecer reusarla al recontratar (no se reactiva la vieja; se copia).
  const sinHistorialPropio = !asignacionesQuery.isLoading && asignaciones.length === 0
  const lineaQuery = useLineaHistoricaPersonalQuery(
    String(personalId),
    permitirCrear && !soloLectura && sinHistorialPropio,
  )
  const asignacionPrevia = (() => {
    const previas = lineaQuery.data?.registroAnteriorInmediato?.asignaciones ?? []
    const candidata =
      previas.find((item: AsignacionPersonalResumen) => item.estado !== "ANULADA") ??
      previas[0]
    if (!candidata) return undefined
    // La forma del resumen es compatible con lo que lee la reutilizacion
    // (cargo/sede/area y cuentas/contratos); se adapta al tipo de respuesta.
    return {
      ...candidata,
      personalId: Number(personalId) || 0,
      cuentasContratos: candidata.cuentasContratos ?? [],
    } as unknown as AsignacionPersonalResponse
  })()
  const esReingreso = Boolean(
    lineaQuery.data && (lineaQuery.data.totalReingresos ?? 0) > 0,
  )
  // Al recontratar, la plantilla sale del registro anterior; en operacion normal,
  // de la asignacion mas reciente del mismo registro.
  const ultimaAsignacionEfectiva = ultimaAsignacion ?? asignacionPrevia
  const descripcionVacia =
    vacioDescripcion ?? "No hay asignaciones registradas para este personal."

  function cerrarCrear(actualizado: boolean) {
    setCrearAbierto(false)
    if (actualizado) void asignacionesQuery.refetch()
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border/70 bg-card text-card-foreground">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">{titulo}</h2>
          <p className="text-sm leading-5 text-muted-foreground">{descripcion}</p>
        </div>
        {puedeCrear ? (
          <Button size="sm" onClick={() => setCrearAbierto(true)} disabled={crearAbierto}>
            <Plus data-icon="inline-start" />
            Crear asignacion
          </Button>
        ) : permitirCrear && yaTieneAsignacion ? (
          <Badge variant="outline">Asignacion vigente · modifica la existente</Badge>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 p-4">
        {asignacionesQuery.error ? (
          <Alert variant="destructive">
            <AlertTitle>Error de API</AlertTitle>
            <AlertDescription>{obtenerMensajeError(asignacionesQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {asignacionesQuery.isLoading ? (
          <>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        ) : (
          <>
            {esReingreso && puedeCrear && asignacionPrevia && !crearAbierto ? (
              <Alert>
                <AlertTitle>Trabajador reincorporado</AlertTitle>
                <AlertDescription>
                  Este trabajador ya laboro antes. Al crear su asignacion puedes reutilizar la
                  configuracion de su ultima etapa (cargo, sede, area, cuentas y contratos) con la
                  opcion &quot;Usar la ultima configuracion&quot;.
                </AlertDescription>
              </Alert>
            ) : null}

            {crearAbierto ? (
              <AsignacionFormulario
                modo="crear"
                personalId={personalId}
                ultimaAsignacion={ultimaAsignacionEfectiva}
                onClose={cerrarCrear}
              />
            ) : null}

            {asignacionVigente ? (
              <AsignacionCard
                key={asignacionVigente.id}
                asignacion={asignacionVigente}
                onActualizado={() => void asignacionesQuery.refetch()}
                soloLectura={soloLectura}
              />
            ) : !crearAbierto ? (
              <Empty className="py-10">
                <EmptyHeader>
                  <EmptyTitle>Sin asignacion vigente</EmptyTitle>
                  <EmptyDescription>{descripcionVacia}</EmptyDescription>
                </EmptyHeader>
                {puedeCrear ? (
                  <Button size="sm" onClick={() => setCrearAbierto(true)}>
                    <Plus data-icon="inline-start" />
                    Crear asignacion
                  </Button>
                ) : null}
              </Empty>
            ) : null}

            {asignacionesHistoricas.length > 0 ? (
              <Alert>
                <AlertTitle>Asignaciones anteriores</AlertTitle>
                <AlertDescription>
                  Este personal tiene {asignacionesHistoricas.length} asignacion(es) finalizada(s) o
                  anulada(s). No se muestran como configuracion actual y no bloquean crear una nueva
                  asignacion vigente.
                </AlertDescription>
              </Alert>
            ) : null}
          </>
        )}
      </div>
    </section>
  )
}
