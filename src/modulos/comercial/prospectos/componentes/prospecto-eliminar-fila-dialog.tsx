"use client";

import * as React from "react";
import { IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";

import { esError409, extraerMensajeError, invalidarConsulta } from "@/compartido/api";
import { CLAVE_PROSPECTOS } from "../../claves-consulta";
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

import { useEliminarProspectoMutation } from "../servicios/prospectos-queries";

type Props = {
  idProspecto: string;
};

// Variante compacta (fila del listado) del dialogo de eliminar. Reutiliza la misma
// mutacion y el mismo manejo de 409 que ProspectoEliminarDialog (detalle), pero se
// queda en el listado: no navega, solo invalida la clave para que la fila se muestre
// tachada en sitio (el listado se pide con incluirEliminados=true).
export function ProspectoEliminarFilaDialog({ idProspecto }: Props) {
  const [abierto, setAbierto] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);

  const eliminarMutation = useEliminarProspectoMutation();

  function handleOpenChange(open: boolean) {
    if (!open) setIsPending(false);
    setAbierto(open);
  }

  async function onConfirmar(event: React.MouseEvent) {
    event.preventDefault();
    setIsPending(true);
    try {
      await eliminarMutation.mutateAsync(idProspecto);
      setAbierto(false);
      toast.success("Prospecto eliminado", {
        description: "El registro fue dado de baja.",
      });
      invalidarConsulta(CLAVE_PROSPECTOS);
    } catch (err) {
      // 409: tiene actividad comercial — no se elimina, se descarta.
      if (esError409(err)) {
        toast.error(
          "No se puede eliminar: el prospecto tiene actividad comercial. Si corresponde, usa Descartar."
        );
      } else {
        toast.error(extraerMensajeError(err, "No se pudo eliminar el prospecto"));
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AlertDialog open={abierto} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          className="text-destructive hover:text-destructive"
        >
          <IconTrash />
          <span className="sr-only">Eliminar</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar prospecto</AlertDialogTitle>
          <AlertDialogDescription>
            Eliminar da de baja el registro (y sus contactos). Es para registros
            que no debian existir (duplicados, pruebas, cargas erroneas), no para
            descalificar un lead real — para eso usa Descartar. Podras revertirlo
            con Restaurar.
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
