"use client"

import { useCallback, useEffect, useRef, useState } from "react"

// Hook generico para consultas asincronas (reemplaza useQuery de TanStack).
//
// USO:
//   const { data, isLoading, isError, error, refetch } = useConsulta(
//     () => obtenerCuentas(query),
//     [query.estado, query.busqueda, ...],
//     { enabled: Boolean(cuentaId) },
//   )
//
// Caracteristicas:
//   - Cancela la request anterior si las deps cambian o el componente se desmonta.
//   - Expone refetch() para forzar una recarga manual. Devuelve { data, error }
//     con el resultado de esa recarga (similar a refetch() de TanStack).
//   - Soporta `enabled: false` para no disparar la query.
//   - NO tiene cache compartido entre hooks (a diferencia de TanStack). Cada
//     instancia es independiente.

export interface ResultadoRefetch<T> {
  readonly data: T | null
  readonly error: unknown
}

export interface ResultadoConsulta<T> {
  readonly data: T | null
  readonly isLoading: boolean
  readonly isFetching: boolean
  readonly isError: boolean
  readonly isSuccess: boolean
  readonly error: unknown
  readonly refetch: () => Promise<ResultadoRefetch<T>>
}

export interface OpcionesConsulta {
  readonly enabled?: boolean
}

export function useConsulta<T>(
  fn: () => Promise<T>,
  deps: ReadonlyArray<unknown>,
  opciones: OpcionesConsulta = {},
): ResultadoConsulta<T> {
  const { enabled = true } = opciones

  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(enabled)
  const [error, setError] = useState<unknown>(null)

  const fnRef = useRef(fn)
  fnRef.current = fn

  const generacionRef = useRef(0)

  const ejecutar = useCallback(async (): Promise<ResultadoRefetch<T>> => {
    const generacion = ++generacionRef.current
    setIsLoading(true)
    setError(null)
    try {
      const resultado = await fnRef.current()
      if (generacionRef.current === generacion) {
        setData(resultado)
      }
      return { data: resultado, error: null }
    } catch (err) {
      if (generacionRef.current === generacion) {
        setError(err)
      }
      return { data: null, error: err }
    } finally {
      if (generacionRef.current === generacion) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false)
      return
    }
    void ejecutar()
    return () => {
      generacionRef.current++
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps])

  return {
    data,
    isLoading,
    isFetching: isLoading,
    isError: error !== null,
    isSuccess: error === null && data !== null,
    error,
    refetch: ejecutar,
  }
}
