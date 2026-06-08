import { Badge } from "@/compartido/componentes/ui/badge";
import type { EstadoProspecto } from "../tipos/prospecto.tipos";

type Props = {
  estado: EstadoProspecto;
};

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"];

function variantPorEstado(estado: EstadoProspecto): BadgeVariant {
  if (estado === "ACTIVO") return "default";
  if (estado === "CONVERTIDO") return "secondary";
  return "destructive"; // DESCARTADO
}

function etiquetaPorEstado(estado: EstadoProspecto): string {
  if (estado === "ACTIVO") return "Activo";
  if (estado === "CONVERTIDO") return "Convertido";
  return "Descartado";
}

export function EstadoProspectoBadge({ estado }: Props) {
  return (
    <Badge variant={variantPorEstado(estado)}>
      {etiquetaPorEstado(estado)}
    </Badge>
  );
}
