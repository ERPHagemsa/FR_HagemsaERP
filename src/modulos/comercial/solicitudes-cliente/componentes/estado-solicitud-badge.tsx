"use client";

import { Badge } from "@/compartido/componentes/ui/badge";
import type { EstadoSolicitudCliente } from "../tipos/solicitud-cliente.tipos";

type Props = {
  estado: EstadoSolicitudCliente;
};

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"];

function variantPorEstado(estado: EstadoSolicitudCliente): BadgeVariant {
  switch (estado) {
    case "PENDIENTE":
      return "default";
    case "EN_COTIZACION":
      return "secondary";
    case "COTIZADA":
      return "outline";
    case "CERRADA":
      return "secondary";
    case "DESCARTADA":
      return "destructive";
  }
}

function etiquetaPorEstado(estado: EstadoSolicitudCliente): string {
  switch (estado) {
    case "PENDIENTE":
      return "Pendiente";
    case "EN_COTIZACION":
      return "En cotizacion";
    case "COTIZADA":
      return "Cotizada";
    case "CERRADA":
      return "Cerrada";
    case "DESCARTADA":
      return "Descartada";
  }
}

export function EstadoSolicitudBadge({ estado }: Props) {
  return (
    <Badge variant={variantPorEstado(estado)}>
      {etiquetaPorEstado(estado)}
    </Badge>
  );
}
