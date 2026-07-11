"use client"

import { useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight, ClipboardList, Coins, Pencil, Plus, Trash2, Wallet } from "lucide-react"

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
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/compartido/componentes/ui/empty"
import { Field, FieldLabel } from "@/compartido/componentes/ui/field"
import { Input } from "@/compartido/componentes/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select"
import { Skeleton } from "@/compartido/componentes/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/compartido/componentes/ui/tabs"
import { Textarea } from "@/compartido/componentes/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table"

import { useSesion } from "@/modulos/autenticacion/ganchos/use-sesion"
import { useListarPorTipoQuery } from "../servicios/configuracion-general-queries"
import { useCostoPeajesRutaQuery, useRutasQuery } from "../servicios/rutas-peajes-queries"
import {
  useAnularCostoOperativoMutation,
  useChecklistCostoOperativoQuery,
  useConceptosCostoQuery,
  useCostosOperativosQuery,
  useGuardarCostoOperativoMutation,
  useHabilitarConceptoCostoMutation,
  useInhabilitarConceptoCostoMutation,
  useModificarConceptoCostoMutation,
  useRegistrarConceptoCostoMutation,
} from "../servicios/costos-operativos-queries"
import type {
  BaseConteo,
  BaseImputacion,
  ChecklistItemCostoOperativo,
  ComidaConcepto,
  ConceptoCostoResponse,
  CostoOperativoResponse,
  FrecuenciaCosto,
  LineaCostoOperativoResponse,
  ModalidadEntrega,
  NaturalezaConcepto,
  TipoComida,
} from "../tipos/costos-operativos"

function obtenerMensajeError(error: unknown) {
  if (error instanceof ApiError) {
    const mensajes = error.errores?.map((item) => item.mensaje).filter(Boolean)
    if (mensajes?.length) return mensajes.join(" ")
    return error.message
  }
  if (error instanceof Error) return error.message
  return "No se pudo completar la operacion."
}

const COMIDAS: TipoComida[] = ["DESAYUNO", "ALMUERZO", "CENA"]
const etiquetaComida: Record<TipoComida, string> = {
  DESAYUNO: "Desayuno",
  ALMUERZO: "Almuerzo",
  CENA: "Cena",
}

const etiquetaNaturaleza: Record<NaturalezaConcepto, string> = {
  FIJO: "Fijo",
  VARIABLE: "Variable",
}
const etiquetaBase: Record<BaseImputacion, string> = {
  UNIDAD: "Por unidad",
  PERSONA: "Por persona",
  SERVICIO: "Por servicio",
}
const etiquetaFrecuencia: Record<FrecuenciaCosto, string> = {
  POR_VIAJE: "Por viaje",
  POR_DIA: "Por dia",
  POR_SERVICIO: "Por servicio",
}
const baseConteoPorComida: Record<TipoComida, BaseConteo> = {
  DESAYUNO: "DIA",
  ALMUERZO: "DIA",
  CENA: "NOCHE",
}
const etiquetaMultiplicadorComida: Record<TipoComida, string> = {
  DESAYUNO: "x dias x personas",
  ALMUERZO: "x dias x personas",
  CENA: "x noches x personas",
}
const ayudaMultiplicadorComida: Record<TipoComida, string> = {
  DESAYUNO: "Se reconoce cada dia del viaje.",
  ALMUERZO: "Se reconoce cada dia del viaje.",
  CENA: "Se reconoce solo si el viaje tiene pernocte.",
}
const formulaComida: Record<TipoComida, string> = {
  DESAYUNO: "personas x dias x tarifa",
  ALMUERZO: "personas x dias x tarifa",
  CENA: "personas x noches x tarifa",
}

function distribuirMonto(total: number, partes: number): number[] {
  if (!Number.isFinite(total) || partes <= 0) return []
  const centimos = Math.round(total * 100)
  const base = Math.floor(centimos / partes)
  const resto = centimos % partes
  return Array.from({ length: partes }, (_, index) => (base + (index < resto ? 1 : 0)) / 100)
}

function formatearMonto(valor: number) {
  return valor.toFixed(2)
}
const ayudaFrecuencia: Record<FrecuenciaCosto, string> = {
  POR_VIAJE: "Se paga 1 vez por cada viaje.",
  POR_DIA: "Se paga por cada dia (o noche) del viaje.",
  POR_SERVICIO: "Se paga 1 vez por todo el servicio, sin importar dias ni viajes.",
}

// --- Plantillas de concepto (UI en lenguaje simple) --------------------------

type ClavePlantilla =
  | "ALIMENTACION"
  | "ALOJAMIENTO"
  | "COCHERA"
  | "LAVADO"
  | "SERVICIO_FIJO"

interface DefinicionPlantilla {
  frase: string
  ejemplo: string
  nota?: string
  naturaleza: NaturalezaConcepto
  baseImputacion: BaseImputacion
  frecuencia: FrecuenciaCosto
  baseConteo: BaseConteo
  // La alimentacion se desglosa en comidas (desayuno/almuerzo/cena).
  esAlimentacion?: boolean
}

const plantillasConcepto: Record<ClavePlantilla, DefinicionPlantilla> = {
  ALIMENTACION: {
    frase: "Alimentacion",
    ejemplo: "PERSONA · POR_DIA",
    naturaleza: "VARIABLE",
    baseImputacion: "PERSONA",
    frecuencia: "POR_DIA",
    baseConteo: "DIA",
    esAlimentacion: true,
  },
  ALOJAMIENTO: {
    frase: "Alojamiento",
    ejemplo: "PERSONA · NOCHE",
    naturaleza: "VARIABLE",
    baseImputacion: "PERSONA",
    frecuencia: "POR_DIA",
    baseConteo: "NOCHE",
  },
  COCHERA: {
    frase: "Cochera",
    ejemplo: "UNIDAD · POR_DIA",
    naturaleza: "VARIABLE",
    baseImputacion: "UNIDAD",
    frecuencia: "POR_DIA",
    baseConteo: "DIA",
  },
  LAVADO: {
    frase: "Lavado",
    ejemplo: "UNIDAD · POR_VIAJE",
    naturaleza: "FIJO",
    baseImputacion: "UNIDAD",
    frecuencia: "POR_VIAJE",
    baseConteo: "DIA",
  },
  SERVICIO_FIJO: {
    frase: "Servicio fijo",
    ejemplo: "SERVICIO · POR_SERVICIO",
    naturaleza: "FIJO",
    baseImputacion: "SERVICIO",
    frecuencia: "POR_SERVICIO",
    baseConteo: "DIA",
  },
}

function fraseComportamientoConcepto(
  frecuencia: FrecuenciaCosto,
  baseImputacion: BaseImputacion,
  baseConteo: BaseConteo,
  esAlimentacion: boolean,
): string {
  if (esAlimentacion) return "Alimentacion por persona, desglosada en desayuno, almuerzo y cena."
  if (frecuencia === "POR_VIAJE") return "Se paga una sola vez por cada viaje."
  if (frecuencia === "POR_SERVICIO") return "Se paga una sola vez por todo el servicio contratado."
  const unidadTiempo = baseConteo === "NOCHE" ? "noche" : "dia"
  const quien =
    baseImputacion === "PERSONA" ? "persona" : baseImputacion === "UNIDAD" ? "vehiculo" : "servicio"
  return `Se paga por cada ${quien}, en cada ${unidadTiempo} del viaje.`
}

function detectarPlantilla(concepto?: ConceptoCostoResponse): ClavePlantilla | null {
  if (!concepto) return "ALIMENTACION"
  if (concepto.esAlimentacion) return "ALIMENTACION"
  const entrada = Object.entries(plantillasConcepto).find(
    ([, def]) =>
      !def.esAlimentacion &&
      def.naturaleza === concepto.naturaleza &&
      def.baseImputacion === concepto.baseImputacion &&
      def.frecuencia === concepto.frecuencia &&
      def.baseConteo === concepto.baseConteo,
  )
  return (entrada?.[0] as ClavePlantilla) ?? null
}

// --- Selectores compartidos --------------------------------------------------

function SelectCuentaContrato({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const cuentasQuery = useListarPorTipoQuery("CUENTA", {
    estado: "ACTIVO",
    estadoRegistro: "ACTIVO",
    pageSize: 100,
    sortBy: "nombre",
    sortOrder: "asc",
  })
  const contratosQuery = useListarPorTipoQuery("CONTRATO", {
    estado: "ACTIVO",
    estadoRegistro: "ACTIVO",
    pageSize: 100,
    sortBy: "nombre",
    sortOrder: "asc",
  })
  const cuentas = cuentasQuery.data?.datos ?? []
  const contratos = contratosQuery.data?.datos ?? []
  const vacio = cuentas.length === 0 && contratos.length === 0

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Selecciona cuenta o contrato" />
      </SelectTrigger>
      <SelectContent>
        {cuentas.length > 0 ? (
          <SelectGroup>
            <SelectLabel>Cuentas</SelectLabel>
            {cuentas.map((c) => (
              <SelectItem key={`cuenta-${c.id}`} value={String(c.id)}>
                {c.codigo} - {c.nombre}
              </SelectItem>
            ))}
          </SelectGroup>
        ) : null}
        {contratos.length > 0 ? (
          <SelectGroup>
            <SelectLabel>Contratos</SelectLabel>
            {contratos.map((c) => (
              <SelectItem key={`contrato-${c.id}`} value={String(c.id)}>
                {c.codigo} - {c.nombre}
              </SelectItem>
            ))}
          </SelectGroup>
        ) : null}
        {vacio ? (
          <SelectItem value="__none" disabled>
            No hay cuentas ni contratos activos
          </SelectItem>
        ) : null}
      </SelectContent>
    </Select>
  )
}

function SelectRuta({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const rutasQuery = useRutasQuery({
    estado: "ACTIVO",
    estadoRegistro: "ACTIVO",
    page: 1,
    pageSize: 100,
  })
  const rutas = rutasQuery.data?.datos ?? []

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Selecciona la ruta" />
      </SelectTrigger>
      <SelectContent>
        {rutas.length > 0 ? (
          <SelectGroup>
            {rutas.map((r) => (
              <SelectItem key={r.id} value={String(r.id)}>
                {r.codigo} - {r.nombre}
              </SelectItem>
            ))}
          </SelectGroup>
        ) : (
          <SelectItem value="__none" disabled>
            No hay rutas activas
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  )
}

const etiquetaModalidad: Record<ModalidadEntrega, string> = {
  NORMAL: "Normal",
  EXPRESS: "Express",
}

// Modalidad de entrega: enum fijo (no administrable). Solo diferencia el paquete.
function SelectModalidad({
  value,
  onChange,
}: {
  value: ModalidadEntrega
  onChange: (v: ModalidadEntrega) => void
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as ModalidadEntrega)}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="NORMAL">Normal</SelectItem>
        <SelectItem value="EXPRESS">Express</SelectItem>
      </SelectContent>
    </Select>
  )
}

// --- Dialogo crear/editar concepto (catalogo) --------------------------------

type EstadoComida = { activa: boolean; monto: string; baseConteo: BaseConteo }

function estadoComidasInicial(concepto?: ConceptoCostoResponse): Record<TipoComida, EstadoComida> {
  const base: Record<TipoComida, EstadoComida> = {
    DESAYUNO: { activa: !concepto, monto: "", baseConteo: baseConteoPorComida.DESAYUNO },
    ALMUERZO: { activa: !concepto, monto: "", baseConteo: baseConteoPorComida.ALMUERZO },
    CENA: { activa: !concepto, monto: "", baseConteo: baseConteoPorComida.CENA },
  }
  if (concepto?.esAlimentacion) {
    concepto.comidas.forEach((c) => {
      base[c.tipoComida] = {
        activa: true,
        monto: String(c.montoReferencial),
        baseConteo: baseConteoPorComida[c.tipoComida],
      }
    })
  }
  return base
}

function ConceptoDialog({
  concepto,
  onClose,
}: {
  concepto?: ConceptoCostoResponse
  onClose: (actualizado: boolean) => void
}) {
  const { usuario } = useSesion()
  const usuarioId = usuario?.email ?? "admin"
  const [nombre, setNombre] = useState(concepto?.nombre ?? "")
  const [descripcion, setDescripcion] = useState(concepto?.descripcion ?? "")
  const [naturaleza, setNaturaleza] = useState<NaturalezaConcepto>(
    concepto?.naturaleza ?? plantillasConcepto.ALIMENTACION.naturaleza,
  )
  const [baseImputacion, setBaseImputacion] = useState<BaseImputacion>(
    concepto?.baseImputacion ?? plantillasConcepto.ALIMENTACION.baseImputacion,
  )
  const [frecuencia, setFrecuencia] = useState<FrecuenciaCosto>(
    concepto?.frecuencia ?? plantillasConcepto.ALIMENTACION.frecuencia,
  )
  const [baseConteo, setBaseConteo] = useState<BaseConteo>(
    concepto?.baseConteo ?? plantillasConcepto.ALIMENTACION.baseConteo,
  )
  const [esAlimentacion, setEsAlimentacion] = useState<boolean>(
    concepto?.esAlimentacion ?? false,
  )
  const [comidas, setComidas] = useState<Record<TipoComida, EstadoComida>>(() =>
    estadoComidasInicial(concepto),
  )
  const [montoAlimentacion, setMontoAlimentacion] = useState(() => {
    if (!concepto?.esAlimentacion) return ""
    const total = concepto.comidas.reduce((suma, comida) => suma + comida.montoReferencial, 0)
    return total > 0 ? formatearMonto(total) : ""
  })
  const [plantilla, setPlantilla] = useState<ClavePlantilla | null>(() => detectarPlantilla(concepto))
  const [modoManual, setModoManual] = useState(() => detectarPlantilla(concepto) === null)
  const [montoReferencial, setMontoReferencial] = useState(
    concepto?.montoReferencial != null ? String(concepto.montoReferencial) : "",
  )
  const [moneda, setMoneda] = useState(concepto?.moneda ?? "PEN")
  const [error, setError] = useState<string | null>(null)

  const crear = useRegistrarConceptoCostoMutation()
  const modificar = useModificarConceptoCostoMutation(concepto?.id ?? 0)
  const pendiente = crear.isPending || modificar.isPending
  const nombreNormalizado = nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
  const conceptoEsAlimentacion = esAlimentacion || nombreNormalizado.includes("aliment")

  function aplicarPlantilla(clave: ClavePlantilla) {
    const def = plantillasConcepto[clave]
    setPlantilla(clave)
    setNaturaleza(def.naturaleza)
    setBaseImputacion(def.baseImputacion)
    setFrecuencia(def.frecuencia)
    setBaseConteo(def.baseConteo)
    setEsAlimentacion(def.esAlimentacion ?? false)
    if (def.esAlimentacion) {
      setComidas((prev) => ({
        DESAYUNO: { ...prev.DESAYUNO, activa: true, baseConteo: baseConteoPorComida.DESAYUNO },
        ALMUERZO: { ...prev.ALMUERZO, activa: true, baseConteo: baseConteoPorComida.ALMUERZO },
        CENA: { ...prev.CENA, activa: true, baseConteo: baseConteoPorComida.CENA },
      }))
    }
  }

  function comidasPayload(): ComidaConcepto[] {
    const activas = COMIDAS.filter((t) => comidas[t].activa)
    const montos = distribuirMonto(Number(montoAlimentacion), activas.length)
    return activas.map((t, index) => ({
      tipoComida: t,
      montoReferencial: montos[index] ?? 0,
      moneda,
      baseConteo: baseConteoPorComida[t],
    }))
  }

  async function guardar() {
    if (!nombre.trim()) {
      setError("El nombre es obligatorio.")
      return
    }
    if (conceptoEsAlimentacion) {
      const activas = COMIDAS.filter((t) => comidas[t].activa)
      if (activas.length === 0) {
        setError("Marca al menos una comida (desayuno, almuerzo o cena).")
        return
      }
      const totalAlimentacion = Number(montoAlimentacion)
      if (!Number.isFinite(totalAlimentacion) || totalAlimentacion <= 0) {
        setError("El monto total de alimentacion debe ser mayor que cero.")
        return
      }
    }
    try {
      setError(null)
      const montoRef = !conceptoEsAlimentacion && montoReferencial.trim() ? Number(montoReferencial) : null
      const comidasReq = conceptoEsAlimentacion ? comidasPayload() : []
      const comun = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        naturaleza,
        baseImputacion: conceptoEsAlimentacion ? "PERSONA" : baseImputacion,
        frecuencia: conceptoEsAlimentacion ? "POR_DIA" : frecuencia,
        baseConteo: conceptoEsAlimentacion ? "DIA" : baseConteo,
        montoReferencial: montoRef,
        moneda,
        comidas: comidasReq,
      }
      if (concepto) {
        await modificar.mutateAsync({ ...comun, usuarioModificacion: usuarioId })
      } else {
        await crear.mutateAsync({ ...comun, usuarioCreacion: usuarioId })
      }
      onClose(true)
    } catch (err) {
      setError(obtenerMensajeError(err))
    }
  }

  const comidasActivas = COMIDAS.filter((t) => comidas[t].activa)
  const montosCalculadosComidas = distribuirMonto(Number(montoAlimentacion), comidasActivas.length)
  const montoCalculadoPorComida = new Map<TipoComida, number>(
    comidasActivas.map((t, index) => [t, montosCalculadosComidas[index] ?? 0]),
  )
  const plantillaActiva = plantilla ? plantillasConcepto[plantilla] : null

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>{concepto ? "Editar concepto" : "Nuevo concepto de costo"}</DialogTitle>
        <DialogDescription>Define regla y tarifa referencial del concepto.</DialogDescription>
      </DialogHeader>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudo guardar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-4">
        <Field>
          <FieldLabel>Nombre</FieldLabel>
          <Input value={nombre} placeholder="Alimentacion" onChange={(e) => setNombre(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel>Descripcion</FieldLabel>
          <Textarea
            value={descripcion ?? ""}
            placeholder="Comida del conductor"
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </Field>
        <div>
          <p className="mb-2 text-sm font-medium">Como se paga este costo</p>

          {!modoManual ? (
            <>
              <div className="grid gap-2 sm:grid-cols-2">
                {(Object.entries(plantillasConcepto) as [ClavePlantilla, DefinicionPlantilla][]).map(
                  ([clave, def]) => {
                    const seleccionado = plantilla === clave
                    return (
                      <button
                        key={clave}
                        type="button"
                        onClick={() => aplicarPlantilla(clave)}
                        className={`rounded-lg border p-3 text-left transition-colors ${
                          seleccionado
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border bg-background hover:bg-muted/40"
                        }`}
                      >
                        <p className="text-sm font-medium">{def.frase}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <Badge variant="secondary" className="text-[10px] font-normal">
                            {def.naturaleza}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] font-normal">
                            {def.ejemplo}
                          </Badge>
                        </div>
                      </button>
                    )
                  },
                )}
              </div>
              {plantillaActiva ? (
                <div className="mt-3 rounded-lg border border-border bg-muted/25 p-3 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Regla:</span> {plantillaActiva.naturaleza} · {plantillaActiva.baseImputacion} · {plantillaActiva.frecuencia}
                </div>
              ) : null}
              <button
                type="button"
                className="mt-2 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                onClick={() => setModoManual(true)}
              >
                Ninguna opcion aplica, configurar a mano
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-4 rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Configuracion manual</p>
                <button
                  type="button"
                  className="text-xs text-primary underline underline-offset-2"
                  onClick={() => {
                    setModoManual(false)
                    aplicarPlantilla("ALIMENTACION")
                  }}
                >
                  Volver a las opciones comunes
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Cambia en el tiempo?</FieldLabel>
                  <Select value={naturaleza} onValueChange={(v) => setNaturaleza(v as NaturalezaConcepto)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIJO">Fijo - monto unico</SelectItem>
                      <SelectItem value="VARIABLE">Variable - se acumula por dia</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>A quien o a que se le carga?</FieldLabel>
                  <Select value={baseImputacion} onValueChange={(v) => setBaseImputacion(v as BaseImputacion)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNIDAD">A la unidad (vehiculo)</SelectItem>
                      <SelectItem value="PERSONA">A la persona (conductor)</SelectItem>
                      <SelectItem value="SERVICIO">Al servicio completo</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field className="sm:col-span-2">
                  <FieldLabel>Cada cuanto se genera?</FieldLabel>
                  <Select value={frecuencia} onValueChange={(v) => setFrecuencia(v as FrecuenciaCosto)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="POR_VIAJE">1 vez por viaje</SelectItem>
                      <SelectItem value="POR_DIA">Por cada dia (o noche) del viaje</SelectItem>
                      <SelectItem value="POR_SERVICIO">1 vez por todo el servicio</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {ayudaFrecuencia[frecuencia]} El &quot;a quien multiplica&quot; lo aporta &quot;A
                    quien se le carga&quot;.
                  </p>
                </Field>
                {frecuencia === "POR_DIA" && !conceptoEsAlimentacion ? (
                  <Field className="sm:col-span-2">
                    <FieldLabel>Se cuenta por dia o por noche?</FieldLabel>
                    <Select value={baseConteo} onValueChange={(v) => setBaseConteo(v as BaseConteo)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DIA">Por dia</SelectItem>
                        <SelectItem value="NOCHE">Por noche</SelectItem>
                      </SelectContent>
                    </Select>
                    {baseConteo === "NOCHE" ? (
                      <p className="text-xs text-amber-600">
                        Las noches se escriben a mano al configurar la ruta + cuenta (no se calculan
                        solas).
                      </p>
                    ) : null}
                  </Field>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {conceptoEsAlimentacion ? (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border bg-muted/30 px-4 py-3">
              <div className="grid gap-3 sm:grid-cols-[1fr_160px_112px] sm:items-end">
                <div>
                  <p className="text-sm font-semibold">Comidas y tarifa referencial</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Monto total dividido entre comidas activas.
                  </p>
                </div>
                <Field>
                  <FieldLabel>Monto total</FieldLabel>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={montoAlimentacion}
                    placeholder="60.00"
                    className="text-right"
                    onChange={(e) => setMontoAlimentacion(e.target.value)}
                  />
                </Field>
                <Field className="w-28">
                  <FieldLabel>Moneda</FieldLabel>
                  <Input value={moneda} onChange={(e) => setMoneda(e.target.value.toUpperCase())} />
                </Field>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-40">Comida</TableHead>
                    <TableHead className="w-36 text-right">Tarifa asignada</TableHead>
                    <TableHead>Se multiplica por</TableHead>
                    <TableHead>Formula</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {COMIDAS.map((t) => (
                    <TableRow key={t}>
                      <TableCell>
                        <label className="flex items-center gap-2 text-sm font-medium">
                          <Checkbox
                            checked={comidas[t].activa}
                            onCheckedChange={(c) =>
                              setComidas((prev) => ({
                                ...prev,
                                [t]: {
                                  ...prev[t],
                                  activa: c === true,
                                  baseConteo: baseConteoPorComida[t],
                                },
                              }))
                            }
                          />
                          {etiquetaComida[t]}
                        </label>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {comidas[t].activa ? `${moneda} ${formatearMonto(montoCalculadoPorComida.get(t) ?? 0)}` : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant="secondary" className="w-fit">
                            {etiquetaMultiplicadorComida[t]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{ayudaMultiplicadorComida[t]}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {formulaComida[t]}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-2 border-t border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground sm:grid-cols-3">
              <p><span className="font-semibold text-foreground">Ejemplo:</span> 50 / 2 comidas = 25 cada una.</p>
              <p>Desayuno/almuerzo usan dias.</p>
              <p>Cena usa noches.</p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium">Tarifa referencial (opcional)</p>
            <p className="mt-0.5 mb-3 text-xs text-muted-foreground">
              Precio unitario sugerido ({etiquetaFrecuencia[frecuencia].toLowerCase()}), no el total
              del viaje. Prellena el checklist cuando ruta + cuenta/contrato aun no tiene su propio
              monto; el usuario puede sobrescribirlo ahi.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Monto referencial</FieldLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={montoReferencial}
                  placeholder="40.00"
                  onChange={(e) => setMontoReferencial(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Moneda</FieldLabel>
                <Input value={moneda} onChange={(e) => setMoneda(e.target.value.toUpperCase())} />
              </Field>
            </div>
          </div>
        )}
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

// --- Tarjeta de concepto (catalogo) -------------------------------------------

function ConceptoCard({
  concepto,
  onEditar,
  onCambiado,
}: {
  concepto: ConceptoCostoResponse
  onEditar: () => void
  onCambiado: () => void
}) {
  const inhabilitar = useInhabilitarConceptoCostoMutation(concepto.id, { onSuccess: onCambiado })
  const habilitar = useHabilitarConceptoCostoMutation(concepto.id, { onSuccess: onCambiado })
  const [error, setError] = useState<string | null>(null)
  const activo = concepto.estado === "ACTIVO"
  const pendiente = inhabilitar.isPending || habilitar.isPending

  async function alternar() {
    try {
      setError(null)
      if (activo) await inhabilitar.mutateAsync(undefined)
      else await habilitar.mutateAsync(undefined)
    } catch (err) {
      setError(obtenerMensajeError(err))
    }
  }

  return (
    <article className="flex min-h-44 flex-col justify-between gap-3 rounded-xl border border-border bg-background p-4 shadow-sm transition-colors hover:bg-muted/30">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <Coins className="size-5" />
          </span>
          <Badge variant={activo ? "outline" : "secondary"}>{activo ? "Activo" : "Inactivo"}</Badge>
        </div>
        <div className="min-w-0">
          <p className="font-mono text-xs text-muted-foreground">{concepto.codigo}</p>
          <h2 className="mt-1 line-clamp-2 text-base font-semibold">{concepto.nombre}</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          {fraseComportamientoConcepto(
            concepto.frecuencia,
            concepto.baseImputacion,
            concepto.baseConteo,
            concepto.esAlimentacion,
          )}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">{etiquetaNaturaleza[concepto.naturaleza]}</Badge>
          <Badge variant="secondary">{etiquetaBase[concepto.baseImputacion]}</Badge>
          {concepto.esAlimentacion ? <Badge variant="secondary">Alimentacion</Badge> : null}
        </div>
        {concepto.esAlimentacion && concepto.comidas.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            {concepto.comidas
              .map(
                (c) =>
                  `${etiquetaComida[c.tipoComida]} ${c.moneda} ${c.montoReferencial.toFixed(2)} (${etiquetaMultiplicadorComida[c.tipoComida]})`,
              )
              .join(" · ")}
          </p>
        ) : concepto.montoReferencial != null ? (
          <p className="text-xs text-muted-foreground">
            Tarifa referencial: {concepto.moneda ?? "PEN"} {concepto.montoReferencial.toFixed(2)}
          </p>
        ) : null}
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="flex-1" onClick={onEditar}>
          <Pencil data-icon="inline-start" />
          Editar
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className={activo ? "text-destructive hover:text-destructive" : ""}
          onClick={() => void alternar()}
          disabled={pendiente}
        >
          {pendiente ? "..." : activo ? "Inhabilitar" : "Habilitar"}
        </Button>
      </div>
    </article>
  )
}

// --- Pestana: catalogo de conceptos ------------------------------------------

function ConceptosTab() {
  const [busqueda, setBusqueda] = useState("")
  const [mostrarInactivos, setMostrarInactivos] = useState(false)
  const conceptosQuery = useConceptosCostoQuery({
    nombre: busqueda || undefined,
    estadoRegistro: "ACTIVO",
    estado: mostrarInactivos ? undefined : "ACTIVO",
    page: 1,
    pageSize: 50,
  })
  const conceptos = useMemo(() => conceptosQuery.data?.datos ?? [], [conceptosQuery.data])
  const [dialogo, setDialogo] = useState<
    { modo: "crear" } | { modo: "editar"; concepto: ConceptoCostoResponse } | null
  >(null)

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <Input
            value={busqueda}
            placeholder="Buscar concepto por nombre"
            className="max-w-sm"
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox checked={mostrarInactivos} onCheckedChange={(c) => setMostrarInactivos(c === true)} />
            Mostrar inhabilitados
          </label>
        </div>
        <Button onClick={() => setDialogo({ modo: "crear" })}>
          <Plus data-icon="inline-start" />
          Nuevo concepto
        </Button>
      </div>

      {conceptosQuery.error ? (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertTitle>Error de API</AlertTitle>
            <AlertDescription>{obtenerMensajeError(conceptosQuery.error)}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {conceptosQuery.isLoading ? (
        <div className="flex flex-col gap-3 p-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : conceptos.length === 0 ? (
        <Empty className="py-12">
          <EmptyHeader>
            <EmptyTitle>Sin conceptos de costo</EmptyTitle>
            <EmptyDescription>
              Registra el primer concepto (alimentacion, cochera, lavado, etc.). Luego, en
              &quot;Configuracion de costo&quot;, arma el paquete por ruta + cuenta/contrato.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          {conceptos.map((concepto) => (
            <ConceptoCard
              key={concepto.id}
              concepto={concepto}
              onEditar={() => setDialogo({ modo: "editar", concepto })}
              onCambiado={() => void conceptosQuery.refetch()}
            />
          ))}
        </div>
      )}

      <Dialog open={dialogo !== null} onOpenChange={(open) => !open && setDialogo(null)}>
        {dialogo ? (
          <ConceptoDialog
            concepto={dialogo.modo === "editar" ? dialogo.concepto : undefined}
            onClose={(actualizado) => {
              setDialogo(null)
              if (actualizado) void conceptosQuery.refetch()
            }}
          />
        ) : null}
      </Dialog>
    </section>
  )
}

// --- Pestana: configuracion de costo (checklist ruta + cuenta + modalidad) --

type EstadoLinea = {
  activo: boolean
  monto: string
  moneda: string
  comidas: Record<TipoComida, string>
}

function ChecklistPanel({
  rutaId,
  cuentaContratoId,
  modalidadEntrega,
  moneda,
  onGuardado,
}: {
  rutaId: number
  cuentaContratoId: number
  modalidadEntrega: ModalidadEntrega
  moneda: string
  onGuardado: () => void
}) {
  const checklistQuery = useChecklistCostoOperativoQuery(rutaId, cuentaContratoId, modalidadEntrega)
  const [lineas, setLineas] = useState<Record<number, EstadoLinea>>({})
  const [diasViatico, setDiasViatico] = useState("")
  const [nochesViatico, setNochesViatico] = useState("")
  const [diasSynced, setDiasSynced] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { usuario } = useSesion()
  const usuarioId = usuario?.email ?? "admin"

  const items = checklistQuery.data?.items ?? []

  if (!diasSynced && checklistQuery.data) {
    setDiasViatico(checklistQuery.data.diasViatico != null ? String(checklistQuery.data.diasViatico) : "")
    setNochesViatico(
      checklistQuery.data.nochesViatico != null ? String(checklistQuery.data.nochesViatico) : "",
    )
    setDiasSynced(true)
  }

  const itemsKey = items
    .map(
      (i) =>
        `${i.conceptoCostoOperativoId}:${i.activo}:${i.monto}:${i.comidas
          .map((c) => `${c.tipoComida}=${c.monto}`)
          .join(",")}`,
    )
    .join("|")
  const [syncedKey, setSyncedKey] = useState<string | null>(null)
  if (itemsKey !== syncedKey && items.length > 0) {
    const inicial: Record<number, EstadoLinea> = {}
    items.forEach((item) => {
      const comidas: Record<TipoComida, string> = { DESAYUNO: "", ALMUERZO: "", CENA: "" }
      item.comidas.forEach((c) => {
        comidas[c.tipoComida] = String(c.monto)
      })
      inicial[item.conceptoCostoOperativoId] = {
        activo: item.activo,
        monto: item.monto != null ? String(item.monto) : "",
        moneda: item.moneda || moneda,
        comidas,
      }
    })
    setLineas(inicial)
    setSyncedKey(itemsKey)
  }

  const guardar = useGuardarCostoOperativoMutation({ onSuccess: onGuardado })

  function toggle(item: ChecklistItemCostoOperativo, checked: boolean) {
    setLineas((prev) => ({
      ...prev,
      [item.conceptoCostoOperativoId]: {
        activo: checked,
        monto: prev[item.conceptoCostoOperativoId]?.monto ?? "",
        moneda: prev[item.conceptoCostoOperativoId]?.moneda ?? moneda,
        comidas: prev[item.conceptoCostoOperativoId]?.comidas ?? {
          DESAYUNO: "",
          ALMUERZO: "",
          CENA: "",
        },
      },
    }))
  }

  function setMonto(conceptoId: number, monto: string) {
    setLineas((prev) => ({
      ...prev,
      [conceptoId]: { ...prev[conceptoId], monto, activo: prev[conceptoId]?.activo ?? false },
    }))
  }

  function setMontoTotalComidas(item: ChecklistItemCostoOperativo, valor: string) {
    const activas = item.comidas.map((comida) => comida.tipoComida)
    const montos = distribuirMonto(Number(valor), activas.length)
    setLineas((prev) => ({
      ...prev,
      [item.conceptoCostoOperativoId]: {
        ...prev[item.conceptoCostoOperativoId],
        comidas: {
          ...prev[item.conceptoCostoOperativoId].comidas,
          ...Object.fromEntries(activas.map((tipo, index) => [tipo, formatearMonto(montos[index] ?? 0)])),
        },
      },
    }))
  }

  function totalComidas(item: ChecklistItemCostoOperativo, linea: EstadoLinea) {
    return item.comidas.reduce((suma, comida) => suma + (Number(linea.comidas[comida.tipoComida]) || 0), 0)
  }

  // baseConteo por comida (para saber si algun concepto marcado cuenta por noche).
  const comidaNochePorConcepto = new Map<number, TipoComida[]>()
  items.forEach((i) => {
    if (i.esAlimentacion) {
      comidaNochePorConcepto.set(
        i.conceptoCostoOperativoId,
        i.comidas.filter((c) => c.baseConteo === "NOCHE").map((c) => c.tipoComida),
      )
    }
  })

  const marcadosPorNoche = items.filter((item) => {
    const linea = lineas[item.conceptoCostoOperativoId]
    if (!linea?.activo) return false
    if (item.esAlimentacion) return (comidaNochePorConcepto.get(item.conceptoCostoOperativoId) ?? []).length > 0
    return item.baseConteo === "NOCHE"
  })

  async function guardarChecklist() {
    for (const item of items) {
      const linea = lineas[item.conceptoCostoOperativoId]
      if (!linea?.activo) continue
      if (item.esAlimentacion) {
        for (const c of item.comidas) {
          const m = Number(linea.comidas[c.tipoComida])
          if (!Number.isFinite(m) || m <= 0) {
            setError(`${item.conceptoNombre}: cada comida necesita un monto mayor que cero.`)
            return
          }
        }
      } else {
        const m = Number(linea.monto)
        if (!Number.isFinite(m) || m <= 0) {
          setError("Cada concepto marcado necesita un monto mayor que cero.")
          return
        }
      }
    }
    try {
      setError(null)
      await guardar.mutateAsync({
        rutaId,
        cuentaContratoId,
        modalidadEntrega,
        moneda,
        diasViatico: diasViatico.trim() ? Number(diasViatico) : 1,
        nochesViatico: nochesViatico.trim() ? Number(nochesViatico) : marcadosPorNoche.length > 0 ? 0 : null,
        usuarioCreacion: usuarioId,
        lineas: items.map((item) => {
          const linea = lineas[item.conceptoCostoOperativoId] ?? {
            activo: false,
            monto: "",
            moneda,
            comidas: { DESAYUNO: "", ALMUERZO: "", CENA: "" },
          }
          if (item.esAlimentacion) {
            return {
              conceptoId: item.conceptoCostoOperativoId,
              activo: linea.activo,
              moneda: linea.moneda || moneda,
              comidas: item.comidas.map((c) => ({
                tipoComida: c.tipoComida,
                activo: true,
                monto: Number(linea.comidas[c.tipoComida]) || 0,
                moneda: linea.moneda || moneda,
              })),
            }
          }
          return {
            conceptoId: item.conceptoCostoOperativoId,
            activo: linea.activo,
            monto: Number(linea.monto) || 0,
            moneda: linea.moneda || moneda,
          }
        }),
      })
    } catch (err) {
      setError(obtenerMensajeError(err))
    }
  }

  if (checklistQuery.isLoading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    )
  }

  if (checklistQuery.error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>Error de API</AlertTitle>
          <AlertDescription>{obtenerMensajeError(checklistQuery.error)}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <Empty className="py-10">
        <EmptyHeader>
          <EmptyTitle>Sin conceptos en el catalogo</EmptyTitle>
          <EmptyDescription>
            Registra conceptos en la pestana &quot;Catalogo de conceptos&quot; antes de armar el
            paquete de costo.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const activos = items.filter((item) => lineas[item.conceptoCostoOperativoId]?.activo).length

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div>
          <p className="text-sm font-semibold">Aplicar catalogo a esta ruta</p>
          <p className="mt-1 text-xs text-muted-foreground">
            El catalogo define que conceptos existen. Aqui solo eliges cuales aplican para esta ruta + cuenta y sus tarifas.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div className="rounded-md border border-border bg-background px-3 py-2">
              <p className="text-[11px] text-muted-foreground">Conceptos seleccionados</p>
              <p className="text-sm font-semibold">{activos} de {items.length}</p>
            </div>
            <div className="rounded-md border border-border bg-background px-3 py-2">
              <p className="text-[11px] text-muted-foreground">Modalidad</p>
              <p className="text-sm font-semibold">{modalidadEntrega}</p>
            </div>
            <div className="rounded-md border border-border bg-background px-3 py-2">
              <p className="text-[11px] text-muted-foreground">Moneda</p>
              <p className="text-sm font-semibold">{moneda}</p>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudo guardar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-3 lg:grid-cols-2">
        {items.map((item) => {
          const linea = lineas[item.conceptoCostoOperativoId] ?? {
            activo: false,
            monto: "",
            moneda,
            comidas: { DESAYUNO: "", ALMUERZO: "", CENA: "" },
          }
          const totalAlimentacion = totalComidas(item, linea)
          const cantidadTexto = item.esAlimentacion
            ? "Desayuno/almuerzo usan dias; cena usa noches."
            : item.frecuencia === "POR_DIA"
              ? `Se multiplica por ${item.baseConteo === "NOCHE" ? "noches" : "dias"}.`
              : item.frecuencia === "POR_VIAJE"
                ? "Se cobra una vez por viaje."
                : "Se cobra una vez por servicio."

          return (
            <article
              key={item.conceptoCostoOperativoId}
              className={`rounded-xl border p-4 shadow-sm transition-colors ${
                linea.activo ? "border-primary bg-primary/5" : "border-border bg-card"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-base font-semibold">{item.conceptoNombre}</h3>
                    {item.esAlimentacion ? <Badge>Alimentacion</Badge> : null}
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{item.conceptoCodigo}</p>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={linea.activo} onCheckedChange={(c) => toggle(item, c === true)} />
                  Activo
                </label>
              </div>

              <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                <Badge variant="secondary" className="justify-center">{etiquetaNaturaleza[item.naturaleza]}</Badge>
                <Badge variant="secondary" className="justify-center">{etiquetaBase[item.baseImputacion]}</Badge>
                <Badge variant="secondary" className="justify-center">{item.esAlimentacion ? "Comidas" : etiquetaFrecuencia[item.frecuencia]}</Badge>
              </div>

              <p className="mt-3 rounded-md bg-background/80 px-3 py-2 text-xs text-muted-foreground">
                {linea.activo ? cantidadTexto : "Disponible desde catalogo. Activalo si aplica a esta ruta."}
              </p>

              <div className="mt-4">
                {item.esAlimentacion ? (
                  <div className="grid gap-3">
                    <Field>
                      <FieldLabel>Monto total de alimentacion</FieldLabel>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={totalAlimentacion > 0 ? formatearMonto(totalAlimentacion) : ""}
                        disabled={!linea.activo}
                        placeholder="0.00"
                        className="text-right"
                        onChange={(e) => setMontoTotalComidas(item, e.target.value)}
                      />
                    </Field>
                    <div className="flex flex-wrap gap-2">
                      {item.comidas.map((c) => (
                        <Badge key={c.tipoComida} variant="outline" className="gap-1 font-normal">
                          {etiquetaComida[c.tipoComida]}: {moneda} {linea.comidas[c.tipoComida] || "0.00"}
                        </Badge>
                      ))}
                    </div>
                    {item.comidas.length < COMIDAS.length ? (
                      <p className="text-xs text-amber-600 dark:text-amber-300">
                        Catalogo activo con {item.comidas.length} comida{item.comidas.length === 1 ? "" : "s"}. Edita catalogo si faltan comidas.
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <Field>
                    <FieldLabel>Monto unitario</FieldLabel>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={linea.monto}
                      disabled={!linea.activo}
                      placeholder="0.00"
                      className="text-right"
                      onChange={(e) => setMonto(item.conceptoCostoOperativoId, e.target.value)}
                    />
                  </Field>
                )}
              </div>
            </article>
          )
        })}
      </section>

      <div className="flex justify-end">
        <Button onClick={() => void guardarChecklist()} disabled={guardar.isPending}>
          {guardar.isPending ? "Guardando..." : "Guardar configuracion de costo"}
        </Button>
      </div>
    </div>
  )
}

type DetalleCostoPaquete = {
  clave: string
  concepto: string
  cobro: string
  cantidad: number
  tarifa: number
  moneda: string
  subtotal: number
}

function cantidadBaseLinea(linea: LineaCostoOperativoResponse, paquete: CostoOperativoResponse) {
  if (linea.frecuencia !== "POR_DIA") return 1
  return linea.baseConteo === "NOCHE" ? (paquete.nochesViatico ?? 0) : (paquete.diasViatico ?? 1)
}

function detalleConceptosPaquete(paquete: CostoOperativoResponse): DetalleCostoPaquete[] {
  return paquete.lineas
    .filter((linea) => linea.activo)
    .flatMap((linea) => {
      const concepto = linea.conceptoNombre ?? linea.conceptoCodigo ?? `Concepto ${linea.conceptoCostoOperativoId}`
      if (linea.esAlimentacion) {
        return linea.comidas
          .filter((comida) => comida.activo !== false)
          .map((comida) => {
            const cantidad = comida.baseConteo === "NOCHE" ? (paquete.nochesViatico ?? 0) : (paquete.diasViatico ?? 1)
            return {
              clave: `${linea.id}-${comida.tipoComida}`,
              concepto: `${concepto} - ${etiquetaComida[comida.tipoComida]}`,
              cobro: comida.baseConteo === "NOCHE" ? "Por noche" : "Por dia",
              cantidad,
              tarifa: comida.monto,
              moneda: comida.moneda || linea.moneda || paquete.moneda || "PEN",
              subtotal: comida.monto * cantidad,
            }
          })
      }
      const cantidad = cantidadBaseLinea(linea, paquete)
      const tarifa = linea.monto ?? 0
      return [{
        clave: String(linea.id),
        concepto,
        cobro: linea.frecuencia === "POR_DIA" ? (linea.baseConteo === "NOCHE" ? "Por noche" : "Por dia") : "Por viaje",
        cantidad,
        tarifa,
        moneda: linea.moneda || paquete.moneda || "PEN",
        subtotal: tarifa * cantidad,
      }]
    })
}

function sumarPorMoneda(filas: Array<{ moneda: string; subtotal: number }>) {
  const totales = new Map<string, number>()
  filas.forEach((fila) => totales.set(fila.moneda, (totales.get(fila.moneda) ?? 0) + fila.subtotal))
  return Array.from(totales.entries())
}

function formatearTotales(totales: Array<[string, number]>) {
  if (totales.length === 0) return "-"
  return totales.map(([moneda, monto]) => `${moneda} ${formatearMonto(monto)}`).join(" + ")
}

function PaqueteConfiguradoCard({
  paquete,
  onEditar,
  onAnular,
}: {
  paquete: CostoOperativoResponse
  onEditar: () => void
  onAnular: () => void
}) {
  const detalleConceptos = detalleConceptosPaquete(paquete)
  const totalConceptos = sumarPorMoneda(detalleConceptos)
  const peajesQuery = useCostoPeajesRutaQuery(paquete.rutaId, { tipoCobro: "NORMAL", sentido: "IDA", numeroEjes: 2 }, true)
  const peajeMoneda = peajesQuery.data?.moneda ?? paquete.moneda ?? "PEN"
  const peajeTotal = peajesQuery.data?.total ?? 0
  const totalEstimado = sumarPorMoneda([
    ...detalleConceptos,
    ...(peajesQuery.data ? [{ moneda: peajeMoneda, subtotal: peajeTotal }] : []),
  ])

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{paquete.rutaNombre ?? `Ruta ${paquete.rutaId}`}</p>
          <p className="truncate text-xs text-muted-foreground">
            {paquete.cuentaContratoNombre ?? `Cuenta/contrato ${paquete.cuentaContratoId}`}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary">{etiquetaModalidad[paquete.modalidadEntrega]}</Badge>
            <Badge variant="outline">Dias {paquete.diasViatico ?? 1}</Badge>
            <Badge variant="outline">Noches {paquete.nochesViatico ?? 0}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button size="sm" variant="outline" onClick={onEditar}>
            <Pencil data-icon="inline-start" />
            Editar
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={onAnular}>
            <Trash2 data-icon="inline-start" />
            Anular
          </Button>
        </div>
      </div>

      <div className="grid gap-4 p-4">
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Concepto</TableHead>
                <TableHead>Cobro</TableHead>
                <TableHead className="text-right">Cant.</TableHead>
                <TableHead className="text-right">Tarifa</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detalleConceptos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    Sin conceptos activos.
                  </TableCell>
                </TableRow>
              ) : (
                detalleConceptos.map((fila) => (
                  <TableRow key={fila.clave}>
                    <TableCell className="font-medium">{fila.concepto}</TableCell>
                    <TableCell>{fila.cobro}</TableCell>
                    <TableCell className="text-right">{fila.cantidad}</TableCell>
                    <TableCell className="text-right">{fila.moneda} {formatearMonto(fila.tarifa)}</TableCell>
                    <TableCell className="text-right font-medium">{fila.moneda} {formatearMonto(fila.subtotal)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
          <div className="rounded-lg border border-border bg-muted/25 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">Peajes referenciales</p>
              <Badge variant="outline">NORMAL · IDA · 2 ejes</Badge>
            </div>
            {peajesQuery.isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : peajesQuery.error ? (
              <p className="text-sm text-destructive">No se pudo calcular peajes.</p>
            ) : peajesQuery.data?.detalle?.length ? (
              <div className="grid gap-1 text-sm">
                {peajesQuery.data.detalle.map((peaje) => (
                  <div key={peaje.peajeId} className="flex items-center justify-between gap-3">
                    <span className="truncate text-muted-foreground">{peaje.peajeNombre ?? `Peaje ${peaje.peajeId}`}</span>
                    <span className="font-medium">{peajeMoneda} {formatearMonto(peaje.subtotal)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Ruta sin peajes cobrables para este calculo.</p>
            )}
          </div>

          <div className="grid gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Conceptos</span>
              <span className="font-semibold">{formatearTotales(totalConceptos)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Peajes</span>
              <span className="font-semibold">{peajesQuery.data ? `${peajeMoneda} ${formatearMonto(peajeTotal)}` : "-"}</span>
            </div>
            <div className="border-t border-primary/20 pt-2">
              <p className="text-xs text-muted-foreground">Total estimado</p>
              <p className="text-lg font-semibold">{formatearTotales(totalEstimado)}</p>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

function ConfiguracionCostoTab() {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const [rutaId, setRutaId] = useState("")
  const [cuentaContratoId, setCuentaContratoId] = useState("")
  const [modalidadEntrega, setModalidadEntrega] = useState<ModalidadEntrega>("NORMAL")
  const [moneda, setMoneda] = useState("PEN")
  const [guardadoOk, setGuardadoOk] = useState(false)
  const [editandoId, setEditandoId] = useState<number | null>(null)

  const paquetesQuery = useCostosOperativosQuery({ estadoRegistro: "ACTIVO", page: 1, pageSize: 50 })
  const paquetes = paquetesQuery.data?.datos ?? []
  const [anularId, setAnularId] = useState<number | null>(null)
  const anular = useAnularCostoOperativoMutation(anularId ?? 0, {
    onSuccess: () => {
      setAnularId(null)
      void paquetesQuery.refetch()
    },
  })

  const rutaSeleccionada = rutaId ? Number(rutaId) : null
  const cuentaSeleccionada = cuentaContratoId ? Number(cuentaContratoId) : null

  return (
    <div className="flex flex-col gap-6">
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-gradient-to-r from-primary/10 via-background to-background px-5 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">Paso 1</p>
              <h2 className="text-lg font-semibold">Define contexto del paquete</h2>
              <p className="text-sm text-muted-foreground">
                Escoge ruta, cliente/contrato y modalidad. Luego arma conceptos y tarifas abajo.
              </p>
            </div>
            <Badge variant={rutaSeleccionada && cuentaSeleccionada ? "default" : "secondary"}>
              {rutaSeleccionada && cuentaSeleccionada ? "Listo para configurar" : "Falta contexto"}
            </Badge>
          </div>
        </div>

        <div className="grid gap-4 p-5 xl:grid-cols-[minmax(0,1fr)_260px]">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-background p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ruta</span>
                <Badge variant={rutaSeleccionada ? "default" : "outline"}>1</Badge>
              </div>
              <SelectRuta
                value={rutaId}
                onChange={(v) => {
                  setRutaId(v)
                  setGuardadoOk(false)
                  setEditandoId(null)
                }}
              />
            </div>
            <div className="rounded-xl border border-border bg-background p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Cuenta/contrato</span>
                <Badge variant={cuentaSeleccionada ? "default" : "outline"}>2</Badge>
              </div>
              <SelectCuentaContrato
                value={cuentaContratoId}
                onChange={(v) => {
                  setCuentaContratoId(v)
                  setGuardadoOk(false)
                  setEditandoId(null)
                }}
              />
            </div>
            <div className="rounded-xl border border-border bg-background p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Modalidad</span>
                <Badge variant="outline">3</Badge>
              </div>
              <SelectModalidad
                value={modalidadEntrega}
                onChange={(v) => {
                  setModalidadEntrega(v)
                  setGuardadoOk(false)
                  setEditandoId(null)
                }}
              />
            </div>
          </div>

          <aside className="rounded-xl border border-border bg-muted/25 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Moneda base</p>
            <Input className="mt-2" value={moneda} onChange={(e) => setMoneda(e.target.value.toUpperCase())} />
            <p className="mt-2 text-xs text-muted-foreground">Se usa para montos nuevos del paquete.</p>
          </aside>
        </div>

        {guardadoOk ? (
          <Alert className="mx-5 mb-5">
            <AlertTitle>Configuracion guardada</AlertTitle>
            <AlertDescription>El paquete de costo quedo actualizado para este par.</AlertDescription>
          </Alert>
        ) : null}

        {rutaSeleccionada && cuentaSeleccionada ? (
          <div ref={editorRef} className="border-t border-border bg-muted/20 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">Paso 2</p>
                <h3 className="text-base font-semibold">Activa conceptos y tarifas</h3>
              </div>
              {editandoId ? <Badge variant="secondary">Editando paquete #{editandoId}</Badge> : null}
            </div>
            <ChecklistPanel
              key={`${rutaSeleccionada}-${cuentaSeleccionada}-${modalidadEntrega}`}
              rutaId={rutaSeleccionada}
              cuentaContratoId={cuentaSeleccionada}
              modalidadEntrega={modalidadEntrega}
              moneda={moneda || "PEN"}
              onGuardado={() => {
                setGuardadoOk(true)
                setEditandoId(null)
                void paquetesQuery.refetch()
              }}
            />
          </div>
        ) : (
          <div className="border-t border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Selecciona ruta y cuenta/contrato para abrir tablero de conceptos.
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="size-4 text-muted-foreground" />
            <div>
              <p className="text-base font-semibold">Paquetes configurados</p>
              <p className="text-sm text-muted-foreground">Historial vigente para editar, simular o anular.</p>
            </div>
          </div>
          <Badge variant="secondary">{paquetes.length} paquete{paquetes.length === 1 ? "" : "s"}</Badge>
        </div>

        {paquetesQuery.isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : paquetes.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Aun no hay paquetes de costo configurados.
          </p>
        ) : (
          <div className="grid gap-3">
            {paquetes.map((p: CostoOperativoResponse) => (
              <PaqueteConfiguradoCard
                key={p.id}
                paquete={p}
                onEditar={() => {
                  setRutaId(String(p.rutaId))
                  setCuentaContratoId(String(p.cuentaContratoId))
                  setModalidadEntrega(p.modalidadEntrega)
                  setMoneda(p.moneda || "PEN")
                  setGuardadoOk(false)
                  setEditandoId(p.id)
                  window.setTimeout(() => editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0)
                }}
                onAnular={() => setAnularId(p.id)}
              />
            ))}
          </div>
        )}
      </section>

      {anularId != null ? (
        <Alert>
          <AlertTitle>Confirmar anulacion</AlertTitle>
          <AlertDescription className="flex flex-col gap-3">
            <span>El paquete quedara anulado. No se elimina el registro.</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => void anular.mutateAsync(undefined)}
                disabled={anular.isPending}
              >
                {anular.isPending ? "Anulando..." : "Si, anular"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAnularId(null)} disabled={anular.isPending}>
                Cancelar
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}

// --- Vista principal ----------------------------------------------------------

export function CostosOperativosVista() {
  return (
    <>
      <SiteHeader
        title="Costos operativos"
        breadcrumbs={[
          { title: "CS-Configuracion General", href: "/configuracion" },
          { title: "Costos operativos" },
        ]}
      />
      <main className="min-h-screen bg-muted/30 px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="flex flex-col gap-4 border-l-4 border-l-primary px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                  <Wallet className="size-6" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                    Configuracion general
                  </p>
                  <h1 className="text-xl font-semibold tracking-normal">Costos operativos del viaje</h1>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Catalogo de conceptos (alimentacion desglosada por comida, alojamiento, cochera...)
                    y paquetes de costo por ruta + cuenta/contrato + modalidad, con vigencia. La config
                    calcula el total; el peaje se calcula aparte por ejes.
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href="/configuracion">
                  <ArrowRight className="size-4 rotate-180" data-icon="inline-start" />
                  Inicio
                </Link>
              </Button>
            </div>
          </section>

          <Tabs defaultValue="configuracion" className="w-full">
            <TabsList>
              <TabsTrigger value="configuracion">Configuracion de costo</TabsTrigger>
              <TabsTrigger value="catalogo">Catalogo de conceptos</TabsTrigger>
            </TabsList>
            <TabsContent value="configuracion" className="mt-4">
              <ConfiguracionCostoTab />
            </TabsContent>
            <TabsContent value="catalogo" className="mt-4">
              <ConceptosTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  )
}
