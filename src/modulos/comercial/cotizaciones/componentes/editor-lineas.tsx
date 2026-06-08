"use client";

import { PlusIcon } from "lucide-react";

import { Button } from "@/compartido/componentes/ui/button";

import type { DraftLinea } from "../servicios/cotizaciones-editor.utils";
import { lineaVacia } from "../servicios/cotizaciones-editor.utils";
import { LineaForm } from "./linea-form";

type Props = {
  lineas: DraftLinea[];
  erroresCampo?: Record<string, string>;
  disabled?: boolean;
  onChange: (lineas: DraftLinea[]) => void;
};

/**
 * EditorLineas — renderiza la lista de lineas de un bucket (seccion o raiz)
 * y permite agregar, eliminar y editar cada linea.
 */
export function EditorLineas({ lineas, erroresCampo = {}, disabled, onChange }: Props) {
  function agregar() {
    onChange([...lineas, lineaVacia()]);
  }

  function eliminar(clave: string) {
    onChange(lineas.filter((l) => l.claveCliente !== clave));
  }

  function actualizar(clave: string, patch: Partial<DraftLinea>) {
    onChange(
      lineas.map((l) => (l.claveCliente === clave ? { ...l, ...patch } : l))
    );
  }

  // Intentar mapear erroresCampo a la linea correspondiente por indice.
  // OQ-3: NestJS class-validator emite paths como "secciones.0.lineas.0.descripcion"
  // o "lineas.0.descripcion". Derivamos errores por linea por indice.
  function erroresPorLinea(idx: number): Record<string, string> {
    const resultado: Record<string, string> = {};
    for (const [ruta, mensaje] of Object.entries(erroresCampo)) {
      // Match "lineas.{idx}.{campo}" o "secciones.{n}.lineas.{idx}.{campo}"
      const matchRaiz = ruta.match(/^lineas\.(\d+)\.(.+)$/);
      if (matchRaiz && parseInt(matchRaiz[1]) === idx) {
        resultado[matchRaiz[2]] = mensaje;
        continue;
      }
      const matchSeccion = ruta.match(/^secciones\.\d+\.lineas\.(\d+)\.(.+)$/);
      if (matchSeccion && parseInt(matchSeccion[1]) === idx) {
        resultado[matchSeccion[2]] = mensaje;
      }
    }
    return resultado;
  }

  return (
    <div className="flex flex-col gap-3">
      {lineas.map((linea, idx) => (
        <LineaForm
          key={linea.claveCliente}
          linea={linea}
          erroresCampo={erroresPorLinea(idx)}
          disabled={disabled}
          onEliminar={() => eliminar(linea.claveCliente)}
          onChange={(patch) => actualizar(linea.claveCliente, patch)}
        />
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        disabled={disabled}
        onClick={agregar}
      >
        <PlusIcon data-icon="inline-start" />
        Agregar linea
      </Button>
    </div>
  );
}
