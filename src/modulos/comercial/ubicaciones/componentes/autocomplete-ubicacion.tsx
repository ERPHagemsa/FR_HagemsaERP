"use client";

import * as React from "react";
import { MapPin } from "lucide-react";

import { Badge } from "@/compartido/componentes/ui/badge";
import { Input } from "@/compartido/componentes/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/compartido/componentes/ui/popover";
import { Spinner } from "@/compartido/componentes/ui/spinner";
import { cn } from "@/compartido/utilidades/utils";

import type { TipoUbicacion, Ubicacion } from "../tipos/ubicaciones.tipos";
import { useBuscarUbicacionesMaestra } from "../servicios/ubicaciones-queries";

const RETARDO_DEBOUNCE_MS = 300;

const ETIQUETA_TIPO: Record<TipoUbicacion, string> = {
  SEDE: "Sede",
  CLIENTE: "Cliente",
  PLANTA: "Planta",
  MINA: "Mina",
  PUERTO: "Puerto",
  PEAJE: "Peaje",
  ESTACIONAMIENTO: "Estacionamiento",
  ALMACEN: "Almacén",
  PATIO: "Patio",
  TERMINAL: "Terminal",
  OTRO: "Otro",
};

/** Etiqueta legible del tipo de ubicación. */
export function etiquetaTipoUbicacion(t: TipoUbicacion): string {
  return ETIQUETA_TIPO[t] ?? t;
}

/** Jerarquía geográfica compacta (distrito · provincia · departamento). */
export function jerarquiaUbicacion(u: Ubicacion, sep = " · "): string {
  return [u.distrito, u.provincia, u.departamento].filter(Boolean).join(sep);
}

type Props = {
  value: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  /** Texto libre (el usuario tipea una ubicación que puede no estar en la maestra). */
  onChangeTexto: (valor: string) => void;
  /** Eligió una ubicación de la maestra. */
  onSeleccionar: (ubicacion: Ubicacion) => void;
};

/**
 * Selector de ubicación (origen/destino de sección) con autocompletado contra la
 * MAESTRA local (réplica confirmada de BC-14). Combobox liviano: Input + Popover
 * (sin cmdk); el popover usa PopoverAnchor para no robarle el foco al input.
 *
 * Es texto libre: si la ubicación NO está en la maestra, el usuario la escribe
 * igual y el backend le crea una temporal al guardar. Si ELIGE una de la maestra,
 * queda su nombre EXACTO → el backend la matchea y usa la maestra (sin temporal).
 */
export function AutocompleteUbicacion({
  value,
  disabled,
  placeholder,
  className,
  onChangeTexto,
  onSeleccionar,
}: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const [termino, setTermino] = React.useState(value.trim());
  const [focado, setFocado] = React.useState(false);
  const [omitirApertura, setOmitirApertura] = React.useState(false);
  const [indiceActivo, setIndiceActivo] = React.useState(-1);

  React.useEffect(() => {
    const t = setTimeout(() => setTermino(value.trim()), RETARDO_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [value]);

  const { data, isLoading } = useBuscarUbicacionesMaestra(termino);

  const sugerencias = React.useMemo<Ubicacion[]>(
    () => (termino.length >= 2 ? (data ?? []) : []),
    [termino, data]
  );

  const mostrar =
    focado &&
    !omitirApertura &&
    termino.length >= 2 &&
    (isLoading || sugerencias.length > 0);

  function manejarTexto(valor: string) {
    setOmitirApertura(false);
    setIndiceActivo(-1);
    onChangeTexto(valor);
  }

  function elegir(u: Ubicacion) {
    setOmitirApertura(true);
    setIndiceActivo(-1);
    onSeleccionar(u);
    inputRef.current?.focus();
  }

  function manejarTeclas(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!mostrar || sugerencias.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndiceActivo((i) => (i + 1) % sugerencias.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndiceActivo((i) => (i <= 0 ? sugerencias.length - 1 : i - 1));
    } else if (
      e.key === "Enter" &&
      indiceActivo >= 0 &&
      indiceActivo < sugerencias.length
    ) {
      e.preventDefault();
      elegir(sugerencias[indiceActivo]);
    } else if (e.key === "Escape") {
      setOmitirApertura(true);
    }
  }

  return (
    <Popover open={mostrar}>
      <PopoverAnchor asChild>
        <Input
          ref={inputRef}
          className={className}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={mostrar}
          onChange={(e) => manejarTexto(e.target.value)}
          onFocus={() => setFocado(true)}
          onBlur={() => setFocado(false)}
          onKeyDown={manejarTeclas}
        />
      </PopoverAnchor>
      <PopoverContent
        align="start"
        sideOffset={4}
        className="w-(--radix-popover-trigger-width) gap-0 p-1"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {isLoading && sugerencias.length === 0 ? (
          <div className="flex items-center gap-2 px-2 py-2 text-xs text-muted-foreground">
            <Spinner className="size-3" />
            Buscando en el maestro…
          </div>
        ) : (
          <ul className="flex max-h-72 flex-col overflow-y-auto">
            {sugerencias.map((u, idx) => (
              <li key={u.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => elegir(u)}
                  onMouseEnter={() => setIndiceActivo(idx)}
                  className={cn(
                    "flex w-full flex-col gap-0.5 rounded-md px-2 py-1.5 text-left",
                    idx === indiceActivo
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/60"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">
                      {u.nombre}
                    </span>
                    <Badge variant="secondary" className="shrink-0">
                      {etiquetaTipoUbicacion(u.tipoUbicacion)}
                    </Badge>
                  </div>
                  {u.direccion ? (
                    <span className="truncate text-xs text-muted-foreground">
                      {u.direccion}
                    </span>
                  ) : null}
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3 shrink-0" />
                    <span className="truncate">{jerarquiaUbicacion(u)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
