"use client";

// Confirmacion de borrado reutilizable: envuelve cualquier boton (el trigger) en un
// AlertDialog que pide confirmar antes de ejecutar la accion destructiva. Asi todos
// los botones de eliminar del ERP comparten el mismo dialogo de "¿seguro?".
//
// Uso:
//   <ConfirmarEliminar onConfirmar={() => borrar(id)} descripcion="Se borrara la linea.">
//     <Button variant="ghost" size="sm" aria-label="Eliminar">
//       <Trash2Icon className="size-4" />
//     </Button>
//   </ConfirmarEliminar>

import * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/compartido/componentes/ui/alert-dialog";

type Props = {
  /** El disparador: normalmente un boton de icono. Se usa via asChild. */
  children: React.ReactNode;
  /** Accion a ejecutar cuando el usuario confirma. */
  onConfirmar: () => void;
  titulo?: string;
  descripcion?: React.ReactNode;
  textoConfirmar?: string;
  textoCancelar?: string;
};

export function ConfirmarEliminar({
  children,
  onConfirmar,
  titulo = "¿Eliminar este dato?",
  descripcion = "Esta accion no se puede deshacer.",
  textoConfirmar = "Eliminar",
  textoCancelar = "Cancelar",
}: Props) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descripcion}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{textoCancelar}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirmar}>
            {textoConfirmar}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
