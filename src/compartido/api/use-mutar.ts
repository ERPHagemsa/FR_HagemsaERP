"use client"

import { useCallback, useRef, useState } from "react"

// Hook generico para mutaciones asincronas (reemplaza useMutation de TanStack).
//
// USO:
//   const crear = useMutar<CrearCuentaPayload, CrearCuentaResponse>({
//     fn: (payload) => crearCuenta(payload),
//     onSuccess: (data) => {
//       toast.success("Creado")
//       cuentasQuery.refetch()
//     },
//   })
//
//   await crear.mutateAsync(payload)
//   // o sin await:
//   crear.mutate(payload)
//
// Diferencia con TanStack: no hay invalidacion automatica de queries. Si la
// mutacion afecta a una consulta abierta, el consumer debe llamar refetch()
// dentro del onSuccess.

export interface OpcionesMutar<TInput, TOutput> {
  readonly fn: (input: TInput) => Promise<TOutput>
  readonly onSuccess?: (data: TOutput, input: TInput) => unknown
  readonly onError?: (error: unknown, input: TInput) => void
}

export interface ResultadoMutar<TInput, TOutput> {
  readonly mutateAsync: (input: TInput) => Promise<TOutput>
  readonly mutate: (input: TInput) => void
  readonly isPending: boolean
  readonly isSuccess: boolean
  readonly isError: boolean
  readonly error: unknown
  readonly data: TOutput | null
  readonly reset: () => void
}

export function useMutar<TInput, TOutput>(
  opciones: OpcionesMutar<TInput, TOutput>,
): ResultadoMutar<TInput, TOutput> {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [data, setData] = useState<TOutput | null>(null)

  const opcionesRef = useRef(opciones)
  opcionesRef.current = opciones

  const mutateAsync = useCallback(async (input: TInput): Promise<TOutput> => {
    setIsPending(true)
    setError(null)
    try {
      const resultado = await opcionesRef.current.fn(input)
      setData(resultado)
      try {
        await Promise.resolve(
          opcionesRef.current.onSuccess?.(resultado, input),
        )
      } catch (errorOnSuccess) {
        // No bloqueamos al consumer si el onSuccess (callback de side-effect)
        // tira excepcion. La mutacion fue exitosa igual. Pero loggeamos para
        // no perder visibilidad de bugs en el callback.
        console.warn("useMutar: onSuccess callback failed", errorOnSuccess)
      }
      return resultado
    } catch (err) {
      setError(err)
      opcionesRef.current.onError?.(err, input)
      throw err
    } finally {
      setIsPending(false)
    }
  }, [])

  const mutate = useCallback(
    (input: TInput) => {
      void mutateAsync(input).catch(() => {
        // El error ya quedo en state via onError; evitamos un unhandled rejection.
      })
    },
    [mutateAsync],
  )

  const reset = useCallback(() => {
    setError(null)
    setIsPending(false)
    setData(null)
  }, [])

  return {
    mutateAsync,
    mutate,
    isPending,
    isSuccess: data !== null && error === null,
    isError: error !== null,
    error,
    data,
    reset,
  }
}
