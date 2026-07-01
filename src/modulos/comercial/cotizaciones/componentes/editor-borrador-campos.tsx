"use client";

import * as React from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/compartido/componentes/ui/accordion";
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
import { EditorContenido } from "./editor-contenido";
import { EditorLeadtimes } from "./editor-leadtimes";
import { EditorStandby } from "./editor-standby";

// Presentacional puro del cuerpo del editor de borrador. No tiene logica de API:
// el contenedor (CotizacionEditor para editar, CotizacionEditorNuevo para crear)
// provee el estado del draft y el handler de guardado.
//
// Layout en dos zonas:
//   1. Zona financiera (protagonista): moneda + contenido (lineas, secciones,
//      cargos) + totales. EditorContenido es una sola grilla.
//   2. Zona informativa (secundaria, colapsada): standby y lead times — no suman
//      al total, viven en un accordion para descomprimir la pantalla.
//
// ADR-D1/D2: el modelo de secciones (bucket por defecto, emision raiz vs secciones)
// lo maneja EditorContenido + armarPayloadBorrador; aca solo cableamos el draft.
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
            Agregue los conceptos de la cotizacion. Agrupelos en secciones solo si
            hace falta; el detalle de cada linea se edita en el panel lateral.
          </p>
        </CardHeader>
        <CardContent className="pt-5">
          <EditorContenido
            secciones={draft.secciones}
            moneda={draft.moneda}
            erroresCampo={erroresCampo}
            disabled={guardando}
            clienteTipo={clienteTipo}
            clienteId={clienteId}
            onChange={actualizarSecciones}
          />
        </CardContent>
      </Card>

      {/* Zona informativa secundaria: standby + lead times (colapsables).
          AccordionContent recibe h-auto para anular la altura fija del primitivo
          (h-(--radix-accordion-content-height)), que recorta el contenido que
          crece despues de abrir (ej.: agregar filas). twMerge deja ganar h-auto.
          Al Accordion se le quita su borde/redondeo propio (border-0 rounded-none)
          para que no dibuje un marco dentro de la Card; los triggers usan px-6 para
          alinearse con el header. */}
      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base">Informacion adicional</CardTitle>
          <p className="text-sm text-muted-foreground">
            Datos informativos de la version. No suman al total de la cotizacion.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <Accordion type="multiple" className="rounded-none border-0">
            <AccordionItem value="standby">
              <AccordionTrigger className="px-6">
                <div className="flex flex-col items-start gap-0.5 text-left">
                  <span className="text-sm font-medium">
                    Stand by ({draft.standbys.length})
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">
                    Periodo durante el cual un vehículo o conductor permanece inactivo, a la
                    expectativa o retenido en el punto de carga, descarga o en ruta.
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="h-auto px-6">
                <EditorStandby
                  standby={draft.standbys}
                  disabled={guardando}
                  onChange={(standbys) => setDraft((d) => ({ ...d, standbys }))}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="leadtimes">
              <AccordionTrigger className="px-6">
                <div className="flex flex-col items-start gap-0.5 text-left">
                  <span className="text-sm font-medium">
                    Lead time ({draft.leadTimes.length})
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">
                    Tiempo total que transcurre desde que un cliente solicita un servicio o
                    pedido hasta que la mercancía se entrega en su destino final.
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="h-auto px-6">
                <EditorLeadtimes
                  leadTimes={draft.leadTimes}
                  erroresCampo={erroresCampo}
                  disabled={guardando}
                  onChange={(leadTimes) => setDraft((d) => ({ ...d, leadTimes }))}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
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
