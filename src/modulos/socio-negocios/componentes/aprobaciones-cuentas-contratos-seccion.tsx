"use client"

import { useState } from "react"
import { Check, FileText, ShieldCheck, Wallet, X } from "lucide-react"

import { ApiError } from "@/compartido/api/axios"
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert"
import { Badge } from "@/compartido/componentes/ui/badge"
import { Button } from "@/compartido/componentes/ui/button"
import { Input } from "@/compartido/componentes/ui/input"
import { cn } from "@/compartido/utilidades/utils"

import { useSesion } from "@/modulos/autenticacion/ganchos/use-sesion"

import {
  useAprobarAprobacionCuentaContratoMutation,
  useAsignacionPersonalQuery,
  useRechazarAprobacionCuentaContratoMutation,
} from "../servicios/asignaciones-personal-queries"
import type {
  AsignacionPersonalResponse,
  CuentaContratoAprobacionResponse,
  CuentaContratoResponse,
  EstadoAprobacionCuentaContrato,
} from "../tipos/asignacion-personal"

function obtenerMensajeError(error: unknown) {
  if (error instanceof ApiError) {
    const mensajes = error.errores?.map((item) => item.mensaje).filter(Boolean)
    if (mensajes?.length) return mensajes.join(" ")
  }
  if (error instanceof Error) return error.message
  return "No se pudo completar la operacion."
}

const ETIQUETA_ESTADO: Record<EstadoAprobacionCuentaContrato, string> = {
  APROBADO: "Aprobado",
  PENDIENTE_APROBACION: "Pendiente",
  RECHAZADO: "Rechazado",
}

function claseEstado(estado?: EstadoAprobacionCuentaContrato) {
  if (estado === "APROBADO") return "border-emerald-500/40 text-emerald-600"
  if (estado === "RECHAZADO") return "border-destructive/40 text-destructive"
  return "border-amber-500/40 text-amber-600"
}

function EstadoAprobacionBadge({ estado }: { estado?: EstadoAprobacionCuentaContrato }) {
  if (!estado) return null
  return (
    <Badge variant="outline" className={`text-[11px] ${claseEstado(estado)}`}>
      {ETIQUETA_ESTADO[estado]}
    </Badge>
  )
}

function claveCuentaDeDetalle(detalle: CuentaContratoResponse) {
  if (detalle.tipo === "CUENTA") return detalle.configuracionCodigo || `cuenta-${detalle.id}`
  return (
    detalle.cuentaRaizCodigo ||
    (detalle.configuracionPadreTipo === "CUENTA" ? detalle.configuracionPadreCodigo : undefined) ||
    `sin-cuenta-${detalle.id}`
  )
}

function etiquetaCuentaDeDetalle(detalle: CuentaContratoResponse) {
  if (detalle.tipo === "CUENTA") {
    return `${detalle.configuracionCodigo} - ${detalle.configuracionNombre}`
  }

  if (detalle.cuentaRaizCodigo || detalle.cuentaRaizNombre) {
    return [detalle.cuentaRaizCodigo, detalle.cuentaRaizNombre].filter(Boolean).join(" - ")
  }

  if (detalle.configuracionPadreTipo === "CUENTA") {
    return [detalle.configuracionPadreCodigo, detalle.configuracionPadreNombre]
      .filter(Boolean)
      .join(" - ")
  }

  return "Sin cuenta vinculada"
}

function agruparDetallesPorCuenta(detalles: CuentaContratoResponse[]) {
  const grupos = new Map<
    string,
    { clave: string; etiqueta: string; cuenta?: CuentaContratoResponse; contratos: CuentaContratoResponse[] }
  >()

  detalles.forEach((detalle) => {
    const clave = claveCuentaDeDetalle(detalle)
    const grupo = grupos.get(clave) ?? {
      clave,
      etiqueta: etiquetaCuentaDeDetalle(detalle),
      contratos: [],
    }

    if (detalle.tipo === "CUENTA") {
      grupo.cuenta = detalle
      grupo.etiqueta = etiquetaCuentaDeDetalle(detalle)
    } else {
      grupo.contratos.push(detalle)
    }

    grupos.set(clave, grupo)
  })

  return Array.from(grupos.values())
}

function FilaAprobacion({
  aprobacion,
  decidible,
  pendiente,
  onAprobar,
  onRechazar,
}: {
  aprobacion: CuentaContratoAprobacionResponse
  decidible: boolean
  pendiente: boolean
  onAprobar: (comentario: string) => void
  onRechazar: (motivo: string) => void
}) {
  const [modoRechazo, setModoRechazo] = useState(false)
  const [comentario, setComentario] = useState("")
  const [motivo, setMotivo] = useState("")

  return (
    <div className="rounded-md border border-border/60 bg-card p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {aprobacion.aprobadorNombre || aprobacion.aprobadorCodigo || "Aprobador"}
          </p>
          <p className="text-xs text-muted-foreground">
            {[
              aprobacion.aprobadorCargoNombre,
              aprobacion.aprobadorAreaNombre,
              aprobacion.aprobadorNivelJerarquico,
            ]
              .filter(Boolean)
              .join(" · ") || "Sin datos del aprobador"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {aprobacion.esObligatorio ? (
            <Badge variant="secondary" className="text-[10px]">Obligatorio</Badge>
          ) : (
            <Badge variant="outline" className="text-[10px]">Opcional</Badge>
          )}
          <EstadoAprobacionBadge estado={aprobacion.estadoAprobacion} />
        </div>
      </div>

      {aprobacion.comentario ? (
        <p className="mt-1 text-xs text-muted-foreground">Comentario: {aprobacion.comentario}</p>
      ) : null}
      {aprobacion.estadoAprobacion === "RECHAZADO" && aprobacion.motivoRechazo ? (
        <p className="mt-1 text-xs text-destructive">Rechazo: {aprobacion.motivoRechazo}</p>
      ) : null}

      {decidible ? (
        modoRechazo ? (
          <div className="mt-3 flex flex-col gap-2">
            <Input
              value={motivo}
              placeholder="Motivo del rechazo"
              onChange={(event) => setMotivo(event.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={pendiente || !motivo.trim()}
                onClick={() => onRechazar(motivo.trim())}
              >
                <X data-icon="inline-start" />
                Confirmar rechazo
              </Button>
              <Button type="button" size="sm" variant="ghost" disabled={pendiente} onClick={() => setModoRechazo(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            <Input
              value={comentario}
              placeholder="Comentario (opcional)"
              onChange={(event) => setComentario(event.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                disabled={pendiente}
                onClick={() => onAprobar(comentario.trim())}
              >
                <Check data-icon="inline-start" />
                Aprobar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pendiente}
                onClick={() => setModoRechazo(true)}
              >
                <X data-icon="inline-start" />
                Rechazar
              </Button>
            </div>
          </div>
        )
      ) : null}
    </div>
  )
}

function DetalleAprobacion({
  detalle,
  asignacionId,
  onActualizado,
  ocultarIdentidad = false,
}: {
  detalle: CuentaContratoResponse
  asignacionId: number
  onActualizado: () => void
  ocultarIdentidad?: boolean
}) {
  const { usuario } = useSesion()
  const [error, setError] = useState<string | null>(null)
  const aprobarMutation = useAprobarAprobacionCuentaContratoMutation(asignacionId)
  const rechazarMutation = useRechazarAprobacionCuentaContratoMutation(asignacionId)
  const pendiente = aprobarMutation.isPending || rechazarMutation.isPending

  const aprobaciones = [...(detalle.aprobaciones ?? [])].sort(
    (a, b) => a.ordenAprobacion - b.ordenAprobacion,
  )
  const terminal =
    detalle.estadoAprobacion === "APROBADO" || detalle.estadoAprobacion === "RECHAZADO"
  // Decision secuencial: solo la primera firma aun no decidida (menor orden) es
  // decidible. Tolerante a cualquier estado que no sea terminal.
  const proximaPendiente = aprobaciones.find(
    (item) => item.estadoAprobacion !== "APROBADO" && item.estadoAprobacion !== "RECHAZADO",
  )
  // Detalle pendiente pero sin firmas: se creo sin enviar aprobadores. No hay
  // jerarquia inferida; las firmas se definen explicitamente al crear la
  // asignacion o al reemplazar sus cuentas/contratos, por lo que no hay ninguna
  // decision posible en la UI todavia.
  const pendienteSinFirmas = !terminal && aprobaciones.length === 0

  async function decidir(
    aprobacion: CuentaContratoAprobacionResponse,
    accion: "aprobar" | "rechazar",
    texto: string,
  ) {
    try {
      setError(null)
      const payload = {
        detalleId: detalle.id,
        aprobacionId: aprobacion.id,
        decision:
          accion === "aprobar"
            ? { usuarioId: usuario?.nombreUsuario, comentario: texto || undefined }
            : { usuarioId: usuario?.nombreUsuario, motivoRechazo: texto || undefined },
      }
      if (accion === "aprobar") {
        await aprobarMutation.mutateAsync(payload)
      } else {
        await rechazarMutation.mutateAsync(payload)
      }
      onActualizado()
    } catch (err) {
      setError(obtenerMensajeError(err))
    }
  }

  const Icono = detalle.tipo === "CUENTA" ? Wallet : FileText

  return (
    <div className="rounded-lg border border-border bg-muted/10 p-3">
      {ocultarIdentidad ? null : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icono data-icon="inline-start" className="text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                {detalle.configuracionCodigo} - {detalle.configuracionNombre}
              </p>
              <p className="text-xs text-muted-foreground">
                {detalle.tipo === "CUENTA" ? "Cuenta" : "Contrato"}
              </p>
            </div>
          </div>
          <EstadoAprobacionBadge estado={detalle.estadoAprobacion} />
        </div>
      )}

      {error ? (
        <Alert variant="destructive" className="mt-3">
          <AlertTitle>No se pudo registrar la decision</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {pendienteSinFirmas ? (
        <p className="mt-3 rounded-md border border-dashed border-amber-500/40 bg-amber-500/5 px-3 py-2 text-xs text-amber-700">
          Este detalle esta pendiente, pero se creo sin aprobadores (firmas). Las firmas no se
          generan automaticamente: se definen explicitamente al crear la asignacion o al reemplazar
          sus cuentas y contratos indicando los aprobadores. Para habilitar la aprobacion, reemplaza
          las cuentas/contratos del detalle incluyendo sus aprobadores.
        </p>
      ) : (
        <div className={cn("flex flex-col gap-2", !ocultarIdentidad && "mt-3")}>
          {aprobaciones.map((aprobacion) => (
            <FilaAprobacion
              key={aprobacion.id}
              aprobacion={aprobacion}
              decidible={!terminal && proximaPendiente?.id === aprobacion.id}
              pendiente={pendiente}
              onAprobar={(comentario) => void decidir(aprobacion, "aprobar", comentario)}
              onRechazar={(motivo) => void decidir(aprobacion, "rechazar", motivo)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Panel de aprobacion de cuentas/contratos de una asignacion. Lista cada detalle
 * con su cadena de firmas y permite decidir (aprobar/rechazar) la firma pendiente
 * de menor orden. Solo muestra detalles que tienen flujo de aprobacion.
 */
export function AprobacionesCuentasContratosSeccion({
  asignacion,
  onActualizado,
  soloLectura = false,
}: {
  asignacion: AsignacionPersonalResponse
  onActualizado: () => void
  soloLectura?: boolean
}) {
  // El listado embebido puede no traer las firmas (`aprobaciones`), que son las
  // que habilitan decidir por `aprobacionId`. En modo editable consultamos el
  // detalle completo (GET /asignaciones-personal/:id), que si las incluye.
  const detalleQuery = useAsignacionPersonalQuery(
    asignacion.id,
    !soloLectura && asignacion.cuentasContratos.length > 0,
  )
  const asignacionEfectiva = detalleQuery.data ?? asignacion
  const refrescar = () => {
    void detalleQuery.refetch()
    onActualizado()
  }

  const detallesConAprobacion = asignacionEfectiva.cuentasContratos.filter(
    (detalle) => (detalle.aprobaciones?.length ?? 0) > 0 || detalle.estadoAprobacion != null,
  )
  const grupos = agruparDetallesPorCuenta(detallesConAprobacion)

  if (detallesConAprobacion.length === 0) {
    // Aun consultando el detalle: evitamos parpadeo y avisamos que se cargan las firmas.
    if (!soloLectura && detalleQuery.isLoading && asignacion.cuentasContratos.length > 0) {
      return (
        <div className="border-t border-border px-4 py-4 text-sm text-muted-foreground">
          Cargando aprobaciones de cuentas y contratos...
        </div>
      )
    }
    return null
  }

  const pendientes = detallesConAprobacion.filter(
    (detalle) => detalle.estadoAprobacion === "PENDIENTE_APROBACION",
  ).length

  return (
    <div className="border-t border-border px-4 py-4">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary" />
          <div>
            <p className="text-sm font-semibold">Aprobacion de cuentas y contratos</p>
            <p className="text-xs text-muted-foreground">
              Cada detalle requiere la firma de uno o varios aprobadores en orden. Solo es operativo
              cuando queda aprobado.
            </p>
          </div>
        </div>
        {pendientes > 0 ? (
          <Badge variant="outline" className="border-amber-500/40 text-amber-600">
            {pendientes} pendiente{pendientes === 1 ? "" : "s"}
          </Badge>
        ) : null}
      </div>

      {detalleQuery.error ? (
        <Alert variant="destructive" className="mb-3">
          <AlertTitle>No se pudo cargar el detalle de aprobaciones</AlertTitle>
          <AlertDescription>{obtenerMensajeError(detalleQuery.error)}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-3">
        {grupos.map((grupo) => {
          const detallesGrupo = [grupo.cuenta, ...grupo.contratos].filter(
            (detalle): detalle is CuentaContratoResponse => Boolean(detalle),
          )

          return (
            <div key={grupo.clave} className="rounded-xl border border-border bg-muted/10 p-3">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Wallet data-icon="inline-start" className="text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold">{grupo.etiqueta}</p>
                    <p className="text-xs text-muted-foreground">
                      Cuenta con {grupo.contratos.length} {grupo.contratos.length === 1 ? "contrato" : "contratos"} asociado{grupo.contratos.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                <EstadoAprobacionBadge estado={grupo.cuenta?.estadoAprobacion} />
              </div>
              <div className="flex flex-col gap-2">
                {detallesGrupo.map((detalle) =>
                  soloLectura ? (
                    <ResumenSoloLectura key={detalle.id} detalle={detalle} />
                  ) : (
                    <DetalleAprobacion
                      key={detalle.id}
                      detalle={detalle}
                      asignacionId={asignacionEfectiva.id}
                      onActualizado={refrescar}
                      ocultarIdentidad={detalle.tipo === "CUENTA"}
                    />
                  ),
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ResumenSoloLectura({ detalle }: { detalle: CuentaContratoResponse }) {
  const Icono = detalle.tipo === "CUENTA" ? Wallet : FileText
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/10 p-3">
      <div className="flex items-center gap-2">
        <Icono data-icon="inline-start" className="text-muted-foreground" />
        <p className="text-sm font-medium">
          {detalle.configuracionCodigo} - {detalle.configuracionNombre}
        </p>
      </div>
      <EstadoAprobacionBadge estado={detalle.estadoAprobacion} />
    </div>
  )
}
