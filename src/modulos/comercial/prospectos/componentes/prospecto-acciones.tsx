"use client";

import Link from "next/link";

import { Button } from "@/compartido/componentes/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/compartido/componentes/ui/tooltip";

import type { EstadoProspecto } from "../tipos/prospecto.tipos";
import { ProspectoDescartarDialog } from "./prospecto-descartar-dialog";

type Props = {
  idProspecto: number;
  estado: EstadoProspecto;
};

export function ProspectoAcciones({ idProspecto, estado }: Props) {
  const esTerminal = estado !== "ACTIVO";
  const motivoBloqueo =
    estado === "DESCARTADO"
      ? "El prospecto esta descartado y no admite cambios"
      : estado === "CONVERTIDO"
        ? "El prospecto fue convertido y no admite cambios"
        : null;

  return (
    <div className="flex flex-wrap gap-2">
      {esTerminal ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button variant="outline" disabled>
                Editar
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>{motivoBloqueo}</TooltipContent>
        </Tooltip>
      ) : (
        <Button asChild variant="outline">
          <Link href={`/comercial/prospectos/${idProspecto}/editar`}>
            Editar
          </Link>
        </Button>
      )}

      {esTerminal ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button variant="destructive" disabled>
                Descartar
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>{motivoBloqueo}</TooltipContent>
        </Tooltip>
      ) : (
        <ProspectoDescartarDialog idProspecto={idProspecto} />
      )}
    </div>
  );
}
