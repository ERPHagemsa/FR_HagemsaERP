"use client";

import { Package, Truck } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/compartido/componentes/ui/dialog";

import type { ModoServicio } from "../servicios/cotizaciones-editor.utils";

type Props = {
  abierto: boolean;
  onElegir: (modo: ModoServicio) => void;
  onCerrar: () => void;
};

/**
 * Modal-gate inicial de la cotización: se elige si va a ser de TRANSPORTE u OTROS
 * servicios antes de armar el contenido. La elección siembra la línea inicial y
 * acota el selector de tipo de servicio (no se persiste — es solo UX del editor).
 */
export function CotizacionTipoServicioModal({ abierto, onElegir, onCerrar }: Props) {
  return (
    <Dialog open={abierto} onOpenChange={(v) => (!v ? onCerrar() : undefined)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>¿Qué vas a cotizar?</DialogTitle>
          <DialogDescription>
            Elige el tipo de servicio de esta cotización. Luego armas el resto del
            contenido.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <OpcionServicio
            icono={<Truck className="size-6" />}
            titulo="Transporte"
            descripcion="Transporte de carga con rutas origen/destino."
            onClick={() => onElegir("TRANSPORTE")}
          />
          <OpcionServicio
            icono={<Package className="size-6" />}
            titulo="Otros servicios"
            descripcion="Alquiler de equipo, almacenaje, personal y otros."
            onClick={() => onElegir("OTROS")}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OpcionServicio({
  icono,
  titulo,
  descripcion,
  onClick,
}: {
  icono: React.ReactNode;
  titulo: string;
  descripcion: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-start gap-2 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icono}
      </span>
      <span className="text-sm font-semibold text-foreground">{titulo}</span>
      <span className="text-xs text-muted-foreground">{descripcion}</span>
    </button>
  );
}
