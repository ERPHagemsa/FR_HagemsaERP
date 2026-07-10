"use client";

import { Button } from "@/compartido/componentes/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/compartido/componentes/ui/dialog";

import {
  CamposNuevaSolicitud,
  useFormularioNuevaSolicitud,
} from "./solicitud-cliente-formulario";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SolicitudClienteNuevaModalProps {
  abierto: boolean;
  onCerrar: () => void;
  onCreado: () => void;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function SolicitudClienteNuevaModal({
  abierto,
  onCerrar,
  onCreado,
}: SolicitudClienteNuevaModalProps) {
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
    <Dialog open={abierto} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle>Nueva solicitud de cliente</DialogTitle>
          <DialogDescription>
            Registra la solicitud a partir de un prospecto de Comercial o un
            cliente existente en Socios de Negocio.
          </DialogDescription>
        </DialogHeader>

        <form
          ref={formularioRef}
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            campos.onSubmit();
          }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <CamposNuevaSolicitud campos={campos} />
          </div>

          <DialogFooter className="border-t border-border px-6 py-4">
            <Button
              type="button"
              variant="outline"
              disabled={campos.isSaving}
              onClick={onCerrar}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={campos.isSaving}>
              {campos.isSaving ? "Registrando..." : "Registrar solicitud"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
