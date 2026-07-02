"use client"

import { useState } from "react"
import { Ban, CheckCircle2 } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert"
import { Badge } from "@/compartido/componentes/ui/badge"
import { Button } from "@/compartido/componentes/ui/button"
import { Checkbox } from "@/compartido/componentes/ui/checkbox"
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/compartido/componentes/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/compartido/componentes/ui/field"
import { Input } from "@/compartido/componentes/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select"

import { useSesion } from "@/modulos/autenticacion/ganchos/use-sesion"

import {
  useCrearConfiguracionLaboralPersonalMutation,
  useCrearTipoTareoPersonalMutation,
  useModificarConfiguracionLaboralPersonalMutation,
  useModificarTipoTareoPersonalMutation,
} from "../../servicios/tareo-personal-queries"
import type {
  ConfiguracionLaboralPersonalResponse,
  EstadoMaestroTareo,
  FormaTareo,
  TipoRegimenPersonal,
  TipoTareoPersonalResponse,
} from "../../tipos/tareo-personal"
import {
  FORMAS_TAREO,
  TIPOS_REGIMEN,
  fechaApi,
  obtenerMensajeError,
  soloFecha,
} from "./utilidades"

export function EstadoMaestroBadge({ estado }: { estado: EstadoMaestroTareo }) {
  const activo = estado === "ACTIVO"
  return (
    <Badge
      variant={activo ? "outline" : "destructive"}
      className="h-6 gap-1.5 rounded-full border-border bg-background px-2.5 text-[12px] font-medium text-foreground shadow-xs"
    >
      {activo ? (
        <CheckCircle2 className="size-3.5 text-emerald-500" />
      ) : (
        <Ban className="size-3.5 text-destructive" />
      )}
      {activo ? "Activo" : "Inactivo"}
    </Badge>
  )
}

// --- Dialogo: Tipo de tareo ----------------------------------------------------

export function TipoTareoDialog({
  modo,
  tipo,
  onClose,
}: {
  modo: "crear" | "editar"
  tipo?: TipoTareoPersonalResponse
  onClose: (actualizado: boolean) => void
}) {
  const { usuario } = useSesion()
  const [codigo, setCodigo] = useState(tipo?.codigo ?? "")
  const [nombre, setNombre] = useState(tipo?.nombre ?? "")
  const [forma, setForma] = useState<FormaTareo | "">(tipo?.forma ?? "")
  const [descripcion, setDescripcion] = useState(tipo?.descripcion ?? "")
  const [error, setError] = useState<string | null>(null)

  const crearMutation = useCrearTipoTareoPersonalMutation()
  const modificarMutation = useModificarTipoTareoPersonalMutation(tipo?.id ?? 0)
  const pendiente = crearMutation.isPending || modificarMutation.isPending

  async function guardar() {
    if (modo === "crear" && !codigo.trim()) {
      setError("El codigo es obligatorio.")
      return
    }
    if (!nombre.trim()) {
      setError("El nombre es obligatorio.")
      return
    }
    if (!forma) {
      setError("Selecciona la forma de tareo.")
      return
    }
    try {
      setError(null)
      if (modo === "crear") {
        await crearMutation.mutateAsync({
          codigo: codigo.trim().toUpperCase(),
          nombre: nombre.trim(),
          forma,
          descripcion: descripcion.trim() || undefined,
          usuarioId: usuario?.nombreUsuario,
        })
      } else {
        await modificarMutation.mutateAsync({
          nombre: nombre.trim(),
          forma,
          descripcion: descripcion.trim() || null,
          usuarioId: usuario?.nombreUsuario,
        })
      }
      onClose(true)
    } catch (err) {
      setError(obtenerMensajeError(err))
    }
  }

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{modo === "crear" ? "Nuevo tipo de tareo" : "Editar tipo de tareo"}</DialogTitle>
        <DialogDescription>
          Define la forma de tareo. El detalle (turno, horario o regimen) se carga luego en cada
          configuracion laboral.
        </DialogDescription>
      </DialogHeader>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudo guardar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-4">
        <Field>
          <FieldLabel>Codigo *</FieldLabel>
          <Input
            value={codigo}
            disabled={modo === "editar"}
            placeholder="Ej. POR_REGIMEN"
            onChange={(event) => setCodigo(event.target.value)}
          />
          {modo === "editar" ? (
            <FieldDescription>El codigo es inmutable tras el alta.</FieldDescription>
          ) : (
            <FieldDescription>Se normaliza en mayusculas y es unico.</FieldDescription>
          )}
        </Field>
        <Field>
          <FieldLabel>Nombre *</FieldLabel>
          <Input
            value={nombre}
            placeholder="Ej. Por regimen"
            onChange={(event) => setNombre(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel>Forma *</FieldLabel>
          <Select value={forma || ""} onValueChange={(v) => setForma(v as FormaTareo)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona la forma" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {FORMAS_TAREO.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Descripcion</FieldLabel>
          <Input
            value={descripcion}
            placeholder="Opcional"
            onChange={(event) => setDescripcion(event.target.value)}
          />
        </Field>
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

// --- Dialogo: Configuracion laboral --------------------------------------------

function CampoCheckbox({
  id,
  checked,
  onChange,
  label,
  disabled = false,
}: {
  id: string
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  disabled?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onChange(value === true)}
      />
      <FieldLabel htmlFor={id} className="cursor-pointer text-sm font-normal">
        {label}
      </FieldLabel>
    </div>
  )
}

export function ConfiguracionLaboralDialog({
  modo,
  configuracion,
  tiposActivos,
  onClose,
}: {
  modo: "crear" | "editar"
  configuracion?: ConfiguracionLaboralPersonalResponse
  tiposActivos: TipoTareoPersonalResponse[]
  onClose: (actualizado: boolean) => void
}) {
  const { usuario } = useSesion()
  const [tipoTareoId, setTipoTareoId] = useState(
    configuracion ? String(configuracion.tipoTareoId) : "",
  )
  const [codigo, setCodigo] = useState(configuracion?.codigo ?? "")
  const [nombre, setNombre] = useState(configuracion?.nombre ?? "")
  const [tipoRegimen, setTipoRegimen] = useState<TipoRegimenPersonal | "">(
    configuracion?.tipoRegimen ?? "",
  )
  const [turnoCodigo, setTurnoCodigo] = useState(configuracion?.turnoCodigo ?? "")
  const [turnoNombre, setTurnoNombre] = useState(configuracion?.turnoNombre ?? "")
  const [horarioCodigo, setHorarioCodigo] = useState(configuracion?.horarioCodigo ?? "")
  const [horarioNombre, setHorarioNombre] = useState(configuracion?.horarioNombre ?? "")
  const [horaInicio, setHoraInicio] = useState(configuracion?.horaInicio ?? "")
  const [horaFin, setHoraFin] = useState(configuracion?.horaFin ?? "")
  const [regimenCodigo, setRegimenCodigo] = useState(configuracion?.regimenCodigo ?? "")
  const [regimenNombre, setRegimenNombre] = useState(configuracion?.regimenNombre ?? "")
  const [regimenPatron, setRegimenPatron] = useState(configuracion?.regimenPatron ?? "")
  const [diasTrabajo, setDiasTrabajo] = useState(
    configuracion?.diasTrabajo != null ? String(configuracion.diasTrabajo) : "",
  )
  const [diasDescanso, setDiasDescanso] = useState(
    configuracion?.diasDescanso != null ? String(configuracion.diasDescanso) : "",
  )
  const [horasPorDia, setHorasPorDia] = useState(
    configuracion?.horasPorDia != null ? String(configuracion.horasPorDia) : "",
  )
  // Feriados
  const [permiteTrabajoFeriado, setPermiteTrabajoFeriado] = useState(
    configuracion?.permiteTrabajoFeriado ?? false,
  )
  const [requiereAprobacionTrabajoFeriado, setRequiereAprobacionTrabajoFeriado] = useState(
    configuracion?.requiereAprobacionTrabajoFeriado ?? false,
  )
  // Nocturnidad
  const [esTurnoNocturno, setEsTurnoNocturno] = useState(configuracion?.esTurnoNocturno ?? false)
  const [horaInicioNocturna, setHoraInicioNocturna] = useState(
    configuracion?.horaInicioNocturna ?? "",
  )
  const [horaFinNocturna, setHoraFinNocturna] = useState(configuracion?.horaFinNocturna ?? "")
  // Horas extra
  const [permiteHorasExtra, setPermiteHorasExtra] = useState(
    configuracion?.permiteHorasExtra ?? false,
  )
  const [requiereAprobacionHorasExtra, setRequiereAprobacionHorasExtra] = useState(
    configuracion?.requiereAprobacionHorasExtra ?? false,
  )
  const [maxHorasExtraDia, setMaxHorasExtraDia] = useState(
    configuracion?.maxHorasExtraDia != null ? String(configuracion.maxHorasExtraDia) : "",
  )
  const [maxHorasExtraSemana, setMaxHorasExtraSemana] = useState(
    configuracion?.maxHorasExtraSemana != null ? String(configuracion.maxHorasExtraSemana) : "",
  )
  // Vigencia
  const [vigenteDesde, setVigenteDesde] = useState(soloFecha(configuracion?.vigenteDesde))
  const [vigenteHasta, setVigenteHasta] = useState(soloFecha(configuracion?.vigenteHasta))
  const [error, setError] = useState<string | null>(null)

  const crearMutation = useCrearConfiguracionLaboralPersonalMutation()
  const modificarMutation = useModificarConfiguracionLaboralPersonalMutation(configuracion?.id ?? 0)
  const pendiente = crearMutation.isPending || modificarMutation.isPending

  // La forma del tipo seleccionado decide que detalle se exige y se muestra.
  const tipoSeleccionado = tiposActivos.find((item) => String(item.id) === tipoTareoId)
  const forma = tipoSeleccionado?.forma
  const esTurno = forma === "POR_TURNO"
  const esHorario = forma === "POR_HORARIO"
  const esRegimen = forma === "POR_REGIMEN"

  const numeroOpcional = (valor: string) => (valor.trim() === "" ? undefined : Number(valor))
  const numeroONull = (valor: string) => (valor.trim() === "" ? null : Number(valor))

  async function guardar() {
    if (modo === "crear" && !tipoTareoId) {
      setError("Selecciona el tipo de tareo.")
      return
    }
    if (modo === "crear" && !codigo.trim()) {
      setError("El codigo es obligatorio.")
      return
    }
    if (!nombre.trim()) {
      setError("El nombre es obligatorio.")
      return
    }
    if (esTurno && (!turnoCodigo.trim() || !horaInicio.trim() || !horaFin.trim())) {
      setError("La forma POR_TURNO exige codigo de turno, hora de inicio y hora de fin.")
      return
    }
    if (esHorario && (!horarioCodigo.trim() || !horaInicio.trim() || !horaFin.trim())) {
      setError("La forma POR_HORARIO exige codigo de horario, hora de inicio y hora de fin.")
      return
    }
    if (esRegimen && (!regimenCodigo.trim() || !regimenPatron.trim() || !diasTrabajo || !diasDescanso)) {
      setError("La forma POR_REGIMEN exige codigo, patron, dias de trabajo y dias de descanso.")
      return
    }
    if (esTurnoNocturno && (!horaInicioNocturna.trim() || !horaFinNocturna.trim())) {
      setError("Si es turno nocturno, indica la hora de inicio y fin nocturnas.")
      return
    }
    if (vigenteHasta && vigenteDesde && vigenteHasta < vigenteDesde) {
      setError("La vigencia final no puede ser anterior a la inicial.")
      return
    }

    try {
      setError(null)
      if (modo === "crear") {
        await crearMutation.mutateAsync({
          tipoTareoId: Number(tipoTareoId),
          codigo: codigo.trim().toUpperCase(),
          nombre: nombre.trim(),
          tipoRegimen: tipoRegimen || undefined,
          turnoCodigo: turnoCodigo.trim() || undefined,
          turnoNombre: turnoNombre.trim() || undefined,
          horarioCodigo: horarioCodigo.trim() || undefined,
          horarioNombre: horarioNombre.trim() || undefined,
          horaInicio: horaInicio.trim() || undefined,
          horaFin: horaFin.trim() || undefined,
          regimenCodigo: regimenCodigo.trim() || undefined,
          regimenNombre: regimenNombre.trim() || undefined,
          regimenPatron: regimenPatron.trim() || undefined,
          diasTrabajo: numeroOpcional(diasTrabajo),
          diasDescanso: numeroOpcional(diasDescanso),
          horasPorDia: numeroOpcional(horasPorDia),
          permiteTrabajoFeriado,
          requiereAprobacionTrabajoFeriado,
          esTurnoNocturno,
          horaInicioNocturna: horaInicioNocturna.trim() || undefined,
          horaFinNocturna: horaFinNocturna.trim() || undefined,
          permiteHorasExtra,
          requiereAprobacionHorasExtra,
          maxHorasExtraDia: numeroOpcional(maxHorasExtraDia),
          maxHorasExtraSemana: numeroOpcional(maxHorasExtraSemana),
          vigenteDesde: vigenteDesde ? fechaApi(vigenteDesde) : undefined,
          vigenteHasta: vigenteHasta ? fechaApi(vigenteHasta) : undefined,
          usuarioId: usuario?.nombreUsuario,
        })
      } else {
        await modificarMutation.mutateAsync({
          nombre: nombre.trim(),
          tipoRegimen: tipoRegimen || undefined,
          turnoCodigo: turnoCodigo.trim() || null,
          turnoNombre: turnoNombre.trim() || null,
          horarioCodigo: horarioCodigo.trim() || null,
          horarioNombre: horarioNombre.trim() || null,
          horaInicio: horaInicio.trim() || null,
          horaFin: horaFin.trim() || null,
          regimenCodigo: regimenCodigo.trim() || null,
          regimenNombre: regimenNombre.trim() || null,
          regimenPatron: regimenPatron.trim() || null,
          diasTrabajo: numeroONull(diasTrabajo),
          diasDescanso: numeroONull(diasDescanso),
          horasPorDia: numeroONull(horasPorDia),
          permiteTrabajoFeriado,
          requiereAprobacionTrabajoFeriado,
          esTurnoNocturno,
          horaInicioNocturna: horaInicioNocturna.trim() || null,
          horaFinNocturna: horaFinNocturna.trim() || null,
          permiteHorasExtra,
          requiereAprobacionHorasExtra,
          maxHorasExtraDia: numeroONull(maxHorasExtraDia),
          maxHorasExtraSemana: numeroONull(maxHorasExtraSemana),
          vigenteDesde: vigenteDesde ? fechaApi(vigenteDesde) : undefined,
          vigenteHasta: vigenteHasta ? fechaApi(vigenteHasta) : null,
          usuarioId: usuario?.nombreUsuario,
        })
      }
      onClose(true)
    } catch (err) {
      setError(obtenerMensajeError(err))
    }
  }

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>
          {modo === "crear" ? "Nueva configuracion laboral" : "Editar configuracion laboral"}
        </DialogTitle>
        <DialogDescription>
          El detalle exigido depende de la forma del tipo (turno, horario o regimen). Ademas define
          feriados, nocturnidad, horas extra y vigencia.
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
            <FieldLabel>Tipo de tareo *</FieldLabel>
            <Select
              value={tipoTareoId || ""}
              disabled={modo === "editar"}
              onValueChange={setTipoTareoId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un tipo activo" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {tiposActivos.map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.codigo} - {item.nombre} ({FORMAS_TAREO.find((f) => f.value === item.forma)?.label ?? item.forma})
                    </SelectItem>
                  ))}
                  {tiposActivos.length === 0 ? (
                    <SelectItem value="__vacio" disabled>
                      No hay tipos activos. Crea uno primero.
                    </SelectItem>
                  ) : null}
                </SelectGroup>
              </SelectContent>
            </Select>
            {modo === "editar" ? (
              <FieldDescription>El tipo es inmutable tras el alta.</FieldDescription>
            ) : null}
          </Field>
          <Field>
            <FieldLabel>Codigo *</FieldLabel>
            <Input
              value={codigo}
              disabled={modo === "editar"}
              placeholder="Ej. R14X7-NOCHE"
              onChange={(event) => setCodigo(event.target.value)}
            />
          </Field>
        </div>

        <Field>
          <FieldLabel>Nombre *</FieldLabel>
          <Input
            value={nombre}
            placeholder="Ej. Regimen 14x7 noche"
            onChange={(event) => setNombre(event.target.value)}
          />
        </Field>

        <Field className="sm:max-w-xs">
          <FieldLabel>Tipo de regimen</FieldLabel>
          <Select
            value={tipoRegimen || ""}
            onValueChange={(v) => setTipoRegimen(v as TipoRegimenPersonal)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Opcional" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {TIPOS_REGIMEN.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        {esTurno ? (
          <FieldSet className="rounded-lg border border-border p-4">
            <FieldLegend>Turno</FieldLegend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Codigo de turno *</FieldLabel>
                <Input value={turnoCodigo} onChange={(e) => setTurnoCodigo(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Nombre de turno</FieldLabel>
                <Input value={turnoNombre} onChange={(e) => setTurnoNombre(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Hora inicio * (HH:mm)</FieldLabel>
                <Input value={horaInicio} placeholder="19:00" onChange={(e) => setHoraInicio(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Hora fin * (HH:mm)</FieldLabel>
                <Input value={horaFin} placeholder="07:00" onChange={(e) => setHoraFin(e.target.value)} />
              </Field>
            </div>
          </FieldSet>
        ) : null}

        {esHorario ? (
          <FieldSet className="rounded-lg border border-border p-4">
            <FieldLegend>Horario</FieldLegend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Codigo de horario *</FieldLabel>
                <Input value={horarioCodigo} onChange={(e) => setHorarioCodigo(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Nombre de horario</FieldLabel>
                <Input value={horarioNombre} onChange={(e) => setHorarioNombre(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Hora inicio * (HH:mm)</FieldLabel>
                <Input value={horaInicio} placeholder="07:00" onChange={(e) => setHoraInicio(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Hora fin * (HH:mm)</FieldLabel>
                <Input value={horaFin} placeholder="19:00" onChange={(e) => setHoraFin(e.target.value)} />
              </Field>
            </div>
          </FieldSet>
        ) : null}

        {esRegimen ? (
          <FieldSet className="rounded-lg border border-border p-4">
            <FieldLegend>Regimen</FieldLegend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Codigo de regimen *</FieldLabel>
                <Input value={regimenCodigo} onChange={(e) => setRegimenCodigo(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Nombre de regimen</FieldLabel>
                <Input value={regimenNombre} onChange={(e) => setRegimenNombre(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Patron * (NxM)</FieldLabel>
                <Input value={regimenPatron} placeholder="14x7" onChange={(e) => setRegimenPatron(e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Dias trabajo *</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    value={diasTrabajo}
                    onChange={(e) => setDiasTrabajo(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel>Dias descanso *</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    value={diasDescanso}
                    onChange={(e) => setDiasDescanso(e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </FieldSet>
        ) : null}

        <Field className="sm:max-w-xs">
          <FieldLabel>Horas por dia</FieldLabel>
          <Input
            type="number"
            min={0}
            max={24}
            value={horasPorDia}
            placeholder="Opcional"
            onChange={(e) => setHorasPorDia(e.target.value)}
          />
        </Field>

        <FieldSet className="rounded-lg border border-border p-4">
          <FieldLegend>Feriados</FieldLegend>
          <div className="flex flex-col gap-3">
            <CampoCheckbox
              id="permite-feriado"
              checked={permiteTrabajoFeriado}
              onChange={setPermiteTrabajoFeriado}
              label="Permite trabajo en feriado"
            />
            <CampoCheckbox
              id="aprob-feriado"
              checked={requiereAprobacionTrabajoFeriado}
              onChange={setRequiereAprobacionTrabajoFeriado}
              disabled={!permiteTrabajoFeriado}
              label="Requiere aprobacion para trabajar en feriado"
            />
          </div>
        </FieldSet>

        <FieldSet className="rounded-lg border border-border p-4">
          <FieldLegend>Nocturnidad</FieldLegend>
          <div className="flex flex-col gap-3">
            <CampoCheckbox
              id="es-nocturno"
              checked={esTurnoNocturno}
              onChange={setEsTurnoNocturno}
              label="Es turno nocturno"
            />
            {esTurnoNocturno ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Hora inicio nocturna * (HH:mm)</FieldLabel>
                  <Input
                    value={horaInicioNocturna}
                    placeholder="22:00"
                    onChange={(e) => setHoraInicioNocturna(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel>Hora fin nocturna * (HH:mm)</FieldLabel>
                  <Input
                    value={horaFinNocturna}
                    placeholder="06:00"
                    onChange={(e) => setHoraFinNocturna(e.target.value)}
                  />
                </Field>
              </div>
            ) : null}
          </div>
        </FieldSet>

        <FieldSet className="rounded-lg border border-border p-4">
          <FieldLegend>Horas extra</FieldLegend>
          <div className="flex flex-col gap-3">
            <CampoCheckbox
              id="permite-extra"
              checked={permiteHorasExtra}
              onChange={setPermiteHorasExtra}
              label="Permite horas extra"
            />
            <CampoCheckbox
              id="aprob-extra"
              checked={requiereAprobacionHorasExtra}
              onChange={setRequiereAprobacionHorasExtra}
              disabled={!permiteHorasExtra}
              label="Requiere aprobacion para horas extra"
            />
            {permiteHorasExtra ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Max horas extra por dia</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    value={maxHorasExtraDia}
                    placeholder="Ej. 4"
                    onChange={(e) => setMaxHorasExtraDia(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel>Max horas extra por semana</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    value={maxHorasExtraSemana}
                    placeholder="Ej. 12"
                    onChange={(e) => setMaxHorasExtraSemana(e.target.value)}
                  />
                </Field>
              </div>
            ) : null}
          </div>
        </FieldSet>

        <FieldSet className="rounded-lg border border-border p-4">
          <FieldLegend>Vigencia</FieldLegend>
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
              <FieldDescription>Dejalo vacio si continua vigente.</FieldDescription>
            </Field>
          </div>
        </FieldSet>

        {!forma && modo === "crear" ? (
          <p className="text-sm text-muted-foreground">
            Selecciona un tipo de tareo para ver el detalle a completar.
          </p>
        ) : null}
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
