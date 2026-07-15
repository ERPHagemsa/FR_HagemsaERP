"use client";

import * as React from "react";
import { IconPhotoPlus, IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";

import { extraerMensajeError } from "@/compartido/api";
import { Button } from "@/compartido/componentes/ui/button";
import { Input } from "@/compartido/componentes/ui/input";
import { Label } from "@/compartido/componentes/ui/label";

import {
  agregarImagenInspeccion,
  eliminarImagenInspeccion,
} from "../servicios/inspeccion-api";
import type { Inspeccion, InspeccionImagen } from "../tipos/inspeccion.tipos";

type Props = {
  inspeccionId: number;
  detalleId: number;
  imagenes: InspeccionImagen[];
  editable: boolean;
  onCambio: (inspeccionActualizada: Inspeccion) => void;
};

function isRenderableImageUrl(url: string) {
  return (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:image/")
  );
}

export function InspeccionImagenes({
  inspeccionId,
  detalleId,
  imagenes,
  editable,
  onCambio,
}: Props) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [guardando, setGuardando] = React.useState(false);
  const [eliminandoId, setEliminandoId] = React.useState<number | null>(null);
  const [selectedFileName, setSelectedFileName] = React.useState<string | null>(
    null
  );
  const [localImageUrl, setLocalImageUrl] = React.useState<string | null>(null);
  const [descripcion, setDescripcion] = React.useState("");

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFileName(null);
      setLocalImageUrl(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Selecciona una imagen valida.");
      event.target.value = "";
      setSelectedFileName(null);
      setLocalImageUrl(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFileName(file.name);
      setLocalImageUrl(String(reader.result));
    };
    reader.onerror = () => {
      toast.error("No se pudo leer la imagen seleccionada.");
      setSelectedFileName(null);
      setLocalImageUrl(null);
    };
    reader.readAsDataURL(file);
  }

  async function agregar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!localImageUrl) {
      toast.error("Selecciona una imagen desde tu equipo.");
      return;
    }

    setGuardando(true);
    try {
      const actualizado = await agregarImagenInspeccion(inspeccionId, detalleId, {
        url: localImageUrl,
        nombreArchivo: selectedFileName ?? undefined,
        descripcion: descripcion.trim() || undefined,
        usuario: "activos.web",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSelectedFileName(null);
      setLocalImageUrl(null);
      setDescripcion("");
      toast.success("Imagen agregada correctamente.");
      onCambio(actualizado);
    } catch (err) {
      toast.error(extraerMensajeError(err, "No se pudo agregar la imagen"));
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(imagen: InspeccionImagen) {
    const confirmado = window.confirm(
      `Quieres eliminar esta imagen de la inspeccion?`
    );
    if (!confirmado) return;

    setEliminandoId(imagen.id);
    try {
      const actualizado = await eliminarImagenInspeccion(
        inspeccionId,
        detalleId,
        imagen.id
      );
      toast.success("Imagen eliminada correctamente.");
      onCambio(actualizado);
    } catch (err) {
      toast.error(extraerMensajeError(err, "No se pudo eliminar la imagen"));
    } finally {
      setEliminandoId(null);
    }
  }

  return (
    <section className="mt-6 border-t border-border pt-5">
      <h3 className="mb-4 flex items-center gap-2 text-base font-semibold">
        <IconPhotoPlus className="size-5 text-primary" />
        Imagenes de la inspeccion
      </h3>

      {editable ? (
        <form onSubmit={agregar} className="mb-5 grid gap-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <div className="grid gap-2">
              <Label htmlFor="inspeccion-imagen-archivo">
                Imagen desde equipo
              </Label>
              <input
                ref={fileInputRef}
                id="inspeccion-imagen-archivo"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={onFileChange}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Seleccionar imagen
                </Button>
                <Input
                  value={selectedFileName ?? "Ninguna imagen seleccionada"}
                  readOnly
                  aria-label="Imagen seleccionada"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="inspeccion-imagen-descripcion">
                Descripcion
              </Label>
              <Input
                id="inspeccion-imagen-descripcion"
                value={descripcion}
                onChange={(event) => setDescripcion(event.target.value)}
                placeholder="Golpe en parachoques delantero"
              />
            </div>
            <Button type="submit" disabled={guardando}>
              {guardando ? "Guardando..." : "Agregar"}
            </Button>
          </div>

          {localImageUrl ? (
            <div className="grid gap-2 rounded-xl border border-border bg-muted/20 p-3 sm:max-w-sm">
              <span className="text-sm font-medium">Vista previa</span>
              <img
                src={localImageUrl}
                alt={selectedFileName ?? "Imagen seleccionada"}
                className="aspect-[4/3] w-full rounded-lg border border-border object-cover"
              />
            </div>
          ) : null}
        </form>
      ) : null}

      {imagenes.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {imagenes.map((imagen) => (
            <figure
              key={imagen.id}
              className="overflow-hidden rounded-xl border border-border bg-muted/20"
            >
              <div className="aspect-[4/3] bg-background">
                {isRenderableImageUrl(imagen.url) ? (
                  <img
                    src={imagen.url}
                    alt={imagen.descripcion ?? imagen.nombreArchivo ?? "Imagen"}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
                    Imagen no disponible para previsualizar
                  </div>
                )}
              </div>
              <figcaption className="grid gap-2 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm text-muted-foreground">
                    {imagen.descripcion || imagen.nombreArchivo || "Sin descripcion"}
                  </p>
                  {editable ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => eliminar(imagen)}
                      disabled={eliminandoId === imagen.id}
                    >
                      <IconTrash className="size-4" />
                      {eliminandoId === imagen.id ? "Eliminando..." : "Eliminar"}
                    </Button>
                  ) : null}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          Esta inspeccion aun no tiene imagenes registradas para este activo.
        </div>
      )}
    </section>
  );
}
