"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/compartido/componentes/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
import { Input } from "@/compartido/componentes/ui/input";
import { Label } from "@/compartido/componentes/ui/label";
import { cambiarEstadoActivo, siniestrarActivo } from "../servicios/activos-api";
import type { Activo } from "../tipos/activo.tipos";

type Props = {
  activo: Activo;
};

export function ActivoAccionesCicloVida({ activo }: Props) {
  const router = useRouter();
  const [motivo, setMotivo] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const estaCerrado = activo.estadoActivo === "SINIESTRADO";

  async function onSiniestrar() {
    if (!confirm("Se marcara el activo como SINIESTRADO. Deseas continuar?")) return;
    setError(null);
    setIsSaving(true);

    try {
      const saved = await siniestrarActivo(activo.id, {
        observacion: motivo.trim() || undefined,
      });
      router.push(`/activos/${saved.codigo}?siniestrado=1`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo siniestrar el activo");
    } finally {
      setIsSaving(false);
    }
  }

  async function onInactivar() {
    if (!confirm("Se marcara el activo como INACTIVO. Deseas continuar?")) return;
    setError(null);
    setIsSaving(true);

    try {
      const saved = await cambiarEstadoActivo(activo.id, {
        estadoActivo: "INACTIVO",
        motivo: motivo.trim() || undefined,
        usuario: "activos.web",
      });
      router.push(`/activos/${saved.codigo}?inactive=1`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo inactivar el activo");
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
        <div className="grid gap-2">
          <Label htmlFor="motivo-cierre">Motivo u observacion</Label>
          <Input
            id="motivo-cierre"
            value={motivo}
            onChange={(event) => setMotivo(event.target.value)}
            placeholder="Ej. Decision operativa, siniestro, observacion administrativa"
            disabled={estaCerrado || isSaving}
          />
        </div>

        {error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/15 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onInactivar}
            disabled={estaCerrado || isSaving}
          >
            Inactivar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onSiniestrar}
            disabled={estaCerrado || isSaving}
          >
            Siniestrar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
