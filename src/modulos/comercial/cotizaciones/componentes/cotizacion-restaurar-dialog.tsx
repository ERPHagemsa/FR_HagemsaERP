"use client";

import * as React from "react";
import { toast } from "sonner";

import { extraerMensajeError, invalidarConsulta } from "@/compartido/api";
import {
  CLAVE_COTIZACIONES,
  CLAVE_COTIZACIONES_RESUMEN,
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

import { useRestaurarCotizacionMutation } from "../servicios/cotizaciones-queries";

type Props = {
  idCotizacion: string;
  abierto: boolean;
  onCerrar: () => void;
};

// Dialogo controlado de restaurar (revertir la baja logica) desde la fila del
// listado. Controlado —sin trigger propio— porque se abre desde el menu `⋯` de
// la tabla generica. Restaurar vive en la fila del listado por consistencia con
// el pilot de prospectos/solicitud.
export function CotizacionRestaurarDialog({
  idCotizacion,
  abierto,
  onCerrar,
}: Props) {
  const [isPending, setIsPending] = React.useState(false);

  const restaurarMutation = useRestaurarCotizacionMutation();

  function handleOpenChange(open: boolean) {
    if (!open && !isPending) onCerrar();
  }

  async function onConfirmar(event: React.MouseEvent) {
    event.preventDefault();
    setIsPending(true);
    try {
      await restaurarMutation.mutateAsync(idCotizacion);
      toast.success("Cotización restaurada", {
        description: "El registro volvio a estar activo.",
      });
      invalidarConsulta(CLAVE_COTIZACIONES);
      invalidarConsulta(CLAVE_COTIZACIONES_RESUMEN);
      onCerrar();
    } catch (err) {
      // 409 (D7b): la solicitud de origen esta eliminada. El backend devuelve un
      // mensaje en espanol nombrando a la solicitud padre y pidiendo restaurarla
      // primero — se muestra tal cual (informativo; sin boton de restaurar padre).
      toast.error(extraerMensajeError(err, "No se pudo restaurar la cotización"));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AlertDialog open={abierto} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Restaurar cotización</AlertDialogTitle>
          <AlertDialogDescription>
            La cotización volvera al listado como registro activo, conservando su
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
