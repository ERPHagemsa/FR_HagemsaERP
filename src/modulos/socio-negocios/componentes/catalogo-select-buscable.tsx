"use client"

import { useState } from "react"
import { Search01Icon, Tick02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Button } from "@/compartido/componentes/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/compartido/componentes/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/compartido/componentes/ui/popover"

import type { MaestroConfiguracionGeneralIntegracion } from "../tipos/socio-negocio"

function normalizarBusqueda(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-PE")
    .trim()
}

export function CatalogoSelectBuscable({
  datos,
  disabled,
  getLabel = (dato) => dato.nombre,
  id,
  name,
  onValueChange,
  placeholder,
  value,
}: {
  datos: MaestroConfiguracionGeneralIntegracion[]
  disabled?: boolean
  getLabel?: (dato: MaestroConfiguracionGeneralIntegracion) => string
  id: string
  name: string
  onValueChange?: (value: string) => void
  placeholder: string
  value?: string
}) {
  const [open, setOpen] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const [valorInterno, setValorInterno] = useState("")
  const usaValorControlado = value !== undefined || Boolean(onValueChange)
  const valorSeleccionado = usaValorControlado ? value ?? "" : valorInterno
  const seleccionado = datos.find((dato) => dato.id === valorSeleccionado)
  const busquedaNormalizada = normalizarBusqueda(busqueda)
  const datosFiltrados = datos.filter((dato) =>
    normalizarBusqueda(`${dato.codigo} ${dato.nombre} ${getLabel(dato)}`).includes(
      busquedaNormalizada,
    ),
  )

  function seleccionar(idSeleccionado: string) {
    if (!usaValorControlado) {
      setValorInterno(idSeleccionado)
    }
    onValueChange?.(idSeleccionado)
    setBusqueda("")
    setOpen(false)
  }

  return (
    <>
      <input name={name} value={valorSeleccionado} readOnly hidden />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            className="w-full justify-between"
            disabled={disabled}
          >
            <span className="min-w-0 truncate text-left">
              {seleccionado ? getLabel(seleccionado) : placeholder}
            </span>
            <HugeiconsIcon data-icon="inline-end" icon={Search01Icon} strokeWidth={2} />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-(--radix-popover-trigger-width) gap-3 p-3">
          <InputGroup>
            <InputGroupAddon>
              <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
            </InputGroupAddon>
            <InputGroupInput
              value={busqueda}
              placeholder="Buscar"
              onChange={(event) => setBusqueda(event.target.value)}
            />
          </InputGroup>
          <div className="max-h-64 overflow-auto rounded-md border border-border bg-background">
            {datosFiltrados.length > 0 ? (
              datosFiltrados.map((dato) => {
                const activo = dato.id === valorSeleccionado

                return (
                  <button
                    key={dato.id}
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => seleccionar(dato.id)}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{getLabel(dato)}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {dato.codigo}
                      </span>
                    </span>
                    {activo ? (
                      <HugeiconsIcon data-icon="inline-end" icon={Tick02Icon} strokeWidth={2} />
                    ) : null}
                  </button>
                )
              })
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Sin registros disponibles
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </>
  )
}
