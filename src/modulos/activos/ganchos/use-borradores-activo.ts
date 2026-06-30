// Estado y manejadores de los "borradores" del formulario de creacion de
// activos: tanques, documentos e imagenes que se agregan en memoria y se
// guardan junto al activo al crearlo. Extraido de activo-formulario.tsx.

import * as React from "react";
import { toast } from "sonner";

import type {
  CrearDocumentoActivoPayload,
  CrearImagenActivoPayload,
  CrearTanqueActivoPayload,
  TipoDocumentoActivo,
  TipoImagenActivo,
  TipoTanqueActivo,
} from "../tipos/activo.tipos";

export function useBorradoresActivo({
  setActiveTab,
  actualizarResumen,
}: {
  setActiveTab: (tab: string) => void;
  actualizarResumen: () => void;
}) {
  const [documentosPendientes, setDocumentosPendientes] = React.useState<
    CrearDocumentoActivoPayload[]
  >([]);
  const [tanquesPendientes, setTanquesPendientes] = React.useState<
    CrearTanqueActivoPayload[]
  >([]);
  const [imagenesPendientes, setImagenesPendientes] = React.useState<
    CrearImagenActivoPayload[]
  >([]);
  const [tipoTanque, setTipoTanque] = React.useState<TipoTanqueActivo>("DIESEL");
  const [selectedImageFileName, setSelectedImageFileName] =
    React.useState<string>("");
  const [localImageUrl, setLocalImageUrl] = React.useState<string>("");
  const [selectedDocFileName, setSelectedDocFileName] =
    React.useState<string>("");
  const [localDocUrl, setLocalDocUrl] = React.useState<string>("");
  const documentoDraftRef = React.useRef<HTMLDivElement>(null);
  const tanqueDraftRef = React.useRef<HTMLDivElement>(null);
  const imagenDraftRef = React.useRef<HTMLDivElement>(null);
  const imageFileInputRef = React.useRef<HTMLInputElement>(null);
  const docFileInputRef = React.useRef<HTMLInputElement>(null);

  function agregarDocumento() {
    const root = documentoDraftRef.current;
    if (!root) return;

    const getValue = (name: string) =>
      (
        root.querySelector(`[name="${name}"]`) as
          | HTMLInputElement
          | HTMLSelectElement
          | null
      )?.value.trim() ?? "";

    const fechaVencimiento = getValue("fechaVencimiento");
    const observacion = getValue("observacionDocumento");
    const numeroDocumento = getValue("numeroDocumento");
    const fechaEmision = getValue("fechaEmision");
    const archivoUrl = localDocUrl || getValue("archivoUrlManual") || undefined;

    if (!numeroDocumento || !fechaEmision) {
      setActiveTab("documentos");
      toast.error("Completa numero y fecha de emision antes de agregar el documento.");
      return;
    }

    setDocumentosPendientes((items) => [
      ...items,
      {
        tipoDocumento: getValue("tipoDocumento") as TipoDocumentoActivo,
        numero: numeroDocumento,
        fechaEmision,
        fechaVencimiento: fechaVencimiento || undefined,
        archivoUrl,
        usuarioCarga: getValue("usuarioCarga") || "usuario.activos",
        observacion: observacion || undefined,
      },
    ]);

    setSelectedDocFileName("");
    setLocalDocUrl("");
    if (docFileInputRef.current) docFileInputRef.current.value = "";

    toast.success("Documento agregado", {
      description: "Se guardara junto al activo.",
    });
    root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea").forEach((input) => {
      input.value = "";
    });
    actualizarResumen();
  }

  function agregarTanque() {
    const root = tanqueDraftRef.current;
    if (!root) return;

    const getValue = (name: string) =>
      (root.querySelector(`[name="${name}"]`) as HTMLInputElement | null)?.value.trim() ??
      "";

    const observacion = getValue("observacionTanque");
    const tipoTanqueSeleccionado =
      getValue("tipoTanque") === "UREA" ? "UREA" : "DIESEL";
    const capacidad = Number(getValue("capacidadTanque"));

    if (!capacidad || capacidad <= 0) {
      toast.error("Ingresa una capacidad de tanque mayor a cero antes de agregarlo.");
      return;
    }

    setTanquesPendientes((items) => [
      ...items,
      {
        tipoTanque: tipoTanqueSeleccionado,
        capacidad,
        orden: Number(getValue("ordenTanque") || items.length + 1),
        observacion: observacion || undefined,
      },
    ]);

    root.querySelectorAll("input").forEach((input) => {
      input.value = "";
    });
    const tipoSelect = root.querySelector<HTMLSelectElement>(
      '[name="tipoTanque"]'
    );
    if (tipoSelect) {
      tipoSelect.value = "DIESEL";
    }
    setTipoTanque("DIESEL");
    toast.success("Tanque agregado", {
      description: "Se guardara junto al activo.",
    });
    actualizarResumen();
  }

  function onImageFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedImageFileName("");
      setLocalImageUrl("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Selecciona una imagen valida.");
      event.target.value = "";
      setSelectedImageFileName("");
      setLocalImageUrl("");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImageFileName(file.name);
      setLocalImageUrl(String(reader.result));
    };
    reader.onerror = () => {
      toast.error("No se pudo leer la imagen seleccionada.");
      setSelectedImageFileName("");
      setLocalImageUrl("");
    };
    reader.readAsDataURL(file);
  }

  function onDocFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedDocFileName("");
      setLocalDocUrl("");
      return;
    }

    const LIMITE_MB = 10;
    if (file.size > LIMITE_MB * 1024 * 1024) {
      toast.error(`El archivo supera los ${LIMITE_MB} MB permitidos.`);
      event.target.value = "";
      setSelectedDocFileName("");
      setLocalDocUrl("");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedDocFileName(file.name);
      setLocalDocUrl(String(reader.result));
    };
    reader.onerror = () => {
      toast.error("No se pudo leer el archivo seleccionado.");
      setSelectedDocFileName("");
      setLocalDocUrl("");
    };
    reader.readAsDataURL(file);
  }

  function agregarImagen() {
    const root = imagenDraftRef.current;
    if (!root) return;

    const getValue = (name: string) =>
      (
        root.querySelector(`[name="${name}"]`) as
          | HTMLInputElement
          | HTMLSelectElement
          | null
      )?.value.trim() ?? "";

    const url = localImageUrl;

    if (!url) {
      toast.error("Selecciona una imagen desde tu equipo.");
      return;
    }

    const orden = getValue("ordenImagen");
    const descripcion = getValue("descripcionImagen");

    setImagenesPendientes((items) => [
      ...items,
      {
        tipoImagen: getValue("tipoImagen") as TipoImagenActivo,
        url,
        descripcion: descripcion || undefined,
        orden: orden ? Number(orden) : undefined,
      },
    ]);

    root.querySelectorAll("input").forEach((input) => {
      input.value = "";
    });
    setSelectedImageFileName("");
    setLocalImageUrl("");
    toast.success("Imagen agregada", {
      description: "Se guardara junto al activo.",
    });
    actualizarResumen();
  }

  return {
    documentosPendientes,
    setDocumentosPendientes,
    tanquesPendientes,
    setTanquesPendientes,
    imagenesPendientes,
    setImagenesPendientes,
    tipoTanque,
    setTipoTanque,
    selectedImageFileName,
    localImageUrl,
    selectedDocFileName,
    localDocUrl,
    documentoDraftRef,
    tanqueDraftRef,
    imagenDraftRef,
    imageFileInputRef,
    docFileInputRef,
    agregarDocumento,
    agregarTanque,
    agregarImagen,
    onImageFileChange,
    onDocFileChange,
  };
}
