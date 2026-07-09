"use client";

import * as React from "react";

import { esError409 } from "@/compartido/api";
import { Button } from "@/compartido/componentes/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/compartido/componentes/ui/dialog";
import { Label } from "@/compartido/componentes/ui/label";
import { Textarea } from "@/compartido/componentes/ui/textarea";
import { normalizarErrorAccion } from "@/modulos/comercial/cotizaciones/servicios/cotizaciones-error-handler";

import { invalidarAprobacionesPendientes, useAprobarMutation, useObservarMutation, useRechazarMutation } from "../servicios/aprobaciones-queries";
import { schemaAprobar, schemaObservar, schemaRechazar } from "../tipos/aprobaciones.schemas";

type AccionResolver = "aprobar" | "rechazar" | "observar";

type Props = {
  idSolicitud: string;
  accion: AccionResolver;
  children?: React.ReactNode;
};

const CONFIG: Record<AccionResolver, {
  titulo: string;
  descripcion: string;
  label: string;
  placeholder: string;
  boton: string;
  procesando: string;
  obligatorio: boolean;
  destructivo?: boolean;
}> = {
  aprobar: {
    titulo: "Aprobar solicitud",
    descripcion: "La cotización pasará a enviada si la solicitud se aprueba.",
    label: "Comentario",
    placeholder: "Comentario opcional para el historial...",
    boton: "Aprobar",
    procesando: "Aprobando...",
    obligatorio: false,
  },
  rechazar: {
    titulo: "Rechazar solicitud",
    descripcion: "La cotización volverá a borrador y podrá corregirse.",
    label: "Motivo",
    placeholder: "Indica el motivo del rechazo...",
    boton: "Rechazar",
    procesando: "Rechazando...",
    obligatorio: true,
    destructivo: true,
  },
  observar: {
    titulo: "Observar solicitud",
    descripcion: "La cotización volverá a borrador para que se atienda la observación.",
    label: "Comentario",
    placeholder: "Indica qué debe ajustarse...",
    boton: "Observar",
    procesando: "Observando...",
    obligatorio: true,
  },
};

export function DialogoResolverSolicitud({ idSolicitud, accion, children }: Props) {
  const config = CONFIG[accion];
  const aprobar = useAprobarMutation(idSolicitud);
  const rechazar = useRechazarMutation(idSolicitud);
  const observar = useObservarMutation(idSolicitud);

  const [abierto, setAbierto] = React.useState(false);
  const [texto, setTexto] = React.useState("");
  const [errorCampo, setErrorCampo] = React.useState<string | null>(null);
  const [errorForm, setErrorForm] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);

  function handleOpenChange(open: boolean) {
    if (!open) {
      setTexto("");
      setErrorCampo(null);
      setErrorForm(null);
      setIsPending(false);
    }
    setAbierto(open);
  }

  async function onConfirmar(event: React.FormEvent) {
    event.preventDefault();
    setErrorCampo(null);
    setErrorForm(null);

    setIsPending(true);
    try {
      const valor = texto.trim();
      if (accion === "aprobar") {
        const resultado = schemaAprobar.safeParse({ comentario: valor || undefined });
        if (!resultado.success) {
          setErrorCampo(resultado.error.issues[0]?.message ?? "Valor inválido");
          return;
        }
        await aprobar.mutateAsync(resultado.data);
      }
      if (accion === "rechazar") {
        const resultado = schemaRechazar.safeParse({ motivo: valor });
        if (!resultado.success) {
          setErrorCampo(resultado.error.issues[0]?.message ?? "El motivo es obligatorio.");
          return;
        }
        await rechazar.mutateAsync(resultado.data);
      }
      if (accion === "observar") {
        const resultado = schemaObservar.safeParse({ comentario: valor });
        if (!resultado.success) {
          setErrorCampo(resultado.error.issues[0]?.message ?? "El comentario es obligatorio.");
          return;
        }
        await observar.mutateAsync(resultado.data);
      }
      setAbierto(false);
    } catch (err) {
      if (esError409(err)) {
        setErrorForm("La solicitud ya fue resuelta por otra operación.");
        invalidarAprobacionesPendientes();
      } else {
        const { mensaje } = normalizarErrorAccion(err, "No se pudo resolver la solicitud");
        setErrorForm(mensaje);
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children ?? <Button type="button" variant={config.destructivo ? "destructive" : "outline"}>{config.boton}</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{config.titulo}</DialogTitle>
          <DialogDescription>{config.descripcion}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onConfirmar} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`resolver-${accion}-${idSolicitud}`}>
              {config.label}{" "}
              {config.obligatorio ? <span className="text-destructive">*</span> : <span className="text-muted-foreground">(opcional)</span>}
            </Label>
            <Textarea
              id={`resolver-${accion}-${idSolicitud}`}
              rows={3}
              value={texto}
              onChange={(event) => {
                setTexto(event.target.value);
                if (errorCampo) setErrorCampo(null);
              }}
              placeholder={config.placeholder}
              disabled={isPending}
              aria-invalid={Boolean(errorCampo)}
              className="min-h-20"
            />
            {errorCampo ? <p className="text-xs text-destructive">{errorCampo}</p> : null}
          </div>

          {errorForm ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{errorForm}</p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAbierto(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" variant={config.destructivo ? "destructive" : "default"} disabled={isPending}>
              {isPending ? config.procesando : config.boton}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
