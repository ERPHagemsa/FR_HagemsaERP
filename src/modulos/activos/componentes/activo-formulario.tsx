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
import {
  TIPO_ACTIVO_DISPOSITIVO_ID,
  TIPO_ACTIVO_EQUIPO_ID,
  TIPO_ACTIVO_HERRAMIENTA_ID,
  TIPO_ACTIVO_OTRO_ID,
  TIPO_ACTIVO_VEHICULO_ID,
  useCatalogosActivos,
} from "../ganchos/use-catalogos-activos";
import { useBorradoresActivo } from "../ganchos/use-borradores-activo";
import type {
  Activo,
  CarroceriaReferencia,
  EstadoActivo,
  EstadoOperativo,
  DocumentoActivo,
  ImagenActivo,
  TanqueActivo,
} from "../tipos/activo.tipos";
import type {
  ActivoTab,
  RegistroResumenData,
} from "./activo-formulario.tipos";
import {
  Field,
  PendingList,
  SectionIntro,
  SelectField,
  TextAreaField,
  TipoTanqueSelector,
  UnidadTanqueDisplay,
} from "./activo-formulario.campos";
import { ResumenRegistro } from "./activo-formulario.resumen";
import {
  TabAdquisicion,
  TabBase,
  TabControl,
  TabDimensiones,
  TabEquipamiento,
  TabVehiculo,
} from "./activo-formulario.pestanas";
import {
  agregarQueryParam,
  construirMetadataCambio,
  construirMotivoConfiguracionHistorica,
  formatearEstadoActivo,
  formatLabel,
  inferirTipoCambioConfiguracion,
  obtenerOrigenCambioVisual,
} from "./activo-formulario.utilidades";

type Props = {
  activo?: Activo;
  modo?: "crear" | "editar";
  documentos?: DocumentoActivo[];
  imagenes?: ImagenActivo[];
  returnTo?: string;
  tanques?: TanqueActivo[];
  tituloPagina?: string;
  subtituloPagina?: string;
  accionesExtra?: React.ReactNode;
};

const TABS_POR_TIPO_ACTIVO: Record<number, ActivoTab[]> = {
  [TIPO_ACTIVO_VEHICULO_ID]: [
    "base",
    "adquisicion",
    "vehiculo",
    "equipamiento",
    "dimensiones",
    "control",
    "combustible",
    "documentos",
  ],
  [TIPO_ACTIVO_EQUIPO_ID]: [
    "base",
    "adquisicion",
    "equipamiento",
    "dimensiones",
    "control",
    "documentos",
  ],
  [TIPO_ACTIVO_HERRAMIENTA_ID]: ["base", "adquisicion", "control", "documentos"],
  [TIPO_ACTIVO_DISPOSITIVO_ID]: [
    "base",
    "adquisicion",
    "equipamiento",
    "control",
    "documentos",
  ],
  [TIPO_ACTIVO_OTRO_ID]: ["base", "adquisicion", "documentos"],
};

export function ActivoFormulario({
  activo,
  modo = "crear",
  documentos = [],
  imagenes = [],
  returnTo,
  tanques = [],
  tituloPagina,
  subtituloPagina,
  accionesExtra,
}: Props) {
  const router = useRouter();
  const [returnToGuardado, setReturnToGuardado] = React.useState<string | null>(
    null
  );
  const [isSaving, setIsSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("base");
  const catalogos = useCatalogosActivos();
  const [tipoActivoSeleccionadoId, setTipoActivoSeleccionadoId] =
    React.useState<number>(
      activo?.tipoActivoReferenciaId ?? TIPO_ACTIVO_VEHICULO_ID
    );
  const [formVersion, setFormVersion] = React.useState(0);
  const [claseVehiculoSeleccionadaId, setClaseVehiculoSeleccionadaId] =
    React.useState<number | null>(
      activo?.vehiculo?.claseVehiculoReferenciaId ?? null
    );
  const [estadoActivoGrupo, setEstadoActivoGrupo] = React.useState<
    "ACTIVO" | "BAJA"
  >(!activo || activo.estadoActivo === "ACTIVO" ? "ACTIVO" : "BAJA");
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
  // Controlado por React (no por mutacion directa del DOM): arranca con el
  // texto legacy del activo (para no perderlo si no hay match de catalogo) y
  // solo cambia cuando el usuario interactua con el selector de carroceria.
  const [carroceriaTexto, setCarroceriaTexto] = React.useState<string>(
    activo?.vehiculo?.carroceria ?? ""
  );
  const crearActivoMutation = useCrearActivoMutation();
  const actualizarActivoMutation = useActualizarActivoMutation();
  const formularioRef = React.useRef<HTMLDivElement>(null);
  const intentoAutocompletarCarroceriaRef = React.useRef(false);
  // Espejo de `selectedCarroceriaReferenciaId` para leerlo dentro del efecto
  // de carga de carrocerias sin meterlo en sus dependencias (evita re-fetch en
  // cada seleccion). Se sincroniza en un efecto, no durante el render.
  const selectedCarroceriaReferenciaIdRef = React.useRef(selectedCarroceriaReferenciaId);
  React.useEffect(() => {
    selectedCarroceriaReferenciaIdRef.current = selectedCarroceriaReferenciaId;
  }, [selectedCarroceriaReferenciaId]);
  const isEdit = modo === "editar";
  const returnToEfectivo = returnTo ?? returnToGuardado ?? undefined;
  const actualizarResumen = React.useCallback(() => {
    setFormVersion((version) => version + 1);
  }, []);
  // Estado y manejadores de tanques/documentos/imagenes en borrador (creacion).
  const borradores = useBorradoresActivo({ setActiveTab, actualizarResumen });
  const tabsDisponibles = TABS_POR_TIPO_ACTIVO[tipoActivoSeleccionadoId] ?? [];
  const tieneTab = React.useCallback(
    (tab: ActivoTab) => tabsDisponibles.includes(tab),
    [tabsDisponibles]
  );

  React.useEffect(() => {
    let isMounted = true;

    setCarroceriasError(null);
    obtenerCarroceriasReferencia(claseVehiculoSeleccionadaId ?? undefined)
      .then((referencias) => {
        if (!isMounted) return;
        const referenciasFiltradas = referencias.filter(
          (referencia) =>
            referencia.claseVehiculoReferenciaId === claseVehiculoSeleccionadaId
        );
        setCarroceriasReferencia(referenciasFiltradas);

        // Activos creados por carga masiva (antes del fix de carga) pueden
        // tener el texto libre "carroceria" pero carroceriaReferenciaId en
        // null: el selector arrancaria vacio aunque la ficha muestre un
        // valor. Intentamos resolverlo por nombre, una sola vez por activo.
        const seleccionActual = selectedCarroceriaReferenciaIdRef.current;
        if (
          !intentoAutocompletarCarroceriaRef.current &&
          !seleccionActual &&
          !activo?.vehiculo?.carroceriaReferenciaId &&
          activo?.vehiculo?.carroceria
        ) {
          intentoAutocompletarCarroceriaRef.current = true;
          const textoActivo = activo.vehiculo.carroceria.trim().toUpperCase();
          const coincidencia = referenciasFiltradas.find(
            (referencia) => referencia.nombre.trim().toUpperCase() === textoActivo
          );
          if (coincidencia) {
            setSelectedCarroceriaReferenciaId(String(coincidencia.id));
            return;
          }
        }

        const selectedStillExists = referenciasFiltradas.some(
          (referencia) => String(referencia.id) === seleccionActual
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
    // selectedCarroceriaReferenciaId se lee via ref (selectedCarroceriaReferenciaIdRef):
    // a proposito NO esta en las dependencias, para no re-disparar el fetch
    // del catalogo cada vez que el usuario elige una carroceria distinta
    // (eso causaba una carrera entre fetches superpuestos que revertia la
    // seleccion visual del usuario).
  }, [claseVehiculoSeleccionadaId]);

  React.useEffect(() => {
    if (returnTo || !isEdit) {
      return;
    }

    const guardado = window.sessionStorage.getItem(
      "activos:returnToAfterEdit"
    );

    if (guardado?.startsWith("/") && !guardado.startsWith("//")) {
      setReturnToGuardado(guardado);
      return;
    }

    if (document.referrer) {
      const referrer = new URL(document.referrer);

      if (
        referrer.origin === window.location.origin &&
        referrer.pathname.startsWith("/activos/inventario-fisico/")
      ) {
        setReturnToGuardado(`${referrer.pathname}${referrer.search}`);
      }
    }
  }, [isEdit, returnTo]);

  React.useEffect(() => {
    actualizarResumen();
  }, [actualizarResumen, causaBaja, estadoActivoGrupo]);

  React.useEffect(() => {
    if (!tabsDisponibles.includes(activeTab as ActivoTab)) {
      setActiveTab("base");
    }

    if (!tabsDisponibles.includes("combustible") && borradores.tanquesPendientes.length) {
      borradores.setTanquesPendientes([]);
    }
  }, [activeTab, tabsDisponibles, borradores.tanquesPendientes.length]);

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

  function cambiarClaseVehiculo(nuevaClaseId: number) {
    setClaseVehiculoSeleccionadaId(nuevaClaseId);
    setSelectedCarroceriaReferenciaId("");
    setCarroceriaTexto("");
    setFormValue("ancho", "");
    setFormValue("longitud", "");
    setFormValue("alto", "");
    setFormValue("ejes", "");
    setFormValue("categoria", "");
    actualizarResumen();
  }

  function cambiarTipoActivo(next: number) {
    setTipoActivoSeleccionadoId(next);

    if (!(TABS_POR_TIPO_ACTIVO[next] ?? []).includes(activeTab as ActivoTab)) {
      setActiveTab("base");
    }

    actualizarResumen();
  }

  function aplicarCarroceriaReferencia(referenciaId: string) {
    setSelectedCarroceriaReferenciaId(referenciaId);

    const referencia = carroceriasReferencia.find(
      (item) => String(item.id) === referenciaId
    );

    if (!referencia) {
      setCarroceriaTexto("");
      setFormValue("ancho", "");
      setFormValue("longitud", "");
      setFormValue("alto", "");
      setFormValue("ejes", "");
      setFormValue("categoria", "");
      actualizarResumen();
      return;
    }

    setCarroceriaTexto(referencia.nombre);
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
        [
          "Tipo",
          catalogos.nombrePorId(
            "TIPO_ACTIVO",
            getValue("tipoActivo")
              ? Number(getValue("tipoActivo"))
              : activo?.tipoActivoReferenciaId
          ),
        ],
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
        [
          "Clase",
          catalogos.nombrePorId(
            "CLASE_VEHICULO",
            getValue("claseVehiculoReferenciaId")
              ? Number(getValue("claseVehiculoReferenciaId"))
              : activo?.vehiculo?.claseVehiculoReferenciaId
          ),
        ],
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
        [
          "Calibracion",
          catalogos.nombrePorId(
            "ESTADO_CALIBRACION",
            getValue("estadoCalibracionReferenciaId")
              ? Number(getValue("estadoCalibracionReferenciaId"))
              : activo?.vehiculo?.estadoCalibracionReferenciaId
          ),
        ],
        ["Observacion", getValue("observacion") || activo?.observacion],
      ],
      dimensiones: [
        ["Ancho", getValue("ancho") || activo?.vehiculo?.ancho],
        ["Longitud", getValue("longitud") || activo?.vehiculo?.longitud],
        ["Alto", getValue("alto") || activo?.vehiculo?.alto],
        ["Suspension", getValue("tipoSuspension") || activo?.vehiculo?.tipoSuspension],
        [
          "Euro",
          catalogos.nombrePorId(
            "CLASE_EURO",
            getValue("claseEuroReferenciaId")
              ? Number(getValue("claseEuroReferenciaId"))
              : activo?.vehiculo?.claseEuroReferenciaId
          ),
        ],
        ["Corona", getValue("ratioCorona") || activo?.vehiculo?.ratioCorona],
        [
          "Transmision",
          catalogos.nombrePorId(
            "TIPO_TRANSMISION",
            getValue("tipoTransmisionReferenciaId")
              ? Number(getValue("tipoTransmisionReferenciaId"))
              : activo?.vehiculo?.tipoTransmisionReferenciaId
          ),
        ],
      ],
      pendientes: [
        ["Tanques", `${borradores.tanquesPendientes.length} agregado${borradores.tanquesPendientes.length === 1 ? "" : "s"}`],
        ["Documentos", `${borradores.documentosPendientes.length} agregado${borradores.documentosPendientes.length === 1 ? "" : "s"}`],
        ["Imagenes", `${borradores.imagenesPendientes.length} agregada${borradores.imagenesPendientes.length === 1 ? "" : "s"}`],
      ],
    };
  }, [
    activo,
    catalogos,
    borradores.documentosPendientes.length,
    formVersion,
    borradores.imagenesPendientes.length,
    borradores.tanquesPendientes.length,
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
      const tipoActivoReferenciaId = Number(getValue("tipoActivo"));
      const estadoActivo = getValue("estadoActivo") as EstadoActivo;
      const claseVehiculoReferenciaId = Number(
        getValue("claseVehiculoReferenciaId")
      );
      const carroceriaReferenciaId = numero("carroceriaReferenciaId");
      const tabsParaGuardar =
        TABS_POR_TIPO_ACTIVO[tipoActivoReferenciaId] ?? tabsDisponibles;
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

      if (!tipoActivoReferenciaId) {
        setActiveTab("base");
        throw new Error("Selecciona el tipo de activo en la pestana Base.");
      }

      if (!estadoActivo) {
        setActiveTab("base");
        throw new Error("Selecciona el estado del activo en la pestana Base.");
      }

      if (puedeGuardarTab("vehiculo") && !getValue("claseVehiculoReferenciaId")) {
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
        ? borradores.tanquesPendientes
        : [];
      const tanqueInvalido = tanquesAGuardar.find(
        (tanque) => !tanque.capacidad || tanque.capacidad <= 0
      );

      if (tanqueInvalido) {
        setActiveTab("combustible");
        throw new Error("Revisa los tanques agregados: la capacidad debe ser mayor a cero.");
      }

      const documentoInvalido = borradores.documentosPendientes.find(
        (documento) =>
          !documento.numero ||
          !documento.fechaEmision
      );

      if (documentoInvalido) {
        setActiveTab("documentos");
        throw new Error(
          "Revisa los documentos agregados: numero y fecha de emision son obligatorios."
        );
      }

      const debeGuardarDetalleTecnico =
        puedeGuardarTab("vehiculo") ||
        puedeGuardarTab("equipamiento") ||
        puedeGuardarTab("dimensiones") ||
        puedeGuardarTab("control");

      const vehiculo = debeGuardarDetalleTecnico
        ? {
            claseVehiculoReferenciaId,
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
            claseEuroReferenciaId: puedeGuardarTab("dimensiones")
              ? numero("claseEuroReferenciaId")
              : null,
            ratioCorona: puedeGuardarTab("dimensiones")
              ? numero("ratioCorona")
              : null,
            tipoTransmisionReferenciaId: puedeGuardarTab("dimensiones")
              ? numero("tipoTransmisionReferenciaId")
              : null,
            estadoCalibracionReferenciaId:
              numero("estadoCalibracionReferenciaId") ?? 0,
          }
        : undefined;

      const payload = {
        tipoActivoReferenciaId,
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
        ...(isEdit
          ? construirMetadataCambio(returnToEfectivo, getValue("motivoCambio"))
          : {}),
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
          ...borradores.documentosPendientes.map((documento) =>
            crearDocumentoPorCodigo(saved.codigo, documento)
          ),
          ...tanquesAGuardar.map((tanque) =>
            crearTanquePorCodigo(saved.codigo, tanque)
          ),
          ...borradores.imagenesPendientes.map((imagen) =>
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

      const destino = returnToEfectivo
        ? agregarQueryParam(returnToEfectivo, isEdit ? "updated" : "created", "1")
        : `/activos/${saved.codigo}?${isEdit ? "updated" : "created"}=1`;

      if (returnToEfectivo) {
        window.sessionStorage.removeItem("activos:returnToAfterEdit");
      }

      router.push(destino);
      router.refresh();
    } catch (err) {
      toast.error(extraerMensajeError(err, "No se pudo guardar el activo"));
    } finally {
      setIsSaving(false);
    }
  }

  function renderImagenesSection() {
    // En edicion, ImagenesActivo ya trae su propia Card con encabezado; la
    // mostramos directa (un solo cuadro, igual que en la ficha del activo).
    if (isEdit) {
      return (
        <div className="mt-5">
          <ImagenesActivo codigo={activo!.codigo} imagenes={imagenes} />
        </div>
      );
    }
    return (
      <Card className="mt-5">
        <CardHeader className="border-b border-border">
          <SectionIntro
            icon={IconPhotoPlus}
            title="Imagenes del activo"
            description="Fotografias y evidencias visuales que se guardaran junto al activo."
          />
        </CardHeader>
        <CardContent className="p-5">
            <div className="grid gap-4">
              <div
                ref={borradores.imagenDraftRef}
                className="grid gap-4 rounded-xl border border-border bg-background/40 p-4"
              >
                <div className="grid gap-4 xl:grid-cols-[160px_minmax(220px,1fr)_120px] xl:items-end">
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
                      ref={borradores.imageFileInputRef}
                      id="imagen-pendiente-archivo"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={borradores.onImageFileChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      title={borradores.selectedImageFileName || "Seleccionar imagen"}
                      onClick={() => borradores.imageFileInputRef.current?.click()}
                    >
                      <span className="truncate">
                        {borradores.selectedImageFileName || "Seleccionar imagen"}
                      </span>
                    </Button>
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
                {borradores.localImageUrl ? (
                  <div className="grid gap-2 rounded-xl border border-border bg-background/50 p-3 sm:max-w-sm">
                    <span className="text-sm font-medium">Vista previa</span>
                    <img
                      src={borradores.localImageUrl}
                      alt={borradores.selectedImageFileName || "Imagen seleccionada"}
                      className="aspect-[4/3] w-full rounded-lg border border-border object-cover"
                    />
                  </div>
                ) : null}
                <div className="flex justify-end">
                  <Button type="button" variant="outline" onClick={borradores.agregarImagen}>
                    Agregar imagen
                  </Button>
                </div>
              </div>
              <PendingList
                empty="No hay imagenes agregadas para guardar."
                items={borradores.imagenesPendientes.map((imagen, index) => ({
                  id: `${imagen.tipoImagen}-${index}`,
                  title: `${formatLabel(imagen.tipoImagen)} - ${
                    imagen.descripcion || "Sin descripcion"
                  }`,
                  detail: imagen.url.startsWith("data:image/")
                    ? "Imagen seleccionada desde equipo"
                    : "Imagen registrada",
                }))}
                onRemove={(index) =>
                  borradores.setImagenesPendientes((items) =>
                    items.filter((_, itemIndex) => itemIndex !== index)
                  )
                }
              />
            </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      ref={formularioRef}
      className="flex flex-col gap-5"
      onChange={actualizarResumen}
      onInput={actualizarResumen}
    >
      {tituloPagina ? (
        <section className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-normal">{tituloPagina}</h1>
            {subtituloPagina ? (
              <p className="mt-1 text-sm text-muted-foreground">{subtituloPagina}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {accionesExtra}
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(returnToEfectivo ?? "/activos")}
            >
              Cancelar
            </Button>
            <Button type="button" disabled={isSaving} onClick={onSubmit}>
              {isSaving ? "Guardando..." : isEdit ? "Actualizar" : "Agregar"}
            </Button>
          </div>
        </section>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">
      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>
            {isEdit ? "Modificar activo" : "Registrar activo"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          {isEdit ? (
            <div className="mb-5 grid gap-3 rounded-xl border border-border bg-muted/20 p-4">
              <div className="grid gap-1">
                <h3 className="text-sm font-semibold text-foreground">
                  Trazabilidad del cambio
                </h3>
                <p className="text-xs text-muted-foreground">
                  Este dato quedara visible en Historial y auditoria del activo.
                </p>
              </div>
              <div className="grid gap-4 lg:grid-cols-[220px_1fr] lg:items-end">
                <div className="grid gap-2">
                  <Label>Origen</Label>
                  <div className="flex h-9 items-center rounded-lg border border-input bg-background px-3 text-sm font-medium text-foreground">
                    {obtenerOrigenCambioVisual(returnToEfectivo)}
                  </div>
                </div>
                <Field
                  name="motivoCambio"
                  label="Motivo del cambio"
                  placeholder="Ej. Correccion de datos tecnicos durante inventario"
                  defaultValue={
                    construirMetadataCambio(returnToEfectivo).motivoCambio
                  }
                />
              </div>
            </div>
          ) : null}
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
              <TabBase
                activo={activo}
                isEdit={isEdit}
                catalogos={catalogos}
                estadoActivoGrupo={estadoActivoGrupo}
                onEstadoActivoChange={(value) => {
                  setEstadoActivoGrupo(value);
                  actualizarResumen();
                }}
                causaBaja={causaBaja}
                onCausaBajaChange={(value) => {
                  setCausaBaja(value);
                  actualizarResumen();
                }}
                onTipoActivoChange={cambiarTipoActivo}
              />
            </TabsContent>

            <TabsContent forceMount value="adquisicion" className="mt-0 data-[state=inactive]:hidden">
              <TabAdquisicion activo={activo} />
            </TabsContent>

            {tieneTab("vehiculo") ? (
            <TabsContent forceMount value="vehiculo" className="mt-0 data-[state=inactive]:hidden">
              <TabVehiculo
                activo={activo}
                catalogos={catalogos}
                claseVehiculoSeleccionadaId={claseVehiculoSeleccionadaId}
                onClaseChange={cambiarClaseVehiculo}
                selectedCarroceriaReferenciaId={selectedCarroceriaReferenciaId}
                carroceriaTexto={carroceriaTexto}
                carroceriasReferencia={carroceriasReferencia}
                onCarroceriaChange={aplicarCarroceriaReferencia}
              />
            </TabsContent>
            ) : null}

            {tieneTab("equipamiento") ? (
            <TabsContent forceMount value="equipamiento" className="mt-0 data-[state=inactive]:hidden">
              <TabEquipamiento activo={activo} />
            </TabsContent>
            ) : null}

            {tieneTab("dimensiones") ? (
            <TabsContent forceMount value="dimensiones" className="mt-0 data-[state=inactive]:hidden">
              <TabDimensiones activo={activo} catalogos={catalogos} />
            </TabsContent>
            ) : null}

            {tieneTab("control") ? (
            <TabsContent forceMount value="control" className="mt-0 data-[state=inactive]:hidden">
              <TabControl activo={activo} catalogos={catalogos} />
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
                      ref={borradores.tanqueDraftRef}
                      className="grid gap-4 rounded-xl border border-border bg-muted/20 p-4"
                    >
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <TipoTanqueSelector
                          tipoTanque={borradores.tipoTanque}
                          onChange={(next) => {
                            borradores.setTipoTanque(next);
                            actualizarResumen();
                          }}
                        />
                        <Field
                          label="Capacidad"
                          min="0.01"
                          name="capacidadTanque"
                          required
                          step="0.01"
                          type="number"
                        />
                        <UnidadTanqueDisplay tipoTanque={borradores.tipoTanque} />
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
                        <Button type="button" variant="outline" onClick={borradores.agregarTanque}>
                          Agregar tanque
                        </Button>
                      </div>
                    </div>
                    <PendingList
                      empty="No hay tanques agregados para guardar."
                      items={borradores.tanquesPendientes.map((tanque, index) => ({
                        id: `${tanque.tipoTanque}-${index}`,
                        title: `${formatLabel(tanque.tipoTanque)} - ${tanque.capacidad} ${tanque.tipoTanque === "DIESEL" ? "galones" : "litros"}`,
                        detail: tanque.observacion ?? "Sin observacion",
                      }))}
                      onRemove={(index) =>
                        borradores.setTanquesPendientes((items) =>
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
                      ref={borradores.documentoDraftRef}
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

                      <div className="grid gap-3">
                        <Label>Archivo del documento</Label>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <input
                            ref={borradores.docFileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                            className="sr-only"
                            onChange={borradores.onDocFileChange}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => borradores.docFileInputRef.current?.click()}
                          >
                            {borradores.selectedDocFileName ? "Cambiar archivo" : "Seleccionar archivo"}
                          </Button>
                          {borradores.selectedDocFileName ? (
                            <span className="truncate text-sm text-muted-foreground">
                              {borradores.selectedDocFileName}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              PDF, Word, Excel o imagen — max 10 MB
                            </span>
                          )}
                        </div>
                        {!borradores.selectedDocFileName && (
                          <div className="flex items-center gap-2">
                            <div className="h-px flex-1 bg-border" />
                            <span className="text-xs text-muted-foreground">o pega una URL</span>
                            <div className="h-px flex-1 bg-border" />
                          </div>
                        )}
                        {!borradores.selectedDocFileName && (
                          <Input
                            name="archivoUrlManual"
                            placeholder="https://drive.google.com/..."
                            className="h-9"
                          />
                        )}
                      </div>

                      <div className="flex justify-end">
                        <Button type="button" variant="outline" onClick={borradores.agregarDocumento}>
                          Agregar documento
                        </Button>
                      </div>
                    </div>
                    <PendingList
                      empty="No hay documentos agregados para guardar."
                      items={borradores.documentosPendientes.map((documento, index) => ({
                        id: `${documento.tipoDocumento}-${index}`,
                        title: `${formatLabel(documento.tipoDocumento)} - ${documento.numero}`,
                        detail: documento.fechaVencimiento
                          ? `Vence: ${documento.fechaVencimiento}`
                          : "Sin vencimiento",
                      }))}
                      onRemove={(index) =>
                        borradores.setDocumentosPendientes((items) =>
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
    </div>
  );
}
