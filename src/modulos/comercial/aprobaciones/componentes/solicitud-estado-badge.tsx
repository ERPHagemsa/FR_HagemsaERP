import { Badge } from "@/compartido/componentes/ui/badge";

import type { EstadoSolicitud } from "../tipos/aprobaciones.tipos";

type Props = { estado: EstadoSolicitud };
type BadgeVariant = React.ComponentProps<typeof Badge>["variant"];

function variantPorEstado(estado: EstadoSolicitud): BadgeVariant {
  switch (estado) {
    case "EN_APROBACION":
      return "outline";
    case "APROBADA":
      return "default";
    case "RECHAZADA":
      return "destructive";
  }
}

function etiquetaPorEstado(estado: EstadoSolicitud): string {
  switch (estado) {
    case "EN_APROBACION":
      return "Pendiente";
    case "APROBADA":
      return "Aprobada";
    case "RECHAZADA":
      return "Rechazada";
  }
}

export function SolicitudEstadoBadge({ estado }: Props) {
  return <Badge variant={variantPorEstado(estado)}>{etiquetaPorEstado(estado)}</Badge>;
}
