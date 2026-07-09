"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react"

import { cn } from "@/compartido/utilidades/utils"
import { Button } from "./button"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { ScrollArea } from "./scroll-area"

export interface OpcionCombobox {
  valor: string
  etiqueta: string
}

interface ComboboxProps {
  opciones: OpcionCombobox[]
  valor: string
  onValorChange: (valor: string) => void
  placeholder?: string
  placeholderBusqueda?: string
  textoVacio?: string
  disabled?: boolean
  cargando?: boolean
  className?: string
}

// Normaliza para buscar sin importar acentos ni mayúsculas.
function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
}

/**
 * Combobox genérico: botón-trigger con la opción elegida + Popover con buscador
 * y lista filtrada. Devuelve el `valor` de la opción; volver a elegir la activa
 * la deselecciona (valor = "").
 *
 * No usa cmdk (roto en este stack, ver autocomplete-carga-nombre): filtra en
 * cliente sobre `opciones` y navega con teclado. El scroll lo estiliza ScrollArea.
 */
export function Combobox({
  opciones,
  valor,
  onValorChange,
  placeholder = "Seleccioná…",
  placeholderBusqueda = "Buscar…",
  textoVacio = "Sin resultados.",
  disabled,
  cargando,
  className,
}: ComboboxProps) {
  const [abierto, setAbierto] = React.useState(false)
  const [busqueda, setBusqueda] = React.useState("")
  const [indiceActivo, setIndiceActivo] = React.useState(0)

  const seleccionada = opciones.find((o) => o.valor === valor)

  const filtradas = React.useMemo(() => {
    const q = normalizar(busqueda)
    if (!q) return opciones
    return opciones.filter((o) => normalizar(o.etiqueta).includes(q))
  }, [opciones, busqueda])

  function elegir(opcion: OpcionCombobox) {
    onValorChange(opcion.valor === valor ? "" : opcion.valor)
    setAbierto(false)
  }

  function manejarApertura(v: boolean) {
    setAbierto(v)
    if (!v) setBusqueda("")
    setIndiceActivo(0)
  }

  function manejarBusqueda(texto: string) {
    // Cada cambio de filtro reencuadra el resaltado al primer resultado.
    setBusqueda(texto)
    setIndiceActivo(0)
  }

  function manejarTeclas(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setIndiceActivo((i) => (filtradas.length ? (i + 1) % filtradas.length : 0))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setIndiceActivo((i) =>
        filtradas.length ? (i <= 0 ? filtradas.length - 1 : i - 1) : 0
      )
    } else if (e.key === "Enter") {
      e.preventDefault()
      const opcion = filtradas[indiceActivo]
      if (opcion) elegir(opcion)
    }
  }

  return (
    // `modal`: cuando el combobox vive dentro de un Dialog, el lock de scroll de
    // este (react-remove-scroll) bloquea la rueda sobre el popover portaleado.
    // El popover modal instala su propia capa de scroll con prioridad → la rueda
    // vuelve a scrollear la lista.
    <Popover open={abierto} onOpenChange={manejarApertura} modal>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={abierto}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !seleccionada && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">
            {seleccionada ? seleccionada.etiqueta : placeholder}
          </span>
          {cargando ? (
            <Loader2 className="size-4 shrink-0 animate-spin opacity-50" />
          ) : (
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) gap-0 p-0"
      >
        <div className="flex h-9 items-center gap-2 border-b px-3">
          <Search className="size-4 shrink-0 opacity-50" />
          <input
            autoFocus
            value={busqueda}
            onChange={(e) => manejarBusqueda(e.target.value)}
            onKeyDown={manejarTeclas}
            placeholder={placeholderBusqueda}
            className="flex h-9 w-full bg-transparent text-sm outline-hidden placeholder:text-muted-foreground"
          />
        </div>
        <ScrollArea type="auto" viewportClassName="max-h-64">
          {filtradas.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {cargando ? "Cargando…" : textoVacio}
            </div>
          ) : (
            <div className="p-1">
              {filtradas.map((o, idx) => (
                <button
                  key={o.valor}
                  type="button"
                  // preventDefault en mousedown: no perder el foco del input.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => elegir(o)}
                  onMouseEnter={() => setIndiceActivo(idx)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm",
                    idx === indiceActivo && "bg-accent text-accent-foreground"
                  )}
                >
                  <Check
                    className={cn(
                      "size-4 shrink-0",
                      o.valor === valor ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{o.etiqueta}</span>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
