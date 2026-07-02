"use client";

import * as React from "react";
import { toast } from "sonner";
import { CheckIcon, LoaderIcon, TriangleAlertIcon } from "lucide-react";

import { esErrorValidacion, extraerMensajeError, obtenerErroresPorCampo } from "@/compartido/api";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/compartido/componentes/ui/accordion";
import { Label } from "@/compartido/componentes/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select";

import type { Moneda, OrigenTipo, Version } from "../tipos/cotizaciones.tipos";
import type { DraftBorrador } from "../servicios/cotizaciones-editor.utils";
import {
  armarPayloadBorrador,
  derivarDraft,
  validarBorrador,
} from "../servicios/cotizaciones-editor.utils";
import { useActualizarBorradorMutation } from "../servicios/cotizaciones-queries";
import { CotizacionSeccionesEditor } from "./cotizacion-secciones-editor";
import { EditorLeadtimes } from "./editor-leadtimes";

type Props = {
  idCotizacion: string;
  version: Version;
  clienteTipo?: OrigenTipo;
  clienteId?: string;
};

type EstadoGuardado = "idle" | "guardando" | "guardado" | "error";

/**
 * Edicion INLINE del contenido de la version vigente, directamente en el detalle de
 * la cotizacion (reemplaza al editor de pagina completa). El contenido se arma por
 * secciones (cada una con su ruta) via CotizacionSeccionesEditor; cada cambio se
 * persiste de inmediato con PATCH /borrador (replacement idempotente). La barra de
 * estado refleja el guardado. Los subtotales mostrados son estimados (el backend
 * recalcula al guardar).
 */
export function CotizacionVersionEditable({ idCotizacion, version, clienteTipo, clienteId }: Props) {
  const [draft, setDraft] = React.useState<DraftBorrador>(() => derivarDraft(version));
  const [estado, setEstado] = React.useState<EstadoGuardado>("idle");

  const guardarMutation = useActualizarBorradorMutation(idCotizacion);

  // Persiste el draft completo. Devuelve true si guardo; false si fue rechazado.
  async function persistir(next: DraftBorrador): Promise<boolean> {
    const errores = validarBorrador(next);
    if (Object.keys(errores).length > 0) {
      setEstado("error");
      const primero = Object.values(errores)[0];
      toast.error(primero ?? "Revise los campos antes de guardar.");
      return false;
    }
    setEstado("guardando");
    try {
      await guardarMutation.mutateAsync(armarPayloadBorrador(next));
      setEstado("guardado");
      return true;
    } catch (err) {
      setEstado("error");
      if (esErrorValidacion(err)) {
        toast.error(extraerMensajeError(err, "No se pudo guardar el borrador."));
      } else {
        const porCampo = obtenerErroresPorCampo(err);
        const claves = Object.keys(porCampo);
        toast.error(
          claves.length > 0
            ? porCampo[claves[0]].mensaje
            : extraerMensajeError(err, "Error al guardar el borrador.")
        );
      }
      return false;
    }
  }

  function aplicar(next: DraftBorrador) {
    setDraft(next);
    void persistir(next);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar: moneda + estado de guardado */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5">
        <Label htmlFor="moneda-inline" className="text-xs font-medium text-muted-foreground">
          Moneda <span className="text-destructive">*</span>
        </Label>
        <Select
          value={draft.moneda}
          onValueChange={(v) => aplicar({ ...draft, moneda: v as Moneda })}
          disabled={estado === "guardando"}
        >
          <SelectTrigger id="moneda-inline" size="sm" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PEN">PEN — Sol peruano</SelectItem>
            <SelectItem value="USD">USD — Dolar</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <IndicadorGuardado estado={estado} />
        </div>
      </div>

      {/* Contenido por secciones (crear/editar via modales) */}
      <CotizacionSeccionesEditor
        secciones={draft.secciones}
        moneda={draft.moneda}
        disabled={estado === "guardando"}
        clienteTipo={clienteTipo}
        clienteId={clienteId}
        onChange={(secciones) => aplicar({ ...draft, secciones })}
      />

      {/* Lead times (informativo, no suma al total) */}
      <div className="overflow-hidden rounded-xl border border-border">
        <Accordion type="multiple" className="rounded-none border-0">
          <AccordionItem value="leadtimes" className="border-0">
            <AccordionTrigger className="px-4">
              <div className="flex flex-col items-start gap-0.5 text-left">
                <span className="text-sm font-medium">Lead time ({draft.leadTimes.length})</span>
                <span className="text-xs font-normal text-muted-foreground">
                  Plazos de entrega de la version. No suman al total.
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="h-auto px-4">
              <EditorLeadtimes
                leadTimes={draft.leadTimes}
                disabled={estado === "guardando"}
                onChange={(leadTimes) => aplicar({ ...draft, leadTimes })}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}

function IndicadorGuardado({ estado }: { estado: EstadoGuardado }) {
  if (estado === "guardando") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <LoaderIcon className="size-3.5 animate-spin" />
        Guardando…
      </span>
    );
  }
  if (estado === "guardado") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-500">
        <CheckIcon className="size-3.5" />
        Guardado
      </span>
    );
  }
  if (estado === "error") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-destructive">
        <TriangleAlertIcon className="size-3.5" />
        No se pudo guardar
      </span>
    );
  }
  return null;
}
