"use client";

import * as React from "react";
import { IconPhotoPlus } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

import { Badge } from "@/compartido/componentes/ui/badge";
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
import { crearImagenPorCodigo } from "../servicios/activos-api";
import type { ImagenActivo, TipoImagenActivo } from "../tipos/activo.tipos";

type Props = {
  codigo: string;
  imagenes: ImagenActivo[];
};

const tiposImagen: TipoImagenActivo[] = [
  "FRONTAL",
  "LATERAL",
  "POSTERIOR",
  "INTERIOR",
  "DOCUMENTO",
  "OTRO",
];

export function ImagenesActivo({ codigo, imagenes }: Props) {
  const router = useRouter();
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const orden = String(formData.get("orden") ?? "").trim();

    try {
      await crearImagenPorCodigo(codigo, {
        tipoImagen: String(formData.get("tipoImagen")) as TipoImagenActivo,
        url: String(formData.get("url") ?? "").trim(),
        descripcion:
          String(formData.get("descripcion") ?? "").trim() || undefined,
        orden: orden ? Number(orden) : undefined,
      });
      event.currentTarget.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la imagen");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2">
          <IconPhotoPlus className="size-5 text-primary" />
          Imagenes del activo
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5 pt-5">
        <form onSubmit={onSubmit} className="grid gap-4 lg:grid-cols-[180px_1fr_1fr_120px_auto] lg:items-end">
          <label className="grid gap-2">
            <span className="text-sm font-medium">Tipo</span>
            <select
              name="tipoImagen"
              defaultValue="FRONTAL"
              className={cn(
                "h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
              )}
              required
            >
              {tiposImagen.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-2">
            <Label htmlFor="imagen-url">
              URL de imagen <span className="text-destructive">*</span>
            </Label>
            <Input
              id="imagen-url"
              name="url"
              placeholder="https://servidor/imagen.jpg"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="imagen-descripcion">Descripcion</Label>
            <Input
              id="imagen-descripcion"
              name="descripcion"
              placeholder="Vista frontal de la unidad"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="imagen-orden">Orden</Label>
            <Input id="imagen-orden" name="orden" type="number" min="0" />
          </div>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Guardando..." : "Agregar"}
          </Button>
        </form>

        {error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/15 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {imagenes.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {imagenes.map((imagen) => (
              <figure
                key={imagen.id}
                className="overflow-hidden rounded-xl border border-border bg-muted/20"
              >
                <div className="aspect-[4/3] bg-background">
                  <img
                    src={imagen.url}
                    alt={imagen.descripcion ?? imagen.tipoImagen}
                    className="size-full object-cover"
                  />
                </div>
                <figcaption className="grid gap-2 p-3">
                  <Badge variant="outline">{imagen.tipoImagen}</Badge>
                  <p className="text-sm text-muted-foreground">
                    {imagen.descripcion || "Sin descripcion"}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            Este activo aun no tiene imagenes registradas.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
