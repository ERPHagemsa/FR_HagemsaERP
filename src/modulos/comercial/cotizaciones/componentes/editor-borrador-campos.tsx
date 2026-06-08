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
import { Separator } from "@/compartido/componentes/ui/separator";

import type { Moneda } from "../tipos/cotizaciones.tipos";
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
}: Props) {
  function actualizarSecciones(secciones: DraftSeccion[]) {
    setDraft((d) => ({ ...d, secciones }));
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Datos de la version: moneda */}
      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base">Datos de la version</CardTitle>
          <p className="text-sm text-muted-foreground">
            Configuracion general que aplica a toda la version.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-1.5 md:max-w-xs">
            <Label className="text-xs text-muted-foreground">
              Moneda <span className="text-destructive">*</span>
            </Label>
            <Select
              value={draft.moneda}
              onValueChange={(v) => setDraft((d) => ({ ...d, moneda: v as Moneda }))}
              disabled={guardando}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PEN">PEN — Sol peruano</SelectItem>
                <SelectItem value="USD">USD — Dolar</SelectItem>
              </SelectContent>
            </Select>
            {erroresCampo["moneda"] ? (
              <p className="text-xs text-destructive">{erroresCampo["moneda"]}</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

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

      <Separator />

      {/* Footer de guardado */}
      <div className="flex items-center justify-end gap-3">
        <p className="text-sm text-muted-foreground">{textoFooter}</p>
        <Button type="button" disabled={guardando} onClick={onGuardar}>
          {guardando ? textoBotonGuardando : textoBoton}
        </Button>
      </div>
    </div>
  );
}
