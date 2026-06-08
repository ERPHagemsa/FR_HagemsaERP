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
import { Separator } from "@/compartido/componentes/ui/separator";

import type { DraftBorrador } from "../servicios/cotizaciones-editor.utils";
import { EditorLineas } from "./editor-lineas";
import { EditorSecciones } from "./editor-secciones";
import { EditorStandby } from "./editor-standby";

// Presentacional puro del cuerpo del editor de borrador. No tiene logica de API:
// el contenedor (CotizacionEditor para editar, CotizacionEditorNuevo para crear)
// provee el estado del draft y el handler de guardado.
//
// Jerarquia de UX (ver dominio en API-Cotizaciones §5.4): el caso tipico de una
// cotizacion NO lleva secciones — las lineas van sueltas a nivel raiz. Por eso
// "Lineas" es el camino principal y "Secciones" es una agrupacion OPCIONAL que
// se ofrece solo cuando la cotizacion realmente tiene varios bloques.
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
  const haySecciones = draft.secciones.length > 0;
  // Estado derivado, sin effect: el panel se muestra si el usuario lo activó
  // manualmente O si el draft ya trae secciones (ej: al editar una cotización
  // existente o tras un refetch). "Ocultar" solo aplica cuando no hay secciones.
  const [agruparManual, setAgruparManual] = React.useState(false);
  const agruparEnSecciones = haySecciones || agruparManual;

  return (
    <div className="flex flex-col gap-5">
      {/* Lineas — camino principal */}
      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base">
            Lineas ({draft.lineasSinSeccion.length})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Agregue aquí los conceptos de la cotización. Para la mayoría de los casos,
            esto es todo lo necesario.
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

      {/* Standby / tarifas a nivel version */}
      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base">
            Standby / tarifas ({draft.standbySinSeccion.length})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Tarifas de standby a nivel de versión (opcional).
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

      {/* Secciones — agrupacion OPCIONAL (opt-in) */}
      {agruparEnSecciones ? (
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base">
                Secciones ({draft.secciones.length})
              </CardTitle>
              {!haySecciones ? (
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
              Agrupe líneas en bloques con nombre (ej.: varios tramos o servicios
              diferenciados). Úselas solo si la cotización lo necesita.
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
