"use client";

import * as React from "react";
import { LayersIcon } from "lucide-react";

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
import { seccionDefectoVacia } from "../servicios/cotizaciones-editor.utils";
import { EditorCargos } from "./editor-cargos";
import { EditorLeadtimes } from "./editor-leadtimes";
import { EditorLineas } from "./editor-lineas";
import { EditorSecciones } from "./editor-secciones";
import { EditorStandby } from "./editor-standby";

// Presentacional puro del cuerpo del editor de borrador. No tiene logica de API:
// el contenedor (CotizacionEditor para editar, CotizacionEditorNuevo para crear)
// provee el estado del draft y el handler de guardado.
//
// ADR-D1: el draft siempre modela la seccion por defecto (esDefecto:true) cuando hay
// lineas sin seccion. El camino principal ("sin agrupar") usa esa seccion invisible.
// ADR-D2: la seccion por defecto sin nombre y sin cargos emite lineas[] raiz en el payload.
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
  // Seccion por defecto (esDefecto:true) — bucket de lineas del camino simple
  const seccionDefecto = draft.secciones.find((s) => s.esDefecto);
  const indiceSeccionDefecto = draft.secciones.findIndex((s) => s.esDefecto);
  const seccionesExplicitas = draft.secciones.filter((s) => !s.esDefecto);
  const haySeccionesExplicitas = seccionesExplicitas.length > 0;

  // Estado derivado, sin effect: el panel se muestra si hay secciones ya o si el usuario lo activó.
  const [agruparManual, setAgruparManual] = React.useState(false);
  const agruparEnSecciones = haySeccionesExplicitas || agruparManual;

  // Asegurar que la seccion por defecto exista en el draft
  function asegurarSeccionDefecto(d: DraftBorrador): DraftBorrador {
    if (d.secciones.find((s) => s.esDefecto)) return d;
    return { ...d, secciones: [seccionDefectoVacia(), ...d.secciones] };
  }

  // Actualizar lineas de la seccion por defecto
  function actualizarLineasDefecto(lineas: DraftSeccion["lineas"]) {
    setDraft((d) => {
      const draft_ = asegurarSeccionDefecto(d);
      return {
        ...draft_,
        secciones: draft_.secciones.map((s) =>
          s.esDefecto ? { ...s, lineas } : s
        ),
      };
    });
  }

  // Actualizar cargosAdicionales de la seccion por defecto
  function actualizarCargosDefecto(
    cargosAdicionales: DraftSeccion["cargosAdicionales"]
  ) {
    setDraft((d) => {
      const draft_ = asegurarSeccionDefecto(d);
      return {
        ...draft_,
        secciones: draft_.secciones.map((s) =>
          s.esDefecto ? { ...s, cargosAdicionales } : s
        ),
      };
    });
  }

  // Errores de cargos de la seccion por defecto: recortar el prefijo "secciones.{i}."
  // para que EditorCargos pueda resolver "cargosAdicionales.{j}.descripcion" correctamente.
  const erroresCargosDefecto: Record<string, string> = {};
  if (indiceSeccionDefecto >= 0) {
    const prefijo = `secciones.${indiceSeccionDefecto}.`;
    for (const [clave, mensaje] of Object.entries(erroresCampo)) {
      if (clave.startsWith(prefijo)) {
        erroresCargosDefecto[clave.slice(prefijo.length)] = mensaje;
      }
    }
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
        <CardContent className="pt-5">
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

      {/* Lineas — camino principal (seccion por defecto) */}
      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base">
            Lineas ({seccionDefecto?.lineas.length ?? 0})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Agregue aqui los conceptos de la cotizacion. Para la mayoria de los casos,
            esto es todo lo necesario.
          </p>
        </CardHeader>
        <CardContent className="pt-5">
          <EditorLineas
            lineas={seccionDefecto?.lineas ?? []}
            erroresCampo={erroresCampo}
            disabled={guardando}
            onChange={actualizarLineasDefecto}
          />
        </CardContent>
      </Card>

      {/* Cargos adicionales de la seccion por defecto */}
      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base">
            Cargos adicionales ({seccionDefecto?.cargosAdicionales.length ?? 0})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Cargos extra de la cotizacion (escolta, viaticos, etc.). Suman al total.
          </p>
        </CardHeader>
        <CardContent className="pt-5">
          <EditorCargos
            cargos={seccionDefecto?.cargosAdicionales ?? []}
            erroresCampo={erroresCargosDefecto}
            disabled={guardando}
            onChange={actualizarCargosDefecto}
          />
        </CardContent>
      </Card>

      {/* Standby / tarifas a nivel version */}
      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base">
            Standby / tarifas ({draft.standbys.length})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Tarifas de standby a nivel de version (informativos, no suman al total).
          </p>
        </CardHeader>
        <CardContent className="pt-5">
          <EditorStandby
            standby={draft.standbys}
            disabled={guardando}
            onChange={(standbys) => setDraft((d) => ({ ...d, standbys }))}
          />
        </CardContent>
      </Card>

      {/* Lead times / plazos a nivel version */}
      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base">
            Lead times / plazos ({draft.leadTimes.length})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Plazos de entrega estimados para esta version (informativos).
          </p>
        </CardHeader>
        <CardContent className="pt-5">
          <EditorLeadtimes
            leadTimes={draft.leadTimes}
            erroresCampo={erroresCampo}
            disabled={guardando}
            onChange={(leadTimes) => setDraft((d) => ({ ...d, leadTimes }))}
          />
        </CardContent>
      </Card>

      <Separator />

      {/* Secciones — agrupacion OPCIONAL (opt-in) */}
      {agruparEnSecciones ? (
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base">
                Secciones ({seccionesExplicitas.length})
              </CardTitle>
              {!haySeccionesExplicitas ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={guardando}
                  onClick={() => setAgruparManual(false)}
                >
                  Ocultar
                </Button>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">
              Agrupe lineas en bloques con nombre (ej.: varios tramos o servicios
              diferenciados). Uselas solo si la cotizacion lo necesita.
            </p>
          </CardHeader>
          <CardContent className="pt-5">
            <EditorSecciones
              secciones={draft.secciones}
              erroresCampo={erroresCampo}
              disabled={guardando}
              onChange={(secciones) => setDraft((d) => ({ ...d, secciones }))}
            />
          </CardContent>
        </Card>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          disabled={guardando}
          onClick={() => setAgruparManual(true)}
        >
          <LayersIcon data-icon="inline-start" />
          Agrupar en secciones (opcional)
        </Button>
      )}

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
