"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { IconExternalLink, IconFilePlus, IconFileUpload, IconTrash } from "@tabler/icons-react";

import { useSesion } from "@/modulos/autenticacion/ganchos/use-sesion";
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
import {
  obtenerArchivoDocumentoCompartidoPorCodigo,
  obtenerArchivoDocumentoPorCodigo,
  obtenerTiposDocumento,
} from "../servicios/activos-api";
import {
  useCrearDocumentoActivoMutation,
  useEliminarDocumentoActivoMutation,
  useQuitarCoberturaDocumentoCompartidoMutation,
} from "../servicios/activos-queries";
import type {
  DocumentoActivo,
  EstadoDocumentoActivo,
  MetadataOrigenCambio,
  TipoDocumentoActivo,
} from "../tipos/activo.tipos";
import type { TipoDocumentoMaestro } from "../tipos/carga-masiva.tipos";

type Props = {
  codigo: string;
  documentos: DocumentoActivo[];
  editable?: boolean;
  /** Se llama tras crear o eliminar, para que el contenedor recargue la lista. */
  onCambio?: () => void;
  /** Vista reducida (ej. dentro del panel lateral): oculta columnas secundarias. */
  compacto?: boolean;
  /** Trazabilidad del historial: desde que proceso se gestiona (ej. inventario fisico). */
  origen?: MetadataOrigenCambio;
};

type EstadoDocumentosOptimistas = {
  codigo: string;
  creados: DocumentoActivo[];
  eliminadosIds: number[];
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

export function DocumentosActivo({
  codigo,
  documentos,
  editable = true,
  onCambio,
  compacto = false,
  origen,
}: Props) {
  const router = useRouter();
  const { usuario } = useSesion();
  const [mostrarFormulario, setMostrarFormulario] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);
  const [abriendoId, setAbriendoId] = React.useState<number | null>(null);
  const [archivoNombre, setArchivoNombre] = React.useState("");
  const [archivoDataUrl, setArchivoDataUrl] = React.useState("");
  const [documentosOptimistas, setDocumentosOptimistas] =
    React.useState<EstadoDocumentosOptimistas>({
      codigo,
      creados: [],
      eliminadosIds: [],
    });
  const [tiposMaestro, setTiposMaestro] = React.useState<TipoDocumentoMaestro[]>(
    [],
  );
  const [tipoSeleccionado, setTipoSeleccionado] = React.useState<string>("SOAT");
  const crearDocumentoMutation = useCrearDocumentoActivoMutation(codigo);
  const eliminarDocumentoMutation = useEliminarDocumentoActivoMutation(
    codigo,
    origen
  );
  const quitarCoberturaMutation = useQuitarCoberturaDocumentoCompartidoMutation(
    codigo,
    origen
  );

  const documentosLocales = React.useMemo(() => {
    const documentosCreados =
      documentosOptimistas.codigo === codigo ? documentosOptimistas.creados : [];
    const documentosEliminadosIds =
      documentosOptimistas.codigo === codigo
        ? documentosOptimistas.eliminadosIds
        : [];
    const eliminados = new Set(documentosEliminadosIds);
    const base = documentos.filter((documento) => !eliminados.has(documento.id));
    const idsBase = new Set(base.map((documento) => documento.id));
    const creados = documentosCreados.filter(
      (documento) => !eliminados.has(documento.id) && !idsBase.has(documento.id)
    );
    return [...base, ...creados];
  }, [codigo, documentos, documentosOptimistas]);

  // Maestro Documentario: tipos disponibles, alcance y vencimiento obligatorio.
  React.useEffect(() => {
    let activo = true;
    obtenerTiposDocumento()
      .then((tipos) => {
        if (activo) setTiposMaestro(tipos);
      })
      .catch(() => {
        // Si falla, se usa la lista de respaldo (comportamiento anterior).
      });
    return () => {
      activo = false;
    };
  }, []);

  const opcionesTipo = React.useMemo(() => {
    if (tiposMaestro.length > 0) {
      return tiposMaestro
        .filter((tipo) => tipo.activo)
        .map((tipo) => ({
          codigo: tipo.codigo,
          nombre: tipo.nombre,
          alcance: tipo.alcance,
          requiereVencimiento: tipo.requiereVencimiento,
        }));
    }
    return tiposDocumento.map((codigo) => ({
      codigo,
      nombre: formatear(codigo),
      alcance: "INDIVIDUAL" as const,
      requiereVencimiento: false,
    }));
  }, [tiposMaestro]);

  const metaTipo = opcionesTipo.find((tipo) => tipo.codigo === tipoSeleccionado);
  const requiereVencimiento = metaTipo?.requiereVencimiento ?? false;
  const esCompartido = metaTipo?.alcance === "COMPARTIDO";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setIsSaving(true);

    const formData = new FormData(form);
    const fechaVencimiento = String(formData.get("fechaVencimiento") ?? "");
    const observacion = String(formData.get("observacion") ?? "").trim();
    const archivoUrl = archivoDataUrl || "pendiente-storage";

    if (!archivoDataUrl) {
      toast.error("Selecciona un documento desde tu equipo.");
      setIsSaving(false);
      return;
    }

    if (requiereVencimiento && !fechaVencimiento) {
      toast.error("Este tipo de documento requiere fecha de vencimiento.");
      setIsSaving(false);
      return;
    }

    try {
      const documentoCreado = await crearDocumentoMutation.mutateAsync({
        tipoDocumento: tipoSeleccionado as TipoDocumentoActivo,
        numero: String(formData.get("numero") ?? "").trim(),
        fechaEmision: String(formData.get("fechaEmision") ?? ""),
        fechaVencimiento: fechaVencimiento || undefined,
        archivoUrl,
        nombreArchivo: archivoNombre || undefined,
        observacion: observacion || undefined,
        usuarioCarga:
          String(formData.get("usuarioCarga") ?? "").trim() || "usuario.activos",
        ...(origen ?? {}),
      });
      setDocumentosOptimistas((actual) => {
        const base =
          actual.codigo === codigo
            ? actual
            : { codigo, creados: [], eliminadosIds: [] };
        const creados = base.creados.some(
          (documento) => documento.id === documentoCreado.id
        )
          ? base.creados.map((documento) =>
              documento.id === documentoCreado.id ? documentoCreado : documento
            )
          : [...base.creados, documentoCreado];
        return { ...base, creados };
      });

      form.reset();
      setArchivoNombre("");
      setArchivoDataUrl("");
      setMostrarFormulario(false);
      toast.success("Documento registrado correctamente.");
      onCambio?.();
      router.refresh();
    } catch (error) {
      toast.error(extraerMensajeError(error, "No se pudo registrar el documento."));
    } finally {
      setIsSaving(false);
    }
  }

  async function onArchivoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const archivo = event.target.files?.[0];

    if (!archivo) {
      setArchivoNombre("");
      setArchivoDataUrl("");
      return;
    }

    if (archivo.size > 10 * 1024 * 1024) {
      event.target.value = "";
      setArchivoNombre("");
      setArchivoDataUrl("");
      toast.error("El documento supera 10 MB. Selecciona uno mas ligero.");
      return;
    }

    setArchivoNombre(archivo.name);
    setArchivoDataUrl(await fileToDataUrl(archivo));
  }

  async function eliminarDocumento(documento: DocumentoActivo) {
    setDeletingId(documento.id);

    try {
      if (documento.alcance === "COMPARTIDO") {
        await quitarCoberturaMutation.mutateAsync(documento.id);
        toast.success("Se quito este activo del documento compartido.");
      } else {
        await eliminarDocumentoMutation.mutateAsync(documento.id);
        toast.success("Documento eliminado correctamente.");
      }
      setDocumentosOptimistas((actual) => {
        const base =
          actual.codigo === codigo
            ? actual
            : { codigo, creados: [], eliminadosIds: [] };
        const eliminadosIds = base.eliminadosIds.includes(documento.id)
          ? base.eliminadosIds
          : [...base.eliminadosIds, documento.id];
        return { ...base, eliminadosIds };
      });
      onCambio?.();
      router.refresh();
    } catch (error) {
      toast.error(extraerMensajeError(error, "No se pudo eliminar el documento."));
    } finally {
      setDeletingId(null);
    }
  }

  async function abrirSustento(documento: DocumentoActivo) {
    setAbriendoId(documento.id);

    try {
      await obtenerYAbrirArchivoDocumento(codigo, documento);
    } catch (error) {
      toast.error(extraerMensajeError(error, "No se pudo abrir el sustento."));
    } finally {
      setAbriendoId(null);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold">Documentos del activo</p>
          <p className="text-sm text-muted-foreground">
            {documentosLocales.length} documento
            {documentosLocales.length === 1 ? "" : "s"} registrado
            {documentosLocales.length === 1 ? "" : "s"}
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

      {editable && mostrarFormulario ? (
        <form
          onSubmit={onSubmit}
          className="@container grid gap-4 rounded-xl border border-border bg-muted/20 p-4"
        >
          <div className="grid gap-4 @lg:grid-cols-2 @3xl:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-foreground">
                Tipo documento<span className="ml-1 text-destructive">*</span>
              </span>
              <select
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                name="tipoDocumento"
                required
                value={tipoSeleccionado}
                onChange={(event) => setTipoSeleccionado(event.target.value)}
              >
                {opcionesTipo.map((tipo) => (
                  <option key={tipo.codigo} value={tipo.codigo}>
                    {tipo.nombre}
                  </option>
                ))}
              </select>
            </label>
            <Field name="numero" label="Numero" required />
            <Field name="fechaEmision" label="Fecha emision" type="date" required />
            <Field
              name="fechaVencimiento"
              label="Fecha vencimiento"
              type="date"
              required={requiereVencimiento}
            />
            <div className="grid gap-2">
              <Label htmlFor="documento-archivo">
                Documento desde equipo
                <span className="ml-1 text-destructive">*</span>
              </Label>
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <Button asChild type="button" variant="outline">
                  <label htmlFor="documento-archivo" className="cursor-pointer">
                    <IconFileUpload />
                    Seleccionar documento
                  </label>
                </Button>
                <Input
                  id="documento-archivo"
                  className="sr-only"
                  type="file"
                  onChange={onArchivoChange}
                />
                <span className="min-w-0 max-w-full truncate rounded-full border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                  {archivoNombre || "Ningun documento seleccionado"}
                </span>
              </div>
            </div>
            <Field
              name="usuarioCarga"
              label="Usuario responsable"
              value={usuario?.nombreUsuario ?? "usuario.activos"}
              readOnly
              className="cursor-default bg-muted/40 text-muted-foreground"
            />
          </div>
          {esCompartido ? (
            <p className="rounded-md border border-sky-200 bg-sky-50/60 px-3 py-2 text-xs text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300">
              Este tipo es compartido (cubre varios activos). Aqui se guardara
              solo en este activo. Para cubrir varias placas a la vez, usa la
              Carga masiva de documentos.
            </p>
          ) : null}
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
              <TableHead className={compacto ? "hidden" : undefined}>
                Numero
              </TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className={compacto ? "hidden" : undefined}>
                Emision
              </TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead className={compacto ? "hidden" : undefined}>
                Usuario
              </TableHead>
              <TableHead>Sustento</TableHead>
              {editable ? <TableHead className="text-center">Accion</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {documentosLocales.map((documento) => (
              <TableRow key={documento.id}>
                <TableCell className="font-medium">
                  <span className="flex items-center gap-2">
                    {formatear(documento.tipoDocumento)}
                    {documento.alcance === "COMPARTIDO" ? (
                      <Badge variant="outline" className="font-normal">
                        Compartido
                        {documento.coberturaTotal
                          ? ` (${documento.coberturaTotal})`
                          : ""}
                      </Badge>
                    ) : null}
                  </span>
                </TableCell>
                <TableCell className={compacto ? "hidden" : undefined}>
                  {documento.numero ?? "-"}
                </TableCell>
                <TableCell>
                  <EstadoDocumentoBadge value={documento.estadoDocumento} />
                </TableCell>
                <TableCell className={compacto ? "hidden" : undefined}>
                  {formatearFecha(documento.fechaEmision)}
                </TableCell>
                <TableCell>{formatearFecha(documento.fechaVencimiento)}</TableCell>
                <TableCell className={compacto ? "hidden" : undefined}>
                  {documento.usuarioActualizacion ??
                    documento.usuarioCarga ??
                    "-"}
                </TableCell>
                <TableCell>
                  {documento.tieneArchivo ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline disabled:opacity-60"
                      disabled={abriendoId === documento.id}
                      onClick={() => abrirSustento(documento)}
                    >
                      <IconExternalLink className="size-4" />
                      {abriendoId === documento.id ? "Abriendo..." : "Ver"}
                    </button>
                  ) : (
                    "Registrado"
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
                      {deletingId === documento.id
                        ? "Quitando..."
                        : documento.alcance === "COMPARTIDO"
                          ? "Quitar"
                          : "Eliminar"}
                    </Button>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
            {!documentosLocales.length ? (
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

// El archivo ya no viaja en la lista de documentos (pesaba hasta 2 MB por
// activo): se pide al backend recien cuando el usuario abre el sustento.
// Lanza error si la descarga falla; el caller decide el toast.
export async function obtenerYAbrirArchivoDocumento(
  codigo: string,
  documento: Pick<DocumentoActivo, "id" | "alcance">
) {
  const { archivoUrl } =
    documento.alcance === "COMPARTIDO"
      ? await obtenerArchivoDocumentoCompartidoPorCodigo(codigo, documento.id)
      : await obtenerArchivoDocumentoPorCodigo(codigo, documento.id);

  if (!archivoUrl) {
    throw new Error("Este documento no tiene archivo adjunto.");
  }

  if (archivoUrl.startsWith("data:")) {
    // base64 -> Blob para que el navegador lo abra como archivo real.
    const blob = await (await fetch(archivoUrl)).blob();
    window.open(URL.createObjectURL(blob), "_blank");
  } else {
    window.open(archivoUrl, "_blank", "noopener,noreferrer");
  }
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
