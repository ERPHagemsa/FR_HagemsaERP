"use client"

import { FileText, Wallet } from "lucide-react"

import { Badge } from "@/compartido/componentes/ui/badge"

import { formatearFecha } from "./socio-negocio-detalle-dato"

/**
 * Forma estructural mínima común a las cuentas/contratos que llegan tanto en el
 * detalle del personal (`CuentaContratoResumen`) como en la asignación completa
 * (`CuentaContratoResponse`). Lo único que necesita la vista es la identidad del
 * nodo y su jerarquía (padre directo + cuenta raíz) ya resuelta por el backend.
 */
export interface NodoCuentaContrato {
  id: number
  tipo: "CUENTA" | "CONTRATO"
  configuracionCodigo?: string
  configuracionNombre?: string
  configuracionPadreTipo?: "CUENTA" | "CONTRATO"
  configuracionPadreCodigo?: string
  configuracionPadreNombre?: string
  cuentaRaizCodigo?: string
  vigenteDesde?: string
  vigenteHasta?: string
  // Flujo de aprobacion jerarquica del detalle (ver asignacion-personal.ts).
  estadoAprobacion?: "PENDIENTE_APROBACION" | "APROBADO" | "RECHAZADO"
  motivoRechazo?: string
}

function vigenciaTexto(desde?: string, hasta?: string) {
  return `${formatearFecha(desde)}${hasta ? ` - ${formatearFecha(hasta)}` : " - actual"}`
}

/**
 * Badge del estado de aprobacion de un detalle cuenta/contrato. Un detalle solo
 * es operativo cuando esta APROBADO; nace PENDIENTE_APROBACION.
 */
function AprobacionBadge({
  estado,
}: {
  estado?: NodoCuentaContrato["estadoAprobacion"]
}) {
  if (!estado) return null
  const config = {
    APROBADO: { label: "Aprobado", className: "border-emerald-500/40 text-emerald-600" },
    PENDIENTE_APROBACION: { label: "Pendiente", className: "border-amber-500/40 text-amber-600" },
    RECHAZADO: { label: "Rechazado", className: "border-destructive/40 text-destructive" },
  }[estado]
  return (
    <Badge variant="outline" className={`text-[10px] ${config.className}`}>
      {config.label}
    </Badge>
  )
}

/**
 * Resuelve a qué cuenta pertenece un contrato, priorizando lo que el backend ya
 * trae en el snapshot y dejando Configuración General solo como respaldo:
 *   1. `cuentaRaizCodigo` (resuelto por el backend, soporta jerarquías de varios niveles).
 *   2. `configuracionPadreCodigo` cuando el padre directo es una CUENTA.
 *   3. mapa contrato→cuenta de CG (compatibilidad con payloads antiguos).
 */
function cuentaDeContrato(
  contrato: NodoCuentaContrato,
  padreDeContrato?: Map<string, string>,
): string | undefined {
  if (contrato.cuentaRaizCodigo) return contrato.cuentaRaizCodigo
  if (contrato.configuracionPadreTipo === "CUENTA" && contrato.configuracionPadreCodigo) {
    return contrato.configuracionPadreCodigo
  }
  return padreDeContrato?.get(contrato.configuracionCodigo ?? "")
}

function NodoContrato({ contrato }: { contrato: NodoCuentaContrato }) {
  // Si el padre directo es otro contrato, lo mostramos para no perder la
  // jerarquía multinivel (subcontrato que cuelga de un contrato marco).
  const dependeDeContrato =
    contrato.configuracionPadreTipo === "CONTRATO" && contrato.configuracionPadreCodigo

  return (
    <div className="rounded-md border border-border/60 bg-card px-3 py-2 text-sm">
      <div className="flex items-center gap-2">
        <FileText data-icon="inline-start" className="text-muted-foreground" />
        <p className="font-medium">
          {contrato.configuracionCodigo} - {contrato.configuracionNombre}
        </p>
        <div className="ml-auto flex items-center gap-1">
          <AprobacionBadge estado={contrato.estadoAprobacion} />
          <Badge variant="secondary" className="text-[10px]">
            Contrato
          </Badge>
        </div>
      </div>
      {contrato.estadoAprobacion === "RECHAZADO" && contrato.motivoRechazo ? (
        <p className="mt-0.5 text-xs text-destructive">Rechazo: {contrato.motivoRechazo}</p>
      ) : null}
      {dependeDeContrato ? (
        <p className="mt-0.5 text-xs text-muted-foreground">
          Depende de {contrato.configuracionPadreCodigo}
          {contrato.configuracionPadreNombre
            ? ` - ${contrato.configuracionPadreNombre}`
            : ""}
        </p>
      ) : null}
      <p className="mt-0.5 text-xs text-muted-foreground">
        {vigenciaTexto(contrato.vigenteDesde, contrato.vigenteHasta)}
      </p>
    </div>
  )
}

/**
 * Relación contractual agrupada: cada cuenta con sus contratos anidados debajo.
 * La pertenencia contrato→cuenta sale del propio snapshot (ver `cuentaDeContrato`);
 * solo cuando ni el payload ni CG la resuelven el contrato se muestra como suelto.
 */
export function JerarquiaCuentasContratos({
  items,
  padreDeContrato,
}: {
  items: NodoCuentaContrato[]
  padreDeContrato?: Map<string, string>
}) {
  const cuentas = items.filter((item) => item.tipo === "CUENTA")
  const contratos = items.filter((item) => item.tipo === "CONTRATO")

  const codigosCuentasAsignadas = new Set(
    cuentas.map((cuenta) => cuenta.configuracionCodigo),
  )
  const contratosHuerfanos = contratos.filter((contrato) => {
    const cuenta = cuentaDeContrato(contrato, padreDeContrato)
    return !cuenta || !codigosCuentasAsignadas.has(cuenta)
  })

  return (
    <div className="flex flex-col gap-3">
      {cuentas.map((cuenta) => {
        const hijos = contratos.filter(
          (contrato) =>
            cuentaDeContrato(contrato, padreDeContrato) === cuenta.configuracionCodigo,
        )
        return (
          <div key={cuenta.id} className="rounded-lg border border-border bg-muted/20 p-3">
            <div className="flex items-center gap-2">
              <Wallet data-icon="inline-start" className="text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {cuenta.configuracionCodigo} - {cuenta.configuracionNombre}
                </p>
                <p className="text-xs text-muted-foreground">
                  Cuenta · {vigenciaTexto(cuenta.vigenteDesde, cuenta.vigenteHasta)}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-1">
                <AprobacionBadge estado={cuenta.estadoAprobacion} />
                <Badge variant="outline" className="text-[10px]">
                  {hijos.length} {hijos.length === 1 ? "contrato" : "contratos"}
                </Badge>
              </div>
            </div>
            {cuenta.estadoAprobacion === "RECHAZADO" && cuenta.motivoRechazo ? (
              <p className="mt-1 text-xs text-destructive">Rechazo: {cuenta.motivoRechazo}</p>
            ) : null}
            {hijos.length > 0 ? (
              <div className="mt-2 flex flex-col gap-2 border-l-2 border-border pl-3">
                {hijos.map((contrato) => (
                  <NodoContrato key={contrato.id} contrato={contrato} />
                ))}
              </div>
            ) : (
              <p className="mt-2 pl-3 text-xs text-muted-foreground">
                Sin contratos en esta cuenta.
              </p>
            )}
          </div>
        )
      })}

      {contratosHuerfanos.length > 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Contratos sin cuenta vinculada
          </p>
          <div className="flex flex-col gap-2">
            {contratosHuerfanos.map((contrato) => (
              <NodoContrato key={contrato.id} contrato={contrato} />
            ))}
          </div>
        </div>
      ) : null}

      {cuentas.length === 0 && contratosHuerfanos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin cuentas ni contratos.</p>
      ) : null}
    </div>
  )
}
