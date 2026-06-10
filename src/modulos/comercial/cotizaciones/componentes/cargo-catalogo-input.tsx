"use client";

import { useState } from "react";
import { CheckIcon } from "lucide-react";

import { Input } from "@/compartido/componentes/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/compartido/componentes/ui/popover";
import { cn } from "@/compartido/utilidades/utils";

import type { CatalogoCargoAdicional } from "../tipos/cotizaciones.tipos";

type Props = {
  value: string;
  onChange: (valor: string) => void;
  opciones: CatalogoCargoAdicional[];
  disabled?: boolean;
  placeholder?: string;
  "aria-invalid"?: boolean;
};

function normalizar(v: string): string {
  return v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLocaleLowerCase("es-PE")
    .trim();
}

export function CargoCatalogoInput({
  value,
  onChange,
  opciones,
  disabled,
  placeholder,
  ...rest
}: Props) {
  const [abierto, setAbierto] = useState(false);

  const hayCatalogo = opciones.length > 0;
  const q = normalizar(value);
  const sugerencias = q
    ? opciones.filter((o) => normalizar(o.nombre).includes(q))
    : opciones;

  if (!hayCatalogo) {
    return (
      <Input
        className="h-8 text-xs"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        aria-invalid={rest["aria-invalid"]}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  return (
    <Popover open={abierto && sugerencias.length > 0} onOpenChange={setAbierto}>
      <PopoverAnchor asChild>
        <Input
          className="h-8 text-xs"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={rest["aria-invalid"]}
          onFocus={() => setAbierto(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setAbierto(true);
          }}
        />
      </PopoverAnchor>
      <PopoverContent
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-(--radix-popover-trigger-width) p-1"
      >
        <div className="flex max-h-56 flex-col overflow-auto">
          {sugerencias.map((opcion) => (
            <button
              key={opcion.id}
              type="button"
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted",
                opcion.nombre === value && "bg-muted/60"
              )}
              onClick={() => {
                onChange(opcion.nombre);
                setAbierto(false);
              }}
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{opcion.nombre}</span>
                {opcion.descripcion ? (
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {opcion.descripcion}
                  </span>
                ) : null}
              </span>
              {opcion.nombre === value ? (
                <CheckIcon data-icon="inline-end" />
              ) : null}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
