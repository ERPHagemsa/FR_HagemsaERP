"use client";

import * as React from "react";
import { IconPhotoPlus, IconTrash, IconX } from "@tabler/icons-react";
import { Camera, ImageUp } from "lucide-react";
import { toast } from "sonner";

import { extraerMensajeError } from "@/compartido/api";
import { Button } from "@/compartido/componentes/ui/button";
import { Input } from "@/compartido/componentes/ui/input";

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
  usuarioActual: string;
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
  usuarioActual,
  onCambio,
}: Props) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const [guardando, setGuardando] = React.useState(false);
  const [eliminandoId, setEliminandoId] = React.useState<number | null>(null);
  const [selectedFileName, setSelectedFileName] = React.useState<string | null>(
    null
  );
  const [localImageUrl, setLocalImageUrl] = React.useState<string | null>(null);
  const [descripcion, setDescripcion] = React.useState("");

  function limpiarSeleccion() {
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    setSelectedFileName(null);
    setLocalImageUrl(null);
  }

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecciona una imagen valida.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFileName(file.name);
      setLocalImageUrl(String(reader.result));
    };
    reader.onerror = () => {
      toast.error("No se pudo leer la imagen seleccionada.");
      limpiarSeleccion();
    };
    reader.readAsDataURL(file);
  }

  async function agregar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!localImageUrl) {
      toast.error("Toma o selecciona una foto primero.");
      return;
    }

    setGuardando(true);
    try {
      const actualizado = await agregarImagenInspeccion(inspeccionId, detalleId, {
        url: localImageUrl,
        nombreArchivo: selectedFileName ?? undefined,
        descripcion: descripcion.trim() || undefined,
        usuario: usuarioActual,
      });
      limpiarSeleccion();
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
      <h3 className="mb-3 flex items-center gap-2 text-base font-semibold">
        <IconPhotoPlus className="size-5 text-primary" />
        Imagenes de la inspeccion
      </h3>

      {editable ? (
        <form onSubmit={agregar} className="mb-4 grid gap-2">
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={onFileChange}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={onFileChange}
          />

          <div className="flex flex-wrap items-center gap-2">
            {localImageUrl ? (
              <div className="relative shrink-0">
                <img
                  src={localImageUrl}
                  alt={selectedFileName ?? "Imagen seleccionada"}
                  className="size-11 rounded-lg border border-border object-cover"
                />
                <button
                  type="button"
                  onClick={limpiarSeleccion}
                  aria-label="Quitar imagen seleccionada"
                  className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                >
                  <IconX className="size-3" />
                </button>
              </div>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera className="size-4" />
                  Tomar foto
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageUp className="size-4" />
                  Galeria
                </Button>
              </>
            )}

            <Input
              value={descripcion}
              onChange={(event) => setDescripcion(event.target.value)}
              placeholder="Descripcion (opcional)"
              className="h-9 min-w-0 flex-1"
            />

            {localImageUrl ? (
              <Button type="submit" size="sm" disabled={guardando}>
                {guardando ? "Guardando..." : "Agregar"}
              </Button>
            ) : null}
          </div>
        </form>
      ) : null}

      {imagenes.length ? (
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))" }}
        >
          {imagenes.map((imagen) => (
            <figure
              key={imagen.id}
              className="relative overflow-hidden rounded-lg border border-border bg-muted/20"
            >
              <div className="aspect-square bg-background">
                {isRenderableImageUrl(imagen.url) ? (
                  <img
                    src={imagen.url}
                    alt={imagen.descripcion ?? imagen.nombreArchivo ?? "Imagen"}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center px-2 text-center text-xs text-muted-foreground">
                    No disponible
                  </div>
                )}
              </div>
              {imagen.descripcion ? (
                <figcaption className="truncate px-1.5 py-1 text-xs text-muted-foreground">
                  {imagen.descripcion}
                </figcaption>
              ) : null}
              {editable ? (
                <button
                  type="button"
                  onClick={() => eliminar(imagen)}
                  disabled={eliminandoId === imagen.id}
                  aria-label="Eliminar imagen"
                  className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white"
                >
                  <IconTrash className="size-3.5" />
                </button>
              ) : null}
            </figure>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          Esta inspeccion aun no tiene imagenes registradas para este activo.
        </div>
      )}
    </section>
  );
}
