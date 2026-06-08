"use client";

import * as React from "react";
import { ChevronDownIcon, ChevronUpIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/compartido/componentes/ui/button";
import { Input } from "@/compartido/componentes/ui/input";
import { Label } from "@/compartido/componentes/ui/label";
import { Separator } from "@/compartido/componentes/ui/separator";

import type { DraftSeccion } from "../servicios/cotizaciones-editor.utils";
import { seccionVacia } from "../servicios/cotizaciones-editor.utils";
import { EditorLineas } from "./editor-lineas";
import { EditorCargos } from "./editor-cargos";

type Props = {
  secciones: DraftSeccion[];
  erroresCampo?: Record<string, string>;
  disabled?: boolean;
  onChange: (secciones: DraftSeccion[]) => void;
};

export function EditorSecciones({ secciones, erroresCampo = {}, disabled, onChange }: Props) {
  function agregar() {
    const nueva = seccionVacia(false);
    nueva.orden = secciones.length;
    onChange([...secciones, nueva]);
  }

  function eliminar(clave: string) {
    onChange(secciones.filter((s) => s.claveCliente !== clave));
  }

  function actualizar(clave: string, patch: Partial<DraftSeccion>) {
    onChange(
      secciones.map((s) => (s.claveCliente === clave ? { ...s, ...patch } : s))
    );
  }

  // Extraer errores de una seccion por indice
  function erroresPorSeccion(idx: number): Record<string, string> {
    const resultado: Record<string, string> = {};
    for (const [ruta, mensaje] of Object.entries(erroresCampo)) {
      const match = ruta.match(/^secciones\.(\d+)\.(.+)$/);
      if (match && parseInt(match[1]) === idx) {
        resultado[match[2]] = mensaje;
      }
    }
    return resultado;
  }

  // Solo mostrar secciones no-defecto en el panel de agrupacion
  const seccionesVisibles = secciones.filter((s) => !s.esDefecto);

  return (
    <div className="flex flex-col gap-3">
      {seccionesVisibles.map((seccion) => {
        const idx = secciones.indexOf(seccion);
        return (
          <SeccionPanel
            key={seccion.claveCliente}
            seccion={seccion}
            erroresCampo={erroresPorSeccion(idx)}
            disabled={disabled}
            onEliminar={() => eliminar(seccion.claveCliente)}
            onChange={(patch) => actualizar(seccion.claveCliente, patch)}
          />
        );
      })}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        disabled={disabled}
        onClick={agregar}
      >
        <PlusIcon data-icon="inline-start" />
        Agregar seccion
      </Button>
    </div>
  );
}

function SeccionPanel({
  seccion,
  erroresCampo = {},
  disabled,
  onEliminar,
  onChange,
}: {
  seccion: DraftSeccion;
  erroresCampo?: Record<string, string>;
  disabled?: boolean;
  onEliminar: () => void;
  onChange: (patch: Partial<DraftSeccion>) => void;
}) {
  const [expandida, setExpandida] = React.useState(true);

  return (
    <div className="rounded-xl border border-border bg-muted/10">
      {/* Cabecera de seccion */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <button
          type="button"
          className="flex flex-1 items-center gap-2 text-left text-sm font-medium"
          onClick={() => setExpandida((v) => !v)}
        >
          {expandida ? (
            <ChevronUpIcon className="size-4 shrink-0" />
          ) : (
            <ChevronDownIcon className="size-4 shrink-0" />
          )}
          <span className="truncate">
            {seccion.nombre || "Seccion sin nombre"}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            ({seccion.lineas.length} linea{seccion.lineas.length !== 1 ? "s" : ""})
          </span>
        </button>

        {/* No permitir eliminar la seccion por defecto */}
        {!seccion.esDefecto ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="size-8 text-destructive hover:text-destructive"
            disabled={disabled}
            onClick={onEliminar}
            aria-label="Eliminar seccion"
          >
            <Trash2Icon />
          </Button>
        ) : null}
      </div>

      {expandida ? (
        <div className="flex flex-col gap-4 p-4">
          {/* Nombre de la seccion (obligatorio para secciones con nombre; no aplica a esDefecto) */}
          {!seccion.esDefecto ? (
            <div className="grid gap-1.5 md:max-w-sm">
              <Label className="text-xs text-muted-foreground">
                Nombre de la seccion <span className="text-destructive">*</span>
              </Label>
              <Input
                value={seccion.nombre}
                disabled={disabled}
                placeholder="Ej: Tramo Lima → Mina"
                aria-invalid={Boolean(erroresCampo.nombre)}
                onChange={(e) => onChange({ nombre: e.target.value })}
              />
              {erroresCampo.nombre ? (
                <p className="text-xs text-destructive">{erroresCampo.nombre}</p>
              ) : null}
            </div>
          ) : null}

          {!seccion.esDefecto ? <Separator /> : null}

          {/* Lineas de esta seccion */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Lineas ({seccion.lineas.length})
            </Label>
            <EditorLineas
              lineas={seccion.lineas}
              erroresCampo={erroresCampo}
              disabled={disabled}
              onChange={(lineas) => onChange({ lineas })}
            />
          </div>

          <Separator />

          {/* Cargos adicionales de esta seccion */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Cargos adicionales ({seccion.cargosAdicionales.length})
            </Label>
            <p className="text-xs text-muted-foreground">
              Los cargos adicionales suman al subtotal de esta seccion.
            </p>
            <EditorCargos
              cargos={seccion.cargosAdicionales}
              erroresCampo={erroresCampo}
              disabled={disabled}
              onChange={(cargosAdicionales) => onChange({ cargosAdicionales })}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
