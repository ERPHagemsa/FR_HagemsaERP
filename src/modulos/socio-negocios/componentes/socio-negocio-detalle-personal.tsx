import {
  AtSign,
  BadgeCheck,
  CalendarClock,
  CalendarRange,
  IdCard,
  MapPin,
  Phone,
  User,
  UserRound,
} from "lucide-react"

import { cn } from "@/compartido/utilidades/utils"

import type { SocioDeNegocioResponse } from "../tipos/socio-negocio"
import { EstadoBadge } from "./estado-badge"
import { DatoVer, SeccionDetalle, formatearFecha } from "./socio-negocio-detalle-dato"
import { SocioNegocioDetallePersonalAsignaciones } from "./socio-negocio-detalle-personal-asignaciones"

function DisponibilidadesVigentes({
  socio,
}: {
  socio: SocioDeNegocioResponse
}) {
  const disponibilidades = socio.disponibilidadesVigentes ?? []

  return (
    <section className="overflow-hidden rounded-xl border border-border/70 bg-card text-card-foreground">
      <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold">Disponibilidad vigente</h2>
          <p className="text-sm leading-5 text-muted-foreground">
            Periodos configurados como referencia operativa. No es asistencia ni marcacion.
          </p>
        </div>
        {disponibilidades.length > 0 ? (
          <span className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
            {disponibilidades.length} vigente{disponibilidades.length === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-3 p-4">
        {disponibilidades.length > 0 ? (
          disponibilidades.map((item) => (
            <div key={item.id} className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  {item.estadoDisponibilidad.replaceAll("_", " ")}
                </span>
                <span className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
                  {item.origen}
                </span>
                <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarRange className="size-3.5" />
                  {formatearFecha(item.vigenteDesde)} - {item.vigenteHasta ? formatearFecha(item.vigenteHasta) : "indefinido"}
                </span>
              </div>
              <p className="mt-3 text-sm font-medium">{item.motivo}</p>
              {item.observacion ? (
                <p className="mt-1 text-sm text-muted-foreground">{item.observacion}</p>
              ) : null}
              <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                <span>
                  {item.asignacionPersonalCuentaContratoId
                    ? "Cuenta/contrato asignado"
                    : "Sin cuenta/contrato especifico"}
                </span>
                <span>
                  {[item.configuracionLaboralNombre, item.regimenPatron, item.horasPorDia ? `${item.horasPorDia} h/dia` : undefined]
                    .filter(Boolean)
                    .join(" · ") || "Sin detalle de jornada"}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            No hay disponibilidades configuradas vigentes para este personal.
          </div>
        )}
      </div>
    </section>
  )
}

/** Nombre legible del personal, con respaldos cuando faltan partes del nombre. */
function nombreCompletoPersonal(socio: SocioDeNegocioResponse) {
  return (
    socio.nombreCompleto ||
    [socio.primerNombre, socio.segundoNombre, socio.apellidoPaterno, socio.apellidoMaterno]
      .filter(Boolean)
      .join(" ") ||
    socio.numeroDocumento
  )
}

/** Iniciales (apellido paterno + primer nombre) para el avatar del encabezado. */
function inicialesPersonal(socio: SocioDeNegocioResponse) {
  const partes = [socio.primerNombre, socio.apellidoPaterno].filter(Boolean) as string[]
  if (partes.length === 0) {
    const nombre = nombreCompletoPersonal(socio)
    return nombre.slice(0, 2).toUpperCase()
  }
  return partes
    .map((parte) => parte.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2)
}

/** Fila etiqueta/valor con icono, para las tarjetas de contacto y trazabilidad. */
function FilaDato({
  icono: Icono,
  label,
  value,
}: {
  icono: typeof User
  label: string
  value?: string | number | null
}) {
  return (
    <div className="flex items-start gap-3 px-5 py-3.5">
      <Icono className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 break-words text-sm font-medium">{value || "-"}</p>
      </div>
    </div>
  )
}

/**
 * Detalle de un socio de tipo PERSONAL presentado como ficha de empleado:
 * encabezado de identidad, contacto, trazabilidad y asignaciones laborales.
 * SAP no aplica al personal, por eso no se muestran código SAP, sincronización
 * ni nombre comercial.
 */
export function SocioNegocioDetallePersonal({
  socio,
}: {
  socio: SocioDeNegocioResponse
}) {
  const anulado = socio.estadoRegistro === "ANULADO"

  return (
    <div className="flex flex-col gap-5">
      {/* Encabezado de identidad: avatar, nombre y estados del empleado */}
      <section className="overflow-hidden rounded-xl border border-border/70 bg-card text-card-foreground">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <div
            className={cn(
              "flex size-16 shrink-0 items-center justify-center rounded-full text-xl font-semibold",
              anulado
                ? "bg-muted text-muted-foreground"
                : "bg-primary/10 text-primary",
            )}
            aria-hidden
          >
            {inicialesPersonal(socio)}
          </div>
          <div className="min-w-0 flex-1">
            <h2
              className={cn(
                "truncate text-lg font-semibold",
                anulado && "text-muted-foreground line-through",
              )}
            >
              {nombreCompletoPersonal(socio)}
            </h2>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <IdCard className="size-3.5" />
                {socio.numeroDocumento}
              </span>
              <span aria-hidden>·</span>
              <span>{socio.tipo}</span>
              <span aria-hidden>·</span>
              <span>Origen {socio.origen}</span>
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <EstadoBadge estado={socio.estado} />
              <EstadoBadge estado={socio.estadoRegistro} />
            </div>
          </div>
        </div>
      </section>

      {/* Contacto y trazabilidad lado a lado */}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="overflow-hidden rounded-xl border border-border/70 bg-card text-card-foreground">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <UserRound className="size-4 text-muted-foreground" />
            <h3 className="text-base font-semibold">Contacto</h3>
          </div>
          <div className="divide-y divide-border">
            <FilaDato icono={User} label="Persona de contacto" value={socio.contacto} />
            <FilaDato icono={MapPin} label="Dirección" value={socio.direccion} />
            <FilaDato icono={AtSign} label="Correo" value={socio.correo} />
            <FilaDato icono={Phone} label="Celular" value={socio.numeroCelular} />
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-border/70 bg-card text-card-foreground">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <CalendarClock className="size-4 text-muted-foreground" />
            <h3 className="text-base font-semibold">Trazabilidad</h3>
          </div>
          <div className="divide-y divide-border">
            <FilaDato
              icono={BadgeCheck}
              label="Creación"
              value={`${formatearFecha(socio.fechaCreacion)} · ${socio.usuarioCreacion || "-"}`}
            />
            <FilaDato
              icono={CalendarClock}
              label="Última modificación"
              value={`${formatearFecha(socio.fechaModificacion)} · ${socio.usuarioModificacion || "-"}`}
            />
            <FilaDato icono={IdCard} label="ID del registro" value={socio.id} />
            <FilaDato
              icono={IdCard}
              label="Registro anterior"
              value={socio.registroAnteriorId ?? "Sin antecesor"}
            />
          </div>
        </section>
      </div>

      {/* Datos de baja, solo si el registro fue dado de baja o anulado */}
      {socio.estado === "INACTIVO" || anulado ? (
        <SeccionDetalle
          titulo="Baja del registro"
          descripcion="Motivo y fecha del cierre de este registro de personal."
        >
          <DatoVer label="Fecha de baja" value={formatearFecha(socio.fechaBaja)} />
          <DatoVer label="Motivo de baja" value={socio.motivoBaja} />
          <DatoVer label="Usuario de baja" value={socio.usuarioBajaId} />
          {anulado ? (
            <>
              <DatoVer label="Fecha de anulación" value={formatearFecha(socio.fechaAnulacion)} />
              <DatoVer label="Motivo de anulación" value={socio.motivoAnulacion} />
              <DatoVer label="Usuario de anulación" value={socio.usuarioAnulacionId} />
            </>
          ) : null}
        </SeccionDetalle>
      ) : null}

      <SocioNegocioDetallePersonalAsignaciones asignaciones={socio.asignaciones} />
      <DisponibilidadesVigentes socio={socio} />
    </div>
  )
}
