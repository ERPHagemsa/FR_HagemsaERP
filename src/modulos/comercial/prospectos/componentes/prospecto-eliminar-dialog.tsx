"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { esError409, extraerMensajeError } from "@/compartido/api";
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

export function ProspectoEliminarDialog({ idProspecto }: Props) {
  const router = useRouter();
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
      router.push("/comercial/prospectos");
      router.refresh();
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
        <Button type="button" variant="destructive">
          Eliminar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar prospecto</AlertDialogTitle>
          <AlertDialogDescription>
            Eliminar da de baja el registro (y sus contactos). Es para registros
            que no debian existir (duplicados, pruebas, cargas erroneas), no para
            descalificar un lead real — para eso usa Descartar. El prospecto dejara
            de aparecer en el listado.
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
