"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import {
  IconClipboardText,
  IconFileDescription,
  IconGasStation,
  IconPhotoPlus,
  IconReceipt2,
  IconRulerMeasure,
  IconSettings,
  IconShieldCheck,
  IconTruck,
  type Icon,
} from "@tabler/icons-react";

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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/compartido/componentes/ui/tabs";
import { cn } from "@/compartido/utilidades";
import { DocumentosActivo } from "./documentos-activo";
import { ImagenesActivo } from "./imagenes-activo";
import { TanquesActivo } from "./tanques-activo";
import {
  crearDocumentoPorCodigo,
  crearImagenPorCodigo,
  crearTanquePorCodigo,
  obtenerCarroceriasReferencia,
  registrarConfiguracionHistoricaPorCodigo,
} from "../servicios/activos-api";
import {
  useActualizarActivoMutation,
  useCrearActivoMutation,
} from "../servicios/activos-queries";
import type {
  Activo,
  CarroceriaReferencia,
  CrearDocumentoActivoPayload,
  CrearImagenActivoPayload,
  CrearTanqueActivoPayload,
  EstadoActivo,
  EstadoCalibracion,
  EstadoOperativo,
  ClaseEuro,
  TipoDocumentoActivo,
  TipoImagenActivo,
  TipoTanqueActivo,
  TipoActivo,
  TipoCambioConfiguracionHistorica,
  TipoTransmision,
  DocumentoActivo,
  ImagenActivo,
  PlantillaInventario,
  TanqueActivo,
} from "../tipos/activo.tipos";

type Props = {
  activo?: Activo;
  modo?: "crear" | "editar";
  documentos?: DocumentoActivo[];
  imagenes?: ImagenActivo[];
  tanques?: TanqueActivo[];
};

type RegistroResumenData = Record<string, Array<[string, unknown]>>;
type ActivoTab =
  | "base"
  | "adquisicion"
  | "vehiculo"
  | "equipamiento"
  | "dimensiones"
  | "control"
  | "combustible"
  | "documentos";

const TABS_POR_TIPO_ACTIVO: Record<TipoActivo, ActivoTab[]> = {
  VEHICULO: [
    "base",
    "adquisicion",
    "vehiculo",
    "equipamiento",
    "dimensiones",
    "control",
    "combustible",
    "documentos",
  ],
  EQUIPO: [
    "base",
    "adquisicion",
    "equipamiento",
    "dimensiones",
    "control",
    "documentos",
  ],
  HERRAMIENTA: ["base", "adquisicion", "control", "documentos"],
  DISPOSITIVO: ["base", "adquisicion", "equipamiento", "control", "documentos"],
  OTRO: ["base", "adquisicion", "documentos"],
};

export function ActivoFormulario({
  activo,
  modo = "crear",
  documentos = [],
  imagenes = [],
  tanques = [],
}: Props) {
  const router = useRouter();
  const [isSaving, setIsSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("base");
  const [tipoActivoSeleccionado, setTipoActivoSeleccionado] =
    React.useState<TipoActivo>(activo?.tipoActivo ?? "VEHICULO");
  const [documentosPendientes, setDocumentosPendientes] = React.useState<
    CrearDocumentoActivoPayload[]
  >([]);
  const [tanquesPendientes, setTanquesPendientes] = React.useState<
    CrearTanqueActivoPayload[]
  >([]);
  const [imagenesPendientes, setImagenesPendientes] = React.useState<
    CrearImagenActivoPayload[]
  >([]);
  const [formVersion, setFormVersion] = React.useState(0);
  const [tipoTanque, setTipoTanque] = React.useState<TipoTanqueActivo>("DIESEL");
  const [plantillaSeleccionada, setPlantillaSeleccionada] =
    React.useState<PlantillaInventario>(
      activo?.vehiculo?.plantillaInventario ?? "EQUIPO_LIVIANO"
    );
  const [estadoActivoGrupo, setEstadoActivoGrupo] = React.useState<
    "ACTIVO" | "BAJA"
  >(activo?.estadoActivo === "ACTIVO" ? "ACTIVO" : "BAJA");
  const [causaBaja, setCausaBaja] = React.useState<
    "SINIESTRADO" | "INACTIVO"
  >(activo?.estadoActivo === "SINIESTRADO" ? "SINIESTRADO" : "INACTIVO");
  const [carroceriasReferencia, setCarroceriasReferencia] = React.useState<
    CarroceriaReferencia[]
  >([]);
  const [carroceriasError, setCarroceriasError] = React.useState<string | null>(
    null
  );
  const [selectedCarroceriaReferenciaId, setSelectedCarroceriaReferenciaId] =
    React.useState<string>(
      activo?.vehiculo?.carroceriaReferenciaId
        ? String(activo.vehiculo.carroceriaReferenciaId)
        : ""
    );
  const [selectedImageFileName, setSelectedImageFileName] =
    React.useState<string>("");
  const [localImageUrl, setLocalImageUrl] = React.useState<string>("");
  const crearActivoMutation = useCrearActivoMutation();
  const actualizarActivoMutation = useActualizarActivoMutation();
  const documentoDraftRef = React.useRef<HTMLDivElement>(null);
  const tanqueDraftRef = React.useRef<HTMLDivElement>(null);
  const imagenDraftRef = React.useRef<HTMLDivElement>(null);
  const imageFileInputRef = React.useRef<HTMLInputElement>(null);
  const formularioRef = React.useRef<HTMLDivElement>(null);
  const isEdit = modo === "editar";
  const actualizarResumen = React.useCallback(() => {
    setFormVersion((version) => version + 1);
  }, []);
  const tabsDisponibles = TABS_POR_TIPO_ACTIVO[tipoActivoSeleccionado];
  const tieneTab = React.useCallback(
    (tab: ActivoTab) => tabsDisponibles.includes(tab),
    [tabsDisponibles]
  );

  React.useEffect(() => {
    let isMounted = true;

    setCarroceriasError(null);
    obtenerCarroceriasReferencia(plantillaSeleccionada)
      .then((referencias) => {
        if (!isMounted) return;
        const referenciasFiltradas = referencias.filter(
          (referencia) =>
            referencia.plantillaInventario === plantillaSeleccionada
        );
        setCarroceriasReferencia(referenciasFiltradas);

        if (process.env.NODE_ENV !== "production") {
          console.log(
            `[Activos] carrocerias cargadas ${JSON.stringify({
              plantilla: plantillaSeleccionada,
              total: referenciasFiltradas.length,
              opciones: referenciasFiltradas.map((referencia) => referencia.nombre),
            })}`
          );
        }

        const selectedStillExists = referenciasFiltradas.some(
          (referencia) =>
            String(referencia.id) === selectedCarroceriaReferenciaId
        );

        if (!selectedStillExists) {
          setSelectedCarroceriaReferenciaId("");
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setCarroceriasReferencia([]);
        setCarroceriasError("No se pudo cargar el catalogo de carrocerias.");
      });

    return () => {
      isMounted = false;
    };
  }, [plantillaSeleccionada, selectedCarroceriaReferenciaId]);

  React.useEffect(() => {
    actualizarResumen();
  }, [actualizarResumen, causaBaja, estadoActivoGrupo]);

  React.useEffect(() => {
    if (!tabsDisponibles.includes(activeTab as ActivoTab)) {
      setActiveTab("base");
    }

    if (!tabsDisponibles.includes("combustible") && tanquesPendientes.length) {
      setTanquesPendientes([]);
    }
  }, [activeTab, tabsDisponibles, tanquesPendientes.length]);

  function setFormValue(name: string, value: string | number | null | undefined) {
    const root = formularioRef.current;
    const input = root?.querySelector(`[name="${name}"]`) as
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement
      | null;

    if (!input) return;
    input.value = value === null || value === undefined ? "" : String(value);
  }

  function aplicarCarroceriaReferencia(referenciaId: string) {
    setSelectedCarroceriaReferenciaId(referenciaId);

    const referencia = carroceriasReferencia.find(
      (item) => String(item.id) === referenciaId
    );

    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[Activos] carroceria seleccionada ${JSON.stringify({
          plantilla: plantillaSeleccionada,
          id: referencia?.id,
          nombre: referencia?.nombre,
          ancho: referencia?.anchoSugerido,
          longitud: referencia?.longitudSugerida,
          alto: referencia?.altoSugerido,
          ejes: referencia?.ejesSugeridos,
          categoria: referencia?.categoriaSugerida,
        })}`
      );
    }

    if (!referencia) {
      setFormValue("carroceria", "");
      setFormValue("ancho", "");
      setFormValue("longitud", "");
      setFormValue("alto", "");
      setFormValue("ejes", "");
      setFormValue("categoria", "");
      actualizarResumen();
      return;
    }

    setFormValue("carroceria", referencia.nombre);
    setFormValue("ancho", referencia.anchoSugerido);
    setFormValue("longitud", referencia.longitudSugerida);
    setFormValue("alto", referencia.altoSugerido);
    setFormValue("ejes", referencia.ejesSugeridos);
    setFormValue("categoria", referencia.categoriaSugerida);
    actualizarResumen();
  }

  const resumen = React.useMemo<RegistroResumenData>(() => {
    const root = formularioRef.current;
    const getValue = (name: string) =>
      (
        root?.querySelector(`[name="${name}"]`) as
          | HTMLInputElement
          | HTMLSelectElement
          | HTMLTextAreaElement
          | null
      )?.value.trim() ?? "";

    return {
      base: [
        ["Codigo", getValue("codigo") || activo?.codigo],
        ["Descripcion", getValue("descripcion") || activo?.descripcion],
        ["Tipo", getValue("tipoActivo") || activo?.tipoActivo],
        ["Ubicacion", getValue("ubicacion") || activo?.ubicacion],
        ["Estado", formatearEstadoActivo(getValue("estadoActivo") || activo?.estadoActivo)],
      ],
      adquisicion: [
        ["Valor", getValue("valorUnidad") || activo?.valorUnidad],
        ["Moneda", getValue("moneda") || activo?.moneda],
        ["Proveedor", getValue("proveedor") || activo?.proveedor],
        ["Factura", getValue("numeroFactura") || activo?.numeroFactura],
        ["Fecha", getValue("fechaFactura") || activo?.fechaFactura],
      ],
      vehiculo: [
        ["Clase", getValue("plantillaInventario") || activo?.vehiculo?.plantillaInventario],
        ["Carroceria", getValue("carroceria") || activo?.vehiculo?.carroceria],
        ["Placa", getValue("placa") || activo?.vehiculo?.placa],
        ["Marca", getValue("marca") || activo?.vehiculo?.marca],
        ["Modelo", getValue("modelo") || activo?.vehiculo?.modelo],
        ["Chasis", getValue("serieChasis") || activo?.vehiculo?.serieChasis],
        ["Motor", getValue("serieMotor") || activo?.vehiculo?.serieMotor],
      ],
      equipamiento: [
        ["Radio", getValue("radioComunicacion") || activo?.vehiculo?.radioComunicacion],
        ["Autorradio", getValue("autorradio") || activo?.vehiculo?.autorradio],
        ["Llantas", getValue("llantasRepuesto") || activo?.vehiculo?.llantasRepuesto],
        ["Camara", getValue("camara") || activo?.vehiculo?.camara],
        ["Tablet", getValue("tablet") || activo?.vehiculo?.tablet],
        ["Seguridad", getValue("dispositivosSeguridad") || activo?.vehiculo?.dispositivosSeguridad],
      ],
      control: [
        ["Condicion", getValue("estadoOperativo") || activo?.vehiculo?.estadoOperativo],
        ["Calibracion", getValue("estadoCalibracion") || activo?.vehiculo?.estadoCalibracion],
        ["Observacion", getValue("observacion") || activo?.observacion],
      ],
      dimensiones: [
        ["Ancho", getValue("ancho") || activo?.vehiculo?.ancho],
        ["Longitud", getValue("longitud") || activo?.vehiculo?.longitud],
        ["Alto", getValue("alto") || activo?.vehiculo?.alto],
        ["Suspension", getValue("tipoSuspension") || activo?.vehiculo?.tipoSuspension],
        ["Euro", getValue("claseEuro") || activo?.vehiculo?.claseEuro],
        ["Corona", getValue("ratioCorona") || activo?.vehiculo?.ratioCorona],
        ["Transmision", getValue("tipoTransmision") || activo?.vehiculo?.tipoTransmision],
      ],
      pendientes: [
        ["Tanques", `${tanquesPendientes.length} agregado${tanquesPendientes.length === 1 ? "" : "s"}`],
        ["Documentos", `${documentosPendientes.length} agregado${documentosPendientes.length === 1 ? "" : "s"}`],
        ["Imagenes", `${imagenesPendientes.length} agregada${imagenesPendientes.length === 1 ? "" : "s"}`],
      ],
    };
  }, [
    activo,
    documentosPendientes.length,
    formVersion,
    imagenesPendientes.length,
    tanquesPendientes.length,
  ]);

  async function onSubmit() {
    const root = formularioRef.current;
    if (!root) return;

    setIsSaving(true);

    const getValue = (name: string) =>
      (
        root.querySelector(`[name="${name}"]`) as
          | HTMLInputElement
          | HTMLSelectElement
          | HTMLTextAreaElement
          | null
      )?.value.trim() ?? "";

    const codigo = getValue("codigo").toUpperCase();
    const numero = (name: string) => {
      const value = getValue(name);
      return value ? Number(value) : null;
    };
    const texto = (name: string) => getValue(name).toUpperCase() || null;

    try {
      const descripcion = getValue("descripcion");
      const ubicacion = getValue("ubicacion");
      const tipoActivo = getValue("tipoActivo") as TipoActivo;
      const estadoActivo = getValue("estadoActivo") as EstadoActivo;
      const plantillaInventario =
        (getValue("plantillaInventario") as PlantillaInventario) ||
        "EQUIPO_LIVIANO";
      const carroceriaReferenciaId = numero("carroceriaReferenciaId");
      const tabsParaGuardar = TABS_POR_TIPO_ACTIVO[tipoActivo] ?? tabsDisponibles;
      const puedeGuardarTab = (tab: ActivoTab) => tabsParaGuardar.includes(tab);

      if (!isEdit && !codigo) {
        setActiveTab("base");
        throw new Error("Completa el codigo del activo en la pestana Base.");
      }

      if (!descripcion) {
        setActiveTab("base");
        throw new Error("Completa la descripcion del activo en la pestana Base.");
      }

      if (!ubicacion) {
        setActiveTab("base");
        throw new Error("Completa la ubicacion del activo en la pestana Base.");
      }

      if (!tipoActivo) {
        setActiveTab("base");
        throw new Error("Selecciona el tipo de activo en la pestana Base.");
      }

      if (!estadoActivo) {
        setActiveTab("base");
        throw new Error("Selecciona el estado del activo en la pestana Base.");
      }

      if (puedeGuardarTab("vehiculo") && !getValue("plantillaInventario")) {
        setActiveTab("vehiculo");
        throw new Error("Selecciona la clase del activo en la pestana Vehiculo.");
      }

      if (puedeGuardarTab("vehiculo") && !getValue("serieChasis")) {
        setActiveTab("vehiculo");
        throw new Error("Completa la serie de chasis en la pestana Vehiculo.");
      }

      if (puedeGuardarTab("vehiculo") && !getValue("serieMotor")) {
        setActiveTab("vehiculo");
        throw new Error("Completa la serie y marca de motor en la pestana Vehiculo.");
      }

      const tanquesAGuardar = puedeGuardarTab("combustible")
        ? tanquesPendientes
        : [];
      const tanqueInvalido = tanquesAGuardar.find(
        (tanque) => !tanque.capacidad || tanque.capacidad <= 0
      );

      if (tanqueInvalido) {
        setActiveTab("combustible");
        throw new Error("Revisa los tanques agregados: la capacidad debe ser mayor a cero.");
      }

      const documentoInvalido = documentosPendientes.find(
        (documento) =>
          !documento.numero ||
          !documento.fechaEmision ||
          !documento.archivoUrl ||
          !isHttpUrl(documento.archivoUrl)
      );

      if (documentoInvalido) {
        setActiveTab("documentos");
        throw new Error(
          "Revisa los documentos agregados: numero, fecha de emision y URL/archivo son obligatorios."
        );
      }

      const debeGuardarDetalleTecnico =
        puedeGuardarTab("vehiculo") ||
        puedeGuardarTab("equipamiento") ||
        puedeGuardarTab("dimensiones") ||
        puedeGuardarTab("control");

      const vehiculo = debeGuardarDetalleTecnico
        ? {
            plantillaInventario,
            carroceriaReferenciaId:
              puedeGuardarTab("vehiculo") &&
              carroceriaReferenciaId &&
              carroceriaReferenciaId > 0
                ? carroceriaReferenciaId
                : null,
            placa: puedeGuardarTab("vehiculo") ? texto("placa") : null,
            anioFabricacion: puedeGuardarTab("vehiculo")
              ? numero("anioFabricacion")
              : null,
            color: puedeGuardarTab("vehiculo") ? texto("color") : null,
            marca: puedeGuardarTab("vehiculo") ? texto("marca") : null,
            modelo: puedeGuardarTab("vehiculo") ? texto("modelo") : null,
            carroceria: puedeGuardarTab("vehiculo") ? texto("carroceria") : null,
            ejes: puedeGuardarTab("vehiculo") ? numero("ejes") : null,
            categoria: puedeGuardarTab("vehiculo") ? texto("categoria") : null,
            serieChasis: puedeGuardarTab("vehiculo") ? texto("serieChasis") : null,
            serieMotor: puedeGuardarTab("vehiculo") ? texto("serieMotor") : null,
            radioComunicacion: puedeGuardarTab("equipamiento")
              ? texto("radioComunicacion")
              : null,
            autorradio: puedeGuardarTab("equipamiento") ? texto("autorradio") : null,
            llantasRepuesto: puedeGuardarTab("equipamiento")
              ? texto("llantasRepuesto")
              : null,
            camara: puedeGuardarTab("equipamiento") ? texto("camara") : null,
            tablet: puedeGuardarTab("equipamiento") ? texto("tablet") : null,
            dispositivosSeguridad: puedeGuardarTab("equipamiento")
              ? texto("dispositivosSeguridad")
              : null,
            estadoOperativo: puedeGuardarTab("control")
              ? ((getValue("estadoOperativo") || "OPERATIVO") as EstadoOperativo)
              : null,
            cajaHerramientas: puedeGuardarTab("equipamiento")
              ? texto("cajaHerramientas")
              : null,
            jaulaAntivuelco: puedeGuardarTab("equipamiento")
              ? texto("jaulaAntivuelco")
              : null,
            carriboy: puedeGuardarTab("equipamiento") ? texto("carriboy") : null,
            baranda: puedeGuardarTab("equipamiento") ? texto("baranda") : null,
            mamparon: puedeGuardarTab("equipamiento") ? texto("mamparon") : null,
            ancho: puedeGuardarTab("dimensiones") ? numero("ancho") : null,
            longitud: puedeGuardarTab("dimensiones") ? numero("longitud") : null,
            alto: puedeGuardarTab("dimensiones") ? numero("alto") : null,
            tipoSuspension: puedeGuardarTab("dimensiones")
              ? texto("tipoSuspension")
              : null,
            tipoTornamesa: puedeGuardarTab("dimensiones")
              ? texto("tipoTornamesa")
              : null,
            claseEuro: puedeGuardarTab("dimensiones")
              ? ((getValue("claseEuro") || null) as ClaseEuro | null)
              : null,
            ratioCorona: puedeGuardarTab("dimensiones")
              ? numero("ratioCorona")
              : null,
            tipoTransmision: puedeGuardarTab("dimensiones")
              ? ((getValue("tipoTransmision") || null) as TipoTransmision | null)
              : null,
            estadoCalibracion: puedeGuardarTab("control")
              ? ((getValue("estadoCalibracion") || "PENDIENTE") as EstadoCalibracion)
              : null,
          }
        : undefined;

      const payload = {
        tipoActivo,
        descripcion,
        ubicacion,
        estadoActivo,
        observacion: getValue("observacion") || undefined,
        valorUnidad: numero("valorUnidad"),
        moneda: getValue("moneda") || "PEN",
        proveedor: getValue("proveedor") || null,
        numeroFactura: getValue("numeroFactura") || null,
        fechaFactura: getValue("fechaFactura") || null,
        ...(vehiculo ? { vehiculo } : {}),
      };

      const saved = isEdit
        ? await actualizarActivoMutation.mutateAsync({
            id: activo!.id,
            payload,
          })
        : await crearActivoMutation.mutateAsync({
            codigo,
            ...payload,
          });

      if (!isEdit) {
        await Promise.all([
          ...documentosPendientes.map((documento) =>
            crearDocumentoPorCodigo(saved.codigo, documento)
          ),
          ...tanquesAGuardar.map((tanque) =>
            crearTanquePorCodigo(saved.codigo, tanque)
          ),
          ...imagenesPendientes.map((imagen) =>
            crearImagenPorCodigo(saved.codigo, imagen)
          ),
        ]);

        if (activo?.activoOrigenId && payload.vehiculo) {
          await registrarConfiguracionHistoricaPorCodigo(saved.codigo, {
            codigoNuevo: saved.codigo,
            codigoAnterior: activo.codigo,
            placaAnterior: activo.vehiculo?.placa ?? null,
            carroceriaAnterior: activo.vehiculo?.carroceria ?? null,
            placaNueva: payload.vehiculo.placa ?? null,
            carroceriaNueva: payload.vehiculo.carroceria ?? null,
            tipoCambio: inferirTipoCambioConfiguracion(activo, payload),
            motivo: construirMotivoConfiguracionHistorica(activo, payload),
            fechaCambio: new Date().toISOString(),
            usuarioRegistro: "activos.web",
          });
        }
      }

      router.push(`/activos/${saved.codigo}?${isEdit ? "updated" : "created"}=1`);
      router.refresh();
    } catch (err) {
      toast.error(extraerMensajeError(err, "No se pudo guardar el activo"));
    } finally {
      setIsSaving(false);
    }
  }

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
    const archivoUrl = getValue("archivoUrl");

    if (!numeroDocumento || !fechaEmision || !archivoUrl) {
      setActiveTab("documentos");
      toast.error(
        "Completa numero, fecha de emision y archivo o URL antes de agregar el documento."
      );
      return;
    }

    if (!isHttpUrl(archivoUrl)) {
      setActiveTab("documentos");
      toast.error("Ingresa una URL valida para el documento, por ejemplo https://...");
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
      toast.error("Selecciona un archivo de imagen valido.");
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

    const url = localImageUrl || getValue("urlImagen");

    if (!url) {
      toast.error("Selecciona una imagen o ingresa una URL.");
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

  function renderImagenesSection() {
    return (
      <Card className="mt-5">
        <CardHeader className="border-b border-border">
          <SectionIntro
            icon={IconPhotoPlus}
            title="Imagenes del activo"
            description={
              isEdit
                ? "Fotografias y evidencias visuales registradas para el activo."
                : "Fotografias y evidencias visuales que se guardaran junto al activo."
            }
          />
        </CardHeader>
        <CardContent className="p-5">
          {isEdit ? (
            <ImagenesActivo codigo={activo!.codigo} imagenes={imagenes} />
          ) : (
            <div className="grid gap-4">
              <div
                ref={imagenDraftRef}
                className="grid gap-4 rounded-xl border border-border bg-background/40 p-4"
              >
                <div className="grid gap-4 xl:grid-cols-[160px_220px_minmax(260px,1fr)_120px] xl:items-end">
                  <SelectField
                    name="tipoImagen"
                    label="Tipo"
                    defaultValue="FRONTAL"
                    values={[
                      "FRONTAL",
                      "LATERAL",
                      "POSTERIOR",
                      "INTERIOR",
                      "DOCUMENTO",
                      "OTRO",
                    ]}
                    required
                  />
                  <div className="grid gap-2">
                    <Label htmlFor="imagen-pendiente-archivo">
                      Imagen desde equipo
                    </Label>
                    <input
                      ref={imageFileInputRef}
                      id="imagen-pendiente-archivo"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={onImageFileChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      title={selectedImageFileName || "Seleccionar imagen"}
                      onClick={() => imageFileInputRef.current?.click()}
                    >
                      <span className="truncate">
                        {selectedImageFileName || "Seleccionar imagen"}
                      </span>
                    </Button>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="urlImagen" className="flex flex-wrap gap-x-1">
                      URL de imagen
                      <span className="text-xs font-normal text-muted-foreground">
                        opcional si hay archivo
                      </span>
                    </Label>
                    <Input
                      id="urlImagen"
                      name="urlImagen"
                      placeholder="https://servidor/imagen.jpg"
                    />
                  </div>
                  <Field
                    label="Orden"
                    min="0"
                    name="ordenImagen"
                    type="number"
                  />
                </div>
                <TextAreaField
                  label="Descripcion"
                  name="descripcionImagen"
                  placeholder="Detalle de la imagen, angulo, condicion visible o comentario de evidencia."
                />
                {localImageUrl ? (
                  <div className="grid gap-2 rounded-xl border border-border bg-background/50 p-3 sm:max-w-sm">
                    <span className="text-sm font-medium">Vista previa</span>
                    <img
                      src={localImageUrl}
                      alt={selectedImageFileName || "Imagen seleccionada"}
                      className="aspect-[4/3] w-full rounded-lg border border-border object-cover"
                    />
                  </div>
                ) : null}
                <div className="flex justify-end">
                  <Button type="button" variant="outline" onClick={agregarImagen}>
                    Agregar imagen
                  </Button>
                </div>
              </div>
              <PendingList
                empty="No hay imagenes agregadas para guardar."
                items={imagenesPendientes.map((imagen, index) => ({
                  id: `${imagen.tipoImagen}-${index}`,
                  title: `${formatLabel(imagen.tipoImagen)} - ${
                    imagen.descripcion || "Sin descripcion"
                  }`,
                  detail: imagen.url.startsWith("data:image/")
                    ? "Archivo seleccionado desde equipo"
                    : imagen.url,
                }))}
                onRemove={(index) =>
                  setImagenesPendientes((items) =>
                    items.filter((_, itemIndex) => itemIndex !== index)
                  )
                }
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      ref={formularioRef}
      className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]"
      onChange={actualizarResumen}
      onInput={actualizarResumen}
    >
      <div className="min-w-0">
      <Card>
        <CardHeader className="flex flex-col gap-3 border-b border-border md:flex-row md:items-center md:justify-between">
          <CardTitle>
            {isEdit ? "Modificar activo" : "Registrar activo"}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={() => router.push("/activos")}>
              Cancelar
            </Button>
            <Button type="button" disabled={isSaving} onClick={onSubmit}>
              {isSaving
                ? "Guardando..."
                : isEdit
                  ? "Actualizar"
                  : "Agregar"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-5 flex h-auto w-full flex-wrap justify-start gap-1 overflow-visible rounded-2xl">
              <TabsTrigger value="base" className="flex-none">
                <IconClipboardText className="size-4 text-primary" />
                Base
              </TabsTrigger>
              <TabsTrigger value="adquisicion" className="flex-none">
                <IconReceipt2 className="size-4 text-primary" />
                Adquisicion
              </TabsTrigger>
              {tieneTab("vehiculo") ? (
                <TabsTrigger value="vehiculo" className="flex-none">
                  <IconTruck className="size-4 text-primary" />
                  Vehiculo
                </TabsTrigger>
              ) : null}
              {tieneTab("equipamiento") ? (
                <TabsTrigger value="equipamiento" className="flex-none">
                  <IconSettings className="size-4 text-primary" />
                  Equipamiento
                </TabsTrigger>
              ) : null}
              {tieneTab("dimensiones") ? (
                <TabsTrigger value="dimensiones" className="flex-none">
                  <IconRulerMeasure className="size-4 text-primary" />
                  Dimensiones
                </TabsTrigger>
              ) : null}
              {tieneTab("control") ? (
                <TabsTrigger value="control" className="flex-none">
                  <IconShieldCheck className="size-4 text-primary" />
                  Control operativo
                </TabsTrigger>
              ) : null}
              {tieneTab("combustible") ? (
                <TabsTrigger value="combustible" className="flex-none">
                  <IconGasStation className="size-4 text-primary" />
                  Combustible
                </TabsTrigger>
              ) : null}
              <TabsTrigger value="documentos" className="flex-none">
                <IconFileDescription className="size-4 text-primary" />
                Documentos
              </TabsTrigger>
            </TabsList>

            <TabsContent forceMount value="base" className="mt-0 data-[state=inactive]:hidden">
              <SectionIntro
                icon={IconClipboardText}
                title="Datos base"
                description="Identificacion administrativa del activo."
              />
                <div className="grid gap-4 lg:grid-cols-[220px_1fr_220px]">
                  <Field
                    name="codigo"
                    label="Codigo"
                    placeholder="ACT-000864"
                    defaultValue={activo?.codigo}
                    disabled={isEdit}
                    required
                  />
                  <Field
                    name="descripcion"
                    label="Descripcion"
                    placeholder="Camioneta Toyota Hilux"
                    defaultValue={activo?.descripcion}
                    required
                  />
                  <input
                    name="estadoActivo"
                    type="hidden"
                    value={estadoActivoGrupo === "ACTIVO" ? "ACTIVO" : causaBaja}
                    readOnly
                  />
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-foreground">
                      Estado activo <span className="text-destructive">*</span>
                    </span>
                    <select
                      value={estadoActivoGrupo}
                      required
                      className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                      onChange={(event) => {
                        setEstadoActivoGrupo(event.target.value as "ACTIVO" | "BAJA");
                        actualizarResumen();
                      }}
                    >
                      <option value="ACTIVO">Activo</option>
                      <option value="BAJA">Baja</option>
                    </select>
                  </label>
                </div>
                {estadoActivoGrupo === "BAJA" ? (
                  <div className="grid gap-4 pt-4 md:grid-cols-2">
                    <SelectField
                      name="causaBaja"
                      label="Causa de baja"
                      defaultValue={causaBaja}
                      values={["SINIESTRADO", "INACTIVO"]}
                      onChange={(value) => {
                        setCausaBaja(value as "SINIESTRADO" | "INACTIVO");
                        actualizarResumen();
                      }}
                      labels={{
                        SINIESTRADO: "Siniestro",
                        INACTIVO: "De baja",
                      }}
                      required
                    />
                  </div>
                ) : null}
                <div className="grid gap-4 pt-4 md:grid-cols-2">
                  <SelectField
                    name="tipoActivo"
                    label="Tipo de activo"
                    defaultValue={activo?.tipoActivo ?? "VEHICULO"}
                    values={["VEHICULO", "EQUIPO", "HERRAMIENTA", "DISPOSITIVO", "OTRO"]}
                    onChange={(value) => {
                      const next = value as TipoActivo;
                      setTipoActivoSeleccionado(next);

                      if (!TABS_POR_TIPO_ACTIVO[next].includes(activeTab as ActivoTab)) {
                        setActiveTab("base");
                      }

                      actualizarResumen();
                    }}
                    required
                  />
                  <Field
                    name="ubicacion"
                    label="Ubicacion"
                    placeholder="Arequipa - Base principal"
                    defaultValue={activo?.ubicacion}
                    required
                  />
                </div>
            </TabsContent>

            <TabsContent forceMount value="adquisicion" className="mt-0 data-[state=inactive]:hidden">
              <SectionIntro
                icon={IconReceipt2}
                title="Datos economicos y adquisicion"
                description="Valor de unidad, proveedor y datos de factura."
              />
              <div className="grid gap-4 md:grid-cols-[1fr_140px]">
                <Field
                  name="valorUnidad"
                  label="Valor de unidad"
                  min="0"
                  placeholder="0.00"
                  step="0.01"
                  type="number"
                  defaultValue={activo?.valorUnidad ?? undefined}
                />
                <SelectField
                  name="moneda"
                  label="Moneda"
                  defaultValue={activo?.moneda ?? "PEN"}
                  values={["PEN", "USD"]}
                />
              </div>
              <div className="grid gap-4 pt-4 md:grid-cols-3">
                <Field
                  name="proveedor"
                  label="Proveedor"
                  placeholder="Proveedor o razon social"
                  defaultValue={activo?.proveedor ?? undefined}
                />
                <Field
                  name="numeroFactura"
                  label="Numero de factura"
                  placeholder="F001-000123"
                  defaultValue={activo?.numeroFactura ?? undefined}
                />
                <Field
                  name="fechaFactura"
                  label="Fecha de factura"
                  type="date"
                  defaultValue={toDateInputValue(activo?.fechaFactura)}
                />
              </div>
            </TabsContent>

            {tieneTab("vehiculo") ? (
            <TabsContent forceMount value="vehiculo" className="mt-0 data-[state=inactive]:hidden">
              <SectionIntro
                icon={IconTruck}
                title="Datos vehiculares"
                description="Placa, marca, modelo y datos propios de la unidad."
              />
                <div className="grid gap-4 lg:grid-cols-[260px_180px_1fr_1fr]">
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-foreground">
                      Clase
                      <span className="ml-1 text-destructive">*</span>
                    </span>
                    <select
                      name="plantillaInventario"
                      defaultValue={plantillaSeleccionada}
                      required
                      className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                      onChange={(event) => {
                        const nuevaPlantilla = event.target
                          .value as PlantillaInventario;
                        setPlantillaSeleccionada(nuevaPlantilla);
                        setSelectedCarroceriaReferenciaId("");
                        setFormValue("carroceriaReferenciaId", "");
                        setFormValue("carroceria", "");
                        setFormValue("ancho", "");
                        setFormValue("longitud", "");
                        setFormValue("alto", "");
                        setFormValue("ejes", "");
                        setFormValue("categoria", "");
                        actualizarResumen();
                      }}
                    >
                      {[
                        "CAMION",
                        "REMOLCADOR",
                        "SEMIREMOLQUE",
                        "EQUIPO_LIVIANO",
                      ].map((value) => (
                        <option key={value} value={value}>
                          {formatLabel(value)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Field name="placa" label="Placa" placeholder="BTZ-750" defaultValue={activo?.vehiculo?.placa ?? undefined} />
                  <Field name="marca" label="Marca" placeholder="TOYOTA" defaultValue={activo?.vehiculo?.marca ?? undefined} />
                  <Field name="modelo" label="Modelo" placeholder="HILUX" defaultValue={activo?.vehiculo?.modelo ?? undefined} />
                </div>
                <div className="grid gap-4 pt-4 md:grid-cols-2 lg:grid-cols-5">
                  <Field name="anioFabricacion" label="Ano fabricacion" type="number" defaultValue={activo?.vehiculo?.anioFabricacion ?? undefined} />
                  <Field name="color" label="Color" defaultValue={activo?.vehiculo?.color ?? undefined} />
                  <label className="grid gap-2">
                    <span
                      id="carroceria-referencia-label"
                      className="text-sm font-medium text-foreground"
                    >
                      Carroceria
                    </span>
                    <input
                      type="hidden"
                      name="carroceriaReferenciaId"
                      value={selectedCarroceriaReferenciaId}
                      readOnly
                    />
                    <select
                      key={plantillaSeleccionada}
                      id="carroceriaReferenciaSelect"
                      name="carroceriaReferenciaSelect"
                      aria-labelledby="carroceria-referencia-label"
                      defaultValue={selectedCarroceriaReferenciaId}
                      className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                      onChange={(event) =>
                        aplicarCarroceriaReferencia(event.target.value)
                      }
                    >
                      <option value="">Seleccionar referencia</option>
                      {carroceriasReferencia.map((referencia) => (
                        <option key={referencia.id} value={referencia.id}>
                          {formatLabel(referencia.nombre)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <input
                    name="carroceria"
                    type="hidden"
                    defaultValue={activo?.vehiculo?.carroceria ?? undefined}
                  />
                  <Field
                    name="ejes"
                    label="Ejes"
                    type="number"
                    defaultValue={activo?.vehiculo?.ejes ?? undefined}
                  />
                  <Field
                    name="categoria"
                    label="Categoria"
                    defaultValue={activo?.vehiculo?.categoria ?? undefined}
                  />
                </div>
                <div className="grid gap-4 pt-4 md:grid-cols-2">
                  <Field name="serieChasis" label="Serie de chasis" defaultValue={activo?.vehiculo?.serieChasis ?? undefined} required />
                  <Field name="serieMotor" label="Serie y marca de motor" defaultValue={activo?.vehiculo?.serieMotor ?? undefined} required />
                </div>
            </TabsContent>
            ) : null}

            {tieneTab("equipamiento") ? (
            <TabsContent forceMount value="equipamiento" className="mt-0 data-[state=inactive]:hidden">
              <SectionIntro
                icon={IconSettings}
                title="Equipamiento e implementacion"
                description="Accesorios, implementos y elementos instalados."
              />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Field name="radioComunicacion" label="Radio de comunicacion" defaultValue={activo?.vehiculo?.radioComunicacion ?? undefined} />
                  <Field name="autorradio" label="Autorradio" defaultValue={activo?.vehiculo?.autorradio ?? undefined} />
                  <Field name="llantasRepuesto" label="Llantas de repuesto" defaultValue={activo?.vehiculo?.llantasRepuesto ?? undefined} />
                  <Field name="camara" label="Camara" defaultValue={activo?.vehiculo?.camara ?? undefined} />
                  <Field name="tablet" label="Tablet" defaultValue={activo?.vehiculo?.tablet ?? undefined} />
                  <Field name="dispositivosSeguridad" label="Dispositivos de seguridad" defaultValue={activo?.vehiculo?.dispositivosSeguridad ?? undefined} />
                  <Field name="cajaHerramientas" label="Caja de herramientas" defaultValue={activo?.vehiculo?.cajaHerramientas ?? undefined} />
                  <Field name="jaulaAntivuelco" label="Jaula antivuelco" defaultValue={activo?.vehiculo?.jaulaAntivuelco ?? undefined} />
                  <Field name="carriboy" label="Carriboy" defaultValue={activo?.vehiculo?.carriboy ?? undefined} />
                  <Field name="baranda" label="Baranda" defaultValue={activo?.vehiculo?.baranda ?? undefined} />
                  <Field name="mamparon" label="Mamparon" defaultValue={activo?.vehiculo?.mamparon ?? undefined} />
                </div>
            </TabsContent>
            ) : null}

            {tieneTab("dimensiones") ? (
            <TabsContent forceMount value="dimensiones" className="mt-0 data-[state=inactive]:hidden">
              <SectionIntro
                icon={IconRulerMeasure}
                title="Dimensiones y configuracion"
                description="Medidas, suspension y tornamesa."
              />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Field
                    name="ancho"
                    label="Ancho"
                    type="number"
                    step="0.001"
                    defaultValue={activo?.vehiculo?.ancho ?? undefined}
                  />
                  <Field
                    name="longitud"
                    label="Longitud"
                    type="number"
                    step="0.001"
                    defaultValue={activo?.vehiculo?.longitud ?? undefined}
                  />
                  <Field
                    name="alto"
                    label="Alto"
                    type="number"
                    step="0.001"
                    defaultValue={activo?.vehiculo?.alto ?? undefined}
                  />
                  <Field name="tipoSuspension" label="Tipo de suspension" defaultValue={activo?.vehiculo?.tipoSuspension ?? undefined} />
                  <Field name="tipoTornamesa" label="Tipo de tornamesa" defaultValue={activo?.vehiculo?.tipoTornamesa ?? undefined} />
                  <SelectField
                    name="claseEuro"
                    label="Clase Euro / NEC"
                    defaultValue={activo?.vehiculo?.claseEuro ?? ""}
                    values={["", "EURO_1", "EURO_2", "EURO_3", "EURO_4", "EURO_5"]}
                  />
                  <Field
                    name="ratioCorona"
                    label="Ratio de corona"
                    max="9.99"
                    min="0"
                    placeholder="0.00"
                    step="0.01"
                    type="number"
                    defaultValue={activo?.vehiculo?.ratioCorona ?? undefined}
                  />
                  <SelectField
                    name="tipoTransmision"
                    label="Tipo transmision"
                    defaultValue={activo?.vehiculo?.tipoTransmision ?? ""}
                    values={[
                      "",
                      "AUTOMATICA",
                      "AUTOMATIZADA",
                      "MECANICA_10_VELOCIDADES",
                      "MECANICA_13_VELOCIDADES",
                      "MECANICA_15_VELOCIDADES",
                      "MECANICA_18_VELOCIDADES",
                      "MECANICA_OTRA",
                    ]}
                  />
                </div>
            </TabsContent>
            ) : null}

            {tieneTab("control") ? (
            <TabsContent forceMount value="control" className="mt-0 data-[state=inactive]:hidden">
              <SectionIntro
                icon={IconShieldCheck}
                title="Control operativo"
                description="Condicion del activo, calibracion y observaciones."
              />
                <div className="grid gap-4 md:grid-cols-3">
                  <SelectField name="estadoOperativo" label="Condicion activo" defaultValue={activo?.vehiculo?.estadoOperativo ?? "OPERATIVO"} values={["OPERATIVO", "MANTENIMIENTO", "NO_OPERATIVO"]} />
                  <SelectField name="estadoCalibracion" label="Estado calibracion" defaultValue={activo?.vehiculo?.estadoCalibracion ?? "PENDIENTE"} values={["CALIBRADA", "NO_CALIBRADA", "PENDIENTE", "OBSERVADA"]} />
                </div>
                <div className="pt-4">
                  <Field name="observacion" label="Observacion" defaultValue={activo?.observacion ?? undefined} />
                </div>
            </TabsContent>
            ) : null}

            {tieneTab("combustible") ? (
            <TabsContent forceMount value="combustible" className="mt-0 data-[state=inactive]:hidden">
              <SectionIntro
                icon={IconGasStation}
                title="Combustible"
                description="Registro de tanques diesel y urea del activo."
              />
                {isEdit ? (
                  <TanquesActivo codigo={activo!.codigo} tanques={tanques} />
                ) : (
                  <div className="grid gap-4">
                    <div
                      ref={tanqueDraftRef}
                      className="grid gap-4 rounded-xl border border-border bg-muted/20 p-4"
                    >
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <label className="grid gap-2">
                          <span className="text-sm font-medium text-foreground">
                            Tipo tanque <span className="text-destructive">*</span>
                          </span>
                          <select
                            className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                            name="tipoTanque"
                            value={tipoTanque}
                            onChange={(event) => {
                              const next =
                                event.currentTarget.value === "UREA"
                                  ? "UREA"
                                  : "DIESEL";
                              setTipoTanque(next);
                              actualizarResumen();
                            }}
                          >
                            <option value="DIESEL">Diesel</option>
                            <option value="UREA">Urea</option>
                          </select>
                        </label>
                        <Field
                          label="Capacidad"
                          min="0.01"
                          name="capacidadTanque"
                          required
                          step="0.01"
                          type="number"
                        />
                        <UnidadTanqueDisplay tipoTanque={tipoTanque} />
                        <Field
                          label="Orden"
                          min="1"
                          name="ordenTanque"
                          step="1"
                          type="number"
                        />
                      </div>
                      <Field
                        label="Observacion"
                        name="observacionTanque"
                        placeholder="Tanque principal, auxiliar, etc."
                      />
                      <div className="flex justify-end">
                        <Button type="button" variant="outline" onClick={agregarTanque}>
                          Agregar tanque
                        </Button>
                      </div>
                    </div>
                    <PendingList
                      empty="No hay tanques agregados para guardar."
                      items={tanquesPendientes.map((tanque, index) => ({
                        id: `${tanque.tipoTanque}-${index}`,
                        title: `${formatLabel(tanque.tipoTanque)} - ${tanque.capacidad} ${tanque.tipoTanque === "DIESEL" ? "galones" : "litros"}`,
                        detail: tanque.observacion ?? "Sin observacion",
                      }))}
                      onRemove={(index) =>
                        setTanquesPendientes((items) =>
                          items.filter((_, itemIndex) => itemIndex !== index)
                        )
                      }
                    />
                  </div>
                )}
            </TabsContent>
            ) : null}

            <TabsContent forceMount value="documentos" className="mt-0 data-[state=inactive]:hidden">
              <SectionIntro
                icon={IconFileDescription}
                title="Documentos"
                description="SOAT, poliza, tarjeta de propiedad y sustentos."
              />
                {isEdit ? (
                  <DocumentosActivo
                    codigo={activo!.codigo}
                    documentos={documentos}
                  />
                ) : (
                  <div className="grid gap-4">
                    <div
                      ref={documentoDraftRef}
                      className="grid gap-4 rounded-xl border border-border bg-muted/20 p-4"
                    >
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <SelectField
                          name="tipoDocumento"
                          label="Tipo documento"
                          defaultValue="SOAT"
                          values={[
                            "SOAT",
                            "POLIZA",
                            "TARJETA_PROPIEDAD",
                            "FACTURA",
                            "MANUAL",
                            "REVISION_TECNICA",
                            "CERTIFICADO",
                            "OTRO",
                          ]}
                          required
                        />
                        <Field name="numeroDocumento" label="Numero" required />
                        <Field
                          name="fechaEmision"
                          label="Fecha emision"
                          required
                          type="date"
                        />
                        <Field
                          name="fechaVencimiento"
                          label="Fecha vencimiento"
                          type="date"
                        />
                        <Field
                          name="archivoUrl"
                          label="Archivo o URL"
                          placeholder="https://..."
                          required
                          type="url"
                        />
                        <Field
                          name="usuarioCarga"
                          label="Usuario responsable"
                          placeholder="usuario.activos"
                          required
                        />
                      </div>
                      <Field
                        name="observacionDocumento"
                        label="Observacion"
                        placeholder="Comentario funcional si aplica"
                      />
                      <div className="flex justify-end">
                        <Button type="button" variant="outline" onClick={agregarDocumento}>
                          Agregar documento
                        </Button>
                      </div>
                    </div>
                    <PendingList
                      empty="No hay documentos agregados para guardar."
                      items={documentosPendientes.map((documento, index) => ({
                        id: `${documento.tipoDocumento}-${index}`,
                        title: `${formatLabel(documento.tipoDocumento)} - ${documento.numero}`,
                        detail: documento.fechaVencimiento
                          ? `Vence: ${documento.fechaVencimiento}`
                          : "Sin vencimiento",
                      }))}
                      onRemove={(index) =>
                        setDocumentosPendientes((items) =>
                          items.filter((_, itemIndex) => itemIndex !== index)
                        )
                      }
                    />
                  </div>
                )}
            </TabsContent>

          </Tabs>
        </CardContent>
      </Card>
      {renderImagenesSection()}
      </div>
      <ResumenRegistro
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        resumen={resumen}
        tabsDisponibles={tabsDisponibles}
      />
    </div>
  );
}

function ResumenRegistro({
  activeTab,
  onSelectTab,
  resumen,
  tabsDisponibles,
}: {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  resumen: RegistroResumenData;
  tabsDisponibles: ActivoTab[];
}) {
  const secciones = [
    {
      id: "base",
      title: "Base",
      icon: IconClipboardText,
      items: resumen.base,
    },
    {
      id: "adquisicion",
      title: "Adquisicion",
      icon: IconReceipt2,
      items: resumen.adquisicion,
    },
    {
      id: "vehiculo",
      title: "Vehiculo",
      icon: IconTruck,
      items: resumen.vehiculo,
    },
    {
      id: "equipamiento",
      title: "Equipamiento",
      icon: IconSettings,
      items: resumen.equipamiento,
    },
    {
      id: "dimensiones",
      title: "Dimensiones",
      icon: IconRulerMeasure,
      items: resumen.dimensiones,
    },
    {
      id: "control",
      title: "Control",
      icon: IconShieldCheck,
      items: resumen.control,
    },
    {
      id: "documentos",
      title: "Pendientes",
      icon: IconFileDescription,
      items: resumen.pendientes,
    },
  ].filter((seccion) => tabsDisponibles.includes(seccion.id as ActivoTab));

  return (
    <aside className="h-fit rounded-xl border border-border bg-background/40 p-4 xl:sticky xl:top-5">
      <div className="mb-4">
        <p className="text-sm font-semibold text-foreground">
          Resumen del registro
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Revisa lo llenado sin volver por cada pestana.
        </p>
      </div>
      <div className="grid gap-3">
        {secciones.map((seccion) => (
          <button
            key={seccion.id}
            type="button"
            onClick={() => onSelectTab(seccion.id)}
            className={cn(
              "rounded-lg border border-border bg-muted/20 p-3 text-left transition hover:border-primary/50",
              activeTab === seccion.id && "border-primary/60 bg-primary/10"
            )}
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
                <seccion.icon className="size-4" />
              </span>
              <span className="text-sm font-semibold">{seccion.title}</span>
            </div>
            <dl className="grid gap-1">
              {seccion.items.map(([label, value]) => (
                <div
                  key={label}
                  className="grid grid-cols-[92px_minmax(0,1fr)] gap-2 text-xs"
                >
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="truncate font-medium text-foreground">
                    {formatSummaryValue(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </button>
        ))}
      </div>
    </aside>
  );
}

function SectionIntro({
  icon: IconComponent,
  title,
  description,
}: {
  icon: Icon;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3 border-b border-border pb-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
        <IconComponent className="size-5" />
      </span>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description ? (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

function PendingList({
  empty,
  items,
  onRemove,
}: {
  empty: string;
  items: { id: string; title: string; detail: string }[];
  onRemove: (index: number) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      {items.length ? (
        <div className="divide-y divide-border">
          {items.map((item, index) => (
            <div
              className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between"
              key={item.id}
            >
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.detail}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => onRemove(index)}
              >
                Quitar
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
          {empty}
        </div>
      )}
    </div>
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
      <Label htmlFor={name}>
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      <Input id={name} name={name} required={required} {...props} />
    </div>
  );
}

function UnidadTanqueDisplay({ tipoTanque }: { tipoTanque: TipoTanqueActivo }) {
  const unidad = tipoTanque === "UREA" ? "Litros" : "Galones";

  return (
    <div className="grid gap-2">
      <Label>Unidad</Label>
      <div
        key={unidad}
        className="flex h-9 items-center rounded-lg border border-input bg-muted/40 px-3 text-sm font-medium text-foreground"
      >
        {unidad}
      </div>
    </div>
  );
}

function TextAreaField({
  label,
  name,
  required,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  name: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      <textarea
        id={name}
        name={name}
        required={required}
        rows={3}
        className="min-h-24 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        {...props}
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  values,
  defaultValue,
  labels,
  onChange,
  required = false,
}: {
  label: string;
  name: string;
  values: string[];
  defaultValue: string;
  labels?: Record<string, string>;
  onChange?: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </span>
      <select
        name={name}
        defaultValue={defaultValue}
        required={required}
        onChange={(event) => onChange?.(event.target.value)}
        className={cn(
          "h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        )}
      >
        {values.map((value) => (
          <option key={value} value={value}>
            {labels?.[value] ?? value}
          </option>
        ))}
      </select>
    </label>
  );
}

type DatosConfiguracionActual = {
  vehiculo?: {
    placa?: string | null;
    carroceria?: string | null;
  };
};

function inferirTipoCambioConfiguracion(
  origen: Activo,
  nuevo: DatosConfiguracionActual
): TipoCambioConfiguracionHistorica {
  const placaAnterior = normalizarValorHistorico(origen.vehiculo?.placa);
  const placaNueva = normalizarValorHistorico(nuevo.vehiculo?.placa);
  const carroceriaAnterior = normalizarValorHistorico(
    origen.vehiculo?.carroceria
  );
  const carroceriaNueva = normalizarValorHistorico(nuevo.vehiculo?.carroceria);

  if (placaAnterior !== placaNueva && (placaAnterior || placaNueva)) {
    return "CAMBIO_PLACA";
  }

  if (
    carroceriaAnterior !== carroceriaNueva &&
    (carroceriaAnterior || carroceriaNueva)
  ) {
    return "CAMBIO_CARROCERIA";
  }

  return "RENOVACION";
}

function construirMotivoConfiguracionHistorica(
  origen: Activo,
  nuevo: DatosConfiguracionActual
) {
  const tipoCambio = inferirTipoCambioConfiguracion(origen, nuevo);
  const placaAnterior = etiquetaValorHistorico(origen.vehiculo?.placa);
  const placaNueva = etiquetaValorHistorico(nuevo.vehiculo?.placa);
  const carroceriaAnterior = etiquetaValorHistorico(
    origen.vehiculo?.carroceria
  );
  const carroceriaNueva = etiquetaValorHistorico(nuevo.vehiculo?.carroceria);

  if (tipoCambio === "CAMBIO_PLACA") {
    return `Replaqueo registrado desde nuevo acople: ${placaAnterior} -> ${placaNueva}.`;
  }

  if (tipoCambio === "CAMBIO_CARROCERIA") {
    return `Cambio de carroceria registrado desde nuevo acople: ${carroceriaAnterior} -> ${carroceriaNueva}.`;
  }

  return "Nuevo acople registrado desde activo anulado.";
}

function normalizarValorHistorico(value: unknown) {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}

function etiquetaValorHistorico(value: unknown) {
  const texto = String(value ?? "").trim();
  return texto || "sin dato";
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatearEstadoActivo(value?: string | null) {
  if (value === "ACTIVO") return "Activo";
  if (value === "SINIESTRADO") return "Baja / Siniestro";
  if (value === "INACTIVO") return "Baja / De baja";
  return value ?? "";
}

function formatSummaryValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "Pendiente";

  return String(value);
}

function toDateInputValue(value: string | null | undefined) {
  if (!value) return undefined;
  return value.slice(0, 10);
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
