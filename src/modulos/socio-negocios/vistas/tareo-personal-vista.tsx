"use client"

import { useState } from "react"
import { CheckCircle2, Ban, Clock, Pencil, Plus } from "lucide-react"

import { ApiError } from "@/compartido/api/axios"
import { SiteHeader } from "@/compartido/componentes/site-header"
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert"
import { Badge } from "@/compartido/componentes/ui/badge"
import { Button } from "@/compartido/componentes/ui/button"
import { Checkbox } from "@/compartido/componentes/ui/checkbox"
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
import { Skeleton } from "@/compartido/componentes/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/compartido/componentes/ui/tabs"

import { useSesion } from "@/modulos/autenticacion/ganchos/use-sesion"

import {
  useActivarConfiguracionLaboralPersonalMutation,
  useActivarTipoTareoPersonalMutation,
  useConfiguracionesLaboralesPersonalQuery,
  useCrearConfiguracionLaboralPersonalMutation,
  useCrearTipoTareoPersonalMutation,
  useInactivarConfiguracionLaboralPersonalMutation,
  useInactivarTipoTareoPersonalMutation,
  useModificarConfiguracionLaboralPersonalMutation,
  useModificarTipoTareoPersonalMutation,
  useTiposTareoPersonalQuery,
} from "../servicios/tareo-personal-queries"
import type {
  ConfiguracionLaboralPersonalResponse,
  EstadoMaestroTareo,
  FormaTareo,
  TipoRegimenPersonal,
  TipoTareoPersonalResponse,
} from "../tipos/tareo-personal"

const FORMAS_TAREO: Array<{ value: FormaTareo; label: string }> = [
  { value: "POR_TURNO", label: "Por turno" },
  { value: "POR_HORARIO", label: "Por horario" },
  { value: "POR_REGIMEN", label: "Por regimen" },
]

const TIPOS_REGIMEN: Array<{ value: TipoRegimenPersonal; label: string }> = [
  { value: "ADMINISTRATIVO", label: "Administrativo" },
  { value: "OPERATIVO", label: "Operativo" },
]

function etiquetaForma(forma: FormaTareo) {
  return FORMAS_TAREO.find((item) => item.value === forma)?.label ?? forma
}

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
  if (Number.isNaN(valor.getTime())) return fecha
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "short", timeStyle: "short" }).format(valor)
}

function soloFecha(fecha?: string | null) {
  if (!fecha) return ""
  return String(fecha).slice(0, 10)
}

function fechaApi(fecha: string) {
  return new Date(`${fecha}T00:00:00.000Z`).toISOString()
}

function EstadoMaestroBadge({ estado }: { estado: EstadoMaestroTareo }) {
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

function TipoTareoDialog({
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
        <DialogTitle>{modo === "crear" ? "Nuevo tipo de tareo" : `Editar tipo #${tipo?.id}`}</DialogTitle>
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

function ConfiguracionLaboralDialog({
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
    if (esTurno && !turnoCodigo.trim()) {
      setError("La forma POR_TURNO exige el codigo de turno.")
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
          {modo === "crear" ? "Nueva configuracion laboral" : `Editar configuracion #${configuracion?.id}`}
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
                      {item.codigo} - {item.nombre} ({etiquetaForma(item.forma)})
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

// --- Tab: Tipos de tareo -------------------------------------------------------

function TiposTareoTab() {
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

function ConfiguracionesLaboralesTab() {
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
                          {tipo ? `${tipo.codigo}` : `#${config.tipoTareoId}`}
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

// --- Vista principal -----------------------------------------------------------

export function TareoPersonalVista() {
  return (
    <>
      <SiteHeader
        title="Maestros de tareo"
        breadcrumbs={[
          { title: "Socio de Negocio", href: "/socio-negocios" },
          { title: "Maestros de tareo" },
        ]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          <section className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Clock className="size-5 text-primary" />
              <h1 className="text-xl font-semibold tracking-normal">Tareo y configuracion laboral</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Catalogo interno de BC-01. Define los tipos de tareo (forma) y sus configuraciones
              laborales (turno, horario, regimen, feriados, nocturnidad, horas extra y vigencia) que
              luego se referencian en la asignacion de personal.
            </p>
          </section>

          <Tabs defaultValue="tipos" className="gap-4">
            <TabsList variant="line">
              <TabsTrigger value="tipos">Tipos de tareo</TabsTrigger>
              <TabsTrigger value="configuraciones">Configuraciones laborales</TabsTrigger>
            </TabsList>
            <TabsContent value="tipos">
              <TiposTareoTab />
            </TabsContent>
            <TabsContent value="configuraciones">
              <ConfiguracionesLaboralesTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  )
}
