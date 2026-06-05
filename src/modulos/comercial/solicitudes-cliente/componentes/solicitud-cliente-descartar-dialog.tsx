"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { extraerMensajeError } from "@/compartido/api";
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
import { Label } from "@/compartido/componentes/ui/label";
import { Textarea } from "@/compartido/componentes/ui/textarea";

import { useDescartarSCMutation } from "../servicios/solicitudes-cliente-queries";
import { schemaDescartarSC } from "../tipos/solicitud-cliente.schemas";

type Props = {
  id: string;
  disabled?: boolean;
  onSuccess?: () => void;
};

export function SolicitudClienteDescartarDialog({ id, disabled, onSuccess }: Props) {
  const router = useRouter();
  const [abierto, setAbierto] = React.useState(false);
  const [motivo, setMotivo] = React.useState("");
  const [errorMotivo, setErrorMotivo] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);

  const descartarMutation = useDescartarSCMutation();

  function handleOpenChange(open: boolean) {
    if (!open) {
      setMotivo("");
      setErrorMotivo(null);
      setIsPending(false);
    }
    setAbierto(open);
  }

  async function onConfirmar(event: React.MouseEvent) {
    event.preventDefault();

    setErrorMotivo(null);

    const resultado = schemaDescartarSC.safeParse({ motivo });
    if (!resultado.success) {
      setErrorMotivo(
        resultado.error.issues[0]?.message ?? "El motivo es requerido"
      );
      return;
    }

    setIsPending(true);
    try {
      await descartarMutation.mutateAsync({
        id,
        payload: { motivo: resultado.data.motivo },
      });
      toast.success("Solicitud descartada correctamente");
      setAbierto(false);
      onSuccess?.();
      router.refresh();
    } catch (err) {
      toast.error(
        extraerMensajeError(err, "No se pudo descartar la solicitud")
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AlertDialog open={abierto} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="destructive" disabled={disabled}>
          Descartar SC
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Descartar solicitud de cliente</AlertDialogTitle>
          <AlertDialogDescription>
            Esta accion marcara la solicitud como descartada. No podra
            reactivarse desde esta interfaz. Por favor indica el motivo.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-2">
          <Label htmlFor="motivo-descarte-sc">
            Motivo
            <span className="ml-1 text-destructive">*</span>
          </Label>
          <Textarea
            id="motivo-descarte-sc"
            rows={3}
            value={motivo}
            onChange={(e) => {
              setMotivo(e.target.value);
              if (errorMotivo) setErrorMotivo(null);
            }}
            disabled={isPending}
            placeholder="Describe el motivo del descarte..."
            className="min-h-20"
            aria-invalid={Boolean(errorMotivo)}
          />
          {errorMotivo ? (
            <p className="text-xs text-destructive">{errorMotivo}</p>
          ) : null}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirmar}
            disabled={isPending || motivo.length === 0}
          >
            {isPending ? "Descartando..." : "Confirmar descarte"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
