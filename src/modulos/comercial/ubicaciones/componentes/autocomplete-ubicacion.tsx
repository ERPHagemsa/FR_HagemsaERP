"use client";

import * as React from "react";

import { Input } from "@/compartido/componentes/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/compartido/componentes/ui/popover";
import { Spinner } from "@/compartido/componentes/ui/spinner";
import { cn } from "@/compartido/utilidades/utils";

import type { Ubicacion } from "../tipos/ubicaciones.tipos";
import { useBuscarUbicacionesMaestra } from "../servicios/ubicaciones-queries";

const RETARDO_DEBOUNCE_MS = 300;

type Props = {
  value: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  onChange: (valor: string) => void;
};

/**
 * Selector de ubicación (origen/destino de sección) con autocompletado contra la
 * MAESTRA local (réplica confirmada de BC-14). Combobox liviano: Input + Popover
 * (sin cmdk); el popover usa PopoverAnchor para no robarle el foco al input.
 *
 * Es texto libre: si la ubicación NO está en la maestra, el usuario la escribe
 * igual y el backend le crea una temporal al guardar. Si ELIGE una de la maestra,
 * queda su nombre EXACTO → el backend la matchea y usa la maestra (sin temporal,
 * sin publicar).
 */
export function AutocompleteUbicacion({
  value,
  disabled,
  placeholder,
  className,
  onChange,
}: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const [termino, setTermino] = React.useState(value.trim());
  const [focado, setFocado] = React.useState(false);
  // Tras elegir, el `value` pasa a ser ese nombre (>=2 chars) y reabriría el
  // dropdown mostrando lo recién elegido. Se suprime hasta el próximo tipeo.
  const [omitirApertura, setOmitirApertura] = React.useState(false);
  const [indiceActivo, setIndiceActivo] = React.useState(-1);

  // Debounce: el `value` controlado baja a `termino` con retardo.
  React.useEffect(() => {
    const t = setTimeout(() => setTermino(value.trim()), RETARDO_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [value]);

  const { data, isLoading } = useBuscarUbicacionesMaestra(termino);

  // Gateo defensivo: useConsulta NO limpia `data` al deshabilitarse; con <2 chars
  // forzamos lista vacía para no mostrar resultados viejos.
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
    onChange(valor);
  }

  function elegir(u: Ubicacion) {
    setOmitirApertura(true);
    setIndiceActivo(-1);
    onChange(u.nombre); // nombre exacto de la maestra → el backend la matchea
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
          <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
            <Spinner className="size-3" />
            Buscando…
          </div>
        ) : (
          <ul className="flex max-h-56 flex-col overflow-y-auto">
            {sugerencias.map((u, idx) => (
              <li key={u.id}>
                <button
                  type="button"
                  // preventDefault en mousedown: evita el blur del input antes del click.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => elegir(u)}
                  onMouseEnter={() => setIndiceActivo(idx)}
                  className={cn(
                    "flex w-full flex-col items-start gap-0.5 rounded-md px-2 py-1.5 text-left text-sm",
                    idx === indiceActivo
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/60"
                  )}
                >
                  <span className="font-medium">{u.nombre}</span>
                  <span className="text-xs text-muted-foreground">
                    {resumenUbicacion(u)}
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

// Línea secundaria: jerarquía geográfica para desambiguar homónimos.
function resumenUbicacion(u: Ubicacion): string {
  return (
    [u.distrito, u.provincia, u.departamento].filter(Boolean).join(", ") ||
    u.pais
  );
}
