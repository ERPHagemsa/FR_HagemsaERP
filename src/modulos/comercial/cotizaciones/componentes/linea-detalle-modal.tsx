"use client";

import * as React from "react";

import { Button } from "@/compartido/componentes/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/compartido/componentes/ui/dialog";
import type { CatalogoCargoAdicional, OrigenTipo } from "../tipos/cotizaciones.tipos";
import type { DraftLinea } from "../servicios/cotizaciones-editor.utils";
import { montoCargo } from "../servicios/cotizaciones-editor.utils";
import { LineaFormulario } from "./linea-formulario";
import { etiquetaTipo, formatearMoneda, totalLinea } from "./lineas-grid.utils";

type Props = {
  abierto: boolean;
  // Linea a editar (copia de trabajo: el modal mantiene su propio borrador y solo
  // confirma con "Aplicar"). null cuando no hay nada abierto.
  linea: DraftLinea | null;
  // Titulo/subtitulo contextual (nombre de la seccion a la que pertenece la linea).
  seccionNombre?: string;
  // Ruta de la seccion: la linea de transporte la hereda (no se edita aca).
  rutaSeccion?: { origen: string; destino: string };
  moneda: string;
  opcionesCatalogo: CatalogoCargoAdicional[];
  disabled?: boolean;
  // Origen de la cotizacion: acota el precio sugerido al historial del cliente.
  clienteTipo?: OrigenTipo;
  clienteId?: string;
  onCerrar: () => void;
  onGuardar: (linea: DraftLinea) => void;
};

/**
 * Modal de edicion de UNA sola linea. Reutiliza LineaFormulario (pestañas Servicio ·
 * Detalle · Precio · Cargos). La ruta se hereda de la seccion (no se edita aca).
 *
 * Controlado por confirmacion: trabaja sobre una copia local y emite onGuardar(linea)
 * solo al pulsar "Aplicar"; "Cancelar" descarta los cambios.
 */
export function LineaDetalleModal({
  abierto,
  linea,
  seccionNombre,
  rutaSeccion,
  moneda,
  opcionesCatalogo,
  disabled,
  clienteTipo,
  clienteId,
  onCerrar,
  onGuardar,
}: Props) {
  const [borrador, setBorrador] = React.useState<DraftLinea | null>(linea);
  const [claveActual, setClaveActual] = React.useState<string | null>(
    linea?.claveCliente ?? null
  );

  // Re-sincronizar el borrador cuando entra otra linea (o null), sin useEffect:
  // patron de ajuste de estado durante el render recomendado por React.
  const claveEntrante = linea?.claveCliente ?? null;
  if (claveEntrante !== claveActual) {
    setClaveActual(claveEntrante);
    setBorrador(linea);
  }

  if (!borrador) return null;

  const total =
    totalLinea(borrador) +
    borrador.cargosAdicionales.reduce((a, c) => a + montoCargo(c), 0);

  // La modalidad es obligatoria (el backend la exige como UUID). Sin ella no se
  // puede aplicar la linea: evita guardar un borrador que el backend rechazaria.
  const faltaModalidad = borrador.idModalidad.trim() === "";

  return (
    <Dialog open={abierto} onOpenChange={(v) => (!v ? onCerrar() : undefined)}>
      <DialogContent className="flex max-h-[95vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-7xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
          <DialogTitle>Editar linea ({etiquetaTipo(borrador.tipoLinea)})</DialogTitle>
          <DialogDescription>
            {seccionNombre
              ? `Seccion: ${seccionNombre}. Solo se edita la informacion de esta linea.`
              : "Solo se edita la informacion de esta linea."}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-5 p-6">
            <LineaFormulario
              linea={borrador}
              moneda={moneda}
              opcionesCatalogo={opcionesCatalogo}
              disabled={disabled}
              clienteTipo={clienteTipo}
              clienteId={clienteId}
              rutaSeccion={rutaSeccion}
              onChange={(l) => setBorrador(l)}
            />
          </div>
        </div>

        <DialogFooter className="shrink-0 flex-row items-center justify-between gap-3 border-t border-border px-6 py-3">
          <span className="text-sm text-muted-foreground">
            Total linea:{" "}
            <span className="font-mono font-semibold text-foreground tabular-nums">
              {formatearMoneda(total, moneda)}
            </span>
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCerrar}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={disabled || faltaModalidad}
              title={faltaModalidad ? "Selecciona una modalidad" : undefined}
              onClick={() => onGuardar(borrador)}
            >
              Aplicar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
