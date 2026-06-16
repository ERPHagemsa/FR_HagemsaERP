"use client"

import { useState } from "react"
import {
  CheckCircle2,
  CircleX,
  Clock,
  FileText,
  History,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react"

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
import { cn } from "@/compartido/utilidades/utils"
import { ApiError } from "@/compartido/api/axios"

import { useConfiguracionGeneralQuery } from "@/modulos/configuracion-general/servicios/configuracion-general-queries"
import { useSesion } from "@/modulos/autenticacion/ganchos/use-sesion"
import type {
  ConfiguracionGeneralResponse,
  TipoDatoMaestro,
} from "@/modulos/configuracion-general/tipos/configuracion-general"

import {
  useAprobarAsignacionPersonalMutation,
  useAsignacionesPorPersonalQuery,
  useCrearAsignacionPersonalMutation,
  useHistorialAsignacionPersonalQuery,
  useModificarAsignacionPersonalMutation,
  useReemplazarCuentasContratosMutation,
} from "../servicios/asignaciones-personal-queries"
import type {
  AsignacionPersonalResponse,
  CuentaContrato,
  TipoAsignacionCuentaContrato,
} from "../tipos/asignacion-personal"

type CampoOrganizacion = {
  key: "cargoId" | "ubicacionFiltroId" | "sedeId" | "areaId"
  label: string
  tipo: TipoDatoMaestro
}

type ValoresOrganizacion = Record<CampoOrganizacion["key"], string>

const VALORES_ORGANIZACION_VACIOS: ValoresOrganizacion = {
  cargoId: "",
  ubicacionFiltroId: "",
  sedeId: "",
  areaId: "",
}

function obtenerMensajeError(error: unknown) {
  if (error instanceof ApiError) {
    const mensajesValidacion = error.errores
      ?.map((item) => item.mensaje)
      .filter(Boolean)

    if (mensajesValidacion?.length) {
      const mensaje = mensajesValidacion.join(" ")
      if (mensaje.includes("El personal debe estar aprobado, activo y con registro activo")) {
        return "Para guardar una asignacion, primero aprueba el personal y verifica que este activo y no anulado."
      }
      return mensaje
    }
  }

  if (error instanceof Error) {
    if (error.message.includes("El personal debe estar aprobado, activo y con registro activo")) {
      return "Para guardar una asignacion, primero aprueba el personal y verifica que este activo y no anulado."
    }
    return error.message
  }

  return "No se pudo completar la operacion."
}

function formatearFecha(fecha?: string | null) {
  if (!fecha) return "-"
  const valor = new Date(fecha)
  if (Number.isNaN(valor.getTime())) return fecha
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" }).format(valor)
}

function soloFecha(fecha?: string | null) {
  if (!fecha) return ""
  return String(fecha).slice(0, 10)
}

function fechaApi(fecha: string) {
  return new Date(`${fecha}T00:00:00.000Z`).toISOString()
}

function obtenerEtiquetaCatalogo(item: ConfiguracionGeneralResponse) {
  if (item.tipoDatoMaestro === "CUENTA" || item.tipoDatoMaestro === "CONTRATO") {
    const nivel =
      item.nivelCuentaContrato ??
      (item.tipoDatoMaestro === "CUENTA" ? 1 : "-")
    return `Nivel ${nivel} - ${item.codigo} - ${item.nombre}`
  }

  if (item.tipoDatoMaestro === "UBICACION" && item.distrito) {
    const referencia = [item.distrito, item.provincia, item.departamento]
      .filter(Boolean)
      .join(", ")
    return `${item.nombre} - ${referencia}`
  }

  return `${item.codigo} - ${item.nombre}`
}

function crearCuentaContratoDesdeCatalogo(
  item: ConfiguracionGeneralResponse,
  tipo: TipoAsignacionCuentaContrato,
  vigenteDesde: string,
  vigenteHasta?: string,
  orden = 1,
): CuentaContrato {
  return {
    tipo,
    configuracionId: item.id,
    vigenteDesde,
    vigenteHasta,
    orden,
  }
}

function contratoPerteneceACuentas(
  contrato: ConfiguracionGeneralResponse,
  cuentasIds: ReadonlySet<string>,
  contratosCatalogo: ConfiguracionGeneralResponse[],
) {
  const contratosPorId = new Map(
    contratosCatalogo.map((item) => [item.id, item]),
  )
  const visitados = new Set<string>()
  let padreId = contrato.contratoPadreId

  while (padreId && !visitados.has(padreId)) {
    if (cuentasIds.has(padreId)) return true

    visitados.add(padreId)
    padreId = contratosPorId.get(padreId)?.contratoPadreId ?? null
  }

  return false
}

function SelectCatalogo({
  tipo,
  value,
  onChange,
  enabled,
  placeholder,
  includeNone = true,
  filtrarItems,
  soloContratosFinales = false,
}: {
  tipo: TipoDatoMaestro
  value: string
  onChange: (item: ConfiguracionGeneralResponse | null) => void
  enabled: boolean
  placeholder: string
  includeNone?: boolean
  filtrarItems?: (item: ConfiguracionGeneralResponse) => boolean
  soloContratosFinales?: boolean
}) {
  const query = useConfiguracionGeneralQuery(
    {
      tipoDatoMaestro: tipo,
      estado: "ACTIVO",
      estadoRegistro: "ACTIVO",
      page: 1,
      pageSize: 100,
      sortBy: "nombre",
      sortOrder: "asc",
    },
  )
  const itemsBase = query.data?.datos ?? []
  const contratosPadre = new Set(
    itemsBase
      .map((item) => item.contratoPadreId)
      .filter((id): id is string => Boolean(id)),
  )
  const items = itemsBase
    .filter((item) => !filtrarItems || filtrarItems(item))
    .filter(
      (item) =>
        !soloContratosFinales ||
        (item.tipoDatoMaestro === "CONTRATO" && !contratosPadre.has(item.id)),
    )
    .sort((a, b) => {
    if (tipo !== "CUENTA" && tipo !== "CONTRATO") return 0
    return (a.nivelCuentaContrato ?? 1) - (b.nivelCuentaContrato ?? 1)
  })

  return (
    <Select
      value={value || (includeNone ? "__none" : "")}
      disabled={!enabled}
      onValueChange={(v) =>
        onChange(v === "__none" ? null : items.find((i) => i.id === v) ?? null)
      }
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {includeNone ? <SelectItem value="__none">Sin asignar</SelectItem> : null}
          {items.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {obtenerEtiquetaCatalogo(item)}
            </SelectItem>
          ))}
          {items.length === 0 && !query.isLoading ? (
            <SelectItem value="__vacio" disabled>
              Sin opciones disponibles
            </SelectItem>
          ) : null}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

function EstadoAprobacionAsignacionBadge({
  estado,
}: {
  estado: AsignacionPersonalResponse["estadoAprobacion"]
}) {
  if (estado === "APROBADA") {
    return (
      <Badge variant="outline" className="gap-1.5 bg-card text-foreground">
        <CheckCircle2 data-icon="inline-start" className="text-emerald-600 dark:text-emerald-400" />
        Aprobado
      </Badge>
    )
  }
  if (estado === "PENDIENTE") {
    return (
      <Badge variant="outline" className="gap-1.5 bg-card text-foreground">
        <Clock data-icon="inline-start" className="text-amber-500 dark:text-amber-400" />
        Pendiente
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="gap-1.5 bg-card text-foreground">
      <CircleX data-icon="inline-start" className="text-destructive" />
      Rechazado
    </Badge>
  )
}

type FilaCuentaContrato = {
  key: string
  modo: "existente" | "nuevo"
  tipo: TipoAsignacionCuentaContrato
  item: {
    id: string
    codigo: string
    nombre: string
  } | null
  vigenteDesde: string
  vigenteHasta: string
}

function buscarConfiguracionActual(
  item: AsignacionPersonalResponse["cuentasContratos"][number],
  catalogo: ConfiguracionGeneralResponse[],
) {
  return (
    catalogo.find((opcion) => opcion.codigo === item.configuracionCodigo) ??
    catalogo.find(
      (opcion) =>
        opcion.nombre.trim().toLocaleLowerCase("es") ===
        item.configuracionNombre.trim().toLocaleLowerCase("es"),
    ) ??
    null
  )
}

function crearFilasRelacionActual(
  asignacion: AsignacionPersonalResponse,
  cuentasCatalogo: ConfiguracionGeneralResponse[],
  contratosCatalogo: ConfiguracionGeneralResponse[],
): FilaCuentaContrato[] {
  return asignacion.cuentasContratos
    .filter((item) => item.estado === "VIGENTE")
    .map((item) => {
      const configuracion = buscarConfiguracionActual(
        item,
        item.tipo === "CUENTA" ? cuentasCatalogo : contratosCatalogo,
      )

      return {
        key: nuevaClaveFila(),
        modo: "existente",
        tipo: item.tipo,
        item: configuracion
          ? {
              id: configuracion.id,
              codigo: configuracion.codigo,
              nombre: configuracion.nombre,
            }
          : null,
        vigenteDesde: soloFecha(item.vigenteDesde),
        vigenteHasta: soloFecha(item.vigenteHasta),
      }
    })
}

let contadorFilas = 0
function nuevaClaveFila() {
  contadorFilas += 1
  return `fila-${contadorFilas}`
}

function FormularioOrganizacion({
  valores,
  onChange,
  habilitado,
  actuales,
}: {
  valores: ValoresOrganizacion
  onChange: (key: CampoOrganizacion["key"], item: ConfiguracionGeneralResponse | null) => void
  habilitado: boolean
  actuales?: {
    cargo?: string
    sede?: string
    area?: string
  }
}) {
  const [distritoClave, setDistritoClave] = useState("")
  const ubicacionesQuery = useConfiguracionGeneralQuery({
    tipoDatoMaestro: "UBICACION",
    estado: "ACTIVO",
    estadoRegistro: "ACTIVO",
    page: 1,
    pageSize: 100,
    sortBy: "nombre",
    sortOrder: "asc",
  })
  const distritos = Array.from(
    new Map(
      (ubicacionesQuery.data?.datos ?? [])
        .filter((item) => Boolean(item.distrito))
        .map((item) => {
          const clave = `${item.departamento ?? ""}|${item.provincia ?? ""}|${item.distrito}`
          return [
            clave,
            {
              clave,
              distrito: item.distrito!,
              provincia: item.provincia,
              departamento: item.departamento,
            },
          ] as const
        }),
    ).values(),
  ).sort((a, b) => a.distrito.localeCompare(b.distrito, "es"))

  function seleccionarUbicacion(item: ConfiguracionGeneralResponse | null) {
    onChange("ubicacionFiltroId", item)
    onChange("sedeId", null)
    onChange("areaId", null)
  }

  function seleccionarDistrito(value: string) {
    setDistritoClave(value)
    seleccionarUbicacion(null)
  }

  function seleccionarSede(item: ConfiguracionGeneralResponse | null) {
    onChange("sedeId", item)
    onChange("areaId", null)
  }

  return (
    <FieldSet className="rounded-lg border border-border p-4">
      <FieldLegend>Datos laborales</FieldLegend>
      <FieldDescription>
        {actuales
          ? "Selecciona solamente los valores que deseas reemplazar. Los campos sin nueva seleccion conservaran su configuracion actual."
          : "El distrito y la ubicacion filtran las sedes permitidas. Solo sede, area y cargo se guardan en la asignacion."}
      </FieldDescription>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <Field>
        <FieldLabel>Distrito *</FieldLabel>
        <Select value={distritoClave} onValueChange={seleccionarDistrito}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona distrito" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {distritos.map((item) => (
                <SelectItem key={item.clave} value={item.clave}>
                  {item.distrito}
                  {item.provincia ? ` - ${item.provincia}` : ""}
                  {item.departamento ? `, ${item.departamento}` : ""}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {actuales ? (
          <FieldDescription>Filtro opcional para buscar una nueva sede.</FieldDescription>
        ) : null}
      </Field>
      <Field>
        <FieldLabel>Ubicacion *</FieldLabel>
        <SelectCatalogo
          tipo="UBICACION"
          value={valores.ubicacionFiltroId}
          onChange={seleccionarUbicacion}
          enabled={habilitado && Boolean(distritoClave)}
          includeNone={false}
          filtrarItems={(item) =>
            `${item.departamento ?? ""}|${item.provincia ?? ""}|${item.distrito ?? ""}` ===
            distritoClave
          }
          placeholder="Selecciona un distrito primero"
        />
        {actuales ? (
          <FieldDescription>No se guarda; solo filtra nuevas sedes.</FieldDescription>
        ) : null}
      </Field>
      <Field>
        <FieldLabel>Sede *</FieldLabel>
        <SelectCatalogo
          tipo="SEDE"
          value={valores.sedeId}
          onChange={seleccionarSede}
          enabled={habilitado && Boolean(valores.ubicacionFiltroId)}
          includeNone={false}
          filtrarItems={(item) => item.ubicacionId === valores.ubicacionFiltroId}
          placeholder={
            actuales?.sede
              ? `Conservar: ${actuales.sede}`
              : "Selecciona una ubicacion primero"
          }
        />
        {actuales?.sede ? (
          <FieldDescription>Actual: {actuales.sede}</FieldDescription>
        ) : null}
      </Field>
      <Field>
        <FieldLabel>Area *</FieldLabel>
        <SelectCatalogo
          tipo="AREA"
          value={valores.areaId}
          onChange={(item) => onChange("areaId", item)}
          enabled={habilitado && Boolean(valores.sedeId)}
          includeNone={false}
          filtrarItems={(item) => item.sedeId === valores.sedeId}
          placeholder={
            actuales?.area ? `Conservar: ${actuales.area}` : "Selecciona una sede primero"
          }
        />
        {actuales?.area ? (
          <FieldDescription>Actual: {actuales.area}</FieldDescription>
        ) : null}
      </Field>
      <Field>
        <FieldLabel>Cargo *</FieldLabel>
        <SelectCatalogo
          tipo="CARGO"
          value={valores.cargoId}
          onChange={(item) => onChange("cargoId", item)}
          enabled={habilitado}
          includeNone={false}
          placeholder={actuales?.cargo ? `Conservar: ${actuales.cargo}` : "Selecciona cargo"}
        />
        {actuales?.cargo ? (
          <FieldDescription>Actual: {actuales.cargo}</FieldDescription>
        ) : null}
      </Field>
      </div>
    </FieldSet>
  )
}

function CuentasContratosEditorFormulario({
  asignacion,
  cuentasCatalogo,
  contratosCatalogo,
  onClose,
}: {
  asignacion: AsignacionPersonalResponse
  cuentasCatalogo: ConfiguracionGeneralResponse[]
  contratosCatalogo: ConfiguracionGeneralResponse[]
  onClose: (actualizado: boolean) => void
}) {
  const [filas, setFilas] = useState<FilaCuentaContrato[]>(() =>
    crearFilasRelacionActual(asignacion, cuentasCatalogo, contratosCatalogo),
  )
  const [error, setError] = useState<string | null>(null)
  const [confirmarLimpieza, setConfirmarLimpieza] = useState(false)
  const reemplazarMutation = useReemplazarCuentasContratosMutation(asignacion.id)
  const { usuario } = useSesion()
  const relacionVigente = asignacion.cuentasContratos.filter(
    (item) => item.estado === "VIGENTE",
  )
  const cuentasSeleccionadasIds = new Set(
    filas
      .filter((fila) => fila.tipo === "CUENTA" && fila.item)
      .map((fila) => fila.item!.id),
  )

  function agregarFila() {
    setFilas((prev) => [
      ...prev,
      {
        key: nuevaClaveFila(),
        modo: "nuevo",
        tipo: prev.some((fila) => fila.tipo === "CONTRATO") ? "CUENTA" : "CONTRATO",
        item: null,
        vigenteDesde: soloFecha(asignacion.vigenteDesde),
        vigenteHasta: "",
      },
    ])
  }

  function limpiarContratosFueraDeCuentas(
    siguientes: FilaCuentaContrato[],
  ): FilaCuentaContrato[] {
    const siguientesCuentasIds = new Set(
      siguientes
        .filter((fila) => fila.tipo === "CUENTA" && fila.item)
        .map((fila) => fila.item!.id),
    )

    return siguientes.map((fila) => {
      if (fila.tipo !== "CONTRATO" || !fila.item) return fila
      const contrato = contratosCatalogo.find((item) => item.id === fila.item!.id)
      if (
        contrato &&
        contratoPerteneceACuentas(
          contrato,
          siguientesCuentasIds,
          contratosCatalogo,
        )
      ) {
        return fila
      }
      return { ...fila, item: null }
    })
  }

  function actualizarFila(key: string, cambios: Partial<FilaCuentaContrato>) {
    setFilas((prev) =>
      limpiarContratosFueraDeCuentas(
        prev.map((fila) => (fila.key === key ? { ...fila, ...cambios } : fila)),
      ),
    )
  }

  function eliminarFila(key: string) {
    setFilas((prev) =>
      limpiarContratosFueraDeCuentas(prev.filter((fila) => fila.key !== key)),
    )
  }

  async function guardar() {
    if (filas.length === 0 && relacionVigente.length > 0 && !confirmarLimpieza) {
      setError(
        "La relacion actual se conservara. Activa la confirmacion para eliminar todas las cuentas y el contrato.",
      )
      return
    }

    const incompleta = filas.some((fila) => !fila.item || !fila.vigenteDesde)
    if (incompleta) {
      setError(
        "Completa las filas pendientes. Algunos valores actuales pueden no estar disponibles en el catalogo activo.",
      )
      return
    }

    if (filas.filter((fila) => fila.tipo === "CONTRATO").length > 1) {
      setError("Solo puedes seleccionar un contrato final. Puedes agregar multiples cuentas.")
      return
    }

    const contratoFueraDeCuenta = filas.some(
      (fila) => {
        if (fila.tipo !== "CONTRATO" || !fila.item) return false
        const contrato = contratosCatalogo.find((item) => item.id === fila.item!.id)
        return (
          !contrato ||
          !contratoPerteneceACuentas(
            contrato,
            cuentasSeleccionadasIds,
            contratosCatalogo,
          )
        )
      },
    )
    if (contratoFueraDeCuenta) {
      setError("El contrato final debe pertenecer a una de las cuentas seleccionadas.")
      return
    }

    const vigenciaInvalida = filas.some(
      (fila) => fila.vigenteHasta && fila.vigenteHasta < fila.vigenteDesde,
    )
    if (vigenciaInvalida) {
      setError("La fecha final no puede ser anterior a la fecha inicial.")
      return
    }

    const vigenciaFueraDeAsignacion = filas.some(
      (fila) =>
        fila.vigenteDesde < soloFecha(asignacion.vigenteDesde) ||
        Boolean(
          asignacion.vigenteHasta &&
            (!fila.vigenteHasta ||
              fila.vigenteHasta > soloFecha(asignacion.vigenteHasta)),
        ),
    )
    if (vigenciaFueraDeAsignacion) {
      setError("La vigencia de cuentas y contrato debe estar dentro de la vigencia de la asignacion.")
      return
    }

    const claves = filas.map((fila) => `${fila.tipo}:${fila.item!.id}`)
    if (new Set(claves).size !== claves.length) {
      setError("No puedes asignar dos veces la misma cuenta o contrato.")
      return
    }

    const cuentasContratos: CuentaContrato[] = filas.map((fila, indice) => ({
      tipo: fila.tipo,
      configuracionId: fila.item!.id,
      vigenteDesde: fechaApi(fila.vigenteDesde),
      vigenteHasta: fila.vigenteHasta ? fechaApi(fila.vigenteHasta) : undefined,
      orden: indice,
    }))

    try {
      setError(null)
      await reemplazarMutation.mutateAsync({
        usuarioId: usuario?.nombreUsuario ?? "",
        cuentasContratos,
      })
      onClose(true)
    } catch (err) {
      setError(obtenerMensajeError(err))
    }
  }

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
      <DialogHeader>
        <DialogTitle>Cambiar cuentas y contrato</DialogTitle>
        <DialogDescription>
          Elige la nueva relacion contractual. El personal, cargo, sede, area y vigencia
          no cambiaran.
        </DialogDescription>
      </DialogHeader>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudo guardar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-3">
        <Alert>
          <AlertTitle>Que cambiara al confirmar</AlertTitle>
          <AlertDescription>
            Solo se reemplazan las cuentas y el contrato. Los valores actuales quedan
            guardados en el historial.
          </AlertDescription>
        </Alert>

        {relacionVigente.length > 0 ? (
          <FieldSet className="rounded-lg border border-border p-4">
            <FieldLegend>Relacion actual</FieldLegend>
            <FieldDescription>
              Sigue vigente hasta guardar la nueva seleccion.
            </FieldDescription>
            <div className="grid gap-3 sm:grid-cols-2">
              {relacionVigente.map((item) => (
                <div key={item.id} className="rounded-lg border border-border bg-muted/20 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      {item.tipo === "CUENTA" ? "Cuenta" : "Contrato final"}
                    </Badge>
                    <Badge variant="secondary">{item.estado}</Badge>
                  </div>
                  <p className="mt-2 text-sm font-medium">
                    {item.configuracionCodigo} - {item.configuracionNombre}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatearFecha(item.vigenteDesde)}
                    {item.vigenteHasta
                      ? ` - ${formatearFecha(item.vigenteHasta)}`
                      : " - actual"}
                  </p>
                </div>
              ))}
            </div>
          </FieldSet>
        ) : null}
        <FieldSet className="rounded-lg border border-border p-4">
          <FieldLegend>Nueva relacion</FieldLegend>
          <FieldDescription>
            Ya viene cargada con la relacion actual. Ajusta solo lo que corresponda.
          </FieldDescription>
        {filas.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            No hay cuentas ni contrato seleccionados para la nueva relacion.
          </p>
        ) : (
          filas.map((fila, indice) => (
            <div key={fila.key} className="rounded-lg border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">
                    {fila.tipo === "CUENTA" ? `Cuenta ${indice + 1}` : "Contrato final"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Completa solo los datos que quedaran vigentes.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Eliminar fila"
                  onClick={() => eliminarFila(fila.key)}
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Field>
                  <FieldLabel>Tipo</FieldLabel>
                  <Select
                    value={fila.tipo}
                    onValueChange={(tipo) =>
                      actualizarFila(fila.key, {
                        tipo: tipo as TipoAsignacionCuentaContrato,
                        item: null,
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="CUENTA">Cuenta</SelectItem>
                        <SelectItem
                          value="CONTRATO"
                          disabled={filas.some(
                            (item) => item.key !== fila.key && item.tipo === "CONTRATO",
                          )}
                        >
                          Contrato final
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel>{fila.tipo === "CUENTA" ? "Cuenta" : "Contrato final"}</FieldLabel>
                  <SelectCatalogo
                    tipo={fila.tipo}
                    value={fila.item?.id ?? ""}
                    onChange={(item) =>
                      actualizarFila(fila.key, {
                        item: item
                          ? {
                              id: item.id,
                              codigo: item.codigo,
                              nombre: item.nombre,
                            }
                          : null,
                      })
                    }
                    enabled={fila.tipo === "CUENTA" || cuentasSeleccionadasIds.size > 0}
                    includeNone={false}
                    filtrarItems={
                      fila.tipo === "CONTRATO"
                        ? (item) =>
                            contratoPerteneceACuentas(
                              item,
                              cuentasSeleccionadasIds,
                              contratosCatalogo,
                            )
                        : undefined
                    }
                    soloContratosFinales={fila.tipo === "CONTRATO"}
                    placeholder={
                      fila.tipo === "CUENTA"
                        ? "Selecciona una cuenta"
                        : cuentasSeleccionadasIds.size > 0
                          ? "Selecciona el ultimo contrato de la cuenta"
                          : "Primero selecciona una cuenta"
                    }
                  />
                  {fila.tipo === "CONTRATO" ? (
                    <FieldDescription>
                      Solo aparecen contratos finales descendientes de las cuentas seleccionadas.
                    </FieldDescription>
                  ) : null}
                </Field>

                <Field>
                  <FieldLabel>Vigente desde</FieldLabel>
                  <Input
                    type="date"
                    value={fila.vigenteDesde}
                    min={soloFecha(asignacion.vigenteDesde)}
                    max={soloFecha(asignacion.vigenteHasta) || undefined}
                    onChange={(event) =>
                      actualizarFila(fila.key, { vigenteDesde: event.target.value })
                    }
                  />
                </Field>

                <Field>
                  <FieldLabel>Vigente hasta</FieldLabel>
                  <Input
                    type="date"
                    value={fila.vigenteHasta}
                    min={fila.vigenteDesde || soloFecha(asignacion.vigenteDesde)}
                    max={soloFecha(asignacion.vigenteHasta) || undefined}
                    onChange={(event) =>
                      actualizarFila(fila.key, { vigenteHasta: event.target.value })
                    }
                  />
                </Field>
              </div>
            </div>
          ))
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={agregarFila}
        >
          <Plus data-icon="inline-start" />
          Agregar cuenta o contrato
        </Button>
        {relacionVigente.length > 0 && filas.length === 0 ? (
          <Field orientation="horizontal">
            <input
              id={`confirmar-limpieza-${asignacion.id}`}
              type="checkbox"
              checked={confirmarLimpieza}
              onChange={(event) => setConfirmarLimpieza(event.target.checked)}
            />
            <FieldLabel htmlFor={`confirmar-limpieza-${asignacion.id}`}>
              Confirmo que la asignacion quedara sin cuentas ni contrato
            </FieldLabel>
          </Field>
        ) : null}
        </FieldSet>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onClose(false)}
          disabled={reemplazarMutation.isPending}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={() => void guardar()}
          disabled={
            reemplazarMutation.isPending ||
            (filas.length === 0 &&
              relacionVigente.length > 0 &&
              !confirmarLimpieza)
          }
        >
          {reemplazarMutation.isPending ? "Guardando..." : "Confirmar cambio contractual"}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

function CuentasContratosEditor({
  asignacion,
  onClose,
}: {
  asignacion: AsignacionPersonalResponse
  onClose: (actualizado: boolean) => void
}) {
  const cuentasQuery = useConfiguracionGeneralQuery({
    tipoDatoMaestro: "CUENTA",
    estado: "ACTIVO",
    estadoRegistro: "ACTIVO",
    page: 1,
    pageSize: 100,
    sortBy: "nombre",
    sortOrder: "asc",
  })
  const contratosQuery = useConfiguracionGeneralQuery({
    tipoDatoMaestro: "CONTRATO",
    estado: "ACTIVO",
    estadoRegistro: "ACTIVO",
    page: 1,
    pageSize: 100,
    sortBy: "nombre",
    sortOrder: "asc",
  })

  if (cuentasQuery.isLoading || contratosQuery.isLoading) {
    return (
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cambiar cuentas y contrato</DialogTitle>
          <DialogDescription>Cargando la relacion contractual actual.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </DialogContent>
    )
  }

  if (cuentasQuery.error || contratosQuery.error) {
    return (
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>No se pudo preparar la edicion</DialogTitle>
          <DialogDescription>
            No fue posible cargar el catalogo necesario para editar cuentas y contratos.
          </DialogDescription>
        </DialogHeader>
        <Alert variant="destructive">
          <AlertTitle>Error de API</AlertTitle>
          <AlertDescription>
            {obtenerMensajeError(cuentasQuery.error ?? contratosQuery.error)}
          </AlertDescription>
        </Alert>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onClose(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    )
  }

  return (
    <CuentasContratosEditorFormulario
      asignacion={asignacion}
      cuentasCatalogo={cuentasQuery.data?.datos ?? []}
      contratosCatalogo={contratosQuery.data?.datos ?? []}
      onClose={onClose}
    />
  )
}

function AsignacionFormulario({
  modo,
  asignacion,
  personalId,
  onClose,
}: {
  modo: "crear" | "editar"
  asignacion?: AsignacionPersonalResponse
  personalId: string | number
  onClose: (actualizado: boolean) => void
}) {
  const [valores, setValores] = useState<ValoresOrganizacion>(() =>
    ({ ...VALORES_ORGANIZACION_VACIOS }),
  )
  const [vigenteDesde, setVigenteDesde] = useState(soloFecha(asignacion?.vigenteDesde))
  const [vigenteHasta, setVigenteHasta] = useState(soloFecha(asignacion?.vigenteHasta))
  const [contratoFinal, setContratoFinal] = useState<ConfiguracionGeneralResponse | null>(
    null,
  )
  const [cuentas, setCuentas] = useState<ConfiguracionGeneralResponse[]>([])
  const [error, setError] = useState<string | null>(null)

  const crearMutation = useCrearAsignacionPersonalMutation()
  const modificarMutation = useModificarAsignacionPersonalMutation(asignacion?.id ?? 0)
  const contratosQuery = useConfiguracionGeneralQuery({
    tipoDatoMaestro: "CONTRATO",
    estado: "ACTIVO",
    estadoRegistro: "ACTIVO",
    page: 1,
    pageSize: 100,
    sortBy: "nombre",
    sortOrder: "asc",
  })
  const contratosCatalogo = contratosQuery.data?.datos ?? []
  const cuentasIds = new Set(cuentas.map((cuenta) => cuenta.id))
  const pendiente = crearMutation.isPending || modificarMutation.isPending
  const { usuario } = useSesion()

  function actualizarValor(key: CampoOrganizacion["key"], item: ConfiguracionGeneralResponse | null) {
    setValores((prev) => ({ ...prev, [key]: item?.id ?? "" }))
  }

  async function guardar() {
    if (!vigenteDesde) {
      setError("La vigencia inicial es obligatoria.")
      return
    }

    if (!usuario?.nombreUsuario) {
      setError("No se pudo identificar al usuario de la sesion.")
      return
    }

    if (vigenteHasta && vigenteHasta < vigenteDesde) {
      setError("La fecha final no puede ser anterior a la fecha inicial.")
      return
    }

    if (
      modo === "crear" &&
      (!valores.cargoId ||
        !valores.ubicacionFiltroId ||
        !valores.sedeId ||
        !valores.areaId)
    ) {
      setError("Selecciona distrito, ubicacion, sede, area y cargo.")
      return
    }

    if (
      modo === "crear" &&
      contratoFinal &&
      !contratoPerteneceACuentas(contratoFinal, cuentasIds, contratosCatalogo)
    ) {
      setError("El contrato final debe pertenecer a una de las cuentas seleccionadas.")
      return
    }

    const cambiaEstructura =
      Boolean(valores.sedeId) ||
      Boolean(valores.areaId)
    if (modo === "editar" && valores.areaId && !valores.sedeId) {
      setError("Para cambiar el area tambien debes seleccionar la sede.")
      return
    }

    try {
      setError(null)
      if (modo === "crear") {
        await crearMutation.mutateAsync({
          personalId,
          cargoId: valores.cargoId || undefined,
          sedeId: valores.sedeId || undefined,
          areaId: valores.areaId || undefined,
          vigenteDesde: fechaApi(vigenteDesde),
          vigenteHasta: vigenteHasta ? fechaApi(vigenteHasta) : undefined,
          usuarioId: usuario?.nombreUsuario ?? "",
          cuentasContratos: [
            ...cuentas.map((cuenta, indice) =>
              crearCuentaContratoDesdeCatalogo(
                cuenta,
                "CUENTA",
                fechaApi(vigenteDesde),
                vigenteHasta ? fechaApi(vigenteHasta) : undefined,
                indice + 1,
              ),
            ),
            ...(contratoFinal
              ? [
                  crearCuentaContratoDesdeCatalogo(
                    contratoFinal,
                    "CONTRATO",
                    fechaApi(vigenteDesde),
                    vigenteHasta ? fechaApi(vigenteHasta) : undefined,
                    cuentas.length + 1,
                  ),
                ]
              : []),
          ],
        })
      } else {
        await modificarMutation.mutateAsync({
          ...(valores.cargoId ? { cargoId: valores.cargoId } : {}),
          ...(cambiaEstructura
            ? {
                sedeId: valores.sedeId,
                areaId: valores.areaId || null,
              }
            : {}),
          vigenteDesde: fechaApi(vigenteDesde),
          vigenteHasta: vigenteHasta ? fechaApi(vigenteHasta) : null,
          usuarioId: usuario?.nombreUsuario ?? "",
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
          {modo === "crear" ? "Nueva asignacion" : `Editar cargo y ubicacion #${asignacion?.id}`}
        </DialogTitle>
        <DialogDescription>
          {modo === "crear"
            ? "Define la estructura organizacional, relacion contractual y vigencia."
            : "Actualiza cargo, sede, area o vigencia. Las cuentas y el contrato no cambiaran."}
        </DialogDescription>
      </DialogHeader>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudo guardar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-4">
        {modo === "editar" && asignacion ? (
          <FieldSet className="rounded-lg border border-border p-4">
            <FieldLegend>Configuracion vigente</FieldLegend>
            <FieldDescription>
              Los campos sin una nueva seleccion conservaran su valor actual.
            </FieldDescription>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Cargo", value: asignacion.cargoNombre },
                { label: "Sede", value: asignacion.sedeNombre },
                { label: "Area", value: asignacion.areaNombre },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-border bg-muted/20 p-3">
                  <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-sm font-medium">{item.value || "Sin asignar"}</p>
                </div>
              ))}
            </div>
          </FieldSet>
        ) : null}
        <FormularioOrganizacion
          valores={valores}
          onChange={actualizarValor}
          habilitado
          actuales={
            modo === "editar" && asignacion
              ? {
                  cargo: asignacion.cargoNombre,
                  sede: asignacion.sedeNombre,
                  area: asignacion.areaNombre,
                }
              : undefined
          }
        />
        {modo === "crear" ? (
          <FieldSet className="rounded-lg border border-border p-4">
            <FieldLegend>Relacion contractual</FieldLegend>
            <FieldDescription>
              Selecciona multiples cuentas y, cuando corresponda, un unico contrato final.
            </FieldDescription>
            <Field>
              <FieldLabel>Cuenta (opcional)</FieldLabel>
              <SelectCatalogo
                tipo="CUENTA"
                value=""
                onChange={(cuenta) => {
                  if (!cuenta) return
                  setCuentas((actuales) =>
                    actuales.some((item) => item.id === cuenta.id)
                      ? actuales
                      : [...actuales, cuenta],
                  )
                }}
                enabled
                includeNone={false}
                filtrarItems={(item) => !cuentas.some((cuenta) => cuenta.id === item.id)}
                placeholder="Selecciona una cuenta para agregarla"
              />
              <FieldDescription>
                La cuenta se agrega automaticamente al seleccionarla.
              </FieldDescription>
              <div className="flex flex-wrap gap-2">
                {cuentas.map((cuenta) => (
                  <Badge key={cuenta.id} variant="outline" className="gap-1.5">
                    {cuenta.codigo} - {cuenta.nombre}
                    <button
                      type="button"
                      aria-label={`Quitar ${cuenta.nombre}`}
                      onClick={() =>
                        setCuentas((actuales) => {
                          const siguientes = actuales.filter((item) => item.id !== cuenta.id)
                          const siguientesIds = new Set(siguientes.map((item) => item.id))
                          if (
                            contratoFinal &&
                            !contratoPerteneceACuentas(
                              contratoFinal,
                              siguientesIds,
                              contratosCatalogo,
                            )
                          ) {
                            setContratoFinal(null)
                          }
                          return siguientes
                        })
                      }
                    >
                      <Trash2 />
                    </button>
                  </Badge>
                ))}
              </div>
            </Field>
            <Field>
              <FieldLabel>Contrato asociado (opcional)</FieldLabel>
              <SelectCatalogo
                tipo="CONTRATO"
                value={contratoFinal?.id ?? ""}
                onChange={setContratoFinal}
                enabled={cuentas.length > 0}
                includeNone={false}
                filtrarItems={(item) =>
                  contratoPerteneceACuentas(item, cuentasIds, contratosCatalogo)
                }
                soloContratosFinales
                placeholder={
                  cuentas.length > 0
                    ? "Selecciona un contrato final de la cuenta"
                    : "Primero selecciona una cuenta"
                }
              />
              <FieldDescription>
                Solo aparecen contratos finales descendientes de las cuentas seleccionadas.
              </FieldDescription>
            </Field>
          </FieldSet>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Vigente desde</FieldLabel>
            <Input
              type="date"
              value={vigenteDesde}
              onChange={(event) => setVigenteDesde(event.target.value)}
              required
            />
          </Field>
          <Field>
            <FieldLabel>Vigente hasta</FieldLabel>
            <Input
              type="date"
              value={vigenteHasta}
              min={vigenteDesde || undefined}
              onChange={(event) => setVigenteHasta(event.target.value)}
            />
          </Field>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onClose(false)} disabled={pendiente}>
          Cancelar
        </Button>
        <Button type="button" onClick={() => void guardar()} disabled={pendiente}>
          {pendiente ? "Guardando..." : modo === "crear" ? "Crear asignacion" : "Guardar cambios"}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

const ETIQUETAS_HISTORIAL_ASIGNACION = {
  ASIGNACION_CREADA: "Asignacion creada",
  ASIGNACION_MODIFICADA: "Cargo, ubicacion o vigencia modificados",
  CUENTAS_CONTRATOS_REEMPLAZADOS: "Cuentas y contrato cambiados",
  ASIGNACION_APROBADA: "Asignacion aprobada",
  ASIGNACION_RECHAZADA: "Asignacion rechazada",
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
        <DialogTitle>Historial de la asignacion #{asignacion.id}</DialogTitle>
        <DialogDescription>
          Revisa cambios de cargo, ubicacion, vigencia, cuentas y contrato. Los valores
          anteriores permanecen aqui como trazabilidad.
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
  const [dialogo, setDialogo] = useState<"editar" | "cuentas" | "historial" | "aprobar" | null>(null)
  const { usuario } = useSesion()
  const aprobarMutation = useAprobarAsignacionPersonalMutation(asignacion.id, {
    onSuccess: onActualizado,
  })
  const pendienteAprobacion = asignacion.estadoAprobacion === "PENDIENTE"
  const relacionVigente = asignacion.cuentasContratos.filter(
    (item) => item.estado === "VIGENTE",
  )
  const cuentasVigentes = relacionVigente.filter((item) => item.tipo === "CUENTA")
  const contratoVigente = relacionVigente.find((item) => item.tipo === "CONTRATO")
  const noVigente = asignacion.estado !== "VIGENTE"

  const datosOrganizacion = [
    { label: "Cargo", value: asignacion.cargoNombre },
    { label: "Sede", value: asignacion.sedeNombre },
    { label: "Area", value: asignacion.areaNombre },
  ]

  function cerrarDialogo(actualizado: boolean) {
    setDialogo(null)
    if (actualizado) onActualizado()
  }

  async function aprobar() {
    try {
      await aprobarMutation.mutateAsync({ aprobadorId: usuario?.nombreUsuario ?? "" })
      cerrarDialogo(true)
    } catch {
      cerrarDialogo(false)
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
          <Badge variant="outline">#{asignacion.id}</Badge>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-sm",
              noVigente ? "font-medium text-destructive" : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400",
                noVigente && "bg-destructive",
              )}
            />
            {asignacion.estado}
          </span>
          <EstadoAprobacionAsignacionBadge estado={asignacion.estadoAprobacion} />
        </div>
        <div className="flex flex-wrap gap-2">
          {!soloLectura && pendienteAprobacion ? (
            <Button
              size="sm"
              disabled={aprobarMutation.isPending}
              onClick={() => void aprobar()}
            >
              {aprobarMutation.isPending ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <CheckCircle2 data-icon="inline-start" />
              )}
              Aprobar
            </Button>
          ) : null}
          {!soloLectura ? (
            <>
              <Button size="sm" variant="outline" onClick={() => setDialogo("editar")}>
                <Pencil data-icon="inline-start" />
                Editar cargo y ubicacion
              </Button>
              <Button size="sm" variant="outline" onClick={() => setDialogo("cuentas")}>
                <Wallet data-icon="inline-start" />
                Cambiar cuentas y contrato
              </Button>
            </>
          ) : null}
          <Button size="sm" variant="outline" onClick={() => setDialogo("historial")}>
            <History data-icon="inline-start" />
            Ver historial
          </Button>
        </div>
      </div>

      <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
        {datosOrganizacion.map((dato) => (
          <div key={dato.label} className="bg-card p-3">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {dato.label}
            </p>
            <p className="mt-1 truncate text-sm font-medium">
              {dato.value || "-"}
            </p>
          </div>
        ))}
        <div className="bg-card p-3">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Vigencia
          </p>
          <p className="mt-1 text-sm font-medium">
            {formatearFecha(asignacion.vigenteDesde)}
            {asignacion.vigenteHasta ? ` - ${formatearFecha(asignacion.vigenteHasta)}` : " - actual"}
          </p>
        </div>
      </div>

      <div className="border-t border-border px-4 py-4">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Cuenta/contrato asignado</p>
            <p className="text-xs text-muted-foreground">
              Relacion vigente para esta asignacion de personal.
            </p>
          </div>
          <Badge variant={relacionVigente.length > 0 ? "secondary" : "outline"}>
            {relacionVigente.length > 0 ? "Asignado" : "Sin asignar"}
          </Badge>
        </div>

        {relacionVigente.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="mb-2 flex items-center gap-2">
                <Wallet data-icon="inline-start" className="text-muted-foreground" />
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Cuentas
                </p>
              </div>
              {cuentasVigentes.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {cuentasVigentes.map((cuenta) => (
                    <div key={cuenta.id} className="rounded-md bg-card px-3 py-2 text-sm">
                      <p className="font-medium">
                        {cuenta.configuracionCodigo} - {cuenta.configuracionNombre}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatearFecha(cuenta.vigenteDesde)}
                        {cuenta.vigenteHasta
                          ? ` - ${formatearFecha(cuenta.vigenteHasta)}`
                          : " - actual"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin cuentas asignadas.</p>
              )}
            </div>

            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="mb-2 flex items-center gap-2">
                <FileText data-icon="inline-start" className="text-muted-foreground" />
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Contrato final
                </p>
              </div>
              {contratoVigente ? (
                <div className="rounded-md bg-card px-3 py-2 text-sm">
                  <p className="font-medium">
                    {contratoVigente.configuracionCodigo} - {contratoVigente.configuracionNombre}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatearFecha(contratoVigente.vigenteDesde)}
                    {contratoVigente.vigenteHasta
                      ? ` - ${formatearFecha(contratoVigente.vigenteHasta)}`
                      : " - actual"}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin contrato final asignado.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            Esta asignacion todavia no tiene cuentas ni contrato vigente.
          </div>
        )}
        </div>

      <Dialog open={dialogo === "editar"} onOpenChange={(open) => !open && setDialogo(null)}>
        {dialogo === "editar" ? (
          <AsignacionFormulario
            modo="editar"
            asignacion={asignacion}
            personalId={asignacion.personalId}
            onClose={cerrarDialogo}
          />
        ) : null}
      </Dialog>

      <Dialog open={dialogo === "cuentas"} onOpenChange={(open) => !open && setDialogo(null)}>
        {dialogo === "cuentas" ? (
          <CuentasContratosEditor asignacion={asignacion} onClose={cerrarDialogo} />
        ) : null}
      </Dialog>

      <Dialog open={dialogo === "historial"} onOpenChange={(open) => !open && setDialogo(null)}>
        {dialogo === "historial" ? (
          <HistorialAsignacionDialog asignacion={asignacion} onClose={() => setDialogo(null)} />
        ) : null}
      </Dialog>
    </div>
  )
}

export function AsignacionesPersonalSeccion({
  personalId,
  titulo = "Asignaciones, cuentas y contratos",
  descripcion = "Asignaciones de cargo, estructura organizacional, cuentas y contratos del personal.",
  permitirCrear = true,
  soloLectura = false,
  vacioTitulo = "Sin asignaciones, cuentas ni contratos",
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
  const descripcionVacia =
    vacioDescripcion ??
    (permitirCrear
      ? "Crea la primera asignacion para registrar sus cuentas y contrato."
      : "No hay asignaciones registradas para este personal.")

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
        {permitirCrear ? (
          <Button size="sm" onClick={() => setCrearAbierto(true)}>
            <Plus data-icon="inline-start" />
            Nueva asignacion
          </Button>
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
        ) : asignaciones.length === 0 ? (
          <Empty className="py-10">
            <EmptyHeader>
              <EmptyTitle>{vacioTitulo}</EmptyTitle>
              <EmptyDescription>{descripcionVacia}</EmptyDescription>
            </EmptyHeader>
            {permitirCrear ? (
              <Button size="sm" onClick={() => setCrearAbierto(true)}>
                <Plus data-icon="inline-start" />
                Crear primera asignacion
              </Button>
            ) : null}
          </Empty>
        ) : (
          asignaciones.map((asignacion) => (
            <AsignacionCard
              key={asignacion.id}
              asignacion={asignacion}
              onActualizado={() => void asignacionesQuery.refetch()}
              soloLectura={soloLectura}
            />
          ))
        )}
      </div>

      <Dialog open={crearAbierto} onOpenChange={(open) => !open && setCrearAbierto(false)}>
        {crearAbierto ? (
          <AsignacionFormulario
            modo="crear"
            personalId={personalId}
            onClose={cerrarCrear}
          />
        ) : null}
      </Dialog>
    </section>
  )
}
