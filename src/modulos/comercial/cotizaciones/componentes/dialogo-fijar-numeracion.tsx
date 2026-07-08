"use client";

import * as React from "react";
import { toast } from "sonner";

import { esError409, extraerMensajeError } from "@/compartido/api";
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
import { Input } from "@/compartido/componentes/ui/input";
import { Label } from "@/compartido/componentes/ui/label";

import { useFijarNumeracionMutation } from "../servicios/cotizaciones-queries";

type Props = {
  // El trigger del popup (p.ej. un boton). Se envuelve con DialogTrigger asChild.
  children: React.ReactNode;
};

// Popup para fijar desde que numero correlativo continua la numeracion del año en
// curso (PUT /cotizaciones/numeracion, API §5.5.1). No hay GET para precargar: el
// usuario escribe el numero a mano. La numeracion es forward-only: si el numero ya
// fue superado por emisiones, el backend responde 409 y se muestra inline.
export function DialogoFijarNumeracion({ children }: Props) {
  const [abierto, setAbierto] = React.useState(false);
  const [valor, setValor] = React.useState("");
  const [errorInline, setErrorInline] = React.useState<string | null>(null);
  const fijarMutation = useFijarNumeracionMutation();

  // Numero valido = entero >= 1 (misma regla que valida el backend).
  const proximoNumero = Number(valor);
  const esValido =
    valor.trim() !== "" && Number.isInteger(proximoNumero) && proximoNumero >= 1;

  function alCambiarApertura(siguiente: boolean) {
    setAbierto(siguiente);
    if (!siguiente) {
      // Reset al cerrar para que la proxima apertura arranque limpia.
      setValor("");
      setErrorInline(null);
      fijarMutation.reset();
    }
  }

  async function guardar() {
    if (!esValido) {
      setErrorInline("Ingresa un numero entero mayor o igual a 1.");
      return;
    }
    setErrorInline(null);

    try {
      const resultado = await fijarMutation.mutateAsync({ proximoNumero });
      toast.success(
        `Numeracion fijada: la proxima cotizacion del ${resultado.anio} tomara el numero ${resultado.proximoNumero}.`
      );
      alCambiarApertura(false);
    } catch (error) {
      // 409 = forward-only: el numero ya fue superado por emisiones. El backend
      // manda el mensaje en español y es accionable, asi que se muestra inline.
      if (esError409(error)) {
        setErrorInline(
          extraerMensajeError(
            error,
            "El numero debe ser mayor al ultimo ya emitido este año."
          )
        );
        return;
      }
      toast.error(extraerMensajeError(error, "No se pudo fijar la numeracion."));
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={alCambiarApertura}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Fijar numeracion de cotizaciones</DialogTitle>
          <DialogDescription>
            Define desde que numero correlativo continua la numeracion del año en
            curso. No emite ninguna cotizacion: el numero recien se refleja al
            emitir la proxima.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void guardar();
          }}
        >
          <Label htmlFor="proximo-numero">Proximo numero</Label>
          <Input
            id="proximo-numero"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            placeholder="Ej. 100"
            value={valor}
            autoFocus
            aria-invalid={errorInline ? true : undefined}
            onChange={(event) => {
              setValor(event.target.value);
              if (errorInline) setErrorInline(null);
            }}
          />
          {errorInline ? (
            <p className="text-sm text-destructive">{errorInline}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              La numeracion solo avanza: puedes saltar hacia adelante, pero no
              fijar un numero menor o igual al ultimo ya emitido este año.
            </p>
          )}

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => alCambiarApertura(false)}
              disabled={fijarMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={fijarMutation.isPending || !esValido}>
              {fijarMutation.isPending ? "Guardando..." : "Fijar numeracion"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
