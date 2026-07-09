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
} from "@/compartido/componentes/ui/dialog";
import { Label } from "@/compartido/componentes/ui/label";
import { Textarea } from "@/compartido/componentes/ui/textarea";
import { normalizarErrorAccion } from "@/modulos/comercial/cotizaciones/servicios/cotizaciones-error-handler";

import { invalidarAprobaciones, useAprobarMutation, useRechazarMutation } from "../servicios/aprobaciones-queries";
import { schemaAprobar, schemaRechazar } from "../tipos/aprobaciones.schemas";

/** El porton es binario: dejar salir la cotizacion, o no dejarla salir. */
export type AccionResolver = "aprobar" | "rechazar";

/**
 * Dialogo controlado: no trae trigger propio. Quien lo usa decide desde donde
 * se dispara (menu `⋯` de la tabla, botones del detalle) y es dueño del estado
 * de apertura. Montarlo bajo demanda —solo cuando hay una accion elegida— hace
 * que el estado del formulario nazca limpio en cada apertura.
 */
type Props = {
  idSolicitud: string;
  accion: AccionResolver;
  abierto: boolean;
  onAbiertoChange: (abierto: boolean) => void;
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
    descripcion:
      "La cotización volverá a borrador para que el ejecutivo la corrija y la reenvíe.",
    label: "Motivo",
    // El motivo carga toda la semantica: tanto "no procede" como "ajustá la
    // linea 3". Por eso el placeholder invita a ser especifico.
    placeholder: "Indica qué hay que corregir o por qué se rechaza...",
    boton: "Rechazar",
    procesando: "Rechazando...",
    obligatorio: true,
    destructivo: true,
  },
};

export function DialogoResolverSolicitud({
  idSolicitud,
  accion,
  abierto,
  onAbiertoChange,
}: Props) {
  const config = CONFIG[accion];
  const aprobar = useAprobarMutation(idSolicitud);
  const rechazar = useRechazarMutation(idSolicitud);

  const [texto, setTexto] = React.useState("");
  const [errorCampo, setErrorCampo] = React.useState<string | null>(null);
  const [errorForm, setErrorForm] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);

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
      } else {
        const resultado = schemaRechazar.safeParse({ motivo: valor });
        if (!resultado.success) {
          setErrorCampo(resultado.error.issues[0]?.message ?? "El motivo es obligatorio.");
          return;
        }
        await rechazar.mutateAsync(resultado.data);
      }
      onAbiertoChange(false);
    } catch (err) {
      if (esError409(err)) {
        setErrorForm("La solicitud ya fue resuelta por otra operación.");
        invalidarAprobaciones();
      } else {
        const { mensaje } = normalizarErrorAccion(err, "No se pudo resolver la solicitud");
        setErrorForm(mensaje);
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={onAbiertoChange}>
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
            <Button type="button" variant="outline" onClick={() => onAbiertoChange(false)} disabled={isPending}>
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
