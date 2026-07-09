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
    case "OBSERVADA":
      return "secondary";
  }
}

function etiquetaPorEstado(estado: EstadoSolicitud): string {
  switch (estado) {
    case "EN_APROBACION":
      return "En aprobación";
    case "APROBADA":
      return "Aprobada";
    case "RECHAZADA":
      return "Rechazada";
    case "OBSERVADA":
      return "Observada";
  }
}

export function SolicitudEstadoBadge({ estado }: Props) {
  return <Badge variant={variantPorEstado(estado)}>{etiquetaPorEstado(estado)}</Badge>;
}
