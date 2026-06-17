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

import { useDescartarProspectoMutation } from "../servicios/prospectos-queries";
import { schemaDescartarProspecto } from "../tipos/prospecto.schemas";

type Props = {
  idProspecto: string;
  disabled?: boolean;
};

export function ProspectoDescartarDialog({ idProspecto, disabled }: Props) {
  const router = useRouter();
  const [abierto, setAbierto] = React.useState(false);
  const [motivo, setMotivo] = React.useState("");
  const [errorMotivo, setErrorMotivo] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);

  const descartarMutation = useDescartarProspectoMutation();

  function handleOpenChange(open: boolean) {
    if (!open) {
      // Limpiar al cerrar
      setMotivo("");
      setErrorMotivo(null);
      setIsPending(false);
    }
    setAbierto(open);
  }

  async function onConfirmar(event: React.MouseEvent) {
    // Prevenir que AlertDialogAction cierre el dialog automaticamente
    event.preventDefault();

    setErrorMotivo(null);

    const resultado = schemaDescartarProspecto.safeParse({ motivo });
    if (!resultado.success) {
      setErrorMotivo(resultado.error.issues[0]?.message ?? "El motivo es requerido");
      return;
    }

    setIsPending(true);
    try {
      await descartarMutation.mutateAsync({
        id: idProspecto,
        payload: { motivo: resultado.data.motivo },
      });
      setAbierto(false);
      router.push(`/comercial/prospectos/${idProspecto}?accion=descartado`);
      router.refresh();
    } catch (err) {
      toast.error(extraerMensajeError(err, "No se pudo descartar el prospecto"));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AlertDialog open={abierto} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="destructive" disabled={disabled}>
          Descartar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Descartar prospecto</AlertDialogTitle>
          <AlertDialogDescription>
            Esta accion marcara el prospecto como descartado (descalifica el lead).
            Es reversible: podras reactivarlo mas adelante. Por favor indica el motivo.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-2">
          <Label htmlFor="motivo-descarte">
            Motivo
            <span className="ml-1 text-destructive">*</span>
          </Label>
          <Textarea
            id="motivo-descarte"
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
            disabled={isPending}
          >
            {isPending ? "Descartando..." : "Confirmar descarte"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
