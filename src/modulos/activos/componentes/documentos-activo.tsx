"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import {
  IconExternalLink,
  IconFilePlus,
  IconFileUpload,
  IconTrash,
} from "@tabler/icons-react";

import { extraerMensajeError } from "@/compartido/api";
import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import { Input } from "@/compartido/componentes/ui/input";
import { Label } from "@/compartido/componentes/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table";
import { cn } from "@/compartido/utilidades";
import {
  useCrearDocumentoActivoMutation,
  useEliminarDocumentoActivoMutation,
} from "../servicios/activos-queries";
import type {
  DocumentoActivo,
  EstadoDocumentoActivo,
  TipoDocumentoActivo,
} from "../tipos/activo.tipos";

type Props = {
  codigo: string;
  documentos: DocumentoActivo[];
  editable?: boolean;
};

const tiposDocumento: TipoDocumentoActivo[] = [
  "SOAT",
  "POLIZA",
  "TARJETA_PROPIEDAD",
  "FACTURA",
  "MANUAL",
  "REVISION_TECNICA",
  "CERTIFICADO",
  "OTRO",
];

export function DocumentosActivo({ codigo, documentos, editable = true }: Props) {
  const router = useRouter();
  const [mostrarFormulario, setMostrarFormulario] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);
  const [archivoNombre, setArchivoNombre] = React.useState("");
  const [archivoDataUrl, setArchivoDataUrl] = React.useState("");
  const [message, setMessage] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const crearDocumentoMutation = useCrearDocumentoActivoMutation(codigo);
  const eliminarDocumentoMutation = useEliminarDocumentoActivoMutation(codigo);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setMessage(null);
    setIsSaving(true);

    const formData = new FormData(form);
    const fechaVencimiento = String(formData.get("fechaVencimiento") ?? "");
    const observacion = String(formData.get("observacion") ?? "").trim();
    const archivoUrl = archivoDataUrl || String(formData.get("archivoUrl") ?? "").trim();

    if (!archivoUrl) {
      setMessage({
        type: "error",
        text: "Selecciona un archivo desde tu equipo o registra una URL documental.",
      });
      setIsSaving(false);
      return;
    }

    try {
      await crearDocumentoMutation.mutateAsync({
        tipoDocumento: String(formData.get("tipoDocumento")) as TipoDocumentoActivo,
        numero: String(formData.get("numero") ?? "").trim(),
        fechaEmision: String(formData.get("fechaEmision") ?? ""),
        fechaVencimiento: fechaVencimiento || undefined,
        archivoUrl,
        observacion: observacion || undefined,
        usuarioCarga:
          String(formData.get("usuarioCarga") ?? "").trim() || "usuario.activos",
      });

      form.reset();
      setArchivoNombre("");
      setArchivoDataUrl("");
      setMostrarFormulario(false);
      setMessage({
        type: "success",
        text: "Documento registrado correctamente.",
      });
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text: extraerMensajeError(error, "No se pudo registrar el documento."),
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function onArchivoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const archivo = event.target.files?.[0];
    setMessage(null);

    if (!archivo) {
      setArchivoNombre("");
      setArchivoDataUrl("");
      return;
    }

    if (archivo.size > 10 * 1024 * 1024) {
      event.target.value = "";
      setArchivoNombre("");
      setArchivoDataUrl("");
      setMessage({
        type: "error",
        text: "El archivo supera 10 MB. Usa una URL documental o selecciona un archivo mas ligero.",
      });
      return;
    }

    setArchivoNombre(archivo.name);
    setArchivoDataUrl(await fileToDataUrl(archivo));
  }

  async function eliminarDocumento(documento: DocumentoActivo) {
    setMessage(null);
    setDeletingId(documento.id);

    try {
      await eliminarDocumentoMutation.mutateAsync(documento.id);
      setMessage({
        type: "success",
        text: "Documento eliminado correctamente.",
      });
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "No se pudo eliminar el documento.",
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold">Documentos del activo</p>
          <p className="text-sm text-muted-foreground">
            {documentos.length} documento{documentos.length === 1 ? "" : "s"} registrado
            {documentos.length === 1 ? "" : "s"}
          </p>
        </div>
        {editable ? (
          <Button
            type="button"
            onClick={() => setMostrarFormulario((value) => !value)}
          >
            <IconFilePlus />
            Nuevo documento
          </Button>
        ) : null}
      </div>

      {editable && message ? (
        <div
          className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            message.type === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
              : "border-destructive/40 bg-destructive/10 text-destructive"
          )}
        >
          {message.text}
        </div>
      ) : null}

      {editable && mostrarFormulario ? (
        <form
          onSubmit={onSubmit}
          className="grid gap-4 rounded-xl border border-border bg-muted/20 p-4"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <SelectField
              name="tipoDocumento"
              label="Tipo documento"
              values={tiposDocumento}
              required
            />
            <Field name="numero" label="Numero" required />
            <Field name="fechaEmision" label="Fecha emision" type="date" required />
            <Field name="fechaVencimiento" label="Fecha vencimiento" type="date" />
            <div className="grid gap-2">
              <Label htmlFor="documento-archivo">
                Archivo desde equipo
                <span className="ml-1 text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Button asChild type="button" variant="outline">
                  <label htmlFor="documento-archivo" className="cursor-pointer">
                    <IconFileUpload />
                    Seleccionar archivo
                  </label>
                </Button>
                <Input
                  id="documento-archivo"
                  className="sr-only"
                  type="file"
                  onChange={onArchivoChange}
                />
                <span className="min-w-0 truncate rounded-full border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                  {archivoNombre || "Ningun archivo seleccionado"}
                </span>
              </div>
            </div>
            <Field
              name="archivoUrl"
              label="URL documental"
              placeholder={archivoDataUrl ? "Archivo seleccionado desde equipo" : "https://..."}
              type="url"
              disabled={Boolean(archivoDataUrl)}
            />
            <Field
              name="usuarioCarga"
              label="Usuario responsable"
              placeholder="usuario.activos"
              required
            />
          </div>
          <Field
            name="observacion"
            label="Observacion"
            placeholder="Comentario funcional si aplica"
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setMostrarFormulario(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar documento"}
            </Button>
          </div>
        </form>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Numero</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Emision</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Archivo</TableHead>
              {editable ? <TableHead className="text-center">Accion</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {documentos.map((documento) => (
              <TableRow key={documento.id}>
                <TableCell className="font-medium">
                  {formatear(documento.tipoDocumento)}
                </TableCell>
                <TableCell>{documento.numero ?? "-"}</TableCell>
                <TableCell>
                  <EstadoDocumentoBadge value={documento.estadoDocumento} />
                </TableCell>
                <TableCell>{formatearFecha(documento.fechaEmision)}</TableCell>
                <TableCell>{formatearFecha(documento.fechaVencimiento)}</TableCell>
                <TableCell>
                  {documento.usuarioActualizacion ??
                    documento.usuarioCarga ??
                    "-"}
                </TableCell>
                <TableCell>
                  {documento.archivoUrl ? (
                    <a
                      className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                      href={documento.archivoUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <IconExternalLink className="size-4" />
                      Abrir
                    </a>
                  ) : (
                    "-"
                  )}
                </TableCell>
                {editable ? (
                  <TableCell className="text-center">
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={deletingId === documento.id}
                      onClick={() => eliminarDocumento(documento)}
                    >
                      <IconTrash />
                      {deletingId === documento.id ? "Eliminando..." : "Eliminar"}
                    </Button>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
            {!documentos.length ? (
              <TableRow>
                <TableCell
                  colSpan={editable ? 8 : 7}
                  className="h-24 text-center text-muted-foreground"
                >
                  No hay documentos registrados para este activo.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function EstadoDocumentoBadge({ value }: { value: EstadoDocumentoActivo }) {
  const className =
    value === "VIGENTE"
      ? "bg-emerald-600 text-white"
      : value === "POR_VENCER"
        ? "bg-amber-500 text-white"
        : value === "VENCIDO"
          ? "bg-destructive text-destructive-foreground"
          : "";

  return (
    <Badge className={className} variant={className ? "default" : "secondary"}>
      {formatear(value)}
    </Badge>
  );
}

function Field({
  label,
  name,
  required,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={`documento-${name}`}>
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      <Input id={`documento-${name}`} name={name} required={required} {...props} />
    </div>
  );
}

function SelectField({
  label,
  name,
  values,
  required = false,
}: {
  label: string;
  name: string;
  values: string[];
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </span>
      <select
        className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        name={name}
        required={required}
      >
        {values.map((value) => (
          <option key={value} value={value}>
            {formatear(value)}
          </option>
        ))}
      </select>
    </label>
  );
}

function formatear(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatearFecha(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}
