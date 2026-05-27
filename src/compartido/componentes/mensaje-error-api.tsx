"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert01Icon, Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons"

import {
  esErrorRed,
  esErrorTimeout,
  obtenerCodigoError,
  obtenerErroresCampo,
  obtenerStatusError,
  obtenerTituloError,
  obtenerTrazaId,
} from "@/compartido/api"
import { ApiError } from "@/compartido/api/axios"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/compartido/componentes/ui/alert"
import { Button } from "@/compartido/componentes/ui/button"

// Componente reutilizable para pintar cualquier error de la API que sigue el
// formato de error estandar del backend. Recibe el `error` thrown por un catch (o el `error` que
// devuelve useConsulta/useMutar) y renderiza:
//
//   - Titulo: el `titulo` del backend o fallback amistoso por status.
//   - Detalle: el `detalle` del backend (mensaje para el usuario).
//   - Lista de errores por campo si los hay (validacion 422).
//   - trazaId con boton "Copiar" para reportar a soporte.
//
// Si el error no es del contrato (ej. fallo de red), igual muestra algo util.
//
// USO:
//   const { error } = useConsulta(...)
//   if (error) return <MensajeErrorApi error={error} />
//
//   // o en un catch:
//   catch (err) { setErrorEnPantalla(err) }
//   {errorEnPantalla ? <MensajeErrorApi error={errorEnPantalla} /> : null}

interface MensajeErrorApiProps {
  readonly error: unknown
  // Mensaje a mostrar si el error no trae titulo ni detalle (fallback de UX).
  readonly fallback?: string
  // Si false, no muestra trazaId ni codigo (modo compacto para inline forms).
  readonly mostrarDetallesTecnicos?: boolean
  readonly className?: string
}

function tituloFallback(err: unknown): string {
  if (esErrorRed(err)) return "Sin conexion al servidor"
  if (esErrorTimeout(err)) return "La operacion tardo demasiado"
  const status = obtenerStatusError(err)
  if (status === 401) return "Sesion no iniciada"
  if (status === 403) return "Acceso denegado"
  if (status === 404) return "Recurso no encontrado"
  if (status === 409) return "Conflicto"
  if (status === 422) return "Datos invalidos"
  if (status === 429) return "Demasiadas peticiones"
  if (status && status >= 500) return "Error del servidor"
  return "Algo salio mal"
}

function detalleFallback(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.detalle) return err.detalle
  if (err instanceof Error && err.message) return err.message
  return fallback
}

export function MensajeErrorApi({
  error,
  fallback = "Ocurrio un error inesperado.",
  mostrarDetallesTecnicos = true,
  className,
}: MensajeErrorApiProps) {
  const [copiado, setCopiado] = useState(false)

  const titulo = obtenerTituloError(error) ?? tituloFallback(error)
  const detalle = detalleFallback(error, fallback)
  const erroresCampo = obtenerErroresCampo(error)
  const trazaId = obtenerTrazaId(error)
  const codigo = obtenerCodigoError(error)

  async function copiarTraza() {
    if (!trazaId) return
    try {
      await navigator.clipboard.writeText(trazaId)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // Si el clipboard falla (permiso denegado), no rompemos la UI.
    }
  }

  return (
    <Alert variant="destructive" className={className}>
      <HugeiconsIcon icon={Alert01Icon} strokeWidth={2} />
      <AlertTitle>{titulo}</AlertTitle>
      <AlertDescription>
        <p>{detalle}</p>

        {erroresCampo && erroresCampo.length > 0 ? (
          <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs">
            {erroresCampo.map((item, idx) => (
              <li key={`${item.campo}-${idx}`}>
                <span className="font-medium">{item.campo}</span>: {item.mensaje}
              </li>
            ))}
          </ul>
        ) : null}

        {mostrarDetallesTecnicos && (codigo || trazaId) ? (
          <div className="mt-3 flex flex-col gap-1 border-t border-destructive/20 pt-2 text-xs text-muted-foreground">
            {codigo ? (
              <span>
                Codigo: <code className="font-mono">{codigo}</code>
              </span>
            ) : null}
            {trazaId ? (
              <div className="flex items-center gap-1.5">
                <span>
                  ID de soporte: <code className="font-mono">{trazaId}</code>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-5"
                  onClick={() => void copiarTraza()}
                  title="Copiar ID de soporte"
                >
                  <HugeiconsIcon
                    icon={copiado ? Tick02Icon : Copy01Icon}
                    strokeWidth={2}
                    className="size-3"
                  />
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </AlertDescription>
    </Alert>
  )
}
