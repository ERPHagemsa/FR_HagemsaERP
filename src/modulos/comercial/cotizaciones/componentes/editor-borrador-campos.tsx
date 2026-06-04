"use client";

import * as React from "react";

import { Button } from "@/compartido/componentes/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
import { Separator } from "@/compartido/componentes/ui/separator";

import type { DraftBorrador } from "../servicios/cotizaciones-editor.utils";
import { EditorLineas } from "./editor-lineas";
import { EditorSecciones } from "./editor-secciones";
import { EditorStandby, LabelStandby } from "./editor-standby";

// Presentacional puro del cuerpo del editor de borrador (secciones + lineas
// sueltas + standby + footer de guardado). No tiene logica de API: el contenedor
// (CotizacionEditor para editar, CotizacionEditorNuevo para crear) provee el
// estado del draft y el handler de guardado.
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
  return (
    <div className="flex flex-col gap-5">
      {/* Secciones */}
      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base">
            Secciones ({draft.secciones.length})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Las lineas y standby dentro de una seccion quedan agrupadas en el borrador.
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

      {/* Lineas sin seccion */}
      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base">
            Lineas sin seccion ({draft.lineasSinSeccion.length})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Servicios sueltos que no pertenecen a ninguna seccion.
          </p>
        </CardHeader>
        <CardContent className="pt-5">
          <EditorLineas
            lineas={draft.lineasSinSeccion}
            erroresCampo={erroresCampo}
            disabled={guardando}
            onChange={(lineasSinSeccion) =>
              setDraft((d) => ({ ...d, lineasSinSeccion }))
            }
          />
        </CardContent>
      </Card>

      {/* Standby sin seccion */}
      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base">
            <LabelStandby count={draft.standbySinSeccion.length} />
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Tarifas de standby a nivel de version (sin seccion asociada).
          </p>
        </CardHeader>
        <CardContent className="pt-5">
          <EditorStandby
            standby={draft.standbySinSeccion}
            disabled={guardando}
            onChange={(standbySinSeccion) =>
              setDraft((d) => ({ ...d, standbySinSeccion }))
            }
          />
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
