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

import { useEliminarCotizacionMutation } from "../servicios/cotizaciones-queries";

type Props = {
  idCotizacion: string;
  abierto: boolean;
  onCerrar: () => void;
};

// Dialogo controlado de eliminar (baja logica) desde la fila del listado. Es
// controlado —no trae trigger propio— porque se abre desde el menu de acciones
// `⋯` de la tabla generica (TablaDatos). Tras el exito invalida las claves para
// que la fila quede tachada en sitio (el listado se pide con incluirEliminados=true).
export function CotizacionEliminarFilaDialog({
  idCotizacion,
  abierto,
  onCerrar,
}: Props) {
  const [isPending, setIsPending] = React.useState(false);

  const eliminarMutation = useEliminarCotizacionMutation();

  function handleOpenChange(open: boolean) {
    if (!open && !isPending) onCerrar();
  }

  async function onConfirmar(event: React.MouseEvent) {
    event.preventDefault();
    setIsPending(true);
    try {
      await eliminarMutation.mutateAsync(idCotizacion);
      toast.success("Cotización eliminada", {
        description: "El registro fue dado de baja.",
      });
      invalidarConsulta(CLAVE_COTIZACIONES);
      invalidarConsulta(CLAVE_COTIZACIONES_RESUMEN);
      onCerrar();
    } catch (err) {
      // 409: la cotizacion no admite baja (GANADA, o con tarifario/contrato
      // asociado). El backend devuelve el motivo en espanol — se muestra tal cual.
      toast.error(extraerMensajeError(err, "No se pudo eliminar la cotización"));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AlertDialog open={abierto} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar cotización</AlertDialogTitle>
          <AlertDialogDescription>
            Eliminar da de baja el registro. Es para cotizaciones que no debian
            existir (duplicados, pruebas, cargas erroneas), no para descartar una
            oferta real — para eso marca Perdida. Podras revertirlo con Restaurar.
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
