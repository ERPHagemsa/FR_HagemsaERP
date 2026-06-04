"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/compartido/componentes/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select"
import { cn } from "@/compartido/utilidades/utils"

function rango(inicio: number, fin: number): number[] {
  const largo = fin - inicio + 1
  return largo > 0 ? Array.from({ length: largo }, (_, i) => inicio + i) : []
}

// Calcula los items a mostrar: numeros de pagina + "elipsis" donde hay saltos.
// Siempre incluye la primera y la ultima pagina, mas una ventana de hermanos
// alrededor de la actual. (Algoritmo estilo MUI usePagination.)
function calcularItems(
  pagina: number,
  total: number,
  hermanos = 1,
  bordes = 1,
): Array<number | "elipsis"> {
  const paginasInicio = rango(1, Math.min(bordes, total))
  const paginasFin = rango(Math.max(total - bordes + 1, bordes + 1), total)

  const inicioHermanos = Math.max(
    Math.min(pagina - hermanos, total - bordes - hermanos * 2 - 1),
    bordes + 2,
  )
  const finHermanos = Math.min(
    Math.max(pagina + hermanos, bordes + hermanos * 2 + 2),
    paginasFin.length > 0 ? paginasFin[0] - 2 : total - 1,
  )

  return [
    ...paginasInicio,
    ...(inicioHermanos > bordes + 2
      ? (["elipsis"] as const)
      : bordes + 1 < total - bordes
        ? [bordes + 1]
        : []),
    ...rango(inicioHermanos, finHermanos),
    ...(finHermanos < total - bordes - 1
      ? (["elipsis"] as const)
      : total - bordes > bordes
        ? [total - bordes]
        : []),
    ...paginasFin,
  ]
}

interface PropsPaginacionTabla {
  pagina: number
  totalPaginas: number
  onCambiar: (pagina: number) => void
  className?: string
}

export function PaginacionTabla({
  pagina,
  totalPaginas,
  onCambiar,
  className,
}: PropsPaginacionTabla) {
  if (totalPaginas <= 1) return null

  const items = calcularItems(pagina, totalPaginas)

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Página anterior"
        onClick={() => onCambiar(pagina - 1)}
        disabled={pagina <= 1}
        className="rounded-none"
      >
        <ChevronLeft />
      </Button>

      {items.map((item, i) =>
        item === "elipsis" ? (
          <span
            key={`elipsis-${i}`}
            className="px-1 text-sm text-muted-foreground select-none"
            aria-hidden
          >
            …
          </span>
        ) : (
          <Button
            key={item}
            variant={item === pagina ? "outline" : "ghost"}
            size="icon-sm"
            aria-label={`Página ${item}`}
            aria-current={item === pagina ? "page" : undefined}
            onClick={() => onCambiar(item)}
            className={cn(
              "rounded-none tabular-nums",
              item === pagina && "pointer-events-none font-medium",
            )}
          >
            {item}
          </Button>
        ),
      )}

      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Página siguiente"
        onClick={() => onCambiar(pagina + 1)}
        disabled={pagina >= totalPaginas}
        className="rounded-none"
      >
        <ChevronRight />
      </Button>
    </div>
  )
}

const OPCIONES_TAMANO = [10, 20, 50, 100]

interface PropsPiePaginacion {
  pagina: number
  limite: number
  total: number
  onPagina: (pagina: number) => void
  onLimite: (limite: number) => void
  opciones?: number[]
}

// Pie de tabla completo: selector de filas por pagina + rango "Mostrando X–Y de
// N" + navegacion numerada. Se renderiza siempre que haya resultados (el selector
// sigue disponible aunque haya una sola pagina).
export function PiePaginacion({
  pagina,
  limite,
  total,
  onPagina,
  onLimite,
  opciones = OPCIONES_TAMANO,
}: PropsPiePaginacion) {
  const totalPaginas = Math.max(1, Math.ceil(total / limite))
  const desde = total === 0 ? 0 : (pagina - 1) * limite + 1
  const hasta = Math.min(pagina * limite, total)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Filas por página</span>
          <Select
            value={String(limite)}
            onValueChange={(v) => onLimite(Number(v))}
          >
            <SelectTrigger size="sm" className="w-[4.25rem] rounded-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              {opciones.map((o) => (
                <SelectItem key={o} value={String(o)}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground tabular-nums">
          Mostrando {desde}–{hasta} de {total}
        </p>
      </div>

      <PaginacionTabla
        pagina={pagina}
        totalPaginas={totalPaginas}
        onCambiar={onPagina}
      />
    </div>
  )
}
