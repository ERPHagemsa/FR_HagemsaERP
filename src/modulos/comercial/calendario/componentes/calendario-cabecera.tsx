"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/compartido/componentes/ui/button";

type Props = {
  mesVisible: Date;
  alAnterior: () => void;
  alSiguiente: () => void;
  alHoy: () => void;
};

// Cabecera de navegacion del calendario mensual: titulo del mes + anterior /
// siguiente / hoy. Sin selector Day/Week/Year: v1 entrega solo la vista Mes
// (ver proposal, "Alcance de vistas") — no agregar controles muertos.
export function CalendarioCabecera({
  mesVisible,
  alAnterior,
  alSiguiente,
  alHoy,
}: Props) {
  const titulo = format(mesVisible, "LLLL yyyy", { locale: es });

  return (
    <div className="flex items-center justify-between gap-3">
      <h1 className="text-xl font-semibold text-foreground capitalize">{titulo}</h1>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={alHoy}>
          Hoy
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={alAnterior}
          aria-label="Mes anterior"
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={alSiguiente}
          aria-label="Mes siguiente"
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
