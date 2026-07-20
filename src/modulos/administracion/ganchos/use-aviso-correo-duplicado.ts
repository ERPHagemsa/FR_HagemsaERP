"use client"

import { useEffect, useState } from "react"

import { cuentasConEseCorreo } from "../servicios/cuentas-api"
import type { CuentaResponse } from "../tipos/administracion.tipos"

// Se espera a que deje de tipear antes de consultar, para no pegarle al backend
// en cada tecla.
const RETARDO_MS = 500

export interface AvisoCorreoDuplicado {
  readonly cuentas: ReadonlyArray<CuentaResponse>
  readonly consultando: boolean
}

/**
 * Avisa si el correo ya lo usa otra cuenta. Es informativo, NO bloquea: el
 * correo dejo de ser unico y varias cuentas pueden compartir casilla a
 * proposito. Sirve para que quien administra lo note y decida.
 *
 * `excluyendoId` evita que una cuenta se reporte a si misma al editarla.
 */
export function useAvisoCorreoDuplicado(
  email: string,
  excluyendoId?: string,
): AvisoCorreoDuplicado {
  const [cuentas, setCuentas] = useState<ReadonlyArray<CuentaResponse>>([])
  const [consultando, setConsultando] = useState(false)

  useEffect(() => {
    const buscado = email.trim()
    // Sin forma de correo no tiene sentido consultar: ahorra llamadas mientras
    // se escribe la direccion.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buscado)) {
      setCuentas([])
      setConsultando(false)
      return
    }

    // `vigente` descarta la respuesta si el correo cambio mientras iba en vuelo,
    // asi un resultado viejo no pisa al nuevo.
    let vigente = true
    setConsultando(true)
    const temporizador = setTimeout(() => {
      cuentasConEseCorreo(buscado, excluyendoId)
        .then((r) => {
          if (vigente) setCuentas(r)
        })
        .catch(() => {
          // Si la consulta falla se omite el aviso: es una ayuda, no una
          // validacion, y no debe entorpecer el alta o la edicion.
          if (vigente) setCuentas([])
        })
        .finally(() => {
          if (vigente) setConsultando(false)
        })
    }, RETARDO_MS)

    return () => {
      vigente = false
      clearTimeout(temporizador)
    }
  }, [email, excluyendoId])

  return { cuentas, consultando }
}
