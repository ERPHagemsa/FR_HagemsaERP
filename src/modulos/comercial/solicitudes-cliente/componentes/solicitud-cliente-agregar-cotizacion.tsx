import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/compartido/componentes/ui/button";

import { accionesPermitidasSC } from "../tipos/solicitud-cliente.tipos";
import type { EstadoSolicitudCliente } from "../tipos/solicitud-cliente.tipos";

type Props = {
  id: string;
  estado: EstadoSolicitudCliente;
  size?: React.ComponentProps<typeof Button>["size"];
  variant?: React.ComponentProps<typeof Button>["variant"];
};

// Navega al editor de creacion de cotizacion. Ya NO crea nada al click: la
// cotizacion nace poblada y solo se persiste cuando el usuario guarda el
// borrador con al menos una linea. Se autoesconde si el estado no permite
// agregar (CERRADA / DESCARTADA).
export function SolicitudClienteAgregarCotizacion({
  id,
  estado,
  size = "sm",
  variant = "outline",
}: Props) {
  if (!accionesPermitidasSC(estado).agregarCotizacion) {
    return null;
  }

  return (
    <Button asChild variant={variant} size={size}>
      <Link href={`/comercial/solicitudes-cliente/${id}/cotizar`}>
        <Plus data-icon="inline-start" />
        Agregar cotizacion
      </Link>
    </Button>
  );
}
