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

import type { SugerenciaCarga } from "../tipos/cotizaciones.tipos";
import { useSugerenciasCarga } from "../servicios/cotizaciones-queries";

const RETARDO_DEBOUNCE_MS = 300;

type Props = {
  value: string;
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
  className?: string;
  /** Cambio libre de texto (el usuario tipea). */
  onChangeTexto: (valor: string) => void;
  /** El usuario eligio una sugerencia: clonar nombre + dimensiones. */
  onSeleccionar: (sugerencia: SugerenciaCarga) => void;
};

/**
 * Input de nombre de carga con autocompletado (API §5.3.1).
 *
 * Combobox liviano: Input + Popover (no usamos cmdk; no esta instalado). El popover
 * usa PopoverAnchor para no robarle el foco al input. Es texto libre — si el nombre
 * no esta entre las sugerencias, el usuario igual lo tipea y sigue.
 *
 * Elegir una sugerencia CLONA sus dimensiones (no vincula); el usuario puede editarlas.
 */
export function AutocompleteCargaNombre({
  value,
  disabled,
  invalid,
  placeholder,
  className,
  onChangeTexto,
  onSeleccionar,
}: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const [termino, setTermino] = React.useState(value.trim());
  const [focado, setFocado] = React.useState(false);
  // Tras elegir una sugerencia, el `value` pasa a ser ese nombre (>=2 chars), lo que
  // reabriria el dropdown mostrando lo recien elegido. Lo suprimimos hasta el proximo tipeo.
  const [omitirApertura, setOmitirApertura] = React.useState(false);
  const [indiceActivo, setIndiceActivo] = React.useState(-1);

  // Debounce: el `value` controlado baja a `termino` con retardo.
  React.useEffect(() => {
    const t = setTimeout(() => setTermino(value.trim()), RETARDO_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [value]);

  const { data, isLoading } = useSugerenciasCarga(termino);

  // Gateo defensivo: useConsulta NO limpia `data` al deshabilitarse, asi que con
  // <2 chars forzamos lista vacia para no mostrar resultados viejos.
  const sugerencias = React.useMemo<SugerenciaCarga[]>(
    () => (termino.length >= 2 ? (data ?? []) : []),
    [termino, data]
  );

  const mostrar =
    focado && !omitirApertura && termino.length >= 2 && (isLoading || sugerencias.length > 0);

  function manejarTexto(valor: string) {
    // El usuario volvio a tipear: reactiva el dropdown si venia suprimido tras elegir
    // y resetea el resaltado (la lista esta por cambiar con el proximo fetch debounced).
    setOmitirApertura(false);
    setIndiceActivo(-1);
    onChangeTexto(valor);
  }

  function elegir(sugerencia: SugerenciaCarga) {
    setOmitirApertura(true);
    setIndiceActivo(-1);
    onSeleccionar(sugerencia);
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
    } else if (e.key === "Enter" && indiceActivo >= 0 && indiceActivo < sugerencias.length) {
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
          className={cn("h-8 text-xs", className)}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={invalid}
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
        // No robar el foco: el usuario sigue tipeando mientras ve las sugerencias.
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {isLoading && sugerencias.length === 0 ? (
          <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
            <Spinner className="size-3" />
            Buscando…
          </div>
        ) : (
          <ul className="flex max-h-56 flex-col overflow-y-auto">
            {sugerencias.map((s, idx) => (
              <li key={`${s.nombre}-${idx}`}>
                <button
                  type="button"
                  // preventDefault en mousedown: evita el blur del input antes del click.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => elegir(s)}
                  className={cn(
                    "flex w-full flex-col items-start gap-0.5 rounded-md px-2 py-1.5 text-left text-xs",
                    idx === indiceActivo ? "bg-accent text-accent-foreground" : "hover:bg-accent/60"
                  )}
                >
                  <span className="font-medium">{s.nombre}</span>
                  <span className="text-[11px] text-muted-foreground">{resumenDimensiones(s)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

// Linea secundaria de la sugerencia: dimensiones disponibles, separadas por · (omite las null).
function resumenDimensiones(s: SugerenciaCarga): string {
  const partes: string[] = [];
  if (s.largoM != null) partes.push(`L ${s.largoM}m`);
  if (s.anchoM != null) partes.push(`A ${s.anchoM}m`);
  if (s.altoM != null) partes.push(`H ${s.altoM}m`);
  if (s.peso != null) partes.push(`${s.peso} ${s.unidadPeso ?? ""}`.trim());
  return partes.length > 0 ? partes.join(" · ") : "Sin dimensiones";
}
