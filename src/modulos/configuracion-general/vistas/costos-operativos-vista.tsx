"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, ClipboardList, Coins, Eye, Pencil, Plus, Trash2, Wallet } from "lucide-react"

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
import type { SentidoPeajeRuta, TipoCobroPeaje } from "../tipos/rutas-peajes"
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
  ConceptoCostoResponse,
  CostoOperativoResponse,
  NaturalezaConcepto,
  TipoServicio,
  UnidadDevengo,
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

const etiquetaNaturaleza: Record<NaturalezaConcepto, string> = {
  FIJO: "Fijo",
  VARIABLE: "Variable",
}
const etiquetaBase: Record<BaseImputacion, string> = {
  UNIDAD: "Por unidad",
  PERSONA: "Por persona",
  SERVICIO: "Por servicio",
}
const etiquetaDevengo: Record<UnidadDevengo, string> = {
  VIAJE: "Por viaje",
  DIA_PERSONA: "Dia / persona",
  DIA_UNIDAD: "Dia / unidad",
  SERVICIO: "Por servicio",
}
const etiquetaBaseConteo: Record<BaseConteo, string> = {
  DIA: "Por dia",
  NOCHE: "Por noche",
}

// --- Plantillas de concepto (UI en lenguaje simple) --------------------------
//
// Los 4 campos tecnicos (naturaleza, baseImputacion, unidadDevengo, baseConteo)
// confunden a un usuario que solo quiere decir "esto se paga por persona cada
// dia". Cada plantilla es UNA frase de negocio ya completa; elegirla llena los
// 4 campos tecnicos por detras. No hay caja de resumen aparte: la frase de la
// tarjeta elegida ES la unica fuente de verdad visible.

type ClavePlantilla = "ALIMENTACION" | "ALOJAMIENTO" | "COCHERA" | "LAVADO" | "SERVICIO_FIJO"

interface DefinicionPlantilla {
  frase: string
  ejemplo: string
  nota?: string
  naturaleza: NaturalezaConcepto
  baseImputacion: BaseImputacion
  unidadDevengo: UnidadDevengo
  baseConteo: BaseConteo
}

const plantillasConcepto: Record<ClavePlantilla, DefinicionPlantilla> = {
  ALIMENTACION: {
    frase: "Se paga por cada persona, cada dia de viaje",
    ejemplo: "Alimentacion, viaticos diarios",
    naturaleza: "VARIABLE",
    baseImputacion: "PERSONA",
    unidadDevengo: "DIA_PERSONA",
    baseConteo: "DIA",
  },
  ALOJAMIENTO: {
    frase: "Se paga por cada persona, cada noche",
    ejemplo: "Alojamiento, hospedaje",
    nota: "Las noches se escriben a mano al configurar la ruta + cuenta (no se calculan solas).",
    naturaleza: "VARIABLE",
    baseImputacion: "PERSONA",
    unidadDevengo: "DIA_PERSONA",
    baseConteo: "NOCHE",
  },
  COCHERA: {
    frase: "Se paga por cada vehiculo, cada dia de viaje",
    ejemplo: "Cochera, estacionamiento",
    naturaleza: "VARIABLE",
    baseImputacion: "UNIDAD",
    unidadDevengo: "DIA_UNIDAD",
    baseConteo: "DIA",
  },
  LAVADO: {
    frase: "Se paga una sola vez por viaje",
    ejemplo: "Lavado del vehiculo",
    naturaleza: "FIJO",
    baseImputacion: "UNIDAD",
    unidadDevengo: "VIAJE",
    baseConteo: "DIA",
  },
  SERVICIO_FIJO: {
    frase: "Se paga una sola vez por todo el servicio",
    ejemplo: "Gasto fijo del contrato, sin importar dias",
    naturaleza: "FIJO",
    baseImputacion: "SERVICIO",
    unidadDevengo: "SERVICIO",
    baseConteo: "DIA",
  },
}

// Frase en lenguaje simple a partir de los 4 campos tecnicos actuales. Se usa
// en la tarjeta de resumen del catalogo (no en el dialogo: ahi la frase vive
// en la plantilla elegida).
function fraseComportamientoConcepto(unidadDevengo: UnidadDevengo, baseConteo: BaseConteo): string {
  if (unidadDevengo === "VIAJE") return "Se paga una sola vez por cada viaje."
  if (unidadDevengo === "SERVICIO") return "Se paga una sola vez por todo el servicio contratado."
  const unidadTiempo = baseConteo === "NOCHE" ? "noche" : "dia"
  if (unidadDevengo === "DIA_PERSONA") return `Se paga por cada persona, en cada ${unidadTiempo} del viaje.`
  if (unidadDevengo === "DIA_UNIDAD") return `Se paga por cada vehiculo, en cada ${unidadTiempo} del viaje.`
  return ""
}

// Al editar un concepto existente, detecta que plantilla calza para dejarla
// preseleccionada. null = ningun caso comun calza -> abrir modo manual.
function detectarPlantilla(concepto?: ConceptoCostoResponse): ClavePlantilla | null {
  if (!concepto) return "ALIMENTACION"
  const entrada = Object.entries(plantillasConcepto).find(
    ([, def]) =>
      def.naturaleza === concepto.naturaleza &&
      def.baseImputacion === concepto.baseImputacion &&
      def.unidadDevengo === concepto.unidadDevengo &&
      def.baseConteo === concepto.baseConteo,
  )
  return (entrada?.[0] as ClavePlantilla) ?? null
}
// El devengo responde: "una sola vez, cada cuanto se paga este costo?".
const ayudaDevengo: Record<UnidadDevengo, string> = {
  VIAJE: "Se paga 1 vez por cada viaje.",
  DIA_PERSONA: "Se paga 1 vez por persona por dia, aunque haga varios viajes ese dia.",
  DIA_UNIDAD: "Se paga 1 vez por vehiculo por dia, aunque haga varios viajes ese dia.",
  SERVICIO: "Se paga 1 vez por todo el servicio, sin importar dias ni viajes.",
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

// --- Dialogo crear/editar concepto (catalogo) --------------------------------

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
  const [unidadDevengo, setUnidadDevengo] = useState<UnidadDevengo>(
    concepto?.unidadDevengo ?? plantillasConcepto.ALIMENTACION.unidadDevengo,
  )
  const [baseConteo, setBaseConteo] = useState<BaseConteo>(
    concepto?.baseConteo ?? plantillasConcepto.ALIMENTACION.baseConteo,
  )
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

  async function guardar() {
    if (!nombre.trim()) {
      setError("El nombre es obligatorio.")
      return
    }
    try {
      setError(null)
      const montoRef = montoReferencial.trim() ? Number(montoReferencial) : null
      if (concepto) {
        await modificar.mutateAsync({
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || null,
          naturaleza,
          baseImputacion,
          unidadDevengo,
          baseConteo,
          montoReferencial: montoRef,
          moneda,
          usuarioModificacion: usuarioId,
        })
      } else {
        await crear.mutateAsync({
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || null,
          naturaleza,
          baseImputacion,
          unidadDevengo,
          baseConteo,
          montoReferencial: montoRef,
          moneda,
          usuarioCreacion: usuarioId,
        })
      }
      onClose(true)
    } catch (err) {
      setError(obtenerMensajeError(err))
    }
  }

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{concepto ? "Editar concepto" : "Nuevo concepto de costo"}</DialogTitle>
        <DialogDescription>
          Define el costo operativo y sus tres ejes. El precio se asigna despues en la pestana
          &quot;Configuracion de costo&quot;, por ruta + cuenta/contrato.
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
          <FieldLabel>Nombre</FieldLabel>
          <Input
            value={nombre}
            placeholder="Alimentacion"
            onChange={(e) => setNombre(e.target.value)}
          />
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
                        onClick={() => {
                          setPlantilla(clave)
                          setNaturaleza(def.naturaleza)
                          setBaseImputacion(def.baseImputacion)
                          setUnidadDevengo(def.unidadDevengo)
                          setBaseConteo(def.baseConteo)
                        }}
                        className={`rounded-lg border p-3 text-left transition-colors ${
                          seleccionado
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border bg-background hover:bg-muted/40"
                        }`}
                      >
                        <p className="text-sm font-medium">{def.frase}</p>
                        <p className="text-xs text-muted-foreground">{def.ejemplo}</p>
                        {def.nota ? (
                          <p className="mt-1 text-[11px] text-amber-600">{def.nota}</p>
                        ) : null}
                      </button>
                    )
                  },
                )}
              </div>
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
                    setPlantilla("ALIMENTACION")
                    const def = plantillasConcepto.ALIMENTACION
                    setNaturaleza(def.naturaleza)
                    setBaseImputacion(def.baseImputacion)
                    setUnidadDevengo(def.unidadDevengo)
                    setBaseConteo(def.baseConteo)
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
                  <Select
                    value={baseImputacion}
                    onValueChange={(v) => setBaseImputacion(v as BaseImputacion)}
                  >
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
                  <FieldLabel>Cada cuanto se paga (una sola vez)?</FieldLabel>
                  <Select
                    value={unidadDevengo}
                    onValueChange={(v) => setUnidadDevengo(v as UnidadDevengo)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VIAJE">1 vez por viaje</SelectItem>
                      <SelectItem value="DIA_PERSONA">1 vez por persona por dia</SelectItem>
                      <SelectItem value="DIA_UNIDAD">1 vez por vehiculo por dia</SelectItem>
                      <SelectItem value="SERVICIO">1 vez por todo el servicio</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {ayudaDevengo[unidadDevengo]} Evita pagar el mismo costo dos veces cuando hay
                    varios viajes.
                  </p>
                </Field>
                {unidadDevengo === "DIA_PERSONA" || unidadDevengo === "DIA_UNIDAD" ? (
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

        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-sm font-medium">Tarifa referencial (opcional)</p>
          <p className="mt-0.5 mb-3 text-xs text-muted-foreground">
            Precio unitario sugerido (por {etiquetaDevengo[unidadDevengo].toLowerCase()}), no el total
            del viaje. Prellena el checklist cuando ruta + cuenta/contrato aun no tiene su propio monto;
            el usuario puede sobrescribirlo ahi.
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
      if (activo) {
        await inhabilitar.mutateAsync(undefined)
      } else {
        await habilitar.mutateAsync(undefined)
      }
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
          {fraseComportamientoConcepto(concepto.unidadDevengo, concepto.baseConteo)}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">{etiquetaNaturaleza[concepto.naturaleza]}</Badge>
          <Badge variant="secondary">{etiquetaBase[concepto.baseImputacion]}</Badge>
        </div>
        {concepto.montoReferencial != null ? (
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

// --- Pestana: configuracion de costo (checklist ruta + cuenta/contrato) -----

function ChecklistPanel({
  rutaId,
  cuentaContratoId,
  tipoServicio,
  onGuardado,
}: {
  rutaId: number
  cuentaContratoId: number
  tipoServicio: TipoServicio
  onGuardado: () => void
}) {
  const checklistQuery = useChecklistCostoOperativoQuery(rutaId, cuentaContratoId, tipoServicio)
  const [lineas, setLineas] = useState<Record<number, { activo: boolean; monto: string; moneda: string }>>(
    {},
  )
  const [diasViatico, setDiasViatico] = useState("")
  const [nochesViatico, setNochesViatico] = useState("")
  const [diasSynced, setDiasSynced] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { usuario } = useSesion()
  const usuarioId = usuario?.email ?? "admin"

  const items = checklistQuery.data?.items ?? []

  if (!diasSynced && checklistQuery.data) {
    setDiasViatico(
      checklistQuery.data.diasViatico != null ? String(checklistQuery.data.diasViatico) : "",
    )
    setNochesViatico(
      checklistQuery.data.nochesViatico != null ? String(checklistQuery.data.nochesViatico) : "",
    )
    setDiasSynced(true)
  }

  // Sincroniza el estado editable cuando llega o cambia el checklist.
  const itemsKey = items.map((i) => `${i.conceptoCostoOperativoId}:${i.activo}:${i.monto}`).join("|")
  const [syncedKey, setSyncedKey] = useState<string | null>(null)
  if (itemsKey !== syncedKey && items.length > 0) {
    const inicial: Record<number, { activo: boolean; monto: string; moneda: string }> = {}
    items.forEach((item) => {
      inicial[item.conceptoCostoOperativoId] = {
        activo: item.activo,
        monto: item.monto != null ? String(item.monto) : "",
        moneda: item.moneda || "PEN",
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
        moneda: prev[item.conceptoCostoOperativoId]?.moneda ?? "PEN",
      },
    }))
  }

  function setMonto(conceptoId: number, monto: string) {
    setLineas((prev) => ({
      ...prev,
      [conceptoId]: { ...prev[conceptoId], monto, activo: prev[conceptoId]?.activo ?? false },
    }))
  }

  const marcadosPorNoche = items.filter(
    (item) => item.baseConteo === "NOCHE" && lineas[item.conceptoCostoOperativoId]?.activo,
  )

  async function guardarChecklist() {
    const marcados = Object.entries(lineas).filter(([, v]) => v.activo)
    for (const [, v] of marcados) {
      const montoNum = Number(v.monto)
      if (!Number.isFinite(montoNum) || montoNum <= 0) {
        setError("Cada concepto marcado necesita un monto mayor que cero.")
        return
      }
    }
    if (marcadosPorNoche.length > 0 && !nochesViatico.trim()) {
      setError(
        `"Noches de viatico" es obligatorio: ${marcadosPorNoche
          .map((i) => i.conceptoNombre)
          .join(", ")} se paga por noche.`,
      )
      return
    }
    try {
      setError(null)
      await guardar.mutateAsync({
        rutaId,
        cuentaContratoId,
        tipoServicio,
        diasViatico: diasViatico.trim() ? Number(diasViatico) : null,
        nochesViatico: nochesViatico.trim() ? Number(nochesViatico) : null,
        usuarioCreacion: usuarioId,
        lineas: Object.entries(lineas).map(([conceptoId, v]) => ({
          conceptoId: Number(conceptoId),
          activo: v.activo,
          monto: Number(v.monto) || 0,
          moneda: v.moneda || "PEN",
        })),
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

  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <AlertTitle>Esto es tarifa, no el costo total del viaje</AlertTitle>
        <AlertDescription>
          Cada monto es precio por unidad (por día, por día-persona, por viaje, segun &quot;Como se
          paga&quot;). Aca solo se fija el precio unitario para esta ruta + cuenta/contrato. Dias de
          viaje, cantidad de personas y numero de ejes del peaje los aporta Operaciones al momento
          real del viaje y multiplica desde ahi &mdash; no se configuran aca.
        </AlertDescription>
      </Alert>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudo guardar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Field className="w-40">
          <FieldLabel>Dias de viatico</FieldLabel>
          <Input
            type="number"
            min="1"
            value={diasViatico}
            placeholder="3"
            onChange={(e) => setDiasViatico(e.target.value)}
          />
        </Field>
        <Field className="w-48">
          <FieldLabel>
            Noches de viatico
            {marcadosPorNoche.length > 0 ? (
              <span className="ml-1 text-destructive">*</span>
            ) : null}
          </FieldLabel>
          <Input
            type="number"
            min="0"
            value={nochesViatico}
            placeholder="2"
            onChange={(e) => setNochesViatico(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            {marcadosPorNoche.length > 0
              ? "Obligatorio: hay conceptos que se pagan por noche."
              : "No se calcula solo (dias - 1). Se informa a mano si aplica."}
          </p>
        </Field>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Concepto</TableHead>
              <TableHead>Como se paga</TableHead>
              <TableHead>Conteo</TableHead>
              <TableHead className="w-44 text-right">Monto por unidad</TableHead>
              <TableHead className="w-24">Moneda</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const linea = lineas[item.conceptoCostoOperativoId] ?? {
                activo: false,
                monto: "",
                moneda: "PEN",
              }
              return (
                <TableRow key={item.conceptoCostoOperativoId}>
                  <TableCell>
                    <Checkbox
                      checked={linea.activo}
                      onCheckedChange={(c) => toggle(item, c === true)}
                    />
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{item.conceptoNombre}</p>
                    <p className="font-mono text-xs text-muted-foreground">{item.conceptoCodigo}</p>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {etiquetaNaturaleza[item.naturaleza]} · {etiquetaBase[item.baseImputacion]} ·{" "}
                    {etiquetaDevengo[item.unidadDevengo]}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {etiquetaBaseConteo[item.baseConteo]}
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={linea.monto}
                      disabled={!linea.activo}
                      placeholder="0.00"
                      className="h-8 text-right"
                      onChange={(e) => setMonto(item.conceptoCostoOperativoId, e.target.value)}
                    />
                    <p className="mt-1 text-right text-[11px] text-muted-foreground">
                      {ayudaDevengo[item.unidadDevengo]}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={linea.moneda}
                      disabled={!linea.activo}
                      className="h-8"
                      onChange={(e) =>
                        setLineas((prev) => ({
                          ...prev,
                          [item.conceptoCostoOperativoId]: {
                            ...prev[item.conceptoCostoOperativoId],
                            moneda: e.target.value.toUpperCase(),
                          },
                        }))
                      }
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => void guardarChecklist()} disabled={guardar.isPending}>
          {guardar.isPending ? "Guardando..." : "Guardar configuracion de costo"}
        </Button>
      </div>
    </div>
  )
}

// Suma lineas activas agrupadas por moneda. Casi siempre una sola moneda por paquete.
function sumarMontoConceptos(paquete: CostoOperativoResponse) {
  const totales = new Map<string, number>()
  paquete.lineas
    .filter((l) => l.activo)
    .forEach((l) => {
      const moneda = l.moneda || "PEN"
      totales.set(moneda, (totales.get(moneda) ?? 0) + l.monto)
    })
  return Array.from(totales.entries())
}

// Simulacion visual: aplica el multiplicador de cada unidadDevengo (dias,
// noches o personas dados por el usuario) sobre el monto unitario guardado.
// Solo para ver un estimado aca; el calculo real lo hace Operaciones con los
// datos reales del viaje. noches es un dato independiente, no se deriva de
// dias - 1.
function simularMontoConceptos(
  paquete: CostoOperativoResponse,
  dias: number,
  noches: number,
  personas: number,
) {
  const totales = new Map<string, number>()
  paquete.lineas
    .filter((l) => l.activo)
    .forEach((l) => {
      const moneda = l.moneda || "PEN"
      const cantidad = l.baseConteo === "NOCHE" ? noches : dias
      let factor = 1
      if (l.unidadDevengo === "DIA_PERSONA") factor = cantidad * personas
      else if (l.unidadDevengo === "DIA_UNIDAD") factor = cantidad
      totales.set(moneda, (totales.get(moneda) ?? 0) + l.monto * factor)
    })
  return Array.from(totales.entries())
}

// Fila expandible: calcula el peaje real (por ejes) y lo suma al monto de
// conceptos ya guardado, para ver el total estimado de un viaje concreto.
function PaqueteFilaViaje({
  paquete,
  onEditar,
  onAnular,
}: {
  paquete: CostoOperativoResponse
  onEditar: () => void
  onAnular: () => void
}) {
  const [abierto, setAbierto] = useState(false)
  const [verDetalle, setVerDetalle] = useState(false)
  const [numeroEjes, setNumeroEjes] = useState("2")
  const [tipoCobro, setTipoCobro] = useState<TipoCobroPeaje>("NORMAL")
  const [sentido, setSentido] = useState<SentidoPeajeRuta>("IDA")
  const [consultar, setConsultar] = useState(false)
  const [dias, setDias] = useState(String(paquete.diasViatico ?? 1))
  const [noches, setNoches] = useState(String(paquete.nochesViatico ?? 0))
  const [personas, setPersonas] = useState("1")

  const montosConceptos = sumarMontoConceptos(paquete)
  const montosConceptosEstimado = simularMontoConceptos(
    paquete,
    Math.max(1, Number(dias) || 1),
    Math.max(0, Number(noches) || 0),
    Math.max(1, Number(personas) || 1),
  )

  const costoQuery = useCostoPeajesRutaQuery(
    paquete.rutaId,
    { tipoCobro, sentido, numeroEjes: Number(numeroEjes) },
    consultar,
  )

  const peajeTotal = costoQuery.data?.total ?? null
  const monedaPeaje = costoQuery.data?.moneda ?? "PEN"
  const monedaConceptos =
    montosConceptosEstimado[0]?.[1] !== undefined ? montosConceptosEstimado[0][0] : "PEN"
  const totalConceptosEstimado = montosConceptosEstimado.reduce((acc, [, m]) => acc + m, 0)
  const totalViaje = peajeTotal != null ? totalConceptosEstimado + peajeTotal : null

  return (
    <>
      <TableRow>
        <TableCell className="text-sm">{paquete.rutaNombre ?? paquete.rutaId}</TableCell>
        <TableCell className="text-sm">{paquete.cuentaContratoNombre ?? paquete.cuentaContratoId}</TableCell>
        <TableCell className="text-sm">
          <Badge variant={paquete.tipoServicio === "EXPRESS" ? "default" : "secondary"}>
            {paquete.tipoServicio}
          </Badge>
        </TableCell>
        <TableCell className="text-sm">{paquete.lineas.filter((l) => l.activo).length}</TableCell>
        <TableCell className="text-sm">
          {montosConceptos.length === 0
            ? "-"
            : montosConceptos.map(([moneda, monto]) => `${moneda} ${monto.toFixed(2)}`).join(" + ")}
        </TableCell>
        <TableCell>
          <Button size="sm" variant="outline" onClick={() => setAbierto((v) => !v)}>
            {abierto ? "Ocultar" : "Calcular viaje"}
          </Button>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-1">
            <Button size="sm" variant="ghost" onClick={() => setVerDetalle((v) => !v)}>
              <Eye data-icon="inline-start" />
              {verDetalle ? "Ocultar" : "Ver"}
            </Button>
            <Button size="sm" variant="ghost" onClick={onEditar}>
              <Pencil data-icon="inline-start" />
              Editar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={onAnular}
            >
              <Trash2 data-icon="inline-start" />
              Anular
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {verDetalle ? (
        <TableRow>
          <TableCell colSpan={7} className="bg-muted/20">
            <div className="flex flex-col gap-2 p-2">
              <p className="text-xs text-muted-foreground">
                Ruta: {paquete.rutaNombre ?? paquete.rutaId} · Cuenta/contrato:{" "}
                {paquete.cuentaContratoNombre ?? paquete.cuentaContratoId} · Estado: {paquete.estado}
              </p>
              {paquete.lineas.filter((l) => l.activo).length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin conceptos marcados en este paquete.</p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Concepto</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead className="w-20">Moneda</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paquete.lineas
                        .filter((l) => l.activo)
                        .map((l) => (
                          <TableRow key={l.id}>
                            <TableCell className="text-sm">
                              <p className="font-medium">{l.conceptoNombre ?? l.conceptoCostoOperativoId}</p>
                              {l.conceptoCodigo ? (
                                <p className="font-mono text-xs text-muted-foreground">{l.conceptoCodigo}</p>
                              ) : null}
                            </TableCell>
                            <TableCell className="text-right text-sm">{l.monto.toFixed(2)}</TableCell>
                            <TableCell className="text-sm">{l.moneda}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      ) : null}
      {abierto ? (
        <TableRow>
          <TableCell colSpan={7} className="bg-muted/20">
            <div className="flex flex-col gap-3 p-2">
              <p className="text-xs text-muted-foreground">
                Simulador visual, no guarda nada. Ingresa dias, noches y personas del viaje para
                estimar conceptos con `unidadDevengo` DIA_PERSONA/DIA_UNIDAD, y ejes/tipo/sentido
                para el peaje. Noches no se calcula solo (no es dias - 1); se informa a mano igual
                que en el paquete. Operaciones calcula el monto real con los datos reales del viaje.
              </p>
              <div className="flex flex-wrap items-end gap-3">
                <Field className="w-24">
                  <FieldLabel>Dias de viaje</FieldLabel>
                  <Input
                    type="number"
                    min="1"
                    value={dias}
                    onChange={(e) => setDias(e.target.value)}
                  />
                </Field>
                <Field className="w-24">
                  <FieldLabel>Noches</FieldLabel>
                  <Input
                    type="number"
                    min="0"
                    value={noches}
                    onChange={(e) => setNoches(e.target.value)}
                  />
                </Field>
                <Field className="w-28">
                  <FieldLabel>Personas</FieldLabel>
                  <Input
                    type="number"
                    min="1"
                    value={personas}
                    onChange={(e) => setPersonas(e.target.value)}
                  />
                </Field>
                <Field className="w-28">
                  <FieldLabel>Numero de ejes</FieldLabel>
                  <Input
                    type="number"
                    min="2"
                    max="20"
                    value={numeroEjes}
                    onChange={(e) => {
                      setNumeroEjes(e.target.value)
                      setConsultar(false)
                    }}
                  />
                </Field>
                <Field className="w-36">
                  <FieldLabel>Tipo de cobro</FieldLabel>
                  <Select
                    value={tipoCobro}
                    onValueChange={(v) => {
                      setTipoCobro(v as TipoCobroPeaje)
                      setConsultar(false)
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="PEX">PEX</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field className="w-32">
                  <FieldLabel>Sentido</FieldLabel>
                  <Select
                    value={sentido}
                    onValueChange={(v) => {
                      setSentido(v as SentidoPeajeRuta)
                      setConsultar(false)
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IDA">Ida</SelectItem>
                      <SelectItem value="REGRESO">Regreso</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Button
                  size="sm"
                  onClick={() => setConsultar(true)}
                  disabled={costoQuery.isFetching || !numeroEjes}
                >
                  {costoQuery.isFetching ? "Calculando..." : "Calcular peaje"}
                </Button>
              </div>

              {costoQuery.error ? (
                <Alert variant="destructive">
                  <AlertTitle>No se pudo calcular</AlertTitle>
                  <AlertDescription>{obtenerMensajeError(costoQuery.error)}</AlertDescription>
                </Alert>
              ) : null}

              {peajeTotal != null ? (
                <div className="grid gap-1 rounded-lg border border-border bg-background p-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Conceptos ({dias} dia{Number(dias) === 1 ? "" : "s"}, {noches} noche
                      {Number(noches) === 1 ? "" : "s"}, {personas} persona
                      {Number(personas) === 1 ? "" : "s"}, estimado)
                    </p>
                    <p className="font-medium">{monedaConceptos} {totalConceptosEstimado.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Peaje (calculado real)</p>
                    <p className="font-medium">{monedaPeaje} {peajeTotal.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total estimado del viaje</p>
                    <p className="font-semibold">{monedaPeaje} {(totalViaje ?? 0).toFixed(2)}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </TableCell>
        </TableRow>
      ) : null}
    </>
  )
}

function ConfiguracionCostoTab() {
  const [rutaId, setRutaId] = useState("")
  const [cuentaContratoId, setCuentaContratoId] = useState("")
  const [tipoServicio, setTipoServicio] = useState<TipoServicio>("NORMAL")
  const [guardadoOk, setGuardadoOk] = useState(false)

  const paquetesQuery = useCostosOperativosQuery(
    { estadoRegistro: "ACTIVO", page: 1, pageSize: 50 },
  )
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
    <div className="flex flex-col gap-5">
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <p className="mb-3 text-sm font-medium">Elige ruta y cuenta/contrato</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel>Ruta</FieldLabel>
            <SelectRuta
              value={rutaId}
              onChange={(v) => {
                setRutaId(v)
                setGuardadoOk(false)
              }}
            />
          </Field>
          <Field>
            <FieldLabel>Cuenta o contrato</FieldLabel>
            <SelectCuentaContrato
              value={cuentaContratoId}
              onChange={(v) => {
                setCuentaContratoId(v)
                setGuardadoOk(false)
              }}
            />
          </Field>
          <Field>
            <FieldLabel>Tipo de servicio</FieldLabel>
            <Select
              value={tipoServicio}
              onValueChange={(v) => {
                setTipoServicio(v as TipoServicio)
                setGuardadoOk(false)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NORMAL">Normal</SelectItem>
                <SelectItem value="EXPRESS">Express</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        {guardadoOk ? (
          <Alert className="mt-4">
            <AlertTitle>Configuracion guardada</AlertTitle>
            <AlertDescription>El paquete de costo quedo actualizado para este par.</AlertDescription>
          </Alert>
        ) : null}

        {rutaSeleccionada && cuentaSeleccionada ? (
          <div className="mt-4">
            <ChecklistPanel
              key={`${rutaSeleccionada}-${cuentaSeleccionada}-${tipoServicio}`}
              rutaId={rutaSeleccionada}
              cuentaContratoId={cuentaSeleccionada}
              tipoServicio={tipoServicio}
              onGuardado={() => {
                setGuardadoOk(true)
                void paquetesQuery.refetch()
              }}
            />
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Selecciona ruta y cuenta/contrato para ver el checklist de conceptos.
          </p>
        )}
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="flex items-center gap-2 border-b border-border p-4">
          <ClipboardList className="size-4 text-muted-foreground" />
          <p className="text-sm font-medium">Paquetes configurados</p>
        </div>

        {paquetesQuery.isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : paquetes.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">Aun no hay paquetes de costo configurados.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ruta</TableHead>
                <TableHead>Cuenta / contrato</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead>Lineas activas</TableHead>
                <TableHead>Monto conceptos</TableHead>
                <TableHead>Viaje</TableHead>
                <TableHead className="text-right">Accion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paquetes.map((p: CostoOperativoResponse) => (
                <PaqueteFilaViaje
                  key={p.id}
                  paquete={p}
                  onEditar={() => {
                    setRutaId(String(p.rutaId))
                    setCuentaContratoId(String(p.cuentaContratoId))
                    setTipoServicio(p.tipoServicio)
                    setGuardadoOk(false)
                  }}
                  onAnular={() => setAnularId(p.id)}
                />
              ))}
            </TableBody>
          </Table>
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
                    Catalogo de conceptos (alimentacion, alojamiento, cochera, lavado, etc.) y
                    paquetes de costo por ruta + cuenta/contrato. El peaje se calcula aparte, por
                    ejes, en el modulo Peajes. El calculo real lo hacen Operaciones y Caja.
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
