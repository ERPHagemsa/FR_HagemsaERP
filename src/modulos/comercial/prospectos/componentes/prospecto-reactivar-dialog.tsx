"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { extraerMensajeError, invalidarConsulta } from "@/compartido/api";
import {
  CLAVE_PROSPECTOS,
  CLAVE_PROSPECTO_DETALLE,
  CLAVE_PROSPECTO_HISTORIAL,
} from "../../claves-consulta";
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

import { useReactivarProspectoMutation } from "../servicios/prospectos-queries";

type Props = {
  idProspecto: string;
};

export function ProspectoReactivarDialog({ idProspecto }: Props) {
  const router = useRouter();
  const [abierto, setAbierto] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);

  const reactivarMutation = useReactivarProspectoMutation();

  function handleOpenChange(open: boolean) {
    if (!open) setIsPending(false);
    setAbierto(open);
  }

  async function onConfirmar(event: React.MouseEvent) {
    event.preventDefault();
    setIsPending(true);
    try {
      await reactivarMutation.mutateAsync(idProspecto);
      setAbierto(false);
      invalidarConsulta(CLAVE_PROSPECTOS);
      invalidarConsulta(CLAVE_PROSPECTO_DETALLE);
      invalidarConsulta(CLAVE_PROSPECTO_HISTORIAL);
      router.push(`/comercial/prospectos/${idProspecto}?accion=reactivado`);
    } catch (err) {
      toast.error(extraerMensajeError(err, "No se pudo reactivar el prospecto"));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AlertDialog open={abierto} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button type="button">Reactivar</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reactivar prospecto</AlertDialogTitle>
          <AlertDialogDescription>
            El prospecto volvera a la cartera en estado ACTIVO y se limpiara el
            motivo de descarte. Podras volver a gestionarlo normalmente.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <Button type="button" onClick={onConfirmar} disabled={isPending}>
            {isPending ? "Reactivando..." : "Confirmar reactivacion"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
