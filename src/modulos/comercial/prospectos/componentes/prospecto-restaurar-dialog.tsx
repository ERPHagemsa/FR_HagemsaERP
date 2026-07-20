"use client";

import * as React from "react";
import { IconRestore } from "@tabler/icons-react";
import { toast } from "sonner";

import { extraerMensajeError, invalidarConsulta } from "@/compartido/api";
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

import { useRestaurarProspectoMutation } from "../servicios/prospectos-queries";

// ROLES_RESTAURAR se promovio a @/compartido/autenticacion/roles cuando aparecio
// el segundo consumidor (solicitudes de cliente). Ya no se declara aca: la fuente
// unica de verdad vive en el modulo compartido de autenticacion.

type Props = {
  idProspecto: string;
};

// Dialogo de confirmacion para restaurar (revertir la baja logica) un prospecto
// desde la fila del listado. Vive en el listado —no en el detalle— porque el
// detalle de un prospecto eliminado responde 404.
export function ProspectoRestaurarDialog({ idProspecto }: Props) {
  const [abierto, setAbierto] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);

  const restaurarMutation = useRestaurarProspectoMutation();

  function handleOpenChange(open: boolean) {
    if (!open) setIsPending(false);
    setAbierto(open);
  }

  async function onConfirmar(event: React.MouseEvent) {
    event.preventDefault();
    setIsPending(true);
    try {
      await restaurarMutation.mutateAsync(idProspecto);
      setAbierto(false);
      toast.success("Prospecto restaurado", {
        description: "El registro volvio a estar activo.",
      });
      invalidarConsulta(CLAVE_PROSPECTOS);
    } catch (err) {
      toast.error(extraerMensajeError(err, "No se pudo restaurar el prospecto"));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AlertDialog open={abierto} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button type="button" size="icon-sm" variant="outline">
          <IconRestore />
          <span className="sr-only">Restaurar</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Restaurar prospecto</AlertDialogTitle>
          <AlertDialogDescription>
            El prospecto volvera al listado como registro activo, conservando su
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
