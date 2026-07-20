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
import { ProspectoEliminarDialog } from "./prospecto-eliminar-dialog";
import { ProspectoReactivarDialog } from "./prospecto-reactivar-dialog";

type Props = {
  idProspecto: string;
  estado: EstadoProspecto;
};

export function ProspectoAcciones({ idProspecto, estado }: Props) {
  // Gating por estado (contrato §3 + notas §7.4):
  // - ACTIVO: editar, descartar y eliminar.
  // - DESCARTADO: solo reactivar (y eliminar, si no tiene actividad comercial).
  // - CONVERTIDO: terminal, no admite ninguna accion de escritura.
  return (
    <div className="flex flex-wrap gap-2">
      {estado === "ACTIVO" ? (
        <>
          <Button asChild variant="outline">
            <Link href={`/comercial/prospectos/${idProspecto}/editar`}>
              Editar
            </Link>
          </Button>
          <ProspectoDescartarDialog idProspecto={idProspecto} />
          <ProspectoEliminarDialog idProspecto={idProspecto} />
        </>
      ) : null}

      {estado === "DESCARTADO" ? (
        <>
          <ProspectoReactivarDialog idProspecto={idProspecto} />
          <ProspectoEliminarDialog idProspecto={idProspecto} />
        </>
      ) : null}

      {estado === "CONVERTIDO" ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button variant="outline" disabled>
                Editar
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            El prospecto fue convertido y no admite cambios
          </TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
}
