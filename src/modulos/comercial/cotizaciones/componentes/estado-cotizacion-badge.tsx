import { Badge } from "@/compartido/componentes/ui/badge";
import type { EstadoCotizacion } from "../tipos/cotizaciones.tipos";

type Props = {
  estado: EstadoCotizacion;
};

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"];

function variantPorEstado(estado: EstadoCotizacion): BadgeVariant {
  switch (estado) {
    case "BORRADOR":
      return "secondary";
    case "ENVIADA":
      return "default";
    case "EN_REVISION":
      return "outline";
    case "GANADA":
      return "default";
    case "PERDIDA":
      return "destructive";
    case "CANCELADA":
      return "destructive";
    case "VENCIDA":
      return "secondary";
  }
}

function etiquetaPorEstado(estado: EstadoCotizacion): string {
  switch (estado) {
    case "BORRADOR":
      return "Borrador";
    case "ENVIADA":
      return "Enviada";
    case "EN_REVISION":
      return "En revision";
    case "GANADA":
      return "Ganada";
    case "PERDIDA":
      return "Perdida";
    case "CANCELADA":
      return "Cancelada";
    case "VENCIDA":
      return "Vencida";
  }
}

export function EstadoCotizacionBadge({ estado }: Props) {
  return (
    <Badge variant={variantPorEstado(estado)}>
      {etiquetaPorEstado(estado)}
    </Badge>
  );
}
