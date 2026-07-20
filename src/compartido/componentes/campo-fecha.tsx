"use client";

import * as React from "react";
import { CalendarDays } from "lucide-react";

import { Button } from "@/compartido/componentes/ui/button";
import { Calendar } from "@/compartido/componentes/ui/calendar";
import { Label } from "@/compartido/componentes/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/compartido/componentes/ui/popover";
import { cn } from "@/compartido/utilidades/utils";

// ---------------------------------------------------------------------------
// CampoFecha — selector de fecha presentacional y reutilizable.
//
// Envuelve el Calendar de shadcn en un Popover con un trigger que muestra la
// fecha formateada en es-ES ("17 de julio de 2026"). Se usa un picker propio en
// vez de <input type="date">: el nativo se renderiza segun el locale del
// navegador (en-US -> mm/dd/yyyy), mientras que este muestra el formato d/m/a de
// forma consistente sin importar el idioma del navegador.
//
// Es tonto: no valida ni conoce el negocio. Recibe value/onSelect y devuelve la
// fecha elegida al padre.
// ---------------------------------------------------------------------------

export type CampoFechaProps = {
  label: string;
  requerido?: boolean;
  value?: Date;
  onSelect: (fecha: Date | undefined) => void;
  /** Fecha minima seleccionable (el resto queda deshabilitado en el calendario). */
  min?: Date;
  error?: string;
  disabled?: boolean;
};

export function CampoFecha({
  label,
  requerido = false,
  value,
  onSelect,
  min,
  error,
  disabled,
}: CampoFechaProps) {
  const [abierto, setAbierto] = React.useState(false);

  return (
    <div className="grid gap-2">
      <Label>
        {label}
        {requerido ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      <Popover open={abierto} onOpenChange={setAbierto}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            aria-invalid={Boolean(error)}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarDays className="size-4" />
            {value
              ? value.toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })
              : "Selecciona una fecha"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(fecha) => {
              onSelect(fecha);
              setAbierto(false);
            }}
            disabled={min ? { before: min } : undefined}
            autoFocus
          />
        </PopoverContent>
      </Popover>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
