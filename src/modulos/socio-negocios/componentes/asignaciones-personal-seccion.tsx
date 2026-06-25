"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArchiveX,
  FileText,
  History,
  Pencil,
  Plus,
  Trash2,
  Wallet,
  X,
} from "lucide-react"

import { ApiError } from "@/compartido/api/axios"
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

import { useSesion } from "@/modulos/autenticacion/ganchos/use-sesion"

import {
  useAsignacionesPorPersonalQuery,
  useAsignacionPersonalQuery,
  useCrearAsignacionPersonalMutation,
  useHistorialAsignacionPersonalQuery,
  useModificarAsignacionPersonalMutation,
  useOpcionesFormularioAsignacionQuery,
  useReemplazarCuentasContratosMutation,
} from "../servicios/asignaciones-personal-queries"
import { usePersonalSociosDeNegocioQuery } from "../servicios/socio-negocios-queries"
import { useConfiguracionesLaboralesPersonalQuery } from "../servicios/tareo-personal-queries"
import type {
  AprobadorCuentaContratoRequest,
  AsignacionPersonalResponse,
  ConfiguracionGeneralOpcionResponse,
  CuentaContrato,
  TipoAsignacionCuentaContrato,
} from "../tipos/asignacion-personal"
import type {
  ConfiguracionLaboralPersonalResponse,
  TipoTareoPersonalResponse,
} from "../tipos/tareo-personal"
import type { PersonalListadoResponse } from "../tipos/socio-negocio"
import { AprobacionesCuentasContratosSeccion } from "./aprobaciones-cuentas-contratos-seccion"
import { EstadoBadge } from "./estado-badge"
import { JerarquiaCuentasContratos } from "./jerarquia-cuentas-contratos"

type CampoOrganizacion = {
  key: "cargoId" | "sedeId" | "areaId"
  label: string
}

type ValoresOrganizacion = Record<CampoOrganizacion["key"], string>

type OpcionCatalogo = {
  id: string
  codigo: string
  nombre: string
}

// La vigencia de cada cuenta/contrato es la misma de la asignacion (heredada al
// guardar), por eso la fila ya no lleva fechas propias: evita que queden fuera
// del rango de la asignacion.
//
// Cada fila es de un tipo:
// - "CUENTA": se elige una cuenta (obligatoria) y, opcionalmente, un contrato
//   hijo de esa cuenta.
// - "CONTRATO": se elige primero una cuenta y luego un contrato obligatorio de
//   esa cuenta. El backend soporta ambos detalles; aqui se valida la relacion.
type RelacionCuentaContratoFila = {
  key: string
  tipo: TipoAsignacionCuentaContrato
  cuenta: OpcionCatalogo | null
  contrato: OpcionCatalogo | null
}

// Aprobador (firma) capturado manualmente. El orden en la lista define el
// `ordenAprobacion` y se aplica igual a todas las cuentas/contratos.
type AprobadorFila = {
  key: string
  aprobadorCodigo: string
  aprobadorNombre: string
}

const VALORES_ORGANIZACION_VACIOS: ValoresOrganizacion = {
  cargoId: "",
  sedeId: "",
  areaId: "",
}

// Catalogos de Configuracion General usados por el formulario, cargados una sola
// vez en el contenedor (ver AsignacionFormulario) desde el endpoint
// opciones-formulario y compartidos por los selects.
type CatalogosOrganizacion = {
  cargos: ConfiguracionGeneralOpcionResponse[]
  sedes: ConfiguracionGeneralOpcionResponse[]
  areas: ConfiguracionGeneralOpcionResponse[]
}

const PASOS_ASIGNACION = [
  { id: "datos", titulo: "Cargo y vigencia" },
  { id: "cuentas", titulo: "Cuenta y contrato" },
  { id: "laboral", titulo: "Horario de trabajo" },
  { id: "aprobadores", titulo: "Quien aprueba" },
  { id: "confirmacion", titulo: "Confirmacion" },
] as const

/**
 * Al editar, la asignacion trae codigos y nombres (cargo/sede/area). Aqui los
 * cruzamos contra el catalogo plano para dejar los selectores ya seleccionados
 * con su valor actual. Se prioriza el match por `codigo` (estable) y, si no
 * calza, por `nombre`. Si nada calza, ese campo queda vacio (se conserva el
 * actual al no tocarlo).
 */
function mapearOrganizacionInicial(
  asignacion: AsignacionPersonalResponse,
  catalogos: CatalogosOrganizacion,
): ValoresOrganizacion {
  const norm = (texto?: string) => (texto ?? "").trim().toLocaleLowerCase("es")
  const buscar = (
    lista: ConfiguracionGeneralOpcionResponse[],
    codigo?: string,
    nombre?: string,
  ) =>
    (codigo ? lista.find((item) => norm(item.codigo) === norm(codigo)) : undefined) ??
    (nombre ? lista.find((item) => norm(item.nombre) === norm(nombre)) : undefined)

  const cargo = buscar(catalogos.cargos, asignacion.cargoCodigo, asignacion.cargoNombre)
  const sede = buscar(catalogos.sedes, asignacion.sedeCodigo, asignacion.sedeNombre)
  const area = buscar(catalogos.areas, asignacion.areaCodigo, asignacion.areaNombre)

  return {
    cargoId: cargo ? String(cargo.id) : "",
    sedeId: sede ? String(sede.id) : "",
    areaId: area ? String(area.id) : "",
  }
}

function obtenerMensajeError(error: unknown) {
  if (error instanceof ApiError) {
    const mensajesValidacion = error.errores
      ?.map((item) => item.mensaje)
      .filter(Boolean)

    if (mensajesValidacion?.length) {
      return mensajesValidacion.join(" ")
    }
  }

  if (error instanceof Error) {
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

function obtenerEtiquetaCatalogo(item: ConfiguracionGeneralOpcionResponse) {
  return `${item.codigo} - ${item.nombre}`
}

function obtenerNombrePersonal(personal: PersonalListadoResponse) {
  return (
    personal.nombreCompleto ||
    [
      personal.primerNombre,
      personal.segundoNombre,
      personal.apellidoPaterno,
      personal.apellidoMaterno,
    ]
      .filter(Boolean)
      .join(" ") ||
    personal.numeroDocumento ||
    `Personal #${personal.id}`
  )
}

function obtenerEtiquetaPersonal(personal: PersonalListadoResponse) {
  const nombre = obtenerNombrePersonal(personal)
  return personal.numeroDocumento ? `${nombre} - ${personal.numeroDocumento}` : nombre
}

function aOpcionCatalogo(item: ConfiguracionGeneralOpcionResponse): OpcionCatalogo {
  return {
    id: String(item.id),
    codigo: item.codigo,
    nombre: item.nombre,
  }
}

/**
 * Opcion de contrato con sangria por nivel jerarquico para que el combo deje ver
 * la profundidad (cuenta=1, contrato directo=2, subniveles 3, 4...).
 */
function aOpcionContrato(item: ConfiguracionGeneralOpcionResponse): OpcionCatalogo {
  const nivel = item.nivelCuentaContrato ?? 2
  const sangria = nivel > 2 ? `${"· ".repeat(nivel - 2)}` : ""
  return {
    id: String(item.id),
    codigo: item.codigo,
    nombre: `${sangria}${item.nombre}`,
  }
}

/**
 * Indica si un contrato cuelga (directa o indirectamente, por subniveles) de la
 * cuenta indicada. Recorre la cadena `contratoPadreId` hasta toparse con la
 * cuenta (que no esta en el catalogo de contratos) o con un ciclo.
 */
function contratoPerteneceACuenta(
  contrato: ConfiguracionGeneralOpcionResponse,
  cuentaId: string,
  contratosPorId: Map<string, ConfiguracionGeneralOpcionResponse>,
): boolean {
  let actual: ConfiguracionGeneralOpcionResponse | undefined = contrato
  const visitados = new Set<string>()
  while (actual) {
    const padreId = String(actual.contratoPadreId ?? "")
    if (!padreId) return false
    if (padreId === cuentaId) return true
    if (visitados.has(padreId)) return false
    visitados.add(padreId)
    actual = contratosPorId.get(padreId)
  }
  return false
}

function aOpcionCuentaContratoExistente(
  item: AsignacionPersonalResponse["cuentasContratos"][number],
  catalogo: ConfiguracionGeneralOpcionResponse[],
): OpcionCatalogo {
  const configuracionActual = buscarConfiguracionActual(item, catalogo)
  if (configuracionActual) return aOpcionCatalogo(configuracionActual)

  return {
    id: String(item.configuracionId ?? item.configuracionCodigo),
    codigo: item.configuracionCodigo,
    nombre: item.configuracionNombre,
  }
}

function buscarConfiguracionActual(
  item: AsignacionPersonalResponse["cuentasContratos"][number],
  catalogo: ConfiguracionGeneralOpcionResponse[],
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

// Recibe el catalogo ya cargado (se centraliza la carga en el contenedor para
// no repetir requests por cada selector ni por cada apertura del formulario).
function SelectCatalogo({
  catalogo,
  cargando = false,
  value,
  onChange,
  enabled,
  placeholder,
  includeNone = true,
  filtrarItems,
}: {
  catalogo: ConfiguracionGeneralOpcionResponse[]
  cargando?: boolean
  value: string
  onChange: (item: ConfiguracionGeneralOpcionResponse | null) => void
  enabled: boolean
  placeholder: string
  includeNone?: boolean
  filtrarItems?: (item: ConfiguracionGeneralOpcionResponse) => boolean
}) {
  const items = catalogo.filter((item) => !filtrarItems || filtrarItems(item))

  return (
    <Select
      value={value || (includeNone ? "__none" : "")}
      disabled={!enabled}
      onValueChange={(v) =>
        onChange(v === "__none" ? null : items.find((item) => String(item.id) === v) ?? null)
      }
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {includeNone ? <SelectItem value="__none">Sin asignar</SelectItem> : null}
          {items.map((item) => (
            <SelectItem key={item.id} value={String(item.id)}>
              {obtenerEtiquetaCatalogo(item)}
            </SelectItem>
          ))}
          {items.length === 0 && !cargando ? (
            <SelectItem value="__vacio" disabled>
              Sin opciones disponibles
            </SelectItem>
          ) : null}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

function agregarOpcionActual(
  opciones: OpcionCatalogo[],
  actual: OpcionCatalogo | null,
) {
  if (!actual || opciones.some((item) => item.id === actual.id)) return opciones
  return [actual, ...opciones]
}

function SelectOpcionesCatalogo({
  opciones,
  value,
  onChange,
  enabled,
  placeholder,
  includeNone = true,
}: {
  opciones: OpcionCatalogo[]
  value: string
  onChange: (item: OpcionCatalogo | null) => void
  enabled: boolean
  placeholder: string
  includeNone?: boolean
}) {
  return (
    <Select
      value={value || (includeNone ? "__none" : "")}
      disabled={!enabled}
      onValueChange={(v) =>
        onChange(v === "__none" ? null : opciones.find((item) => item.id === v) ?? null)
      }
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {includeNone ? <SelectItem value="__none">Sin asignar</SelectItem> : null}
          {opciones.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.codigo} - {item.nombre}
            </SelectItem>
          ))}
          {opciones.length === 0 ? (
            <SelectItem value="__vacio" disabled>
              Sin opciones disponibles
            </SelectItem>
          ) : null}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

let contadorFilas = 0
function nuevaClaveFila() {
  contadorFilas += 1
  return `relacion-${contadorFilas}`
}

function crearFilaCuentaVacia(): RelacionCuentaContratoFila {
  return {
    key: nuevaClaveFila(),
    tipo: "CUENTA",
    cuenta: null,
    contrato: null,
  }
}

function crearFilaContratoVacia(): RelacionCuentaContratoFila {
  return {
    key: nuevaClaveFila(),
    tipo: "CONTRATO",
    cuenta: null,
    contrato: null,
  }
}

function crearFilaAprobadorVacia(): AprobadorFila {
  return {
    key: nuevaClaveFila(),
    aprobadorCodigo: "",
    aprobadorNombre: "",
  }
}

/**
 * Aprobadores iniciales al editar: se reconstruyen desde las firmas existentes
 * de los detalles vigentes (la primera relacion que las tenga), ordenadas por
 * `ordenAprobacion`, para no perderlas al reemplazar las cuentas/contratos.
 */
function crearFilasAprobadorActual(
  asignacion: AsignacionPersonalResponse,
): AprobadorFila[] {
  const conFirmas = asignacion.cuentasContratos
    .filter((item) => item.estado !== "ANULADA" && (item.aprobaciones?.length ?? 0) > 0)
    .map((item) => item.aprobaciones ?? [])
    .sort((a, b) => b.length - a.length)[0]

  if (!conFirmas?.length) return []

  return [...conFirmas]
    .sort((a, b) => a.ordenAprobacion - b.ordenAprobacion)
    .map((firma) => ({
      key: nuevaClaveFila(),
      aprobadorCodigo: firma.aprobadorCodigo ?? "",
      aprobadorNombre: firma.aprobadorNombre ?? "",
    }))
}

function firmaAprobadores(filas: AprobadorFila[]) {
  return filas
    .map((fila) => `${fila.aprobadorCodigo.trim()}:${fila.aprobadorNombre.trim()}`)
    .join("|")
}

/** Filas con codigo y nombre completos, listas para enviar al backend. */
function aprobadoresValidos(
  filas: AprobadorFila[],
  personalCatalogo: PersonalListadoResponse[] = [],
): AprobadorCuentaContratoRequest[] {
  return filas
    .map((fila) => {
      const aprobadorCodigo = fila.aprobadorCodigo.trim()
      const aprobadorNombre = fila.aprobadorNombre.trim()
      const personal = personalCatalogo.find((item) => String(item.id) === aprobadorCodigo)

      return {
        aprobadorCodigo,
        aprobadorNombre:
          !aprobadorNombre || aprobadorNombre === aprobadorCodigo
            ? personal
              ? obtenerNombrePersonal(personal)
              : aprobadorNombre
            : aprobadorNombre,
      }
    })
    .filter((fila) => fila.aprobadorCodigo && fila.aprobadorNombre)
}

function crearFilasRelacionActual(
  asignacion: AsignacionPersonalResponse,
  cuentasCatalogo: ConfiguracionGeneralOpcionResponse[],
  contratosCatalogo: ConfiguracionGeneralOpcionResponse[],
  // Al reutilizar la configuracion de una asignacion previa (posiblemente
  // finalizada) tomamos sus cuentas/contratos no anulados; en edicion normal
  // solo las vigentes.
  incluirNoVigentes = false,
): RelacionCuentaContratoFila[] {
  const relacionesVigentes = asignacion.cuentasContratos.filter((item) =>
    incluirNoVigentes ? item.estado !== "ANULADA" : item.estado === "VIGENTE",
  )
  const filas: RelacionCuentaContratoFila[] = []

  // Cada detalle guardado se reconstruye como su propio bloque, rotulado por tipo.
  relacionesVigentes
    .filter((item) => item.tipo === "CUENTA")
    .forEach((cuenta) => {
      filas.push({
        key: nuevaClaveFila(),
        tipo: "CUENTA",
        cuenta: aOpcionCuentaContratoExistente(cuenta, cuentasCatalogo),
        contrato: null,
      })
    })

  relacionesVigentes
    .filter((item) => item.tipo === "CONTRATO")
    .forEach((contrato) => {
      filas.push({
        key: nuevaClaveFila(),
        tipo: "CONTRATO",
        cuenta: null,
        contrato: aOpcionCuentaContratoExistente(contrato, contratosCatalogo),
      })
    })

  return filas
}

function firmaRelaciones(filas: RelacionCuentaContratoFila[]) {
  return filas
    .map((fila) => `${fila.tipo}:${fila.cuenta?.id ?? ""}:${fila.contrato?.id ?? ""}`)
    .sort()
    .join("|")
}

function nombreOpcionSeleccionada(
  id: string,
  catalogo: ConfiguracionGeneralOpcionResponse[],
  respaldo?: string,
) {
  const item = catalogo.find((opcion) => String(opcion.id) === id)
  return item ? `${item.codigo} - ${item.nombre}` : respaldo || "Sin definir"
}

type ResultadoRelacionContractual =
  | { ok: false; error: string }
  | { ok: true; cuentasContratos: CuentaContrato[] }

function validarYConstruirCuentasContratos(
  filas: RelacionCuentaContratoFila[],
  vigencia: { vigenteDesde: string; vigenteHasta: string },
  contratosCatalogo: ConfiguracionGeneralOpcionResponse[],
  // Misma lista de firmas para todas las cuentas/contratos. Se omite el campo si
  // esta vacia para no enviar `aprobadores: []`.
  aprobadores: AprobadorCuentaContratoRequest[] = [],
): ResultadoRelacionContractual {
  if (filas.length === 0) {
    return {
      ok: false,
      error: "Agrega al menos una cuenta o un contrato.",
    }
  }

  // Cada tipo de bloque solo exige su propio dato:
  // - CUENTA: la cuenta es obligatoria; el contrato hijo es opcional.
  // - CONTRATO: solo el contrato es obligatorio. No requiere cuenta: el backend
  //   resuelve la jerarquia (cuenta raiz) a partir del contrato.
  const cuentaSinSeleccion = filas.find((fila) => fila.tipo === "CUENTA" && !fila.cuenta)
  if (cuentaSinSeleccion) {
    return {
      ok: false,
      error: "El bloque de cuenta debe tener una cuenta seleccionada.",
    }
  }

  const contratoSinSeleccion = filas.find(
    (fila) => fila.tipo === "CONTRATO" && !fila.contrato,
  )
  if (contratoSinSeleccion) {
    return {
      ok: false,
      error: "El bloque de contrato debe tener un contrato seleccionado.",
    }
  }

  // La misma cuenta puede aparecer en varios bloques (se deduplica al enviar).
  // Lo que no se permite es repetir el mismo contrato.
  const contratos = filas
    .map((fila) => fila.contrato?.id)
    .filter((contrato): contrato is string => Boolean(contrato))
  if (new Set(contratos).size !== contratos.length) {
    return {
      ok: false,
      error: "No puedes repetir el mismo contrato en dos bloques distintos.",
    }
  }

  // Solo en bloques CUENTA con contrato hijo validamos que el contrato pertenezca
  // a esa cuenta (relacion explicita del front). En bloques CONTRATO sueltos no
  // se valida cuenta: la jerarquia la resuelve el backend.
  const contratoInvalido = filas.find((fila) => {
    if (fila.tipo !== "CUENTA" || !fila.cuenta || !fila.contrato) return false
    const contrato = contratosCatalogo.find((item) => String(item.id) === fila.contrato?.id)
    if (!contrato) return false
    return String(contrato?.contratoPadreId ?? "") !== fila.cuenta.id
  })
  if (contratoInvalido) {
    return {
      ok: false,
      error: "El contrato seleccionado no pertenece a la cuenta elegida.",
    }
  }

  // La vigencia de cada cuenta/contrato se hereda de la asignacion: asi siempre
  // queda dentro de su rango y no puede dispararse el error de vigencia.
  const vigenteDesde = fechaApi(vigencia.vigenteDesde)
  const vigenteHasta = vigencia.vigenteHasta ? fechaApi(vigencia.vigenteHasta) : undefined

  const firmas = aprobadores.length > 0 ? { aprobadores } : {}
  const cuentasContratos: CuentaContrato[] = []
  // Evita enviar la misma CUENTA o el mismo CONTRATO dos veces.
  const cuentasEmitidas = new Set<string>()
  const contratosEmitidos = new Set<string>()

  function emitirCuenta(cuentaId: string) {
    if (cuentasEmitidas.has(cuentaId)) return
    cuentasEmitidas.add(cuentaId)
    cuentasContratos.push({
      tipo: "CUENTA",
      configuracionId: cuentaId,
      vigenteDesde,
      vigenteHasta,
      orden: cuentasContratos.length,
      ...firmas,
    })
  }

  function emitirContrato(contratoId: string) {
    if (contratosEmitidos.has(contratoId)) return
    contratosEmitidos.add(contratoId)
    cuentasContratos.push({
      tipo: "CONTRATO",
      configuracionId: contratoId,
      vigenteDesde,
      vigenteHasta,
      orden: cuentasContratos.length,
      ...firmas,
    })
  }

  filas.forEach((fila) => {
    if (fila.tipo === "CUENTA" && fila.cuenta) {
      emitirCuenta(fila.cuenta.id)
      if (fila.contrato) emitirContrato(fila.contrato.id)
    } else if (fila.tipo === "CONTRATO" && fila.contrato) {
      // Contrato suelto: el backend resuelve su cuenta raiz.
      emitirContrato(fila.contrato.id)
    }
  })

  return { ok: true, cuentasContratos }
}

function FormularioOrganizacion({
  valores,
  onChange,
  habilitado,
  actuales,
  catalogos,
}: {
  valores: ValoresOrganizacion
  onChange: (key: CampoOrganizacion["key"], item: ConfiguracionGeneralOpcionResponse | null) => void
  habilitado: boolean
  actuales?: {
    cargo?: string
    sede?: string
    area?: string
  }
  catalogos: CatalogosOrganizacion
}) {
  return (
    <FieldSet className="rounded-lg border border-border p-4">
      <FieldLegend>Datos laborales</FieldLegend>
      <FieldDescription>
        {actuales
          ? "Selecciona solo los campos que deseas cambiar. Lo que no toques conservara su valor actual."
          : "Sede, area y cargo se guardan en la asignacion."}
      </FieldDescription>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field>
          <FieldLabel>Sede *</FieldLabel>
          <SelectCatalogo
            catalogo={catalogos.sedes}
            value={valores.sedeId}
            onChange={(item) => onChange("sedeId", item)}
            enabled={habilitado}
            includeNone={false}
            placeholder={actuales?.sede ? `Conservar: ${actuales.sede}` : "Selecciona sede"}
          />
          {actuales?.sede ? (
            <FieldDescription>Actual: {actuales.sede}</FieldDescription>
          ) : null}
        </Field>

        <Field>
          <FieldLabel>Area *</FieldLabel>
          <SelectCatalogo
            catalogo={catalogos.areas}
            value={valores.areaId}
            onChange={(item) => onChange("areaId", item)}
            enabled={habilitado}
            includeNone={false}
            placeholder={actuales?.area ? `Conservar: ${actuales.area}` : "Selecciona area"}
          />
          {actuales?.area ? (
            <FieldDescription>Actual: {actuales.area}</FieldDescription>
          ) : null}
        </Field>

        <Field>
          <FieldLabel>Cargo *</FieldLabel>
          <SelectCatalogo
            catalogo={catalogos.cargos}
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

function EditorRelacionContractual({
  filas,
  onChange,
  cuentasCatalogo,
  contratosCatalogo,
}: {
  filas: RelacionCuentaContratoFila[]
  onChange: (filas: RelacionCuentaContratoFila[]) => void
  cuentasCatalogo: ConfiguracionGeneralOpcionResponse[]
  contratosCatalogo: ConfiguracionGeneralOpcionResponse[]
}) {
  function actualizarFila(
    key: string,
    cambios: Partial<RelacionCuentaContratoFila>,
  ) {
    onChange(filas.map((fila) => (fila.key === key ? { ...fila, ...cambios } : fila)))
  }

  function agregarCuenta() {
    onChange([...filas, crearFilaCuentaVacia()])
  }

  function agregarContrato() {
    onChange([...filas, crearFilaContratoVacia()])
  }

  function eliminarFila(key: string) {
    onChange(filas.filter((fila) => fila.key !== key))
  }

  const contratosPorId = new Map(
    contratosCatalogo.map((item) => [String(item.id), item]),
  )

  return (
    <div className="flex flex-col gap-3">
      {filas.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          Todavia no agregaste cuentas ni contratos. Agrega una <strong>cuenta</strong> (puede
          llevar un contrato hijo) o un <strong>contrato</strong> por separado: el sistema ubica
          solo su cuenta.
        </div>
      ) : null}

      {filas.map((fila, indice) => {
        const esCuenta = fila.tipo === "CUENTA"
        const opcionesCuenta = agregarOpcionActual(
          cuentasCatalogo.map(aOpcionCatalogo),
          fila.cuenta,
        )
        // En bloque CUENTA, el contrato hijo se filtra por la cuenta elegida
        // (solo hijos directos del primer nivel).
        const opcionesContratoHijo = agregarOpcionActual(
          contratosCatalogo
            .filter((item) => String(item.contratoPadreId ?? "") === fila.cuenta?.id)
            .map(aOpcionContrato),
          fila.contrato,
        )
        // En bloque CONTRATO, la cuenta es solo filtro de ubicacion: si se elige,
        // se muestran todos los contratos de su arbol (con subniveles); si no, todos.
        const contratosFiltrados = fila.cuenta
          ? contratosCatalogo.filter((item) =>
              contratoPerteneceACuenta(item, fila.cuenta!.id, contratosPorId),
            )
          : contratosCatalogo
        const opcionesContratoFiltradas = agregarOpcionActual(
          [...contratosFiltrados]
            .sort((a, b) => (a.nivelCuentaContrato ?? 0) - (b.nivelCuentaContrato ?? 0))
            .map(aOpcionContrato),
          fila.contrato,
        )

        return (
          <div
            key={fila.key}
            className={cn(
              "overflow-hidden rounded-lg border-l-4 bg-card shadow-xs",
              esCuenta
                ? "border-l-sky-500 border-y border-r border-sky-500/30"
                : "border-l-violet-500 border-y border-r border-violet-500/30",
            )}
          >
            <div
              className={cn(
                "flex items-center justify-between gap-3 border-b px-4 py-2.5",
                esCuenta
                  ? "border-sky-500/20 bg-sky-500/5"
                  : "border-violet-500/20 bg-violet-500/5",
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-md",
                    esCuenta
                      ? "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                      : "bg-violet-500/15 text-violet-600 dark:text-violet-400",
                  )}
                >
                  {esCuenta ? (
                    <Wallet className="size-4" />
                  ) : (
                    <FileText className="size-4" />
                  )}
                </span>
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold">
                    {esCuenta ? "Cuenta" : "Contrato"}
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                      #{indice + 1}
                    </span>
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {esCuenta
                      ? "Cuenta principal, con contrato hijo opcional"
                      : "Contrato independiente; su cuenta se resuelve sola"}
                  </span>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Eliminar"
                onClick={() => eliminarFila(fila.key)}
              >
                <Trash2 className="text-destructive" />
              </Button>
            </div>

            <div className="p-4">
              {esCuenta ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <Field>
                    <FieldLabel>Cuenta *</FieldLabel>
                    <SelectOpcionesCatalogo
                      opciones={opcionesCuenta}
                      value={fila.cuenta?.id ?? ""}
                      onChange={(item) =>
                        actualizarFila(fila.key, { cuenta: item, contrato: null })
                      }
                      enabled
                      includeNone={false}
                      placeholder="Selecciona una cuenta"
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Contrato de la cuenta</FieldLabel>
                    <SelectOpcionesCatalogo
                      opciones={opcionesContratoHijo}
                      value={fila.contrato?.id ?? ""}
                      onChange={(item) => actualizarFila(fila.key, { contrato: item })}
                      enabled={Boolean(fila.cuenta)}
                      placeholder={
                        fila.cuenta
                          ? "Opcional: contrato de la cuenta"
                          : "Primero selecciona una cuenta"
                      }
                    />
                    <FieldDescription>
                      Opcional. Solo se muestran contratos de la cuenta elegida.
                    </FieldDescription>
                  </Field>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  <Field>
                    <FieldLabel>Cuenta (filtro de ubicacion)</FieldLabel>
                    <SelectOpcionesCatalogo
                      opciones={opcionesCuenta}
                      value={fila.cuenta?.id ?? ""}
                      onChange={(item) =>
                        actualizarFila(fila.key, { cuenta: item, contrato: null })
                      }
                      enabled
                      placeholder="Todas las cuentas"
                    />
                    <FieldDescription>
                      Opcional. Acota los contratos por cuenta; no se guarda como cuenta.
                    </FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel>Contrato *</FieldLabel>
                    <SelectOpcionesCatalogo
                      opciones={opcionesContratoFiltradas}
                      value={fila.contrato?.id ?? ""}
                      onChange={(item) => actualizarFila(fila.key, { contrato: item })}
                      enabled
                      includeNone={false}
                      placeholder={
                        fila.cuenta
                          ? "Contrato de la cuenta (incluye subniveles)"
                          : "Selecciona un contrato"
                      }
                    />
                    <FieldDescription>
                      La sangria indica el nivel. El sistema ubica la cuenta del contrato al guardar.
                    </FieldDescription>
                  </Field>
                </div>
              )}
            </div>
          </div>
        )
      })}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={agregarCuenta}
          className="border-sky-500/40 text-sky-700 hover:bg-sky-500/10 dark:text-sky-400"
        >
          <Wallet data-icon="inline-start" />
          Agregar cuenta
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={agregarContrato}
          className="border-violet-500/40 text-violet-700 hover:bg-violet-500/10 dark:text-violet-400"
        >
          <FileText data-icon="inline-start" />
          Agregar contrato
        </Button>
      </div>
    </div>
  )
}

function EditorAprobadores({
  filas,
  onChange,
  personalCatalogo = [],
  cargandoPersonal = false,
}: {
  filas: AprobadorFila[]
  onChange: (filas: AprobadorFila[]) => void
  personalCatalogo?: PersonalListadoResponse[]
  cargandoPersonal?: boolean
}) {
  function actualizarFila(key: string, cambios: Partial<AprobadorFila>) {
    onChange(filas.map((fila) => (fila.key === key ? { ...fila, ...cambios } : fila)))
  }

  function agregarFila() {
    onChange([...filas, crearFilaAprobadorVacia()])
  }

  function eliminarFila(key: string) {
    onChange(filas.filter((fila) => fila.key !== key))
  }

  return (
    <div className="flex flex-col gap-3">
      {filas.length === 0 ? (
        <div className="rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 px-4 py-4 text-sm text-amber-700">
          Si no agregas quien aprueba, las cuentas y contratos quedaran en espera y no se podran
          aprobar. Agrega al menos una persona que apruebe.
        </div>
      ) : null}

      {filas.map((fila, indice) => (
        <div key={fila.key} className="rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Aprobador #{indice + 1}</p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Eliminar aprobador"
              onClick={() => eliminarFila(fila.key)}
            >
              <Trash2 className="text-destructive" />
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Field className="md:col-span-2">
              <FieldLabel>Elegir de la lista de personal</FieldLabel>
              <Select
                value={
                  personalCatalogo.some((personal) => String(personal.id) === fila.aprobadorCodigo)
                    ? fila.aprobadorCodigo
                    : "__manual"
                }
                onValueChange={(value) => {
                  if (value === "__manual") return
                  const personal = personalCatalogo.find((item) => String(item.id) === value)
                  if (!personal) return
                  actualizarFila(fila.key, {
                    aprobadorCodigo: String(personal.id),
                    aprobadorNombre: obtenerNombrePersonal(personal),
                  })
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un aprobador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="__manual">
                      {cargandoPersonal ? "Cargando personal..." : "Seleccion manual"}
                    </SelectItem>
                    {personalCatalogo.map((personal) => (
                      <SelectItem key={personal.id} value={String(personal.id)}>
                        {obtenerEtiquetaPersonal(personal)}
                      </SelectItem>
                    ))}
                    {personalCatalogo.length === 0 && !cargandoPersonal ? (
                      <SelectItem value="__vacio" disabled>
                        Sin personal disponible
                      </SelectItem>
                    ) : null}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>
                Elige a la persona que aprobara. Si no esta en la lista, puedes escribir su codigo y
                nombre a mano abajo.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel>Codigo del aprobador *</FieldLabel>
              <Input
                value={fila.aprobadorCodigo}
                placeholder="Ej. GER-OPER"
                onChange={(event) =>
                  actualizarFila(fila.key, { aprobadorCodigo: event.target.value })
                }
              />
            </Field>
            <Field>
              <FieldLabel>Nombre del aprobador *</FieldLabel>
              <Input
                value={fila.aprobadorNombre}
                placeholder="Ej. Gerente de Operaciones"
                onChange={(event) =>
                  actualizarFila(fila.key, { aprobadorNombre: event.target.value })
                }
              />
            </Field>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={agregarFila}
      >
        <Plus data-icon="inline-start" />
        Agregar aprobador
      </Button>
    </div>
  )
}

function AsignacionFormularioContenido({
  modo,
  asignacion,
  personalId,
  ultimaAsignacion,
  cuentasCatalogo,
  contratosCatalogo,
  catalogosOrganizacion,
  tiposTareo,
  configuracionesLaboralesCatalogo,
  onClose,
}: {
  modo: "crear" | "editar"
  asignacion?: AsignacionPersonalResponse
  personalId: string | number
  ultimaAsignacion?: AsignacionPersonalResponse
  cuentasCatalogo: ConfiguracionGeneralOpcionResponse[]
  contratosCatalogo: ConfiguracionGeneralOpcionResponse[]
  catalogosOrganizacion: CatalogosOrganizacion
  tiposTareo: TipoTareoPersonalResponse[]
  configuracionesLaboralesCatalogo: ConfiguracionLaboralPersonalResponse[]
  onClose: (actualizado: boolean) => void
}) {
  // Al editar, precargamos cargo/sede/area desde el catalogo plano para que
  // aparezcan ya seleccionados y solo se cambie lo necesario.
  const organizacionInicial =
    modo === "editar" && asignacion
      ? mapearOrganizacionInicial(asignacion, catalogosOrganizacion)
      : { ...VALORES_ORGANIZACION_VACIOS }
  const [valores, setValores] = useState<ValoresOrganizacion>(organizacionInicial)
  // Jefe/responsable: dato libre (BC-01 ya no lo valida contra Configuracion
  // General). Se guarda como jefeCodigo (opcional) y jefeNombre.
  const [jefeCodigo, setJefeCodigo] = useState(asignacion?.jefeCodigo ?? "")
  const [jefeNombre, setJefeNombre] = useState(asignacion?.jefeNombre ?? "")
  const jefeCodigoInicial = asignacion?.jefeCodigo ?? ""
  const jefeNombreInicial = asignacion?.jefeNombre ?? ""
  const [vigenteDesde, setVigenteDesde] = useState(soloFecha(asignacion?.vigenteDesde))
  const [vigenteHasta, setVigenteHasta] = useState(soloFecha(asignacion?.vigenteHasta))
  // Tareo: maestros internos de BC-01. La configuracion laboral se filtra por el
  // tipo seleccionado; al cambiar el tipo se reinicia la configuracion elegida.
  const tipoTareoInicial = asignacion?.tipoTareoId ? String(asignacion.tipoTareoId) : ""
  const configuracionLaboralInicial = asignacion?.configuracionLaboralId
    ? String(asignacion.configuracionLaboralId)
    : ""
  const [tipoTareoId, setTipoTareoId] = useState(tipoTareoInicial)
  const [configuracionLaboralId, setConfiguracionLaboralId] = useState(configuracionLaboralInicial)
  // Las configuraciones laborales llegan en opciones-formulario (snapshot inicial),
  // pero ademas las consultamos en vivo por el tipo elegido para reflejar las
  // recien creadas/activadas sin depender solo del snapshot. Se mezclan por id.
  const configuracionesLaboralesQuery = useConfiguracionesLaboralesPersonalQuery(
    { tipoTareoId, estado: "ACTIVO" },
    Boolean(tipoTareoId),
  )
  const configuracionesLaborales = tipoTareoId
    ? (() => {
        const porId = new Map<string, ConfiguracionLaboralPersonalResponse>()
        configuracionesLaboralesCatalogo
          .filter((config) => String(config.tipoTareoId) === tipoTareoId)
          .forEach((config) => porId.set(String(config.id), config))
        ;(configuracionesLaboralesQuery.data ?? []).forEach((config) =>
          porId.set(String(config.id), config),
        )
        return [...porId.values()]
      })()
    : []
  const cargandoConfiguraciones = configuracionesLaboralesQuery.isLoading
  const personalQuery = usePersonalSociosDeNegocioQuery({
    estado: "ACTIVO",
    estadoRegistro: "ACTIVO",
    estadoAprobacion: "APROBADO",
    pageSize: 200,
    sortBy: "fechaCreacion",
    sortOrder: "desc",
  })
  const personalCatalogo = personalQuery.data?.datos ?? []
  const [relaciones, setRelaciones] = useState<RelacionCuentaContratoFila[]>(() =>
    modo === "editar" && asignacion
      ? crearFilasRelacionActual(asignacion, cuentasCatalogo, contratosCatalogo)
      : [],
  )
  // Aprobadores (firmas) capturados manualmente; misma lista para todas las
  // cuentas/contratos. Al editar se precargan desde las firmas existentes.
  const [aprobadores, setAprobadores] = useState<AprobadorFila[]>(() =>
    modo === "editar" && asignacion ? crearFilasAprobadorActual(asignacion) : [],
  )
  const [firmaInicialAprobadores] = useState(() =>
    firmaAprobadores(
      modo === "editar" && asignacion ? crearFilasAprobadorActual(asignacion) : [],
    ),
  )
  // Preview de "usar ultima configuracion" (solo al crear, si hubo una previa).
  const [previewReutilizar, setPreviewReutilizar] = useState(false)
  const puedeReutilizar = modo === "crear" && Boolean(ultimaAsignacion)
  const relacionesUltima =
    ultimaAsignacion?.cuentasContratos.filter((item) => item.estado !== "ANULADA") ?? []

  function usarUltimaConfiguracion() {
    if (!ultimaAsignacion) return
    setRelaciones(
      crearFilasRelacionActual(ultimaAsignacion, cuentasCatalogo, contratosCatalogo, true),
    )
    setAprobadores(crearFilasAprobadorActual(ultimaAsignacion))
    setPreviewReutilizar(false)
  }
  const [firmaInicialRelaciones] = useState(() =>
    firmaRelaciones(
      modo === "editar" && asignacion
        ? crearFilasRelacionActual(asignacion, cuentasCatalogo, contratosCatalogo)
        : [],
    ),
  )
  const [confirmarLimpieza, setConfirmarLimpieza] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pasoActual, setPasoActual] = useState(0)

  const crearMutation = useCrearAsignacionPersonalMutation()
  const modificarMutation = useModificarAsignacionPersonalMutation(asignacion?.id ?? 0)
  const reemplazarMutation = useReemplazarCuentasContratosMutation(asignacion?.id ?? 0)
  const { usuario } = useSesion()
  const pendiente =
    crearMutation.isPending || modificarMutation.isPending || reemplazarMutation.isPending

  const relacionVigente = asignacion
    ? asignacion.cuentasContratos.filter((item) => item.estado === "VIGENTE")
    : []
  const relacionCambio =
    modo === "crear" ||
    firmaRelaciones(relaciones) !== firmaInicialRelaciones ||
    firmaAprobadores(aprobadores) !== firmaInicialAprobadores
  const esPrimerPaso = pasoActual === 0
  const esUltimoPaso = pasoActual === PASOS_ASIGNACION.length - 1
  const paso = PASOS_ASIGNACION[pasoActual]
  const tipoTareoSeleccionado = tiposTareo.find((tipo) => String(tipo.id) === tipoTareoId)
  const configuracionLaboralSeleccionada = configuracionesLaborales.find(
    (config) => String(config.id) === configuracionLaboralId,
  )
  // Se ofrecen todos los tipos de horario activos; el regimen (administrativo /
  // operativo) lo trae cada configuracion y lo resuelve BC-01 al guardar.
  const tiposTareoFiltrados = tiposTareo

  function avanzarPaso() {
    setError(null)
    setPasoActual((actual) => Math.min(actual + 1, PASOS_ASIGNACION.length - 1))
  }

  function retrocederPaso() {
    setError(null)
    setPasoActual((actual) => Math.max(actual - 1, 0))
  }

  function irAPaso(index: number) {
    if (pendiente) return
    setError(null)
    setPasoActual(index)
  }

  function actualizarValor(
    key: CampoOrganizacion["key"],
    item: ConfiguracionGeneralOpcionResponse | null,
  ) {
    // Guardamos SIEMPRE el id como string: los <Select> (Radix) comparan valores
    // como texto y los filtros de la cascada usan String(item.x). Si guardaramos el
    // numero, el valor elegido no calzaria y el select quedaria vacio.
    setValores((prev) => ({ ...prev, [key]: item ? String(item.id) : "" }))
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
      (!valores.cargoId || !valores.sedeId || !valores.areaId)
    ) {
      setError("Selecciona sede, area y cargo.")
      return
    }

    if (modo === "editar" && valores.areaId && !valores.sedeId) {
      setError("Para cambiar el area tambien debes seleccionar la sede.")
      return
    }

    if (
      modo === "editar" &&
      relaciones.length === 0 &&
      relacionVigente.length > 0 &&
      relacionCambio &&
      !confirmarLimpieza
    ) {
      setError(
        "Confirma si deseas dejar la asignacion sin cuentas ni contratos, o vuelve a agregar una cuenta.",
      )
      return
    }

    const firmas = aprobadoresValidos(aprobadores, personalCatalogo)
    let resultadoRelacion: ResultadoRelacionContractual | null = null
    if (relaciones.length > 0) {
      resultadoRelacion = validarYConstruirCuentasContratos(
        relaciones,
        { vigenteDesde, vigenteHasta },
        contratosCatalogo,
        firmas,
      )

      if (!resultadoRelacion.ok) {
        setError(resultadoRelacion.error)
        return
      }
    } else if (modo === "crear") {
      setError("Agrega al menos una cuenta o un contrato.")
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
          jefeCodigo: jefeCodigo.trim() || undefined,
          jefeNombre: jefeNombre.trim() || undefined,
          tipoTareoId: tipoTareoId ? Number(tipoTareoId) : undefined,
          configuracionLaboralId: configuracionLaboralId
            ? Number(configuracionLaboralId)
            : undefined,
          vigenteDesde: fechaApi(vigenteDesde),
          vigenteHasta: vigenteHasta ? fechaApi(vigenteHasta) : undefined,
          usuarioId: usuario.nombreUsuario,
          cuentasContratos: resultadoRelacion?.ok ? resultadoRelacion.cuentasContratos : [],
        })
        onClose(true)
        return
      }

      // Como los campos arrancan preseleccionados al editar, comparamos contra el
      // valor inicial para enviar solo lo que cambio (y no marcar cambios falsos).
      const cargoCambio = valores.cargoId !== organizacionInicial.cargoId
      const sedeCambio = valores.sedeId !== organizacionInicial.sedeId
      const areaCambio = valores.areaId !== organizacionInicial.areaId
      const cambiaEstructura = sedeCambio || areaCambio
      const jefeCambio =
        jefeCodigo.trim() !== jefeCodigoInicial.trim() ||
        jefeNombre.trim() !== jefeNombreInicial.trim()
      const tipoTareoCambio = tipoTareoId !== tipoTareoInicial
      const configLaboralCambio = configuracionLaboralId !== configuracionLaboralInicial
      const tareoCambio = tipoTareoCambio || configLaboralCambio
      const vigenciaCambio =
        vigenteDesde !== soloFecha(asignacion?.vigenteDesde) ||
        vigenteHasta !== soloFecha(asignacion?.vigenteHasta)
      const datosLaboralesCambiaron =
        cargoCambio || cambiaEstructura || jefeCambio || tareoCambio || vigenciaCambio

      if (!datosLaboralesCambiaron && !relacionCambio) {
        setError("No hay cambios para guardar.")
        return
      }

      if (datosLaboralesCambiaron) {
        await modificarMutation.mutateAsync({
          ...(cargoCambio && valores.cargoId ? { cargoId: valores.cargoId } : {}),
          ...(cambiaEstructura
            ? {
                sedeId: valores.sedeId,
                areaId: valores.areaId || null,
              }
            : {}),
          ...(jefeCambio
            ? {
                jefeCodigo: jefeCodigo.trim() || null,
                jefeNombre: jefeNombre.trim() || null,
              }
            : {}),
          // `null` limpia el tareo; un id lo asigna. Solo se envia si cambio.
          ...(tipoTareoCambio
            ? { tipoTareoId: tipoTareoId ? Number(tipoTareoId) : null }
            : {}),
          ...(configLaboralCambio
            ? {
                configuracionLaboralId: configuracionLaboralId
                  ? Number(configuracionLaboralId)
                  : null,
              }
            : {}),
          vigenteDesde: fechaApi(vigenteDesde),
          vigenteHasta: vigenteHasta ? fechaApi(vigenteHasta) : null,
          usuarioId: usuario.nombreUsuario,
        })
      }

      if (relacionCambio) {
        await reemplazarMutation.mutateAsync({
          usuarioId: usuario.nombreUsuario,
          cuentasContratos: resultadoRelacion?.ok ? resultadoRelacion.cuentasContratos : [],
        })
      }

      onClose(true)
    } catch (err) {
      setError(obtenerMensajeError(err))
    }
  }

  return (
    <div className="rounded-xl border border-border bg-muted/10 p-4">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold">
            {modo === "crear" ? "Configurar nueva asignacion" : `Editar asignacion #${asignacion?.id}`}
          </h3>
          <p className="text-sm text-muted-foreground">
            Sigue el orden: cargo y vigencia, cuenta y contrato, horario de trabajo y, al final, quien aprueba.
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => onClose(false)} disabled={pendiente}>
          <X data-icon="inline-start" />
          Cerrar
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudo guardar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-4 rounded-lg border border-border bg-card p-3">
        <div className="flex flex-wrap gap-2">
          {PASOS_ASIGNACION.map((item, index) => {
            const activo = index === pasoActual
            const completado = index < pasoActual
            return (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  activo && "border-primary bg-primary text-primary-foreground",
                  completado && !activo && "border-primary/30 bg-primary/10 text-primary",
                  !activo && !completado && "border-border bg-background text-muted-foreground",
                )}
                onClick={() => irAPaso(index)}
                disabled={pendiente}
              >
                <span className="flex size-5 items-center justify-center rounded-full bg-background/80 text-[11px] text-foreground">
                  {index + 1}
                </span>
                {item.titulo}
              </button>
            )
          })}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Paso {pasoActual + 1} de {PASOS_ASIGNACION.length}: {paso.titulo}.
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {puedeReutilizar ? (
          <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Usar la ultima configuracion</p>
                <p className="text-xs text-muted-foreground">
                  Este personal ya tuvo una asignacion. Revisa como estaba y reutiliza sus cuentas
                  y contratos para no cargarlos de nuevo.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => setPreviewReutilizar((prev) => !prev)}
              >
                <History data-icon="inline-start" />
                {previewReutilizar ? "Ocultar" : "Ver ultima configuracion"}
              </Button>
            </div>

            {previewReutilizar && ultimaAsignacion ? (
              <div className="mt-3 flex flex-col gap-3 rounded-md border border-border bg-card p-3">
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Asi estaba la asignacion #{ultimaAsignacion.id} ({ultimaAsignacion.estado})
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Cargo", value: ultimaAsignacion.cargoNombre },
                    { label: "Sede", value: ultimaAsignacion.sedeNombre },
                    { label: "Area", value: ultimaAsignacion.areaNombre },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="mt-1 text-sm font-medium">{item.value || "Sin asignar"}</p>
                    </div>
                  ))}
                </div>
                {relacionesUltima.length > 0 ? (
                  <JerarquiaCuentasContratos items={relacionesUltima} />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No tenia cuentas ni contratos registrados.
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={usarUltimaConfiguracion}
                    disabled={relacionesUltima.length === 0}
                  >
                    Usar estas cuentas y contratos
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewReutilizar(false)}
                  >
                    Cerrar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  El cargo, la sede y el area los eliges abajo; el preview es solo de referencia.
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className={paso.id === "datos" ? "contents" : "hidden"}>
          <FormularioOrganizacion
            valores={valores}
            onChange={actualizarValor}
            habilitado
            catalogos={catalogosOrganizacion}
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

          <FieldSet className="rounded-lg border border-border p-4">
            <FieldLegend>Jefe o responsable</FieldLegend>
            <FieldDescription>
              Responsable directo del personal. Es un dato libre: BC-01 lo guarda tal cual (no se
              valida contra Configuracion General). El codigo es opcional.
            </FieldDescription>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Codigo del jefe</FieldLabel>
                <Input
                  value={jefeCodigo}
                  placeholder="Ej. SUP01"
                  onChange={(event) => setJefeCodigo(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Nombre del jefe</FieldLabel>
                <Input
                  value={jefeNombre}
                  placeholder="Ej. Supervisor de Operaciones"
                  onChange={(event) => setJefeNombre(event.target.value)}
                />
              </Field>
            </div>
          </FieldSet>
        </div>

        <FieldSet className={cn("rounded-lg border border-border p-4", paso.id !== "laboral" && "hidden")}>
          <FieldLegend>Horario de trabajo</FieldLegend>
          <FieldDescription>
            Define como trabaja la persona: por turno, por horario o por regimen. Primero elige el
            tipo y luego la configuracion correspondiente. Es opcional.
          </FieldDescription>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Tipo de horario</FieldLabel>
              <Select
                value={tipoTareoId || "__none"}
                onValueChange={(v) => {
                  setTipoTareoId(v === "__none" ? "" : v)
                  setConfiguracionLaboralId("")
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona tipo de horario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="__none">Sin asignar</SelectItem>
                    {tiposTareoFiltrados.map((tipo) => (
                      <SelectItem key={tipo.id} value={String(tipo.id)}>
                        {tipo.codigo} - {tipo.nombre}
                      </SelectItem>
                    ))}
                    {tiposTareoFiltrados.length === 0 ? (
                      <SelectItem value="__vacio" disabled>
                        No hay tipos de horario para este tipo de personal
                      </SelectItem>
                    ) : null}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Configuracion del horario</FieldLabel>
              <Select
                value={configuracionLaboralId || "__none"}
                disabled={!tipoTareoId}
                onValueChange={(v) =>
                  setConfiguracionLaboralId(v === "__none" ? "" : v)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      tipoTareoId
                        ? "Selecciona configuracion"
                        : "Primero elige un tipo de horario"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="__none">Sin asignar</SelectItem>
                    {configuracionesLaborales.map((config) => (
                      <SelectItem key={config.id} value={String(config.id)}>
                        {config.codigo} - {config.nombre}
                      </SelectItem>
                    ))}
                    {tipoTareoId &&
                    configuracionesLaborales.length === 0 &&
                    cargandoConfiguraciones ? (
                      <SelectItem value="__cargando" disabled>
                        Cargando configuraciones...
                      </SelectItem>
                    ) : null}
                    {tipoTareoId &&
                    configuracionesLaborales.length === 0 &&
                    !cargandoConfiguraciones ? (
                      <SelectItem value="__vacio" disabled>
                        No hay configuraciones de horario para este tipo
                      </SelectItem>
                    ) : null}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </div>

          {tipoTareoId &&
          configuracionesLaborales.length === 0 &&
          !cargandoConfiguraciones ? (
            <Alert className="mt-3">
              <AlertTitle>Este tipo de horario aun no tiene configuraciones</AlertTitle>
              <AlertDescription>
                La configuracion del horario (turno, horario o regimen, dias y horas) se crea en el
                catalogo de tareo. Crea una configuracion activa para este tipo y vuelve a esta
                pantalla.{" "}
                <Link
                  href="/socio-negocios/tareo"
                  target="_blank"
                  className="font-medium underline underline-offset-2"
                >
                  Abrir catalogo de tareo
                </Link>
              </AlertDescription>
            </Alert>
          ) : null}

          {configuracionLaboralSeleccionada ? (
            <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="mb-3">
                <p className="text-sm font-semibold">
                  {configuracionLaboralSeleccionada.codigo} - {configuracionLaboralSeleccionada.nombre}
                </p>
                <p className="text-xs text-muted-foreground">
                  Detalle que se copiara a la asignacion al guardar.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Turno", value: configuracionLaboralSeleccionada.turnoNombre },
                  { label: "Horario", value: configuracionLaboralSeleccionada.horarioNombre },
                  { label: "Hora entrada", value: configuracionLaboralSeleccionada.horaInicio },
                  { label: "Hora salida", value: configuracionLaboralSeleccionada.horaFin },
                  { label: "Regimen", value: configuracionLaboralSeleccionada.regimenNombre },
                  { label: "Patron", value: configuracionLaboralSeleccionada.regimenPatron },
                  {
                    label: "Dias trabajo",
                    value: configuracionLaboralSeleccionada.diasTrabajo?.toString(),
                  },
                  {
                    label: "Dias descanso",
                    value: configuracionLaboralSeleccionada.diasDescanso?.toString(),
                  },
                  {
                    label: "Horas por dia",
                    value: configuracionLaboralSeleccionada.horasPorDia?.toString(),
                  },
                  {
                    label: "Turno nocturno",
                    value: configuracionLaboralSeleccionada.esTurnoNocturno ? "Si" : "No",
                  },
                  {
                    label: "Horas extra",
                    value: configuracionLaboralSeleccionada.permiteHorasExtra ? "Permite" : "No permite",
                  },
                  {
                    label: "Trabajo feriado",
                    value: configuracionLaboralSeleccionada.permiteTrabajoFeriado
                      ? "Permite"
                      : "No permite",
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-md border border-border bg-card p-3">
                    <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm font-semibold">{item.value || "-"}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : tipoTareoId ? (
            <Alert>
              <AlertTitle>Elige la configuracion del horario</AlertTitle>
              <AlertDescription>
                Ya elegiste el tipo. Ahora elige la configuracion, que tiene el detalle de horario,
                turno, regimen, dias y horas.
              </AlertDescription>
            </Alert>
          ) : null}
        </FieldSet>

        <FieldSet className={cn("rounded-lg border border-border p-4", paso.id !== "cuentas" && "hidden")}>
          <FieldLegend>{modo === "editar" ? "Editar cuenta y contrato" : "Cuenta y contrato"}</FieldLegend>
          <FieldDescription>
            Agrega las cuentas y contratos de la persona. Lo que dejes aqui al guardar reemplaza las
            cuentas y contratos actuales.
          </FieldDescription>

          <EditorRelacionContractual
            filas={relaciones}
            onChange={setRelaciones}
            cuentasCatalogo={cuentasCatalogo}
            contratosCatalogo={contratosCatalogo}
          />

          {modo === "editar" && relacionVigente.length > 0 && relaciones.length === 0 ? (
            <Field orientation="horizontal">
              <input
                id={`confirmar-limpieza-${asignacion?.id}`}
                type="checkbox"
                checked={confirmarLimpieza}
                onChange={(event) => setConfirmarLimpieza(event.target.checked)}
              />
              <FieldLabel htmlFor={`confirmar-limpieza-${asignacion?.id}`}>
                Confirmo que la asignacion quedara sin cuentas ni contratos
              </FieldLabel>
            </Field>
          ) : null}
        </FieldSet>

        <FieldSet className={cn("rounded-lg border border-border p-4", paso.id !== "aprobadores" && "hidden")}>
          <FieldLegend>Quien aprueba</FieldLegend>
          <FieldDescription>
            Indica quien debe aprobar las cuentas y contratos. Aprueban en el orden en que los
            agregas, y la misma lista se aplica a todas las cuentas y contratos.
          </FieldDescription>

          <EditorAprobadores
            filas={aprobadores}
            onChange={setAprobadores}
            personalCatalogo={personalCatalogo}
            cargandoPersonal={personalQuery.isLoading}
          />
        </FieldSet>

        <FieldSet className={cn("rounded-lg border border-border p-4", paso.id !== "datos" && "hidden")}>
          <FieldLegend>Vigencia en la posicion</FieldLegend>
          <FieldDescription>
            Indica desde cuando empieza a operar en este cargo, con su contrato, en esa area y esa
            sede. Es la fecha que responde &quot;desde cuando inicio en esta asignacion&quot;.
          </FieldDescription>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Inicio en la posicion *</FieldLabel>
              <Input
                type="date"
                value={vigenteDesde}
                onChange={(event) => setVigenteDesde(event.target.value)}
              />
              <FieldDescription>
                Desde cuando opera en este cargo, con su contrato, area y sede.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel>Fin de la posicion</FieldLabel>
              <Input
                type="date"
                value={vigenteHasta}
                min={vigenteDesde || undefined}
                onChange={(event) => setVigenteHasta(event.target.value)}
              />
              <FieldDescription>Dejalo vacio si continua vigente.</FieldDescription>
            </Field>
          </div>
        </FieldSet>

        <FieldSet className={cn("rounded-lg border border-border p-4", paso.id !== "confirmacion" && "hidden")}>
          <FieldLegend>Confirmacion</FieldLegend>
          <FieldDescription>
            Revisa que todo este correcto antes de guardar la asignacion.
          </FieldDescription>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {[
              {
                label: "Cargo",
                value: nombreOpcionSeleccionada(
                  valores.cargoId,
                  catalogosOrganizacion.cargos,
                  asignacion?.cargoNombre,
                ),
              },
              {
                label: "Sede",
                value: nombreOpcionSeleccionada(
                  valores.sedeId,
                  catalogosOrganizacion.sedes,
                  asignacion?.sedeNombre,
                ),
              },
              {
                label: "Area",
                value: nombreOpcionSeleccionada(
                  valores.areaId,
                  catalogosOrganizacion.areas,
                  asignacion?.areaNombre,
                ),
              },
              { label: "Cuentas", value: `${relaciones.filter((item) => item.cuenta).length}` },
              {
                label: "Contratos",
                value: `${relaciones.filter((item) => item.contrato).length}`,
              },
              { label: "Aprobadores", value: `${aprobadoresValidos(aprobadores, personalCatalogo).length}` },
              { label: "Tipo de horario", value: tipoTareoSeleccionado?.nombre || "Sin asignar" },
              {
                label: "Configuracion del horario",
                value: configuracionLaboralSeleccionada?.nombre || "Sin asignar",
              },
              { label: "Disponibilidad", value: "Disponible" },
              { label: "Inicio", value: vigenteDesde || "Pendiente" },
              { label: "Fin", value: vigenteHasta || "Sin fecha fin" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-border bg-background p-3">
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-1 text-sm font-semibold">{item.value || "Sin definir"}</p>
              </div>
            ))}
          </div>
        </FieldSet>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={retrocederPaso} disabled={pendiente || esPrimerPaso}>
            Anterior
          </Button>
          {esUltimoPaso ? (
            <Button type="button" onClick={() => void guardar()} disabled={pendiente}>
              {pendiente ? "Guardando..." : modo === "crear" ? "Crear asignacion" : "Guardar cambios"}
            </Button>
          ) : (
            <Button type="button" onClick={avanzarPaso} disabled={pendiente}>
              Siguiente
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => onClose(false)} disabled={pendiente}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  )
}

function AsignacionFormulario({
  modo,
  asignacion,
  personalId,
  ultimaAsignacion,
  onClose,
}: {
  modo: "crear" | "editar"
  asignacion?: AsignacionPersonalResponse
  personalId: string | number
  ultimaAsignacion?: AsignacionPersonalResponse
  onClose: (actualizado: boolean) => void
}) {
  // Una sola llamada trae cargos, sedes, areas, cuentas, contratos, tipos de
  // tareo, configuraciones laborales y catalogos de disponibilidad. Reemplaza el
  // patron anterior de pedir combo por combo a Configuracion General.
  const opcionesQuery = useOpcionesFormularioAsignacionQuery()
  const asignacionDetalleQuery = useAsignacionPersonalQuery(
    asignacion?.id ?? "",
    modo === "editar" && Boolean(asignacion?.id),
  )

  const cargando = opcionesQuery.isLoading || asignacionDetalleQuery.isLoading
  const errorCarga = opcionesQuery.error
  const opciones = opcionesQuery.data
  const asignacionEfectiva = asignacionDetalleQuery.data ?? asignacion

  if (cargando) {
    return (
      <div className="rounded-xl border border-border p-4">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    )
  }

  if (errorCarga || !opciones) {
    return (
      <Alert variant="destructive">
        <AlertTitle>No se pudo preparar el formulario</AlertTitle>
        <AlertDescription>
          {errorCarga
            ? obtenerMensajeError(errorCarga)
            : "No se pudieron cargar las opciones del formulario."}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <AsignacionFormularioContenido
      modo={modo}
      asignacion={asignacionEfectiva}
      personalId={personalId}
      ultimaAsignacion={ultimaAsignacion}
      cuentasCatalogo={opciones.cuentas}
      contratosCatalogo={opciones.contratos}
      catalogosOrganizacion={{
        cargos: opciones.cargos,
        sedes: opciones.sedes,
        areas: opciones.areas,
      }}
      tiposTareo={opciones.tiposTareo}
      configuracionesLaboralesCatalogo={opciones.configuracionesLaborales}
      onClose={onClose}
    />
  )
}

const ETIQUETAS_HISTORIAL_ASIGNACION = {
  ASIGNACION_CREADA: "Asignacion creada",
  ASIGNACION_MODIFICADA: "Cargo, ubicacion o vigencia modificados",
  CUENTAS_CONTRATOS_REEMPLAZADOS: "Cuentas y contrato cambiados",
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
          Revisa cambios de cargo, ubicacion, vigencia, cuentas y contrato.
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
  const puedeEditar = !soloLectura && asignacion.estado === "VIGENTE"
  const [editorAbierto, setEditorAbierto] = useState(puedeEditar)
  const [confirmarAnulacion, setConfirmarAnulacion] = useState(false)
  const [errorAnulacion, setErrorAnulacion] = useState<string | null>(null)
  const [historialAbierto, setHistorialAbierto] = useState(false)
  const relacionVigente = asignacion.cuentasContratos.filter((item) => item.estado === "VIGENTE")
  const noVigente = asignacion.estado !== "VIGENTE"
  const { usuario } = useSesion()
  const anularMutation = useModificarAsignacionPersonalMutation(asignacion.id, {
    onSuccess: onActualizado,
  })

  function cerrarEditor(actualizado: boolean) {
    if (actualizado) {
      onActualizado()
    } else {
      setEditorAbierto(false)
    }
  }

  async function anularAsignacion() {
    if (!usuario?.nombreUsuario) {
      setErrorAnulacion("No se pudo identificar al usuario de la sesion.")
      return
    }

    try {
      setErrorAnulacion(null)
      await anularMutation.mutateAsync({
        estado: "ANULADA",
        vigenteHasta: new Date().toISOString(),
        usuarioId: usuario.nombreUsuario,
      })
      setConfirmarAnulacion(false)
    } catch (error) {
      setErrorAnulacion(obtenerMensajeError(error))
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
          <EstadoBadge estado={asignacion.estado} />
        </div>
        <div className="flex flex-wrap gap-2">
          {puedeEditar ? (
            <Button size="sm" variant="outline" onClick={() => setEditorAbierto((prev) => !prev)}>
              <Pencil data-icon="inline-start" />
              {editorAbierto ? "Ocultar edicion" : "Modificar asignacion"}
            </Button>
          ) : null}
          {puedeEditar ? (
            <Button size="sm" variant="outline" onClick={() => setConfirmarAnulacion(true)}>
              <ArchiveX data-icon="inline-start" />
              Anular asignacion
            </Button>
          ) : null}
          <Button size="sm" variant="outline" onClick={() => setHistorialAbierto(true)}>
            <History data-icon="inline-start" />
            Ver historial
          </Button>
        </div>
      </div>

      <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Cargo", value: asignacion.cargoNombre },
          { label: "Sede", value: asignacion.sedeNombre },
          { label: "Area", value: asignacion.areaNombre },
          { label: "Jefe", value: asignacion.jefeNombre },
          { label: "Tipo de horario", value: asignacion.tipoTareoNombre },
          {
            label: "Configuracion del horario",
            value:
              asignacion.configuracionLaboralNombre ??
              asignacion.regimenNombre ??
              asignacion.horarioNombre ??
              asignacion.turnoNombre,
          },
          {
            label: "En la posicion desde",
            value: `${formatearFecha(asignacion.vigenteDesde)}${
              asignacion.vigenteHasta ? ` - ${formatearFecha(asignacion.vigenteHasta)}` : " - actual"
            }`,
          },
        ].map((dato) => (
          <div key={dato.label} className="bg-card p-3">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {dato.label}
            </p>
            <p className="mt-1 truncate text-sm font-medium">{dato.value || "-"}</p>
          </div>
        ))}
      </div>

      {soloLectura || !editorAbierto ? (
        <div className="border-t border-border px-4 py-4">
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">Cuenta y contrato asignado</p>
              <p className="text-xs text-muted-foreground">
                Cada cuenta puede tener un contrato asociado de forma opcional.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={relacionVigente.length > 0 ? "secondary" : "outline"}>
                {relacionVigente.length > 0 ? "Asignado" : "Sin asignar"}
              </Badge>
              {puedeEditar ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setEditorAbierto(true)}
                >
                  <Pencil data-icon="inline-start" />
                  Modificar cuenta/contrato
                </Button>
              ) : null}
            </div>
          </div>

          {relacionVigente.length > 0 ? (
            <JerarquiaCuentasContratos items={relacionVigente} />
          ) : (
            <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              Esta asignacion todavia no tiene cuentas registradas.
            </div>
          )}
        </div>
      ) : null}

      {puedeEditar && editorAbierto ? (
        <div className="border-t border-border p-4">
          <AsignacionFormulario
            key={`editar-${asignacion.id}-${asignacion.fechaModificacion}`}
            modo="editar"
            asignacion={asignacion}
            personalId={asignacion.personalId}
            onClose={cerrarEditor}
          />
        </div>
      ) : null}

      {!editorAbierto ? (
        <AprobacionesCuentasContratosSeccion
          asignacion={asignacion}
          soloLectura={soloLectura || noVigente}
          onActualizado={onActualizado}
        />
      ) : null}

      <Dialog open={historialAbierto} onOpenChange={setHistorialAbierto}>
        {historialAbierto ? (
          <HistorialAsignacionDialog
            asignacion={asignacion}
            onClose={() => setHistorialAbierto(false)}
          />
        ) : null}
      </Dialog>

      <AlertDialog open={confirmarAnulacion} onOpenChange={setConfirmarAnulacion}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anular asignacion vigente</AlertDialogTitle>
            <AlertDialogDescription>
              Usa esta accion solo si la asignacion fue creada por error. La asignacion quedara
              anulada, se conservara en el historial y el personal podra recibir una nueva
              asignacion vigente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {errorAnulacion ? (
            <Alert variant="destructive">
              <AlertTitle>No se pudo anular</AlertTitle>
              <AlertDescription>{errorAnulacion}</AlertDescription>
            </Alert>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={anularMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={anularMutation.isPending}
              onClick={(event) => {
                event.preventDefault()
                void anularAsignacion()
              }}
            >
              {anularMutation.isPending ? "Anulando..." : "Anular asignacion"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export function AsignacionesPersonalSeccion({
  personalId,
  titulo = "Asignaciones, cuentas y contratos",
  descripcion = "Asignaciones de cargo, estructura organizacional, cuentas y contratos del personal.",
  permitirCrear = true,
  soloLectura = false,
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
  // Regla de negocio: un PERSONAL solo puede tener UNA asignacion VIGENTE
  // (unicidad por personal_id en el backend). Si ya tiene una vigente, la via es
  // editar la existente, no crear otra. Las cuentas/contratos sí son varios,
  // pero viven dentro de esa única asignación.
  const asignacionVigente = asignaciones.find((item) => item.estado === "VIGENTE")
  const asignacionesHistoricas = asignaciones.filter((item) => item.estado !== "VIGENTE")
  const yaTieneAsignacion = Boolean(asignacionVigente)
  const puedeCrear = permitirCrear && !soloLectura && !yaTieneAsignacion
  // Para reutilizar: la asignacion mas reciente (aunque ya no este vigente)
  // sirve como plantilla al crear una nueva.
  const ultimaAsignacion =
    asignaciones.length > 0
      ? [...asignaciones].sort((a, b) =>
          (b.fechaModificacion ?? b.fechaCreacion).localeCompare(
            a.fechaModificacion ?? a.fechaCreacion,
          ),
        )[0]
      : undefined
  const descripcionVacia =
    vacioDescripcion ?? "No hay asignaciones registradas para este personal."

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
        {puedeCrear ? (
          <Button size="sm" onClick={() => setCrearAbierto(true)} disabled={crearAbierto}>
            <Plus data-icon="inline-start" />
            Crear asignacion
          </Button>
        ) : permitirCrear && yaTieneAsignacion ? (
          <Badge variant="outline">Asignacion vigente · modifica la existente</Badge>
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
        ) : (
          <>
            {crearAbierto ? (
              <AsignacionFormulario
                modo="crear"
                personalId={personalId}
                ultimaAsignacion={ultimaAsignacion}
                onClose={cerrarCrear}
              />
            ) : null}

            {asignacionVigente ? (
              <AsignacionCard
                key={asignacionVigente.id}
                asignacion={asignacionVigente}
                onActualizado={() => void asignacionesQuery.refetch()}
                soloLectura={soloLectura}
              />
            ) : !crearAbierto ? (
              <Empty className="py-10">
                <EmptyHeader>
                  <EmptyTitle>Sin asignacion vigente</EmptyTitle>
                  <EmptyDescription>{descripcionVacia}</EmptyDescription>
                </EmptyHeader>
                {puedeCrear ? (
                  <Button size="sm" onClick={() => setCrearAbierto(true)}>
                    <Plus data-icon="inline-start" />
                    Crear asignacion
                  </Button>
                ) : null}
              </Empty>
            ) : null}

            {asignacionesHistoricas.length > 0 ? (
              <Alert>
                <AlertTitle>Asignaciones anteriores</AlertTitle>
                <AlertDescription>
                  Este personal tiene {asignacionesHistoricas.length} asignacion(es) finalizada(s) o
                  anulada(s). No se muestran como configuracion actual y no bloquean crear una nueva
                  asignacion vigente.
                </AlertDescription>
              </Alert>
            ) : null}
          </>
        )}
      </div>
    </section>
  )
}
