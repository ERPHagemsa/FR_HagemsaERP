"use client";

import * as React from "react";

import { Button } from "@/compartido/componentes/ui/button";
import { Separator } from "@/compartido/componentes/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/compartido/componentes/ui/sheet";

import {
  CamposNuevaSolicitud,
  useFormularioNuevaSolicitud,
} from "./solicitud-cliente-formulario";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SolicitudClienteNuevaSheetProps {
  abierto: boolean;
  onCerrar: () => void;
  onCreado: () => void;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function SolicitudClienteNuevaSheet({
  abierto,
  onCerrar,
  onCreado,
}: SolicitudClienteNuevaSheetProps) {
  const { formularioRef, campos } = useFormularioNuevaSolicitud({
    onExito: () => {
      onCreado();
      onCerrar();
    },
  });

  function handleOpenChange(open: boolean) {
    if (!open) {
      onCerrar();
    }
  }

  return (
    <Sheet open={abierto} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full gap-0 data-[side=right]:sm:max-w-lg">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Nueva solicitud de cliente</SheetTitle>
        </SheetHeader>

        <form
          ref={formularioRef}
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            campos.onSubmit();
          }}
        >
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <CamposNuevaSolicitud campos={campos} />
          </div>

          <Separator />

          <SheetFooter className="flex-row justify-end gap-2 px-6 py-4">
            <SheetClose asChild>
              <Button type="button" variant="outline" disabled={campos.isSaving}>
                Cancelar
              </Button>
            </SheetClose>
            <Button type="submit" disabled={campos.isSaving}>
              {campos.isSaving ? "Registrando..." : "Registrar solicitud"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
