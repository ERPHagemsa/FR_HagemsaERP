"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import {
  esError404,
  esError409,
  esErrorValidacion,
  extraerMensajeError,
} from "@/compartido/api";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/compartido/componentes/ui/alert-dialog";
import { Button } from "@/compartido/componentes/ui/button";

import { useAgregarCotizacionMutation } from "../servicios/solicitudes-cliente-queries";
import { accionesPermitidasSC } from "../tipos/solicitud-cliente.tipos";
import type { EstadoSolicitudCliente } from "../tipos/solicitud-cliente.tipos";

type Props = {
  id: string;
  estado: EstadoSolicitudCliente;
  size?: React.ComponentProps<typeof Button>["size"];
  variant?: React.ComponentProps<typeof Button>["variant"];
};

// Crea una cotizacion adicional sobre la SC. Pide confirmacion porque el POST
// persiste una cotizacion BORRADOR de inmediato (no es un borrador en memoria):
// sin confirmar, un click accidental ya deja un registro. Se autoesconde si el
// estado no permite agregar (CERRADA / DESCARTADA).
export function SolicitudClienteAgregarCotizacion({
  id,
  estado,
  size = "sm",
  variant = "outline",
}: Props) {
  const router = useRouter();
  const [abierto, setAbierto] = React.useState(false);
  const agregarMutation = useAgregarCotizacionMutation();

  if (!accionesPermitidasSC(estado).agregarCotizacion) {
    return null;
  }

  async function onConfirmar(event: React.MouseEvent) {
    event.preventDefault();
    try {
      const respuesta = await agregarMutation.mutateAsync(id);
      router.push(`/comercial/cotizaciones/${respuesta.idCotizacion}/editar`);
    } catch (err) {
      if (esError404(err)) {
        toast.error(extraerMensajeError(err, "Solicitud no encontrada"));
        setAbierto(false);
        return;
      }
      if (esError409(err)) {
        toast.error(
          extraerMensajeError(err, "No se puede agregar cotizacion: conflicto de origen")
        );
        setAbierto(false);
        return;
      }
      if (esErrorValidacion(err)) {
        toast.error(
          extraerMensajeError(err, "No se puede agregar cotizacion en este estado")
        );
        setAbierto(false);
        return;
      }
      toast.error(extraerMensajeError(err, "No se pudo agregar la cotizacion"));
      setAbierto(false);
    }
  }

  return (
    <AlertDialog open={abierto} onOpenChange={setAbierto}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant={variant} size={size}>
          <Plus data-icon="inline-start" />
          Agregar cotizacion
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Agregar cotizacion</AlertDialogTitle>
          <AlertDialogDescription>
            Se creara una nueva cotizacion en estado BORRADOR vinculada a esta
            solicitud y se abrira el editor. Si luego no la necesitas, puedes
            cancelarla desde la cotizacion.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={agregarMutation.isPending}>
            Cancelar
          </AlertDialogCancel>
          <Button
            type="button"
            onClick={onConfirmar}
            disabled={agregarMutation.isPending}
          >
            {agregarMutation.isPending ? "Creando..." : "Crear cotizacion"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
