"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, CalendarDays, ClipboardList, Clock3, Coins, Pencil, Plus, Trash2, Wallet } from "lucide-react"

import { ApiError } from "@/compartido/api/axios"
import { obtenerUsuarioAuditoria } from "@/compartido/autenticacion/usuario-auditoria"
import { SiteHeader } from "@/compartido/componentes/site-header"
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/compartido/componentes/ui/accordion"
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
import { ScrollArea } from "@/compartido/componentes/ui/scroll-area"
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
import { useCostoPeajesRutaQuery, useDetalleRutaQuery, useRutasQuery } from "../servicios/rutas-peajes-queries"
import type { PaginationMeta } from "../tipos/configuracion-general"
import {
  useAnularCostoOperativoMutation,
  useCalcularCostoQuery,
  useChecklistCostoOperativoQuery,
  useConceptosCostoQuery,
  useCostosOperativosQuery,
  useGuardarTramosCostoOperativoMutation,
  useGuardarCostoOperativoMutation,
  useHabilitarConceptoCostoMutation,
  useInhabilitarConceptoCostoMutation,
  useModificarConceptoCostoMutation,
  useRegistrarConceptoCostoMutation,
  useTiempoCostoOperativoQuery,
  useTramosCostoOperativoQuery,
} from "../servicios/costos-operativos-queries"
import type {
  BaseConteo,
  BaseImputacion,
  CalculoCostoResponse,
  ChecklistItemCostoOperativo,
  ComidaConcepto,
  ConceptoCostoResponse,
  CostoOperativoResponse,
  FrecuenciaCosto,
  ModalidadEntrega,
  NaturalezaConcepto,
  TipoCargaCosto,
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
const etiquetaMultiplicadorComida = (baseConteo: BaseConteo) => {
  return baseConteo === "NOCHE" ? "x noches x personas" : "x dias x personas"
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

function formatearFecha(fecha?: string | null) {
  if (!fecha) return null
  const valor = new Date(fecha)
  if (Number.isNaN(valor.getTime())) return fecha
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" }).format(valor)
}

// Texto de vigencia legible: "Desde 5 ene 2026", "Hasta 5 ene 2026", o rango.
function textoVigencia(fechaInicio?: string | null, fechaFin?: string | null) {
  const inicio = formatearFecha(fechaInicio)
  const fin = formatearFecha(fechaFin)
  if (inicio && fin) return `${inicio} - ${fin}`
  if (inicio) return `Desde ${inicio}`
  if (fin) return `Hasta ${fin}`
  return "Sin fecha de vigencia"
}

function cantidadConteo(baseConteo: BaseConteo, dias: string, noches: string) {
  const valor = baseConteo === "NOCHE" ? Number(noches) : Number(dias)
  return Number.isFinite(valor) && valor >= 0 ? valor : 0
}

function etiquetaConteo(baseConteo: BaseConteo, dias: string, noches: string) {
  const cantidad = cantidadConteo(baseConteo, dias, noches)
  return baseConteo === "NOCHE" ? `Noches (${cantidad})` : `Dias (${cantidad})`
}

function textoNormalizado(valor?: string | null) {
  return (valor ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
}

function esAlojamiento(nombre?: string | null) {
  const texto = textoNormalizado(nombre)
  return texto.includes("aloj") || texto.includes("hosped") || texto.includes("hotel")
}

function permiteConteoNochesSimple(item: Pick<ChecklistItemCostoOperativo, "conceptoNombre" | "frecuencia" | "esAlimentacion">) {
  return !item.esAlimentacion && item.frecuencia === "POR_DIA" && esAlojamiento(item.conceptoNombre)
}

function baseConteoSimpleEfectiva(item: ChecklistItemCostoOperativo, baseConteo: BaseConteo) {
  if (item.frecuencia !== "POR_DIA") return baseConteo
  return permiteConteoNochesSimple(item) ? baseConteo : "DIA"
}

function numeroEnteroNoNegativo(valor: string | number | null | undefined) {
  const numero = Number(valor ?? 0)
  return Number.isFinite(numero) && numero > 0 ? Math.floor(numero) : 0
}

function diasMarcados(cantidad: number, dias: number) {
  return Array.from({ length: Math.max(dias, 0) }, (_, index) => index < cantidad)
}

function contarMarcados(valores: boolean[] | undefined) {
  return (valores ?? []).filter(Boolean).length
}

function BotonesConteo({
  value,
  dias,
  noches,
  disabled,
  onChange,
}: {
  value: BaseConteo
  dias: string
  noches: string
  disabled?: boolean
  onChange: (value: BaseConteo) => void
}) {
  return (
    <div className="inline-flex rounded-md border border-border bg-background p-0.5">
      {(["DIA", "NOCHE"] as BaseConteo[]).map((opcion) => (
        <button
          key={opcion}
          type="button"
          disabled={disabled}
          onClick={() => onChange(opcion)}
          className={`rounded px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
            value === opcion ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          {etiquetaConteo(opcion, dias, noches)}
        </button>
      ))}
    </div>
  )
}
// Marca los dias (o noches) del viaje en que aplica una comida, con un chip por
// dia. La fuente de verdad interna es el arreglo de dias marcados (el payload
// envia cantidad = dias marcados).
function ChipsDias({
  dias,
  marcados,
  unidad,
  disabled,
  onToggleDia,
  onTodos,
  onNinguno,
}: {
  dias: number
  marcados: boolean[]
  unidad: "dia" | "noche"
  disabled?: boolean
  onToggleDia: (diaIndex: number, checked: boolean) => void
  onTodos: () => void
  onNinguno: () => void
}) {
  const cantidad = contarMarcados(marcados)
  const etiquetaUnidad = unidad === "noche" ? "noches" : "dias"
  const prefijo = unidad === "noche" ? "N" : "D"

  if (dias === 0) {
    return (
      <p className="text-xs text-amber-600">
        Escribe las {etiquetaUnidad} del viaje en el Paso 1 para poder marcarlas.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          {unidad === "noche" ? "Noches" : "Dias"} que aplica
          <span className="ml-1 text-foreground">{cantidad}/{dias}</span>
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            disabled={disabled}
            onClick={onTodos}
            className="rounded px-2 py-0.5 text-xs text-primary hover:bg-primary/10 disabled:opacity-50"
          >
            Todos
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={onNinguno}
            className="rounded px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted disabled:opacity-50"
          >
            Ninguno
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: dias }, (_, index) => {
          const activo = Boolean(marcados[index])
          return (
            <button
              key={index}
              type="button"
              disabled={disabled}
              onClick={() => onToggleDia(index, !activo)}
              className={`flex h-8 w-10 items-center justify-center rounded-md border text-xs font-medium transition-colors disabled:opacity-50 ${
                activo
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40"
              }`}
            >
              {prefijo}{index + 1}
            </button>
          )
        })}
      </div>
    </div>
  )
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
    naturaleza: "FIJO",
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
  const valorInterno = value
    ? cuentas.some((c) => String(c.id) === value)
      ? `cuenta-${value}`
      : contratos.some((c) => String(c.id) === value)
        ? `contrato-${value}`
        : undefined
    : undefined

  return (
    <Select
      value={valorInterno}
      onValueChange={(v) => onChange(v.replace(/^cuenta-|^contrato-/, ""))}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Selecciona cuenta o contrato" />
      </SelectTrigger>
      <SelectContent>
        {cuentas.length > 0 ? (
          <SelectGroup>
            <SelectLabel>Cuentas</SelectLabel>
            {cuentas.map((c) => (
              <SelectItem key={`cuenta-${c.id}`} value={`cuenta-${c.id}`}>
                {c.codigo} - {c.nombre}
              </SelectItem>
            ))}
          </SelectGroup>
        ) : null}
        {contratos.length > 0 ? (
          <SelectGroup>
            <SelectLabel>Contratos</SelectLabel>
            {contratos.map((c) => (
              <SelectItem key={`contrato-${c.id}`} value={`contrato-${c.id}`}>
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
    <Select key={value || "sin-ruta"} value={value || undefined} onValueChange={onChange}>
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

const etiquetaTipoCarga: Record<TipoCargaCosto, string> = {
  GENERAL: "General",
  DIMENSIONADO: "Dimensionado",
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

const MONEDAS = ["PEN", "USD"] as const

// Moneda del costo: enum corto y estable. Evita texto libre propenso a error.
function SelectMoneda({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (v: string) => void
  className?: string
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className ?? "w-full"}>
        <SelectValue placeholder="Moneda" />
      </SelectTrigger>
      <SelectContent>
        {MONEDAS.map((m) => (
          <SelectItem key={m} value={m}>
            {m}
          </SelectItem>
        ))}
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
        baseConteo: c.baseConteo,
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
  const usuarioId = obtenerUsuarioAuditoria(usuario)
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
      baseConteo: comidas[t].baseConteo,
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
                  <SelectMoneda value={moneda} onChange={setMoneda} />
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
                          <Select
                            value={comidas[t].baseConteo}
                            onValueChange={(v) =>
                              setComidas((prev) => ({
                                ...prev,
                                [t]: { ...prev[t], baseConteo: v as BaseConteo },
                              }))
                            }
                          >
                            <SelectTrigger className="h-8 w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="DIA">Por dia</SelectItem>
                              <SelectItem value="NOCHE">Por noche</SelectItem>
                            </SelectContent>
                          </Select>
                          <span className="text-xs text-muted-foreground">
                            {comidas[t].baseConteo === "NOCHE" ? "Usa noches configuradas." : "Usa dias configurados."}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        personas x {comidas[t].baseConteo === "NOCHE" ? "noches" : "dias"} x tarifa
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-2 border-t border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground sm:grid-cols-3">
              <p><span className="font-semibold text-foreground">Ejemplo:</span> 50 / 2 comidas = 25 cada una.</p>
              <p>El conteo DIA/NOCHE se puede ajustar por comida.</p>
              <p>Cena puede ser por noche o por dia segun ruta.</p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium">Tarifa referencial (opcional)</p>
            <p className="mt-0.5 mb-3 text-xs text-muted-foreground">
              Precio unitario sugerido ({etiquetaFrecuencia[frecuencia].toLowerCase()}), no el total
              del viaje. Prellena el checklist cuando la ruta aun no tiene su propio
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
                <SelectMoneda value={moneda} onChange={setMoneda} />
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
                  `${etiquetaComida[c.tipoComida]} ${c.moneda} ${c.montoReferencial.toFixed(2)} (${etiquetaMultiplicadorComida(c.baseConteo)})`,
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
              &quot;Configuracion de costo&quot;, arma el paquete por ruta.
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
  baseConteo: BaseConteo
  comidas: Record<TipoComida, string>
  baseConteoComidas: Record<TipoComida, BaseConteo>
  diasComidas: Record<TipoComida, boolean[]>
}

function SelectTipoCarga({
  value,
  onChange,
}: {
  value: TipoCargaCosto
  onChange: (v: TipoCargaCosto) => void
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as TipoCargaCosto)}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="GENERAL">General</SelectItem>
        <SelectItem value="DIMENSIONADO">Dimensionado</SelectItem>
      </SelectContent>
    </Select>
  )
}

type EstadoTramoOperativo = {
  ubicacionDesdeId: string
  ubicacionHastaId: string
  horasBase: string
  distanciaKm: string
  tiempoParadaHoras: string
}

function tramoVacio(): EstadoTramoOperativo {
  return {
    ubicacionDesdeId: "",
    ubicacionHastaId: "",
    horasBase: "",
    distanciaKm: "",
    tiempoParadaHoras: "",
  }
}

function TramosOperativosPanel({
  costoOperativoId,
  rutaId,
  setDiasViatico,
  setNochesViatico,
}: {
  costoOperativoId: number | null
  rutaId: number
  setDiasViatico: (v: string) => void
  setNochesViatico: (v: string) => void
}) {
  const { usuario } = useSesion()
  const usuarioId = obtenerUsuarioAuditoria(usuario)
  const detalleRutaQuery = useDetalleRutaQuery(rutaId, true)
  const tramosQuery = useTramosCostoOperativoQuery(costoOperativoId, costoOperativoId != null)
  const tiempoQuery = useTiempoCostoOperativoQuery(costoOperativoId, undefined, costoOperativoId != null)
  const guardarTramos = useGuardarTramosCostoOperativoMutation(costoOperativoId ?? 0, {
    onSuccess: () => {
      void tramosQuery.refetch()
      void tiempoQuery.refetch()
    },
  })
  const [tramos, setTramos] = useState<EstadoTramoOperativo[]>([])
  const [syncedKey, setSyncedKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const puntos = detalleRutaQuery.data?.puntos ?? []
  const ubicacionesRuta = useMemo(
    () => Array.from(new Map(puntos.map((p) => [p.ubicacionId, p])).values()),
    [puntos],
  )
  const tramosGuardados = Array.isArray(tramosQuery.data) ? tramosQuery.data : []
  const dataKey = costoOperativoId
    ? `saved:${costoOperativoId}:${tramosGuardados.map((t) => `${t.orden}:${t.ubicacionDesdeId}-${t.ubicacionHastaId}:${t.horasBase}:${t.distanciaKm}:${t.tiempoParadaHoras}`).join("|")}`
    : `ruta:${rutaId}:${puntos.map((p) => `${p.orden}:${p.ubicacionId}`).join("|")}`

  useEffect(() => {
    if (dataKey === syncedKey) return
    if (tramosGuardados.length > 0) {
      setTramos(
        tramosGuardados.map((tramo) => ({
          ubicacionDesdeId: String(tramo.ubicacionDesdeId),
          ubicacionHastaId: String(tramo.ubicacionHastaId),
          horasBase: String(tramo.horasBase),
          distanciaKm: tramo.distanciaKm == null ? "" : String(tramo.distanciaKm),
          tiempoParadaHoras: tramo.tiempoParadaHoras == null ? "" : String(tramo.tiempoParadaHoras),
        })),
      )
    } else if (puntos.length >= 2) {
      setTramos(
        puntos.slice(0, -1).map((punto, index) => ({
          ubicacionDesdeId: String(punto.ubicacionId),
          ubicacionHastaId: String(puntos[index + 1]?.ubicacionId ?? ""),
          horasBase: "",
          distanciaKm: "",
          tiempoParadaHoras: "",
        })),
      )
    } else {
      setTramos([])
    }
    setSyncedKey(dataKey)
  }, [dataKey, puntos, syncedKey, tramosGuardados])

  function actualizarTramo(index: number, campo: keyof EstadoTramoOperativo, valor: string) {
    setTramos((prev) => prev.map((tramo, i) => (i === index ? { ...tramo, [campo]: valor } : tramo)))
  }

  async function guardar() {
    if (!costoOperativoId) {
      setError("Guarda primero el paquete de costos para poder registrar tramos operativos.")
      return
    }
    const payload = []
    for (const tramo of tramos) {
      const desde = Number(tramo.ubicacionDesdeId)
      const hasta = Number(tramo.ubicacionHastaId)
      const horas = Number(tramo.horasBase)
      if (!desde || !hasta || !Number.isFinite(horas) || horas <= 0) {
        setError("Cada tramo necesita origen, destino y horas base mayor que cero.")
        return
      }
      payload.push({
        ubicacionDesdeId: desde,
        ubicacionHastaId: hasta,
        horasBase: horas,
        distanciaKm: tramo.distanciaKm.trim() ? Number(tramo.distanciaKm) : null,
        tiempoParadaHoras: tramo.tiempoParadaHoras.trim() ? Number(tramo.tiempoParadaHoras) : null,
      })
    }
    try {
      setError(null)
      await guardarTramos.mutateAsync({ tramos: payload, usuarioCreacion: usuarioId })
    } catch (err) {
      setError(obtenerMensajeError(err))
    }
  }

  const calculo = tiempoQuery.data

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Clock3 className="size-4 text-muted-foreground" />
            <p className="text-sm font-semibold">Tramos operativos del paquete</p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Horas, distancia y paradas viven en costo operativo porque pueden cambiar por contrato o modalidad.
          </p>
        </div>
        {calculo ? (
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="secondary">{calculo.horasTotal} h</Badge>
            <Badge variant="outline">{calculo.diasSugeridos} dias</Badge>
            <Badge variant="outline">{calculo.nochesSugeridas} noches</Badge>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setDiasViatico(String(calculo.diasSugeridos))
                setNochesViatico(String(calculo.nochesSugeridas))
              }}
            >
              Usar sugerencia
            </Button>
          </div>
        ) : null}
      </div>

      {!costoOperativoId ? (
        <Alert className="mt-3">
          <AlertTitle>Primero guarda el paquete</AlertTitle>
          <AlertDescription>
            Selecciona conceptos y guarda costos. Luego registra tramos operativos para este paquete.
          </AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive" className="mt-3">
          <AlertTitle>No se pudo guardar tramos</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-4 flex flex-col gap-3">
        {tramos.map((tramo, index) => (
          <div key={index} className="grid gap-3 rounded-lg border border-border bg-background p-3 lg:grid-cols-[1fr_1fr_110px_110px_130px]">
            <Field>
              <FieldLabel>Desde</FieldLabel>
              <Select value={tramo.ubicacionDesdeId} onValueChange={(v) => actualizarTramo(index, "ubicacionDesdeId", v)}>
                <SelectTrigger><SelectValue placeholder="Origen" /></SelectTrigger>
                <SelectContent>
                  {ubicacionesRuta.map((p) => (
                    <SelectItem key={`d-${index}-${p.ubicacionId}`} value={String(p.ubicacionId)}>
                      {p.ubicacionNombre ?? `Ubicacion ${p.ubicacionId}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Hasta</FieldLabel>
              <Select value={tramo.ubicacionHastaId} onValueChange={(v) => actualizarTramo(index, "ubicacionHastaId", v)}>
                <SelectTrigger><SelectValue placeholder="Destino" /></SelectTrigger>
                <SelectContent>
                  {ubicacionesRuta.map((p) => (
                    <SelectItem key={`h-${index}-${p.ubicacionId}`} value={String(p.ubicacionId)}>
                      {p.ubicacionNombre ?? `Ubicacion ${p.ubicacionId}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Horas</FieldLabel>
              <Input type="number" min="0.01" step="0.25" className="text-right" value={tramo.horasBase} onChange={(e) => actualizarTramo(index, "horasBase", e.target.value)} />
            </Field>
            <Field>
              <FieldLabel>Km</FieldLabel>
              <Input type="number" min="0" step="0.1" className="text-right" value={tramo.distanciaKm} onChange={(e) => actualizarTramo(index, "distanciaKm", e.target.value)} />
            </Field>
            <Field>
              <FieldLabel>Parada h</FieldLabel>
              <Input type="number" min="0" step="0.25" className="text-right" value={tramo.tiempoParadaHoras} onChange={(e) => actualizarTramo(index, "tiempoParadaHoras", e.target.value)} />
            </Field>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap justify-between gap-2">
        <Button type="button" variant="outline" onClick={() => setTramos((prev) => [...prev, tramoVacio()])}>
          Agregar tramo
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => void tiempoQuery.refetch()} disabled={!costoOperativoId}>
            Recalcular
          </Button>
          <Button type="button" onClick={() => void guardar()} disabled={!costoOperativoId || guardarTramos.isPending}>
            {guardarTramos.isPending ? "Guardando..." : "Guardar tramos"}
          </Button>
        </div>
      </div>
    </section>
  )
}

function ChecklistPanel({
  rutaId,
  cuentaContratoId,
  modalidadEntrega,
  tipoCarga,
  moneda,
  diasViatico,
  setDiasViatico,
  nochesViatico,
  setNochesViatico,
  fechaInicioEdicion,
  onGuardado,
}: {
  rutaId: number
  cuentaContratoId: number | null
  modalidadEntrega: ModalidadEntrega
  tipoCarga: TipoCargaCosto
  moneda: string
  diasViatico: string
  setDiasViatico: (v: string) => void
  nochesViatico: string
  setNochesViatico: (v: string) => void
  fechaInicioEdicion?: string | null
  onGuardado: (paquete: CostoOperativoResponse) => void
}) {
  const checklistQuery = useChecklistCostoOperativoQuery(rutaId, cuentaContratoId, modalidadEntrega, tipoCarga)
  const [lineas, setLineas] = useState<Record<number, EstadoLinea>>({})
  const [diasSynced, setDiasSynced] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [costoOperativoGuardadoId, setCostoOperativoGuardadoId] = useState<number | null>(null)
  const { usuario } = useSesion()
  const usuarioId = obtenerUsuarioAuditoria(usuario)

  const items = checklistQuery.data?.items ?? []
  const costoOperativoId = checklistQuery.data?.costoOperativoId ?? costoOperativoGuardadoId

  useEffect(() => {
    if (diasSynced || !checklistQuery.data) return
    setDiasViatico(checklistQuery.data.diasViatico != null ? String(checklistQuery.data.diasViatico) : "")
    setNochesViatico(
      checklistQuery.data.nochesViatico != null ? String(checklistQuery.data.nochesViatico) : "",
    )
    setDiasSynced(true)
  }, [checklistQuery.data, diasSynced, setDiasViatico, setNochesViatico])

  const itemsKey = items
    .map(
      (i) =>
        `${i.conceptoCostoOperativoId}:${i.activo}:${i.monto}:${i.baseConteo}:${i.comidas
          .map((c) => `${c.tipoComida}=${c.monto}:${c.baseConteo}`)
          .join(",")}`,
    )
    .join("|")
  const [syncedKey, setSyncedKey] = useState<string | null>(null)
  useEffect(() => {
    if (itemsKey === syncedKey || items.length === 0) return
    const inicial: Record<number, EstadoLinea> = {}
    items.forEach((item) => {
      const diasConfigurados = numeroEnteroNoNegativo(checklistQuery.data?.diasViatico ?? 0)
      const nochesConfiguradas = numeroEnteroNoNegativo(checklistQuery.data?.nochesViatico ?? 0)
      const comidas: Record<TipoComida, string> = { DESAYUNO: "", ALMUERZO: "", CENA: "" }
      const baseConteoComidas: Record<TipoComida, BaseConteo> = {
        DESAYUNO: baseConteoPorComida.DESAYUNO,
        ALMUERZO: baseConteoPorComida.ALMUERZO,
        CENA: baseConteoPorComida.CENA,
      }
      const diasComidas: Record<TipoComida, boolean[]> = {
        DESAYUNO: [],
        ALMUERZO: [],
        CENA: [],
      }
      item.comidas.forEach((c) => {
        comidas[c.tipoComida] = String(c.monto)
        baseConteoComidas[c.tipoComida] = c.baseConteo
        const total = c.baseConteo === "NOCHE" ? nochesConfiguradas : diasConfigurados
        const cantidad = c.cantidad ?? total
        diasComidas[c.tipoComida] = diasMarcados(cantidad, total)
      })
      inicial[item.conceptoCostoOperativoId] = {
        activo: item.activo,
        monto: item.monto != null ? String(item.monto) : "",
        moneda: item.moneda || moneda,
        baseConteo: item.baseConteo,
        comidas,
        baseConteoComidas,
        diasComidas,
      }
    })
    setLineas(inicial)
    setSyncedKey(itemsKey)
  }, [checklistQuery.data?.diasViatico, checklistQuery.data?.nochesViatico, items, itemsKey, moneda, syncedKey])

  const guardar = useGuardarCostoOperativoMutation()

  function toggle(item: ChecklistItemCostoOperativo, checked: boolean) {
    const totalDias = numeroEnteroNoNegativo(diasViatico)
    const totalNoches = numeroEnteroNoNegativo(nochesViatico)
    setLineas((prev) => {
      const actual = prev[item.conceptoCostoOperativoId]
      const baseComidas = actual?.baseConteoComidas ?? {
        DESAYUNO: baseConteoPorComida.DESAYUNO,
        ALMUERZO: baseConteoPorComida.ALMUERZO,
        CENA: baseConteoPorComida.CENA,
      }
      // Al activar alimentacion, pre-marca todos los dias/noches del viaje: el
      // usuario solo destilda los que no aplican. Al desactivar conserva lo previo.
      let diasComidas = actual?.diasComidas ?? { DESAYUNO: [], ALMUERZO: [], CENA: [] }
      if (checked && item.esAlimentacion) {
        const yaMarcado = COMIDAS.some((t) => contarMarcados(diasComidas[t]) > 0)
        if (!yaMarcado) {
          diasComidas = {
            DESAYUNO: [],
            ALMUERZO: [],
            CENA: [],
          }
          item.comidas.forEach((c) => {
            const total = (baseComidas[c.tipoComida] ?? c.baseConteo) === "NOCHE" ? totalNoches : totalDias
            diasComidas[c.tipoComida] = diasMarcados(total, total)
          })
        }
      }
      return {
        ...prev,
        [item.conceptoCostoOperativoId]: {
          activo: checked,
          monto: actual?.monto ?? "",
          moneda: actual?.moneda ?? moneda,
          baseConteo: actual?.baseConteo ?? item.baseConteo,
          comidas: actual?.comidas ?? { DESAYUNO: "", ALMUERZO: "", CENA: "" },
          baseConteoComidas: baseComidas,
          diasComidas,
        },
      }
    })
  }

  function setMonto(conceptoId: number, monto: string) {
    setLineas((prev) => ({
      ...prev,
      [conceptoId]: { ...prev[conceptoId], monto, activo: prev[conceptoId]?.activo ?? false },
    }))
  }

  function setBaseConteoLinea(conceptoId: number, baseConteo: BaseConteo) {
    setLineas((prev) => ({
      ...prev,
      [conceptoId]: { ...prev[conceptoId], baseConteo, activo: prev[conceptoId]?.activo ?? false },
    }))
  }


  function setCantidadComida(conceptoId: number, tipoComida: TipoComida, cantidad: number, total: number) {
    const limitada = Math.min(Math.max(cantidad, 0), total)
    setLineas((prev) => {
      const actual = prev[conceptoId]
      return {
        ...prev,
        [conceptoId]: {
          ...actual,
          activo: actual?.activo ?? false,
          diasComidas: {
            DESAYUNO: actual?.diasComidas?.DESAYUNO ?? [],
            ALMUERZO: actual?.diasComidas?.ALMUERZO ?? [],
            CENA: actual?.diasComidas?.CENA ?? [],
            [tipoComida]: diasMarcados(limitada, total),
          },
        },
      }
    })
  }

  // Marca/desmarca un dia individual de una comida (chips del panel).
  function setDiaComida(conceptoId: number, tipoComida: TipoComida, diaIndex: number, checked: boolean, total: number) {
    setLineas((prev) => {
      const actual = prev[conceptoId]
      const base = actual?.diasComidas?.[tipoComida] ?? []
      const siguientes = Array.from({ length: total }, (_, i) => Boolean(base[i]))
      siguientes[diaIndex] = checked
      return {
        ...prev,
        [conceptoId]: {
          ...actual,
          activo: actual?.activo ?? false,
          diasComidas: {
            DESAYUNO: actual?.diasComidas?.DESAYUNO ?? [],
            ALMUERZO: actual?.diasComidas?.ALMUERZO ?? [],
            CENA: actual?.diasComidas?.CENA ?? [],
            [tipoComida]: siguientes,
          },
        },
      }
    })
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

  const marcadosPorNoche = items.filter((item) => {
    const linea = lineas[item.conceptoCostoOperativoId]
    if (!linea?.activo) return false
    if (item.esAlimentacion) return false
    return permiteConteoNochesSimple(item) && linea.baseConteo === "NOCHE"
  })

  async function guardarChecklist() {
    for (const item of items) {
      const linea = lineas[item.conceptoCostoOperativoId]
      if (!linea?.activo) continue
      if (item.esAlimentacion) {
        let comidasMarcadas = 0
        for (const c of item.comidas) {
          const cantidad = contarMarcados(linea.diasComidas[c.tipoComida])
          comidasMarcadas += cantidad
          if (cantidad === 0) continue
          const m = Number(linea.comidas[c.tipoComida])
          if (!Number.isFinite(m) || m <= 0) {
            setError(`${item.conceptoNombre}: cada comida necesita un monto mayor que cero.`)
            return
          }
        }
        if (comidasMarcadas === 0) {
          setError(`${item.conceptoNombre}: marca al menos una comida en algun dia.`)
          return
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
      const paqueteGuardado = await guardar.mutateAsync({
        rutaId,
        cuentaContratoId,
        modalidadEntrega,
        tipoCarga,
        fechaInicio: fechaInicioEdicion ?? null,
        diasViatico: diasViatico.trim() ? Number(diasViatico) : 1,
        nochesViatico: nochesViatico.trim() ? Number(nochesViatico) : marcadosPorNoche.length > 0 ? 0 : null,
        usuarioCreacion: usuarioId,
        lineas: items.map((item) => {
          const linea = lineas[item.conceptoCostoOperativoId] ?? {
            activo: false,
            monto: "",
            moneda,
            baseConteo: item.baseConteo,
            comidas: { DESAYUNO: "", ALMUERZO: "", CENA: "" },
            baseConteoComidas: {
              DESAYUNO: baseConteoPorComida.DESAYUNO,
              ALMUERZO: baseConteoPorComida.ALMUERZO,
              CENA: baseConteoPorComida.CENA,
            },
            diasComidas: { DESAYUNO: [], ALMUERZO: [], CENA: [] },
          }
          if (item.esAlimentacion) {
            return {
              conceptoId: item.conceptoCostoOperativoId,
              activo: linea.activo,
              comidas: item.comidas.map((c) => ({
                tipoComida: c.tipoComida,
                activo: true,
                monto: Number(linea.comidas[c.tipoComida]) || 0,
                baseConteo: linea.baseConteoComidas[c.tipoComida] ?? c.baseConteo,
                cantidad: contarMarcados(linea.diasComidas[c.tipoComida]),
              })),
            }
          }
          return {
            conceptoId: item.conceptoCostoOperativoId,
            activo: linea.activo,
            monto: Number(linea.monto) || 0,
            baseConteo: baseConteoSimpleEfectiva(item, linea.baseConteo),
          }
        }),
      })
      setCostoOperativoGuardadoId(paqueteGuardado.id)
      await checklistQuery.refetch()
      onGuardado(paqueteGuardado)
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
          <EmptyTitle>Aun no hay costos creados</EmptyTitle>
          <EmptyDescription>
            Primero crea los costos (alimentacion, alojamiento, cochera...) en la pestana
            &quot;Catalogo de conceptos&quot;. Luego vuelve aqui para elegir cuales se cobran.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const activos = items.filter((item) => lineas[item.conceptoCostoOperativoId]?.activo).length
  const diasDisponibles = numeroEnteroNoNegativo(diasViatico)
  const nochesDisponibles = numeroEnteroNoNegativo(nochesViatico)

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <p className="text-sm font-semibold">Costos de esta ruta</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Marca los costos que se cobran en este viaje y escribe su precio.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5">
            <span className="text-muted-foreground">Conceptos</span>
            <span className="font-semibold">{activos} de {items.length}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5">
            <span className="text-muted-foreground">Modalidad</span>
            <span className="font-semibold">{etiquetaModalidad[modalidadEntrega]}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5">
            <span className="text-muted-foreground">Carga</span>
            <span className="font-semibold">{etiquetaTipoCarga[tipoCarga]}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5">
            <span className="text-muted-foreground">Moneda</span>
            <span className="font-semibold">{moneda}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5">
            <span className="text-muted-foreground">Dias</span>
            <span className="font-semibold">{diasDisponibles || "-"}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5">
            <span className="text-muted-foreground">Noches</span>
            <span className="font-semibold">{numeroEnteroNoNegativo(nochesViatico) || "-"}</span>
          </span>
        </div>
      </section>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudo guardar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <ScrollArea viewportClassName="max-h-[60vh] pr-2">
        <div className="flex flex-col gap-3">
          {items.map((item) => {
            const linea = lineas[item.conceptoCostoOperativoId] ?? {
              activo: false,
              monto: "",
              moneda,
              baseConteo: item.baseConteo,
              comidas: { DESAYUNO: "", ALMUERZO: "", CENA: "" },
              baseConteoComidas: {
                DESAYUNO: baseConteoPorComida.DESAYUNO,
                ALMUERZO: baseConteoPorComida.ALMUERZO,
                CENA: baseConteoPorComida.CENA,
              },
              diasComidas: { DESAYUNO: [], ALMUERZO: [], CENA: [] },
            }
            const baseConteoSimple = baseConteoSimpleEfectiva(item, linea.baseConteo)
            const totalAlimentacion = totalComidas(item, linea)
            const cantidadTexto = item.esAlimentacion
              ? "Por comida"
              : item.frecuencia === "POR_DIA"
                ? baseConteoSimple === "NOCHE" ? "Por noche" : "Por dia"
                : item.frecuencia === "POR_VIAJE"
                  ? "Por viaje"
                  : "Por servicio"

            return (
              <div
                key={item.conceptoCostoOperativoId}
                className={`rounded-xl border p-4 transition-colors ${
                  linea.activo ? "border-primary/40 bg-primary/5" : "border-border bg-card"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <label className="flex cursor-pointer items-start gap-3">
                    <Checkbox
                      checked={linea.activo}
                      className="mt-0.5"
                      onCheckedChange={(c) => toggle(item, c === true)}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{item.conceptoNombre}</span>
                        {item.esAlimentacion ? <Badge variant="secondary">Alimentacion</Badge> : null}
                      </div>
                      <span className="font-mono text-[11px] text-muted-foreground">{item.conceptoCodigo}</span>
                    </div>
                  </label>
                  <Badge variant="outline">{cantidadTexto}</Badge>
                </div>

                {linea.activo ? (
                  <div className="mt-4 border-t border-border/60 pt-4">
                    {!item.esAlimentacion ? (
                      <div className="flex flex-wrap items-end gap-4">
                        <Field className="w-40">
                          <FieldLabel>Precio</FieldLabel>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={linea.monto}
                            placeholder="0.00"
                            className="text-right"
                            onChange={(e) => setMonto(item.conceptoCostoOperativoId, e.target.value)}
                          />
                        </Field>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-medium text-muted-foreground">Se cobra</span>
                          {item.frecuencia === "POR_DIA" && permiteConteoNochesSimple(item) ? (
                            <BotonesConteo
                              value={linea.baseConteo}
                              dias={diasViatico}
                              noches={nochesViatico}
                              onChange={(value) => setBaseConteoLinea(item.conceptoCostoOperativoId, value)}
                            />
                          ) : item.frecuencia === "POR_DIA" ? (
                            <span className="text-sm">
                              <span className="font-semibold">
                                {cantidadConteo(baseConteoSimple, diasViatico, nochesViatico)}
                              </span>{" "}
                              {baseConteoSimple === "NOCHE" ? "noches" : "dias"} del viaje
                            </span>
                          ) : (
                            <span className="text-sm">1 vez por {item.frecuencia === "POR_VIAJE" ? "viaje" : "servicio"}</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <Field className="w-56">
                          <FieldLabel>Precio de comida (1 dia, 1 persona)</FieldLabel>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={totalAlimentacion > 0 ? formatearMonto(totalAlimentacion) : ""}
                            placeholder="0.00"
                            className="text-right"
                            onChange={(e) => setMontoTotalComidas(item, e.target.value)}
                          />
                          <span className="text-xs text-muted-foreground">
                            Se reparte entre las comidas. El sistema lo multiplica por dias y personas.
                          </span>
                        </Field>
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {item.comidas.map((c) => {
                            const baseComida = linea.baseConteoComidas[c.tipoComida] ?? c.baseConteo
                            const unidad = baseComida === "NOCHE" ? "noche" : "dia"
                            const totalComida = baseComida === "NOCHE" ? nochesDisponibles : diasDisponibles
                            return (
                              <div key={c.tipoComida} className="rounded-lg border border-border bg-background p-3">
                                <div className="mb-3 flex items-center justify-between gap-2">
                                  <span className="text-sm font-semibold">{etiquetaComida[c.tipoComida]}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {moneda} {linea.comidas[c.tipoComida] || "0.00"} c/u
                                  </span>
                                </div>
                                <ChipsDias
                                  dias={totalComida}
                                  marcados={linea.diasComidas[c.tipoComida] ?? []}
                                  unidad={unidad}
                                  onToggleDia={(diaIndex, checked) =>
                                    setDiaComida(item.conceptoCostoOperativoId, c.tipoComida, diaIndex, checked, totalComida)
                                  }
                                  onTodos={() =>
                                    setCantidadComida(item.conceptoCostoOperativoId, c.tipoComida, totalComida, totalComida)
                                  }
                                  onNinguno={() =>
                                    setCantidadComida(item.conceptoCostoOperativoId, c.tipoComida, 0, totalComida)
                                  }
                                />
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </ScrollArea>

      <div className="flex justify-end">
        <Button onClick={() => void guardarChecklist()} disabled={guardar.isPending}>
          {guardar.isPending ? "Guardando..." : "Guardar costos de la ruta"}
        </Button>
      </div>
    </div>
  )
}

type FilaCalculo = {
  clave: string
  concepto: string
  cobro: string
  cantidad: number
  tarifa: number
  moneda: string
  subtotal: number
}

const etiquetaCobroFrecuencia: Record<FrecuenciaCosto, string> = {
  POR_VIAJE: "Por viaje",
  POR_DIA: "Por dia",
  POR_SERVICIO: "Por servicio",
}

// Aplana el resultado del backend (GET /costos-operativos/calcular) en filas para
// la tabla. El backend ya aplico la formula (personas/unidades/dias), aqui solo se
// muestra; no se recalcula nada en el cliente.
function filasDesdeCalculo(calculo: CalculoCostoResponse): FilaCalculo[] {
  return calculo.lineas.flatMap((linea) => {
    const nombre = linea.conceptoNombre ?? linea.conceptoCodigo ?? `Concepto ${linea.conceptoCostoOperativoId}`
    if (linea.esAlimentacion) {
      return linea.comidas.map((comida) => ({
        clave: `${linea.conceptoCostoOperativoId}-${comida.tipoComida}`,
        concepto: `${nombre} - ${etiquetaComida[comida.tipoComida]}`,
        cobro: comida.baseConteo === "NOCHE" ? "Por noche" : "Por dia",
        cantidad: comida.cantidad,
        tarifa: comida.monto,
        moneda: calculo.moneda,
        subtotal: comida.subtotal,
      }))
    }
    return [
      {
        clave: String(linea.conceptoCostoOperativoId),
        concepto: nombre,
        cobro: etiquetaCobroFrecuencia[linea.frecuencia],
        cantidad: linea.cantidad ?? 1,
        tarifa: linea.monto ?? 0,
        moneda: calculo.moneda,
        subtotal: linea.subtotal,
      },
    ]
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
  mostrarEncabezado = true,
}: {
  paquete: CostoOperativoResponse
  onEditar: () => void
  onAnular: () => void
  mostrarEncabezado?: boolean
}) {
  const [personas, setPersonas] = useState("1")
  const [unidades, setUnidades] = useState("1")
  const personasNum = Math.max(numeroEnteroNoNegativo(personas), 1)
  const unidadesNum = Math.max(numeroEnteroNoNegativo(unidades), 1)

  // El total lo calcula el backend con la formula del dominio (personas x unidades
  // x dias/noches segun cada concepto). No se recalcula en el cliente.
  const calcularQuery = useCalcularCostoQuery({
    rutaId: paquete.rutaId,
    cuentaContratoId: paquete.cuentaContratoId,
    modalidadEntrega: paquete.modalidadEntrega,
    tipoCarga: paquete.tipoCarga ?? "GENERAL",
    personas: personasNum,
    unidades: unidadesNum,
  })
  const calculo = calcularQuery.data
  const filasConceptos = calculo ? filasDesdeCalculo(calculo) : []
  const monedaConceptos = calculo?.moneda ?? paquete.moneda ?? "PEN"
  const totalConceptos = calculo ? [[monedaConceptos, calculo.total] as [string, number]] : []

  const peajesQuery = useCostoPeajesRutaQuery(paquete.rutaId, { tipoCobro: "NORMAL", sentido: "IDA", numeroEjes: 2 }, true)
  const peajeMoneda = peajesQuery.data?.moneda ?? paquete.moneda ?? "PEN"
  const peajeTotal = peajesQuery.data?.total ?? 0
  const totalEstimado = sumarPorMoneda([
    ...filasConceptos.map((fila) => ({ moneda: fila.moneda, subtotal: fila.subtotal })),
    ...(peajesQuery.data ? [{ moneda: peajeMoneda, subtotal: peajeTotal }] : []),
  ])
  const lineasConfiguradas = paquete.lineas.filter((linea) => linea.activo)

  if (!mostrarEncabezado) {
    return (
      <article className="rounded-xl border border-border bg-background p-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{etiquetaModalidad[paquete.modalidadEntrega]}</Badge>
              <Badge variant="outline">{etiquetaTipoCarga[paquete.tipoCarga ?? "GENERAL"]}</Badge>
              <Badge variant="outline">{paquete.diasViatico ?? 1} dias</Badge>
              <Badge variant="outline">{paquete.nochesViatico ?? 0} noches</Badge>
              <Badge variant="outline">{paquete.codigo ?? `#${paquete.id}`}</Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Vigencia {textoVigencia(paquete.fechaInicio, paquete.fechaFin)}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
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

        <div className="mt-3 grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="overflow-hidden rounded-lg border border-border bg-background">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-3 py-2">
              <div>
                <p className="text-sm font-semibold">Calculo del paquete</p>
                <p className="text-[11px] text-muted-foreground">
                  Base: 1 persona, 1 unidad, {paquete.diasViatico ?? 1} dias y {paquete.nochesViatico ?? 0} noches.
                </p>
              </div>
              <span className="text-xs text-muted-foreground">{filasConceptos.length} item(s)</span>
            </div>
            {calcularQuery.isLoading ? (
              <p className="p-3 text-sm text-muted-foreground">Calculando...</p>
            ) : calcularQuery.error ? (
              <p className="p-3 text-sm text-destructive">{obtenerMensajeError(calcularQuery.error)}</p>
            ) : filasConceptos.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">Sin conceptos activos.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Cobro</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Tarifa</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filasConceptos.map((fila) => (
                      <TableRow key={fila.clave}>
                        <TableCell className="min-w-[220px] whitespace-normal py-2 font-medium leading-snug">{fila.concepto}</TableCell>
                        <TableCell className="py-2 text-muted-foreground">{fila.cobro}</TableCell>
                        <TableCell className="py-2 text-right">{fila.cantidad}</TableCell>
                        <TableCell className="py-2 text-right">{fila.moneda} {formatearMonto(fila.tarifa)}</TableCell>
                        <TableCell className="py-2 text-right font-semibold">{fila.moneda} {formatearMonto(fila.subtotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="border-t border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                  Cantidad = dias/noches/personas/unidades segun regla del concepto.
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 xl:sticky xl:top-4">
            <p className="text-xs text-muted-foreground">Total estimado</p>
            <p className="mt-1 text-lg font-semibold">{formatearTotales(totalEstimado)}</p>
            <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
              <div className="flex justify-between gap-2">
                <span>Conceptos</span>
                <span className="text-foreground">{formatearTotales(totalConceptos)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span>Peajes</span>
                <span className="text-foreground">{peajesQuery.data ? `${peajeMoneda} ${formatearMonto(peajeTotal)}` : "-"}</span>
              </div>
            </div>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
      {mostrarEncabezado ? (
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{paquete.rutaNombre ?? `Ruta ${paquete.rutaId}`}</p>
            <p className="truncate text-xs text-muted-foreground">Costo operativo interno por ruta</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="secondary">{etiquetaModalidad[paquete.modalidadEntrega]}</Badge>
              <Badge variant="outline">{etiquetaTipoCarga[paquete.tipoCarga ?? "GENERAL"]}</Badge>
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
      ) : (
        <div className="flex justify-end gap-2 border-b border-border p-3">
          <Button size="sm" variant="outline" onClick={onEditar}>
            <Pencil data-icon="inline-start" />
            Editar
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={onAnular}>
            <Trash2 data-icon="inline-start" />
            Anular
          </Button>
        </div>
      )}

      <div className="grid gap-4 p-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            Codigo <span className="font-mono text-foreground">{paquete.codigo ?? `#${paquete.id}`}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-3.5" />
            Vigencia <span className="text-foreground">{textoVigencia(paquete.fechaInicio, paquete.fechaFin)}</span>
          </span>
          {formatearFecha(paquete.fechaCreacion) ? (
            <span>
              Creado {formatearFecha(paquete.fechaCreacion)}
              {paquete.usuarioCreacion ? ` por ${paquete.usuarioCreacion}` : ""}
            </span>
          ) : null}
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">Tarifa configurada</p>
            <Badge variant="outline">{lineasConfiguradas.length} concepto{lineasConfiguradas.length === 1 ? "" : "s"}</Badge>
          </div>
          {lineasConfiguradas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin conceptos activos configurados.</p>
          ) : (
            <div className="grid gap-2">
              {lineasConfiguradas.map((linea) => {
                const nombre = linea.conceptoNombre ?? linea.conceptoCodigo ?? `Concepto ${linea.conceptoCostoOperativoId}`
                return (
                  <div key={linea.id} className="rounded-md border border-border bg-background p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{nombre}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {linea.conceptoCodigo ?? `#${linea.conceptoCostoOperativoId}`} · {linea.frecuencia ?? "-"} · {linea.baseImputacion ?? "-"}
                        </p>
                      </div>
                      {!linea.esAlimentacion ? (
                        <Badge variant="secondary">
                          {linea.moneda} {formatearMonto(linea.monto ?? 0)}
                        </Badge>
                      ) : null}
                    </div>
                    {linea.esAlimentacion ? (
                      <div className="mt-2 grid gap-2 sm:grid-cols-3">
                        {linea.comidas.map((comida) => (
                          <div key={comida.tipoComida} className="rounded border border-border bg-muted/30 px-2 py-1.5 text-xs">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium">{etiquetaComida[comida.tipoComida]}</span>
                              <span>{comida.moneda} {formatearMonto(comida.monto)}</span>
                            </div>
                            <p className="mt-0.5 text-muted-foreground">
                              {comida.baseConteo === "NOCHE" ? "Por noche" : "Por dia"}
                              {comida.cantidad != null ? ` · ${comida.cantidad} marcado(s)` : ""}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {linea.baseConteo === "NOCHE" ? "Multiplica por noches" : "Multiplica por dias"}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-muted/25 p-3">
          <Field className="w-32">
            <FieldLabel>Personas</FieldLabel>
            <Input
              type="number"
              min="1"
              value={personas}
              className="h-9 text-right"
              onChange={(e) => setPersonas(e.target.value)}
            />
          </Field>
          <Field className="w-32">
            <FieldLabel>Unidades</FieldLabel>
            <Input
              type="number"
              min="1"
              value={unidades}
              className="h-9 text-right"
              onChange={(e) => setUnidades(e.target.value)}
            />
          </Field>
          <p className="flex-1 text-xs text-muted-foreground">
            Cambia personas y unidades para simular el costo. El total lo calcula el sistema
            segun cada concepto.
          </p>
        </div>

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
              {calcularQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    Calculando...
                  </TableCell>
                </TableRow>
              ) : calcularQuery.error ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-destructive">
                    {obtenerMensajeError(calcularQuery.error)}
                  </TableCell>
                </TableRow>
              ) : filasConceptos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    Sin conceptos activos.
                  </TableCell>
                </TableRow>
              ) : (
                filasConceptos.map((fila) => (
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

type ContextoPaquete = {
  modoEdicion: boolean
  cuentaContratoId: string
  setCuentaContratoId: (v: string) => void
  rutaId: string
  setRutaId: (v: string) => void
  modalidadEntrega: ModalidadEntrega
  setModalidadEntrega: (v: ModalidadEntrega) => void
  tipoCarga: TipoCargaCosto
  setTipoCarga: (v: TipoCargaCosto) => void
  moneda: string
  setMoneda: (v: string) => void
  editandoPaquete: CostoOperativoResponse | null
  setEditandoPaquete: (v: CostoOperativoResponse | null) => void
  onGuardado: (paquete: CostoOperativoResponse) => void
}

// Paso 1 (contexto) + Paso 2 (checklist). El estado del contexto vive en la vista
// principal para poder editar un paquete desde la pestana de listado.
function ConfiguracionCostoTab({
  modoEdicion,
  cuentaContratoId,
  setCuentaContratoId,
  rutaId,
  setRutaId,
  modalidadEntrega,
  setModalidadEntrega,
  tipoCarga,
  setTipoCarga,
  moneda,
  setMoneda,
  editandoPaquete,
  setEditandoPaquete,
  onGuardado,
}: ContextoPaquete) {
  const [guardadoOk, setGuardadoOk] = useState(false)
  const [diasViatico, setDiasViatico] = useState("")
  const [nochesViatico, setNochesViatico] = useState("")

  const cuentaContratoSeleccionada = cuentaContratoId ? Number(cuentaContratoId) : null
  const rutaSeleccionada = rutaId ? Number(rutaId) : null
  const contextoListo = Boolean(cuentaContratoSeleccionada && rutaSeleccionada)

  function limpiarEdicion() {
    setGuardadoOk(false)
    setEditandoPaquete(null)
    // Dias/noches se re-sincronizan desde el checklist del nuevo contexto.
    setDiasViatico("")
    setNochesViatico("")
  }

  function limpiarFormulario() {
    setGuardadoOk(false)
    setEditandoPaquete(null)
    setCuentaContratoId("")
    setRutaId("")
    setModalidadEntrega("NORMAL")
    setTipoCarga("GENERAL")
    setMoneda("PEN")
    setDiasViatico("")
    setNochesViatico("")
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-card px-5 py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">Paso 1</p>
            <h2 className="text-lg font-semibold">Elige cuenta/contrato y ruta</h2>
            <p className="text-sm text-muted-foreground">
              La cuenta o contrato filtra que rutas y costos puede usar Operaciones.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {modoEdicion ? <Badge variant="secondary">Editando paquete</Badge> : null}
            <Badge variant={contextoListo ? "default" : "secondary"}>
              {contextoListo ? "Listo" : "Falta elegir"}
            </Badge>
            <Button type="button" variant="outline" size="sm" onClick={limpiarFormulario}>
              Nuevo costo
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-5 xl:grid-cols-[minmax(0,1fr)_260px]">
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-border bg-background p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Cuenta / contrato</span>
                <Badge variant={cuentaContratoSeleccionada ? "default" : "outline"}>1</Badge>
              </div>
              <SelectCuentaContrato
                value={cuentaContratoId}
                onChange={(v) => {
                  setCuentaContratoId(v)
                  limpiarEdicion()
                }}
              />
            </div>
            <div className="rounded-xl border border-border bg-background p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ruta</span>
                <Badge variant={rutaSeleccionada ? "default" : "outline"}>2</Badge>
              </div>
              <SelectRuta
                value={rutaId}
                onChange={(v) => {
                  setRutaId(v)
                  limpiarEdicion()
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
                  limpiarEdicion()
                }}
              />
            </div>
            <div className="rounded-xl border border-border bg-background p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tipo de carga</span>
                <Badge variant="outline">4</Badge>
              </div>
              <SelectTipoCarga
                value={tipoCarga}
                onChange={(v) => {
                  setTipoCarga(v)
                  limpiarEdicion()
                }}
              />
            </div>
          </div>

          <Alert>
            <AlertTitle>Regla de costo interno</AlertTitle>
            <AlertDescription>
              Para la misma cuenta/contrato, ruta, modalidad y tipo de carga el sistema edita el paquete vigente;
              no crea duplicados paralelos.
            </AlertDescription>
          </Alert>
        </div>

        <aside className="flex flex-col gap-3 rounded-xl border border-border bg-muted/25 p-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Moneda base</p>
            <div className="mt-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium">
              Soles (PEN)
            </div>
            <p className="mt-2 text-xs text-muted-foreground">El backend asigna PEN internamente.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Dias del viaje</FieldLabel>
              <Input
                type="number"
                min="1"
                value={diasViatico}
                placeholder="4"
                disabled={!contextoListo}
                className="text-right"
                onChange={(e) => setDiasViatico(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>Noches</FieldLabel>
              <Input
                type="number"
                min="0"
                value={nochesViatico}
                placeholder="0"
                disabled={!contextoListo}
                className="text-right"
                onChange={(e) => setNochesViatico(e.target.value)}
              />
            </Field>
          </div>
          <p className="text-xs text-muted-foreground">Dias y noches del viaje para calcular cantidades.</p>
        </aside>
      </div>

      {guardadoOk ? (
        <Alert className="mx-5 mb-5">
          <AlertTitle>Configuracion guardada</AlertTitle>
          <AlertDescription>El paquete de costo quedo actualizado para este par.</AlertDescription>
        </Alert>
      ) : null}

      {contextoListo ? (
        <div className="border-t border-border bg-muted/20 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">Paso 2</p>
              <h3 className="text-base font-semibold">Marca los costos y sus precios</h3>
            </div>
            {editandoPaquete ? <Badge variant="secondary">Editando {editandoPaquete.codigo ?? `#${editandoPaquete.id}`}</Badge> : null}
          </div>
          <ChecklistPanel
            key={`${cuentaContratoSeleccionada}-${rutaSeleccionada}-${modalidadEntrega}-${tipoCarga}`}
            rutaId={rutaSeleccionada!}
            cuentaContratoId={cuentaContratoSeleccionada!}
            modalidadEntrega={modalidadEntrega}
            tipoCarga={tipoCarga}
            moneda={moneda || "PEN"}
            diasViatico={diasViatico}
            setDiasViatico={setDiasViatico}
            nochesViatico={nochesViatico}
            setNochesViatico={setNochesViatico}
            fechaInicioEdicion={editandoPaquete?.fechaInicio ?? null}
            onGuardado={(paquete) => {
              setGuardadoOk(true)
              limpiarFormulario()
              onGuardado(paquete)
            }}
          />
        </div>
      ) : (
        <div className="border-t border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Elige cuenta/contrato y ruta para ver los costos.
        </div>
      )}
    </section>
  )
}

// Pestana de listado: paquetes ya configurados. "Editar" salta a la pestana de
// configuracion con el contexto precargado; "Anular" pide confirmacion modal.
function PaquetesTab({
  cuentaContratoId,
  setCuentaContratoId,
  onNuevoCosto,
  paquetes,
  paginacion,
  cargando,
  onCambiarPagina,
  onEditar,
  onAnulado,
}: {
  cuentaContratoId: string
  setCuentaContratoId: (v: string) => void
  onNuevoCosto: () => void
  paquetes: CostoOperativoResponse[]
  paginacion?: PaginationMeta
  cargando: boolean
  onCambiarPagina: (pagina: number) => void
  onEditar: (paquete: CostoOperativoResponse) => void
  onAnulado: () => void
}) {
  const [anularPaquete, setAnularPaquete] = useState<CostoOperativoResponse | null>(null)
  const anular = useAnularCostoOperativoMutation(anularPaquete?.id ?? 0, {
    onSuccess: () => {
      setAnularPaquete(null)
      onAnulado()
    },
  })

  const paquetesOrdenados = useMemo(
    () => [...paquetes].sort((a, b) => (a.rutaNombre ?? "").localeCompare(b.rutaNombre ?? "")),
    [paquetes],
  )
  const paginasVisibles = useMemo(() => {
    const total = paginacion?.totalPaginas ?? 1
    const actual = paginacion?.pagina ?? 1
    const inicio = Math.max(1, actual - 2)
    const fin = Math.min(total, inicio + 4)
    return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i)
  }, [paginacion?.pagina, paginacion?.totalPaginas])

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-4 text-muted-foreground" />
          <div>
            <p className="text-base font-semibold">Costos por ruta</p>
            <p className="text-sm text-muted-foreground">
              Cada ruta tiene un unico costo operativo vigente por modalidad.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            {paginacion?.total ?? paquetesOrdenados.length} paquete{(paginacion?.total ?? paquetesOrdenados.length) === 1 ? "" : "s"}
          </Badge>
          <Button type="button" variant="outline" size="sm" onClick={onNuevoCosto}>
            <Plus data-icon="inline-start" />
            Nuevo costo
          </Button>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-border bg-muted/25 p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <Field className="max-w-xl flex-1">
            <FieldLabel>Filtrar por cuenta / contrato</FieldLabel>
            <SelectCuentaContrato value={cuentaContratoId} onChange={setCuentaContratoId} />
          </Field>
          {cuentaContratoId ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => setCuentaContratoId("")}>Limpiar filtro</Button>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">El listado se pagina desde backend y muestra 10 paquetes por pagina.</p>
      </div>

      {!cuentaContratoId ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Elige una cuenta o contrato para ver sus rutas configuradas.
        </p>
      ) : cargando ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : paquetesOrdenados.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Aun no hay rutas con costo operativo configurado.
        </p>
      ) : (
        <Accordion type="multiple" className="border-0 bg-transparent">
          {paquetesOrdenados.map((p: CostoOperativoResponse) => (
            <AccordionItem
              key={p.id}
              value={String(p.id)}
              className="mb-2 overflow-hidden rounded-xl border border-border bg-background last:mb-0"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="grid min-w-0 flex-1 gap-2 text-left lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold">{p.rutaNombre ?? `Ruta ${p.rutaId}`}</p>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {p.codigo ?? `#${p.id}`}
                      </Badge>
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <CalendarDays className="size-3 shrink-0" />
                      {textoVigencia(p.fechaInicio, p.fechaFin)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 lg:justify-end">
                    <Badge variant="secondary">{etiquetaModalidad[p.modalidadEntrega]}</Badge>
                    <Badge variant="outline">{etiquetaTipoCarga[p.tipoCarga ?? "GENERAL"]}</Badge>
                    <Badge variant="outline">{p.diasViatico ?? 1} dias</Badge>
                    <Badge variant="outline">{p.nochesViatico ?? 0} noches</Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="!h-auto px-3 pb-3">
                <PaqueteConfiguradoCard
                  paquete={p}
                  mostrarEncabezado={false}
                  onEditar={() => onEditar(p)}
                  onAnular={() => setAnularPaquete(p)}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {cuentaContratoId && paginacion ? (
        <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Mostrando {paquetesOrdenados.length} de {paginacion.total} paquetes. Pagina {paginacion.pagina} de {paginacion.totalPaginas || 1}.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!paginacion.tieneAnterior || cargando}
              onClick={() => onCambiarPagina(1)}
            >
              Inicio
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!paginacion.tieneAnterior || cargando}
              onClick={() => onCambiarPagina(Math.max(1, paginacion.pagina - 1))}
            >
              Anterior
            </Button>
            {paginasVisibles.map((pagina) => (
              <Button
                key={pagina}
                type="button"
                variant={pagina === paginacion.pagina ? "default" : "outline"}
                size="sm"
                disabled={cargando}
                onClick={() => onCambiarPagina(pagina)}
              >
                {pagina}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!paginacion.tieneSiguiente || cargando}
              onClick={() => onCambiarPagina(paginacion.pagina + 1)}
            >
              Siguiente
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!paginacion.tieneSiguiente || cargando}
              onClick={() => onCambiarPagina(paginacion.totalPaginas || 1)}
            >
              Fin
            </Button>
          </div>
        </div>
      ) : null}

      <AlertDialog open={anularPaquete !== null} onOpenChange={(open) => !open && setAnularPaquete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anular paquete de costo</AlertDialogTitle>
            <AlertDialogDescription>
              {anularPaquete
                ? `Se anulara "${anularPaquete.rutaNombre ?? `Ruta ${anularPaquete.rutaId}`}". El registro no se elimina, queda como referencia.`
                : "El registro no se elimina, queda como referencia."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={anular.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={anular.isPending}
              onClick={(e) => {
                e.preventDefault()
                void anular.mutateAsync(undefined)
              }}
            >
              {anular.isPending ? "Anulando..." : "Si, anular"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}

// --- Vista principal ----------------------------------------------------------

export function CostosOperativosVista() {
  const [tab, setTab] = useState("configuracion")
  const [cuentaContratoId, setCuentaContratoId] = useState("")
  const [filtroPaquetesCuentaContratoId, setFiltroPaquetesCuentaContratoId] = useState("")
  const [paginaPaquetes, setPaginaPaquetes] = useState(1)
  const [rutaId, setRutaId] = useState("")
  const [modalidadEntrega, setModalidadEntrega] = useState<ModalidadEntrega>("NORMAL")
  const [tipoCarga, setTipoCarga] = useState<TipoCargaCosto>("GENERAL")
  const [moneda, setMoneda] = useState("PEN")
  const [editandoPaquete, setEditandoPaquete] = useState<CostoOperativoResponse | null>(null)

  useEffect(() => {
    setPaginaPaquetes(1)
  }, [filtroPaquetesCuentaContratoId])

  const paquetesQuery = useCostosOperativosQuery(
    {
      cuentaContratoId: filtroPaquetesCuentaContratoId ? Number(filtroPaquetesCuentaContratoId) : undefined,
      estadoRegistro: "ACTIVO",
      page: paginaPaquetes,
      pageSize: 10,
    },
    Boolean(filtroPaquetesCuentaContratoId),
  )
  const paquetes = (paquetesQuery.data?.datos ?? []).filter((paquete) => paquete.fechaFin == null)
  const totalPaquetes = paquetesQuery.data?.paginacion?.total ?? paquetes.length

  function nuevoCosto() {
    setCuentaContratoId("")
    setRutaId("")
    setModalidadEntrega("NORMAL")
    setTipoCarga("GENERAL")
    setMoneda("PEN")
    setEditandoPaquete(null)
    setTab("configuracion")
  }

  function guardarPaquete(paquete: CostoOperativoResponse) {
    const filtro = paquete.cuentaContratoId ? String(paquete.cuentaContratoId) : ""
    setFiltroPaquetesCuentaContratoId(filtro)
    setPaginaPaquetes(1)
    setTab("paquetes")
  }

  function editarPaquete(p: CostoOperativoResponse) {
    setCuentaContratoId(p.cuentaContratoId ? String(p.cuentaContratoId) : "")
    setFiltroPaquetesCuentaContratoId(p.cuentaContratoId ? String(p.cuentaContratoId) : "")
    setRutaId(String(p.rutaId))
    setModalidadEntrega(p.modalidadEntrega)
    setTipoCarga(p.tipoCarga ?? "GENERAL")
    setMoneda(p.moneda || "PEN")
    setEditandoPaquete(p)
    setTab("configuracion")
  }

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
                    y paquetes de costo interno por ruta + modalidad, con vigencia. La config
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

          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList>
              <TabsTrigger value="configuracion">Configurar costo</TabsTrigger>
              <TabsTrigger value="paquetes">
                Paquetes configurados
                {totalPaquetes > 0 ? (
                  <Badge variant="secondary" className="ml-2">{totalPaquetes}</Badge>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="catalogo">Catalogo de conceptos</TabsTrigger>
            </TabsList>
            <TabsContent value="configuracion" className="mt-4">
              <ConfiguracionCostoTab
                modoEdicion={Boolean(editandoPaquete)}
                cuentaContratoId={cuentaContratoId}
                setCuentaContratoId={setCuentaContratoId}
                rutaId={rutaId}
                setRutaId={setRutaId}
                modalidadEntrega={modalidadEntrega}
                setModalidadEntrega={setModalidadEntrega}
                tipoCarga={tipoCarga}
                setTipoCarga={setTipoCarga}
                moneda={moneda}
                setMoneda={setMoneda}
                editandoPaquete={editandoPaquete}
                setEditandoPaquete={setEditandoPaquete}
                onGuardado={guardarPaquete}
              />
            </TabsContent>
            <TabsContent value="paquetes" className="mt-4">
              <PaquetesTab
                cuentaContratoId={filtroPaquetesCuentaContratoId}
                setCuentaContratoId={setFiltroPaquetesCuentaContratoId}
                onNuevoCosto={nuevoCosto}
                paquetes={paquetes}
                paginacion={paquetesQuery.data?.paginacion}
                cargando={paquetesQuery.isLoading}
                onCambiarPagina={setPaginaPaquetes}
                onEditar={editarPaquete}
                onAnulado={() => void paquetesQuery.refetch()}
              />
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
