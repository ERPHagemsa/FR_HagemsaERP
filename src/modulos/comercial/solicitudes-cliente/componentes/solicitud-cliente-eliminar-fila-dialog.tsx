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

import { useEliminarSolicitudMutation } from "../servicios/solicitudes-cliente-queries";

type Props = {
  idSolicitud: string;
  abierto: boolean;
  onCerrar: () => void;
};

// Dialogo controlado de eliminar (baja logica) desde la fila del listado. Es
// controlado —no trae trigger propio— porque se abre desde el menu de acciones
// `⋯` de la tabla generica (TablaDatos). Reutiliza la misma mutacion; tras el
// exito invalida la clave para que la fila quede tachada en sitio (el listado se
// pide con incluirEliminados=true).
export function SolicitudClienteEliminarFilaDialog({
  idSolicitud,
  abierto,
  onCerrar,
}: Props) {
  const [isPending, setIsPending] = React.useState(false);

  const eliminarMutation = useEliminarSolicitudMutation();

  function handleOpenChange(open: boolean) {
    if (!open && !isPending) onCerrar();
  }

  async function onConfirmar(event: React.MouseEvent) {
    event.preventDefault();
    setIsPending(true);
    try {
      await eliminarMutation.mutateAsync(idSolicitud);
      toast.success("Solicitud eliminada", {
        description: "El registro fue dado de baja.",
      });
      invalidarConsulta(CLAVE_SOLICITUDES_CLIENTE);
      invalidarConsulta(CLAVE_SOLICITUDES_CLIENTE_RESUMEN);
      onCerrar();
    } catch (err) {
      // 409: la solicitud ya tiene una cotizacion. El backend devuelve un mensaje
      // en espanol mencionando las cotizaciones — se muestra tal cual.
      toast.error(extraerMensajeError(err, "No se pudo eliminar la solicitud"));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AlertDialog open={abierto} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar solicitud</AlertDialogTitle>
          <AlertDialogDescription>
            Eliminar da de baja el registro. Es para solicitudes que no debian
            existir (duplicados, pruebas, cargas erroneas), no para cerrar un caso
            real — para eso usa Descartar. Podras revertirlo con Restaurar.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirmar}
            disabled={isPending}
          >
            {isPending ? "Eliminando..." : "Confirmar eliminacion"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
