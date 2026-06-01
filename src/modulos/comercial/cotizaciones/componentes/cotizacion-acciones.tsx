"use client";

import Link from "next/link";
import { Edit, Send, GitBranch, Trophy, XCircle, X } from "lucide-react";

import { Button } from "@/compartido/componentes/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/compartido/componentes/ui/tooltip";

import type { Cotizacion, EstadoCotizacion } from "../tipos/cotizaciones.tipos";
import { accionesPermitidas } from "../tipos/cotizaciones.tipos";

type Props = {
  cotizacion: Cotizacion;
};

// Stub UI — Slice 2: renderiza botones gateados por estado.
// La logica real de mutaciones se conecta en Slice 4.
export function CotizacionAcciones({ cotizacion }: Props) {
  const { id, estado, versionVigente, versiones } = cotizacion;
  const acciones = accionesPermitidas(estado);

  // editar ademas exige version vigente no congelada
  const versionActual = versiones.find((v) => v.numeroVersion === versionVigente);
  const puedeEditar = acciones.editar && versionActual !== undefined && !versionActual.congelada;

  const motivoTerminal = obtenerMotivoTerminal(estado);

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-2">
        {/* Editar borrador */}
        <AccionBoton
          label="Editar"
          icono={<Edit data-icon="inline-start" />}
          habilitado={puedeEditar}
          tooltip={
            !acciones.editar
              ? motivoTerminal ?? "No se puede editar en este estado"
              : !puedeEditar
                ? "La version vigente ya esta congelada"
                : undefined
          }
          href={puedeEditar ? `/comercial/cotizaciones/${id}/editar` : undefined}
          variant="outline"
        />

        {/* Enviar */}
        <AccionBoton
          label="Enviar"
          icono={<Send data-icon="inline-start" />}
          habilitado={acciones.enviar}
          tooltip={
            !acciones.enviar
              ? motivoTerminal ?? "No se puede enviar en este estado"
              : undefined
          }
          variant="default"
          // onClick se conecta en Slice 4
        />

        {/* Nueva version */}
        <AccionBoton
          label="Nueva version"
          icono={<GitBranch data-icon="inline-start" />}
          habilitado={acciones.nuevaVersion}
          tooltip={
            !acciones.nuevaVersion
              ? motivoTerminal ?? "No se puede crear una nueva version en este estado"
              : undefined
          }
          variant="outline"
          // onClick se conecta en Slice 4
        />

        {/* Marcar ganada */}
        <AccionBoton
          label="Marcar ganada"
          icono={<Trophy data-icon="inline-start" />}
          habilitado={acciones.ganar}
          tooltip={
            !acciones.ganar
              ? motivoTerminal ?? "No se puede marcar como ganada en este estado"
              : undefined
          }
          variant="outline"
          // onClick se conecta en Slice 4
        />

        {/* Marcar perdida */}
        <AccionBoton
          label="Marcar perdida"
          icono={<XCircle data-icon="inline-start" />}
          habilitado={acciones.perder}
          tooltip={
            !acciones.perder
              ? motivoTerminal ?? "No se puede marcar como perdida en este estado"
              : undefined
          }
          variant="destructive"
          // onClick se conecta en Slice 4
        />

        {/* Cancelar */}
        <AccionBoton
          label="Cancelar"
          icono={<X data-icon="inline-start" />}
          habilitado={acciones.cancelar}
          tooltip={
            !acciones.cancelar
              ? motivoTerminal ?? "Solo se puede cancelar desde BORRADOR"
              : undefined
          }
          variant="outline"
          // onClick se conecta en Slice 4
        />
      </div>
    </TooltipProvider>
  );
}

// ---------------------------------------------------------------------------
// Sub-componente boton de accion gateado
// ---------------------------------------------------------------------------

type AccionBotonProps = {
  label: string;
  icono: React.ReactNode;
  habilitado: boolean;
  tooltip?: string;
  href?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  onClick?: () => void;
};

function AccionBoton({
  label,
  icono,
  habilitado,
  tooltip,
  href,
  variant = "outline",
  onClick,
}: AccionBotonProps) {
  if (habilitado) {
    if (href) {
      return (
        <Button asChild variant={variant}>
          <Link href={href}>
            {icono}
            {label}
          </Link>
        </Button>
      );
    }
    return (
      <Button variant={variant} onClick={onClick}>
        {icono}
        {label}
      </Button>
    );
  }

  // Deshabilitado con tooltip explicativo
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* span necesario para que el tooltip funcione sobre un boton disabled */}
        <span>
          <Button variant={variant} disabled>
            {icono}
            {label}
          </Button>
        </span>
      </TooltipTrigger>
      {tooltip ? <TooltipContent>{tooltip}</TooltipContent> : null}
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------
// Helper: texto explicativo para estados terminales
// ---------------------------------------------------------------------------

function obtenerMotivoTerminal(estado: EstadoCotizacion): string | null {
  switch (estado) {
    case "GANADA":
      return "La cotizacion fue marcada como ganada y no admite mas cambios";
    case "PERDIDA":
      return "La cotizacion fue marcada como perdida y no admite mas cambios";
    case "CANCELADA":
      return "La cotizacion fue cancelada y no admite mas cambios";
    case "VENCIDA":
      return "La cotizacion vencio y no admite mas cambios";
    default:
      return null;
  }
}
