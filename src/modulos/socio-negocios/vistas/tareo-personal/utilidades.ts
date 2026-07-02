// Helpers y constantes del catalogo de tareo (tipos de tareo y configuraciones
// laborales). Extraidos de tareo-personal-vista.tsx.

import { ApiError } from "@/compartido/api/axios"

import type { FormaTareo, TipoRegimenPersonal } from "../../tipos/tareo-personal"

export const FORMAS_TAREO: Array<{ value: FormaTareo; label: string }> = [
  { value: "POR_TURNO", label: "Por turno" },
  { value: "POR_HORARIO", label: "Por horario" },
  { value: "POR_REGIMEN", label: "Por regimen" },
]

export const TIPOS_REGIMEN: Array<{ value: TipoRegimenPersonal; label: string }> = [
  { value: "ADMINISTRATIVO", label: "Administrativo" },
  { value: "OPERATIVO", label: "Operativo" },
]

export function etiquetaForma(forma: FormaTareo) {
  return FORMAS_TAREO.find((item) => item.value === forma)?.label ?? forma
}

export function obtenerMensajeError(error: unknown) {
  if (error instanceof ApiError) {
    const mensajes = error.errores?.map((item) => item.mensaje).filter(Boolean)
    if (mensajes?.length) return mensajes.join(" ")
  }
  if (error instanceof Error) return error.message
  return "No se pudo completar la operacion."
}

export function formatearFecha(fecha?: string | null) {
  if (!fecha) return "-"
  const valor = new Date(fecha)
  if (Number.isNaN(valor.getTime())) return fecha
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "short", timeStyle: "short" }).format(valor)
}

export function soloFecha(fecha?: string | null) {
  if (!fecha) return ""
  return String(fecha).slice(0, 10)
}

export function fechaApi(fecha: string) {
  return new Date(`${fecha}T00:00:00.000Z`).toISOString()
}
