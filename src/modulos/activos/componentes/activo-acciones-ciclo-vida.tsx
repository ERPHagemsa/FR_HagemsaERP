"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { extraerMensajeError } from "@/compartido/api";
import { Button } from "@/compartido/componentes/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
import { Input } from "@/compartido/componentes/ui/input";
import { Label } from "@/compartido/componentes/ui/label";
import { cn } from "@/compartido/utilidades";
import {
  useCambiarEstadoActivoMutation,
  useCambiarEstadoRegistroMutation,
  useSiniestrarActivoMutation,
} from "../servicios/activos-queries";
import type { Activo } from "../tipos/activo.tipos";

type Props = {
  activo: Activo;
};

export function ActivoAccionesCicloVida({ activo }: Props) {
  const router = useRouter();
  const [motivo, setMotivo] = React.useState("");
  const [causaBaja, setCausaBaja] = React.useState<"INACTIVO" | "SINIESTRADO">(
    "INACTIVO"
  );
  const [isSaving, setIsSaving] = React.useState(false);
  const [mostrarConfirmacionBaja, setMostrarConfirmacionBaja] =
    React.useState(false);
  const [mostrarConfirmacionBorrado, setMostrarConfirmacionBorrado] =
    React.useState(false);
  const cambiarEstadoMutation = useCambiarEstadoActivoMutation();
  const cambiarEstadoRegistroMutation = useCambiarEstadoRegistroMutation();
  const siniestrarMutation = useSiniestrarActivoMutation();
  const estaCerrado =
    activo.estadoActivo === "SINIESTRADO" || activo.estadoRegistro === false;
  const yaEstaDeBaja = estaCerrado || activo.estadoActivo === "INACTIVO";

  async function onDarDeBaja() {
    setIsSaving(true);

    try {
      const saved =
        causaBaja === "SINIESTRADO"
          ? await siniestrarMutation.mutateAsync({
              id: activo.id,
              payload: {
                observacion: motivo.trim() || undefined,
              },
            })
          : await cambiarEstadoMutation.mutateAsync({
              id: activo.id,
              payload: {
                estadoActivo: "INACTIVO",
                motivo: motivo.trim() || undefined,
                usuario: "activos.web",
              },
            });

      router.push(
        `/activos/${saved.codigo}?${causaBaja === "SINIESTRADO" ? "siniestrado" : "inactive"}=1`
      );
      router.refresh();
      setMostrarConfirmacionBaja(false);
    } catch (err) {
      toast.error(extraerMensajeError(err, "No se pudo dar de baja el activo"));
    } finally {
      setIsSaving(false);
    }
  }

  async function onEliminar() {
    setIsSaving(true);

    try {
      const saved = await cambiarEstadoRegistroMutation.mutateAsync({
        id: activo.id,
        payload: {
          estadoRegistro: false,
          motivo: motivo.trim() || "Borrado logico desde Activos",
          usuario: "activos.web",
        },
      });
      router.push(`/activos/${saved.codigo}?deleted=1`);
      router.refresh();
      setMostrarConfirmacionBorrado(false);
    } catch (err) {
      toast.error(extraerMensajeError(err, "No se pudo borrar el activo"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estado del activo</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            onClick={() => setMostrarConfirmacionBaja(true)}
            disabled={yaEstaDeBaja || isSaving}
          >
            Dar de baja
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setMostrarConfirmacionBorrado(true)}
            disabled={estaCerrado || isSaving}
          >
            Borrar
          </Button>
        </div>
        {mostrarConfirmacionBaja ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
            <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl">
              <h3 className="text-lg font-semibold">Confirmar baja</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Selecciona la causa y confirma que deseas dar de baja el activo
                {activo.codigo}.
              </p>
              <div className="mt-4 grid gap-2">
                <Label htmlFor="motivo-baja">Motivo u observacion</Label>
                <Input
                  id="motivo-baja"
                  value={motivo}
                  onChange={(event) => setMotivo(event.target.value)}
                  placeholder="Ej. Decision operativa, siniestro, observacion administrativa"
                  disabled={isSaving}
                />
              </div>
              <div className="mt-4 grid gap-2">
                <Label>Causa de baja</Label>
                <div className="grid h-9 grid-cols-2 rounded-lg border border-input bg-background p-0.5">
                  {[
                    { value: "INACTIVO", label: "De baja" },
                    { value: "SINIESTRADO", label: "Siniestro" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setCausaBaja(
                          option.value as "INACTIVO" | "SINIESTRADO"
                        )
                      }
                      disabled={isSaving}
                      className={cn(
                        "rounded-md px-3 text-sm font-medium text-muted-foreground transition",
                        causaBaja === option.value &&
                          "bg-primary text-primary-foreground",
                        isSaving && "cursor-not-allowed opacity-60"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMostrarConfirmacionBaja(false)}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button type="button" onClick={onDarDeBaja} disabled={isSaving}>
                  {isSaving ? "Procesando..." : "Dar de baja"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
        {mostrarConfirmacionBorrado ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
            <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl">
              <h3 className="text-lg font-semibold">Confirmar borrado</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                El activo se retirara del maestro visible y no podra usarse en
                procesos operativos. Deseas continuar?
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMostrarConfirmacionBorrado(false)}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onEliminar}
                  disabled={isSaving}
                >
                  {isSaving ? "Procesando..." : "Borrar activo"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
