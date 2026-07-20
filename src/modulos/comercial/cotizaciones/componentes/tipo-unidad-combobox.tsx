"use client";

import * as React from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/compartido/componentes/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/compartido/componentes/ui/command";
import { cn } from "@/compartido/utilidades/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { UnfoldMoreIcon, Tick02Icon } from "@hugeicons/core-free-icons";

import type { TipoUnidadOpcion } from "../tipos/cotizaciones.tipos";
import { useListarTiposUnidad } from "../servicios/cotizaciones-queries";

type Props = {
  value: string; // idTipoUnidad seleccionado ("" = sin seleccion)
  disabled?: boolean;
  invalid?: boolean;
  // Segundo argumento: la opcion elegida (para congelar fuente + nombre en el draft).
  onValueChange: (id: string, opcion?: TipoUnidadOpcion) => void;
};

/**
 * Combobox (Popover + Command) del tipo de unidad de la carga. Une ACTIVOS + terceros
 * (GET /tipos-unidad); ~40 opciones, por eso combobox con busqueda en cliente en vez de
 * un select plano. El id es opaco (idActivos numerico o UUID de tercero); se envia tal cual.
 */
export function TipoUnidadCombobox({ value, disabled, invalid, onValueChange }: Props) {
  const [abierto, setAbierto] = React.useState(false);
  const { data, isLoading } = useListarTiposUnidad();
  const opciones = data ?? [];

  const seleccionada = opciones.find((o) => o.id === value);

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger
        disabled={disabled ?? isLoading}
        role="combobox"
        aria-expanded={abierto}
        aria-invalid={invalid}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-1.5 rounded-4xl border border-input bg-input/30 px-3 py-2 text-sm whitespace-nowrap transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 dark:hover:bg-input/50"
        )}
      >
        <span className={cn("line-clamp-1 text-left", !seleccionada && "text-muted-foreground")}>
          {isLoading
            ? "Cargando..."
            : seleccionada
              ? seleccionada.nombre
              : "Selecciona tipo de unidad"}
        </span>
        <HugeiconsIcon
          icon={UnfoldMoreIcon}
          strokeWidth={2}
          className="pointer-events-none size-4 shrink-0 text-muted-foreground"
        />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={4}
        className="w-(--radix-popover-trigger-width) p-0"
      >
        <Command>
          <CommandInput placeholder="Buscar tipo de unidad..." />
          <CommandList>
            <CommandEmpty>Sin resultados.</CommandEmpty>
            {opciones.map((o) => (
              <CommandItem
                key={o.id}
                // cmdk filtra por `value`: nombre + clase para busqueda; el id (opaco) al
                // final lo hace unico (varias clases comparten nombre, p.ej. "PLATAFORMA").
                value={`${o.nombre} ${o.clase ?? ""} ${o.id}`}
                onSelect={() => {
                  onValueChange(o.id, o);
                  setAbierto(false);
                }}
              >
                <HugeiconsIcon
                  icon={Tick02Icon}
                  strokeWidth={2}
                  className={cn("size-4", o.id === value ? "opacity-100" : "opacity-0")}
                />
                <span className="flex-1">{o.nombre}</span>
                {o.clase ? (
                  <span className="text-xs text-muted-foreground">{o.clase}</span>
                ) : null}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
