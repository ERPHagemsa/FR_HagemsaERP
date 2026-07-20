"use client";

import * as React from "react";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/compartido/utilidades/utils";
import type { Activo } from "../tipos/activo.tipos";
import { buscarActivosPorPlaca } from "../servicios/activos-api";

export type ResultadoPlaca = {
  activo: Activo;
  placa: string;
};

type Props = {
  /** Placa inicial (controlado opcionalmente desde fuera) */
  value?: string;
  /** Callback al seleccionar una placa; null cuando se borra el campo */
  onSeleccionar: (resultado: ResultadoPlaca | null) => void;
  /** Si se muestra input deshabilitado */
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  /** Si se muestran marca + modelo debajo de la placa en el dropdown */
  mostrarDetalle?: boolean;
};

export function BuscadorPlaca({
  value,
  onSeleccionar,
  disabled = false,
  placeholder = "Buscar por placa...",
  className,
  mostrarDetalle = true,
}: Props) {
  const [texto, setTexto] = React.useState(value ?? "");
  const [resultados, setResultados] = React.useState<Activo[]>([]);
  const [cargando, setCargando] = React.useState(false);
  const [abierto, setAbierto] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (value !== undefined) setTexto(value);
  }, [value]);

  function disparar(consulta: string) {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!consulta.trim() || consulta.trim().length < 2) {
      setResultados([]);
      setAbierto(false);
      return;
    }

    timerRef.current = setTimeout(async () => {
      setCargando(true);
      try {
        const activos = await buscarActivosPorPlaca(consulta);
        const vehiculos = activos.filter((a) => a.vehiculo?.placa);
        setResultados(vehiculos);
        setAbierto(vehiculos.length > 0);
      } catch {
        setResultados([]);
        setAbierto(false);
      } finally {
        setCargando(false);
      }
    }, 300);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setTexto(val);
    onSeleccionar(null);
    disparar(val);
  }

  function seleccionar(activo: Activo) {
    const placa = activo.vehiculo?.placa ?? "";
    setTexto(placa);
    setAbierto(false);
    setResultados([]);
    onSeleccionar({ activo, placa });
  }

  function limpiar() {
    setTexto("");
    setResultados([]);
    setAbierto(false);
    onSeleccionar(null);
    inputRef.current?.focus();
  }

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        {cargando ? (
          <Loader2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : (
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={texto}
          onChange={handleChange}
          onFocus={() => {
            if (resultados.length > 0) setAbierto(true);
          }}
          onBlur={() => {
            setTimeout(() => setAbierto(false), 150);
          }}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            "h-10 w-full rounded-xl border border-input bg-background pl-9 pr-9 text-sm outline-none",
            "focus:ring-2 focus:ring-ring focus:border-transparent",
            "disabled:cursor-not-allowed disabled:opacity-60",
            "transition-shadow"
          )}
        />
        {texto ? (
          <button
            type="button"
            onClick={limpiar}
            disabled={disabled}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:pointer-events-none"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {abierto ? (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-popover shadow-lg">
          {resultados.length > 0 ? (
            <ul className="max-h-64 overflow-y-auto py-1">
              {resultados.map((activo) => {
                const placa = activo.vehiculo?.placa ?? "";
                const descripcion = [
                  activo.vehiculo?.marca,
                  activo.vehiculo?.modelo,
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <li key={activo.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        seleccionar(activo);
                      }}
                      className="flex w-full flex-col gap-0.5 px-4 py-2 text-left hover:bg-accent focus:bg-accent outline-none"
                    >
                      <span className="font-semibold text-sm">{placa}</span>
                      {mostrarDetalle ? (
                        <span className="text-xs text-muted-foreground">
                          {descripcion || activo.descripcion}
                          {activo.ubicacion
                            ? ` · ${activo.ubicacion}`
                            : ""}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              Sin resultados para &quot;{texto}&quot;
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
