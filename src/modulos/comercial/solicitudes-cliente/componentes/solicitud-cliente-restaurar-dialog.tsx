"use client";

import * as React from "react";
import { toast } from "sonner";

import { extraerMensajeError, invalidarConsulta } from "@/compartido/api";
import {
  CLAVE_SOLICITUDES_CLIENTE,
  CLAVE_SOLICITUDES_CLIENTE_RESUMEN,
} from "../../claves-consulta";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/compartido/componentes/ui/alert-dialog";
import { Button } from "@/compartido/componentes/ui/button";

import { useRestaurarSolicitudMutation } from "../servicios/solicitudes-cliente-queries";

type Props = {
  idSolicitud: string;
  abierto: boolean;
  onCerrar: () => void;
};

// Dialogo controlado de restaurar (revertir la baja logica) desde la fila del
// listado. Controlado —sin trigger propio— porque se abre desde el menu `⋯` de
// la tabla generica. A diferencia del prospecto, el detalle de una solicitud
// eliminada SI carga; aun asi Restaurar vive en la fila del listado por
// consistencia con el pilot.
export function SolicitudClienteRestaurarDialog({
  idSolicitud,
  abierto,
  onCerrar,
}: Props) {
  const [isPending, setIsPending] = React.useState(false);

  const restaurarMutation = useRestaurarSolicitudMutation();

  function handleOpenChange(open: boolean) {
    if (!open && !isPending) onCerrar();
  }

  async function onConfirmar(event: React.MouseEvent) {
    event.preventDefault();
    setIsPending(true);
    try {
      await restaurarMutation.mutateAsync(idSolicitud);
      toast.success("Solicitud restaurada", {
        description: "El registro volvio a estar activo.",
      });
      invalidarConsulta(CLAVE_SOLICITUDES_CLIENTE);
      invalidarConsulta(CLAVE_SOLICITUDES_CLIENTE_RESUMEN);
      onCerrar();
    } catch (err) {
      // 409 (D7b): el prospecto de origen esta eliminado. El backend devuelve un
      // mensaje en espanol nombrando al prospecto padre y pidiendo restaurarlo
      // primero — se muestra tal cual (informativo; sin boton de restaurar padre).
      toast.error(
        extraerMensajeError(err, "No se pudo restaurar la solicitud")
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AlertDialog open={abierto} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Restaurar solicitud</AlertDialogTitle>
          <AlertDialogDescription>
            La solicitud volvera al listado como registro activo, conservando su
            estado de negocio. Es la accion inversa a Eliminar.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <Button type="button" onClick={onConfirmar} disabled={isPending}>
            {isPending ? "Restaurando..." : "Confirmar restauracion"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
