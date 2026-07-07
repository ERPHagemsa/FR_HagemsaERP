"use client";

import * as React from "react";

import { Button } from "@/compartido/componentes/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
import { Label } from "@/compartido/componentes/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select";

import type { Moneda, OrigenTipo } from "../tipos/cotizaciones.tipos";
import type { DraftBorrador, DraftSeccion } from "../servicios/cotizaciones-editor.utils";
import { CotizacionSeccionesEditor } from "./cotizacion-secciones-editor";

// Presentacional puro del cuerpo del editor de borrador en MODO CREACION
// (CotizacionEditorNuevo). No tiene logica de API: el contenedor provee el estado
// del draft y el handler de guardado. La edicion de una cotizacion ya existente se
// hace INLINE en el detalle (CotizacionVersionEditable), no aqui.
//
// Layout en dos zonas:
//   1. Zona financiera (protagonista): moneda + contenido por secciones (cada una
//      con su ruta, lineas y cargos) + totales. Lo maneja CotizacionSeccionesEditor.
//   2. Zona informativa (secundaria, colapsada): lead times — no suman al total,
//      viven en un accordion para descomprimir la pantalla.
//
// El modelo de secciones (bucket por defecto, ruta por seccion) y la emision del
// payload los manejan CotizacionSeccionesEditor + armarPayloadBorrador.
type Props = {
  draft: DraftBorrador;
  setDraft: React.Dispatch<React.SetStateAction<DraftBorrador>>;
  erroresCampo: Record<string, string>;
  guardando: boolean;
  onGuardar: () => void;
  textoFooter: string;
  textoBoton: string;
  textoBotonGuardando: string;
  // Cambios sin guardar respecto al ultimo estado persistido. El contenedor de
  // edicion lo calcula contra un snapshot; el de creacion lo omite (sin baseline).
  sucio?: boolean;
  // Origen de la cotizacion (opcional): acota el precio sugerido al historial del cliente.
  clienteTipo?: OrigenTipo;
  clienteId?: string;
};

export function EditorBorradorCampos({
  draft,
  setDraft,
  erroresCampo,
  guardando,
  onGuardar,
  textoFooter,
  textoBoton,
  textoBotonGuardando,
  sucio,
  clienteTipo,
  clienteId,
}: Props) {
  function actualizarSecciones(secciones: DraftSeccion[]) {
    setDraft((d) => ({ ...d, secciones }));
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Moneda: fila compacta (un solo campo, no amerita Card con header) */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5">
        <Label htmlFor="moneda-editor" className="text-xs font-medium text-muted-foreground">
          Moneda <span className="text-destructive">*</span>
        </Label>
        <Select
          value={draft.moneda}
          onValueChange={(v) => setDraft((d) => ({ ...d, moneda: v as Moneda }))}
          disabled={guardando}
        >
          <SelectTrigger id="moneda-editor" size="sm" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PEN">PEN — Sol peruano</SelectItem>
            <SelectItem value="USD">USD — Dolar</SelectItem>
          </SelectContent>
        </Select>
        {erroresCampo["moneda"] ? (
          <span className="text-xs text-destructive">{erroresCampo["moneda"]}</span>
        ) : null}
      </div>

      {/* Contenido de la cotizacion: lineas + secciones + cargos + totales */}
      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base">Contenido de la cotizacion</CardTitle>
          <p className="text-sm text-muted-foreground">
            Cree una seccion por ruta (origen/destino) y agregue sus lineas; cada
            seccion y sus lineas se editan en un modal.
          </p>
        </CardHeader>
        <CardContent className="pt-5">
          <CotizacionSeccionesEditor
            secciones={draft.secciones}
            moneda={draft.moneda}
            disabled={guardando}
            clienteTipo={clienteTipo}
            clienteId={clienteId}
            onChange={actualizarSecciones}
          />
        </CardContent>
      </Card>

      {/* Action bar de guardado: sticky al fondo del viewport para que el boton
          quede siempre accesible en formularios largos. Muestra el estado dirty
          (cambios sin guardar) cuando el contenedor lo provee. */}
      <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 rounded-xl border border-border bg-card/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="flex min-w-0 items-center gap-2">
          {sucio ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-500">
              <span className="size-1.5 shrink-0 rounded-full bg-amber-500" />
              Cambios sin guardar
            </span>
          ) : (
            <span className="truncate text-xs text-muted-foreground">{textoFooter}</span>
          )}
        </div>
        <Button type="button" disabled={guardando} onClick={onGuardar}>
          {guardando ? textoBotonGuardando : textoBoton}
        </Button>
      </div>
    </div>
  );
}
