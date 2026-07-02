"use client";

import * as React from "react";

import { Button } from "@/compartido/componentes/ui/button";
import { Input } from "@/compartido/componentes/ui/input";
import { Label } from "@/compartido/componentes/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/compartido/componentes/ui/dialog";
import type { DraftSeccion } from "../servicios/cotizaciones-editor.utils";
import { sincronizarRutaSeccion } from "../servicios/cotizaciones-editor.utils";

type Props = {
  abierto: boolean;
  // Seccion a editar (copia de trabajo). null cuando no hay nada abierto.
  seccion: DraftSeccion | null;
  disabled?: boolean;
  onCerrar: () => void;
  onGuardar: (seccion: DraftSeccion) => void;
};

/**
 * Modal para los DATOS de la seccion: nombre + ruta (origen/destino). La ruta se
 * captura una sola vez aca y todas las lineas de transporte la heredan.
 *
 * Controlado por confirmacion: trabaja sobre una copia local y emite onGuardar(seccion)
 * solo al pulsar "Aplicar"; "Cancelar" descarta los cambios.
 */
export function SeccionDatosModal({
  abierto,
  seccion,
  disabled,
  onCerrar,
  onGuardar,
}: Props) {
  const [borrador, setBorrador] = React.useState<DraftSeccion | null>(seccion);
  const [claveActual, setClaveActual] = React.useState<string | null>(
    seccion?.claveCliente ?? null
  );

  // Re-sincronizar el borrador cuando entra otra seccion (o null), sin useEffect.
  const claveEntrante = seccion?.claveCliente ?? null;
  if (claveEntrante !== claveActual) {
    setClaveActual(claveEntrante);
    setBorrador(seccion);
  }

  if (!borrador) return null;

  const set = (patch: Partial<DraftSeccion>) =>
    setBorrador((b) => (b ? { ...b, ...patch } : b));

  function aplicar() {
    // Al nombrar la seccion deja de ser el bucket "sin agrupar" (esDefecto). Luego
    // sincroniza la ruta en las lineas de transporte antes de emitir.
    const nombrada: DraftSeccion = {
      ...borrador!,
      esDefecto: borrador!.nombre.trim() !== "" ? false : borrador!.esDefecto,
    };
    onGuardar(sincronizarRutaSeccion(nombrada));
  }

  return (
    <Dialog open={abierto} onOpenChange={(v) => (!v ? onCerrar() : undefined)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Datos de la seccion</DialogTitle>
          <DialogDescription>
            Nombre y ruta de la seccion. Sus lineas de transporte heredan este origen
            y destino.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <Campo label="Nombre de la seccion" obligatorio>
            <Input
              value={borrador.nombre}
              disabled={disabled}
              placeholder="Ej: Tramo Lima - Mina"
              onChange={(e) => set({ nombre: e.target.value })}
            />
          </Campo>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Origen">
              <Input
                value={borrador.origen}
                disabled={disabled}
                placeholder="Ej: Lima"
                onChange={(e) => set({ origen: e.target.value })}
              />
            </Campo>
            <Campo label="Destino">
              <Input
                value={borrador.destino}
                disabled={disabled}
                placeholder="Ej: Mina"
                onChange={(e) => set({ destino: e.target.value })}
              />
            </Campo>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={disabled || borrador.nombre.trim() === ""}
            title={borrador.nombre.trim() === "" ? "Asigna un nombre a la seccion" : undefined}
            onClick={aplicar}
          >
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Campo({
  label,
  obligatorio,
  children,
}: {
  label: string;
  obligatorio?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">
        {label} {obligatorio ? <span className="text-destructive">*</span> : null}
      </Label>
      {children}
    </div>
  );
}
