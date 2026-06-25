"use client"

import {
  Briefcase,
  Building2,
  CalendarRange,
  Clock,
  Hourglass,
  Layers,
  Network,
  UserCog,
} from "lucide-react"

import { Badge } from "@/compartido/componentes/ui/badge"
import { cn } from "@/compartido/utilidades/utils"

import type { AsignacionPersonalResumen } from "../tipos/socio-negocio"
import { EstadoBadge } from "./estado-badge"
import { JerarquiaCuentasContratos } from "./jerarquia-cuentas-contratos"
import { formatearFecha } from "./socio-negocio-detalle-dato"

function vigenciaTexto(desde?: string, hasta?: string) {
  return `${formatearFecha(desde)}${hasta ? ` - ${formatearFecha(hasta)}` : " - actual"}`
}

function diasDesde(fecha?: string) {
  if (!fecha) return undefined
  const inicio = new Date(fecha)
  if (Number.isNaN(inicio.getTime())) return undefined
  const hoy = new Date()
  const diferencia = hoy.getTime() - inicio.getTime()
  if (diferencia < 0) return 0
  return Math.floor(diferencia / 86_400_000)
}

/** Combina código y nombre en "CODIGO · Nombre", omitiendo lo que falte. */
function codigoNombre(codigo?: string, nombre?: string) {
  return [codigo, nombre].filter(Boolean).join(" · ") || undefined
}

/** Celda etiqueta/valor con icono usada dentro de la tarjeta de asignación. */
function DatoAsignacion({
  icono: Icono,
  label,
  value,
}: {
  icono: typeof Briefcase
  label: string
  value?: string | number | null
}) {
  return (
    <div className="bg-card p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        <Icono className="size-3.5" />
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium" title={value ? String(value) : undefined}>
        {value || "-"}
      </p>
    </div>
  )
}

/** Resume la jornada legible a partir de los campos canonicos de la asignacion. */
function jornadaTexto(asignacion: AsignacionPersonalResumen) {
  const horas = asignacion.horasPorDia
  const rango =
    asignacion.horaInicio && asignacion.horaFin
      ? `${asignacion.horaInicio} - ${asignacion.horaFin}`
      : undefined
  const partes = [rango, horas != null ? `${horas} h/día` : undefined].filter(Boolean)
  return partes.length > 0 ? partes.join(" · ") : undefined
}

export function AsignacionPersonalCard({
  asignacion,
}: {
  asignacion: AsignacionPersonalResumen
}) {
  // La jerarquía cuenta→contrato ya viene resuelta en el payload
  // (cuentaRaizCodigo / configuracionPadreCodigo), por eso no se consulta
  // Configuración General para agruparla.
  const relacion = asignacion.cuentasContratos ?? []
  const noVigente = asignacion.estado && asignacion.estado !== "VIGENTE"
  const jornada = jornadaTexto(asignacion)
  const tareo =
    codigoNombre(asignacion.tipoTareoCodigo, asignacion.tipoTareoNombre) ??
    codigoNombre(asignacion.configuracionLaboralCodigo, asignacion.configuracionLaboralNombre)
  const horario =
    codigoNombre(asignacion.horarioCodigo, asignacion.horarioNombre) ??
    codigoNombre(asignacion.turnoCodigo, asignacion.turnoNombre) ??
    (asignacion.regimenPatron
      ? `${asignacion.regimenNombre ?? "Regimen"} · ${asignacion.regimenPatron}`
      : undefined)
  const diasTrabajando = diasDesde(asignacion.vigenteDesde)

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border bg-card",
        noVigente ? "border-destructive/30 bg-destructive/5" : "border-border",
      )}
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
        <Badge variant="outline">Asignación #{asignacion.id}</Badge>
        <EstadoBadge estado={asignacion.estado ?? "VIGENTE"} />
        <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarRange className="size-3.5" />
          {vigenciaTexto(asignacion.vigenteDesde, asignacion.vigenteHasta)}
        </span>
      </div>

      <div className="grid gap-px bg-border sm:grid-cols-3">
        <DatoAsignacion
          icono={CalendarRange}
          label="Inicio de trabajo"
          value={formatearFecha(asignacion.vigenteDesde)}
        />
        <DatoAsignacion
          icono={CalendarRange}
          label="Fin de asignación"
          value={asignacion.vigenteHasta ? formatearFecha(asignacion.vigenteHasta) : "Vigente / sin fecha fin"}
        />
        <DatoAsignacion
          icono={Hourglass}
          label="Tiempo en asignación"
          value={diasTrabajando != null ? `${diasTrabajando} días` : "Sin fecha de inicio"}
        />
      </div>

      {/* Estructura organizacional */}
      <div className="grid gap-px border-t border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        <DatoAsignacion
          icono={Briefcase}
          label="Cargo"
          value={codigoNombre(asignacion.cargoCodigo, asignacion.cargoNombre)}
        />
        <DatoAsignacion
          icono={Building2}
          label="Sede"
          value={codigoNombre(asignacion.sedeCodigo, asignacion.sedeNombre)}
        />
        <DatoAsignacion
          icono={Network}
          label="Área"
          value={codigoNombre(asignacion.areaCodigo, asignacion.areaNombre)}
        />
        <DatoAsignacion
          icono={UserCog}
          label="Jefe directo"
          value={codigoNombre(asignacion.jefeCodigo, asignacion.jefeNombre)}
        />
      </div>

      {/* Jornada, tareo y horario (solo si el detalle los trae) */}
      {tareo || horario || jornada ? (
        <div className="border-t border-border px-4 py-4">
          <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
            <Clock className="size-4 text-muted-foreground" />
            Jornada y tareo
          </p>
          <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
            <DatoAsignacion icono={Layers} label="Tipo de tareo" value={tareo} />
            <DatoAsignacion icono={Clock} label="Horario" value={horario} />
            <DatoAsignacion icono={CalendarRange} label="Jornada" value={jornada} />
          </div>
        </div>
      ) : null}

      {/* Cuentas y contratos */}
      <div className="border-t border-border px-4 py-4">
        <p className="mb-3 text-sm font-semibold">Cuentas y contratos</p>
        {relacion.length > 0 ? (
          <JerarquiaCuentasContratos items={relacion} />
        ) : (
          <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            Esta asignación no tiene cuentas ni contratos registrados.
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Muestra (solo lectura) las asignaciones embebidas en el detalle del personal.
 * La gestión completa (crear/editar) vive en "Gestionar asignaciones".
 */
export function SocioNegocioDetallePersonalAsignaciones({
  asignaciones,
}: {
  asignaciones?: AsignacionPersonalResumen[]
}) {
  const total = asignaciones?.length ?? 0

  return (
    <section className="overflow-hidden rounded-xl border border-border/70 bg-card text-card-foreground">
      <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold">Asignaciones</h2>
          <p className="text-sm leading-5 text-muted-foreground">
            Cargo, estructura organizacional, jornada, cuentas y contratos vigentes del personal.
          </p>
        </div>
        {total > 0 ? (
          <Badge variant="outline" className="shrink-0">
            {total} {total === 1 ? "asignación" : "asignaciones"}
          </Badge>
        ) : null}
      </div>
      <div className="flex flex-col gap-3 p-4">
        {asignaciones && asignaciones.length > 0 ? (
          asignaciones.map((asignacion) => (
            <AsignacionPersonalCard key={asignacion.id} asignacion={asignacion} />
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            Este personal todavía no tiene asignaciones registradas.
          </div>
        )}
      </div>
    </section>
  )
}
