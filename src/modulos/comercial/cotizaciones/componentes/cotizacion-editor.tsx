"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import {
  esErrorValidacion,
  extraerMensajeError,
  obtenerErroresPorCampo,
} from "@/compartido/api";

import type { Cotizacion } from "../tipos/cotizaciones.tipos";
import type { DraftBorrador } from "../servicios/cotizaciones-editor.utils";
import {
  derivarDraft,
  armarPayloadBorrador,
  validarBorrador,
} from "../servicios/cotizaciones-editor.utils";
import { useActualizarBorradorMutation } from "../servicios/cotizaciones-queries";
import { EditorBorradorCampos } from "./editor-borrador-campos";

type Props = {
  cotizacion: Cotizacion;
};

export function CotizacionEditor({ cotizacion }: Props) {
  const router = useRouter();

  // Encontrar la version vigente editable
  const versionVigente = cotizacion.versiones.find(
    (v) => v.numeroVersion === cotizacion.versionVigente && !v.congelada
  );

  // Inicializar draft desde la version vigente (o vacio si no existe aun)
  const [draft, setDraft] = React.useState<DraftBorrador>(() => {
    if (versionVigente) return derivarDraft(versionVigente);
    return { moneda: "PEN", secciones: [], leadTimes: [] };
  });

  // Snapshot del estado persistido al montar, para el indicador dirty mientras
  // se edita. Al guardar se navega al detalle (no se re-sella in situ).
  const [snapshotGuardado] = React.useState(() => JSON.stringify(draft));
  const sucio = snapshotGuardado !== JSON.stringify(draft);

  const [erroresCampo, setErroresCampo] = React.useState<Record<string, string>>({});
  const [guardando, setGuardando] = React.useState(false);

  const guardarMutation = useActualizarBorradorMutation(cotizacion.id);

  async function onGuardar() {
    setErroresCampo({});

    // Validacion client-side previa (ej: nombre de seccion obligatorio).
    const erroresValidacion = validarBorrador(draft);
    if (Object.keys(erroresValidacion).length > 0) {
      setErroresCampo(erroresValidacion);
      toast.error("Revise los campos marcados antes de guardar.");
      return;
    }

    setGuardando(true);

    const payload = armarPayloadBorrador(draft);

    try {
      await guardarMutation.mutateAsync(payload);
      toast.success("Borrador guardado correctamente.");
      // 204 exitoso: volvemos al detalle, que como RSC re-fetchea la cotizacion
      // con totales recalculados e idSeccion reasignados. No reseteamos guardando:
      // navegamos fuera y el componente se desmonta.
      router.push(`/comercial/cotizaciones/${cotizacion.id}`);
    } catch (err) {
      aplicarErrorApi(err);
      setGuardando(false);
    }
  }

  function aplicarErrorApi(err: unknown) {
    // 422: regla de negocio — mostrar mensaje del backend verbatim
    if (esErrorValidacion(err)) {
      toast.error(extraerMensajeError(err, "No se pudo guardar el borrador."));
      return;
    }

    // 400: intentar mapear errores por campo a inputs del editor
    // OQ-3: NestJS class-validator emite strings como "secciones.0.lineas.0.descripcion must be..."
    // El path antes del primer espacio es la ruta del campo.
    const erroresPorCampoApi = obtenerErroresPorCampo(err);
    const camposConError = Object.keys(erroresPorCampoApi);
    if (camposConError.length > 0) {
      const nuevosMensajes: Record<string, string> = {};
      for (const campo of camposConError) {
        nuevosMensajes[campo] = erroresPorCampoApi[campo].mensaje;
      }
      setErroresCampo(nuevosMensajes);
      toast.error("Revisa los campos marcados en el borrador.");
      return;
    }

    // 400 sin errores por campo: toast generico
    toast.error(extraerMensajeError(err, "Error al guardar el borrador. Revisá los datos ingresados."));
  }

  return (
    <EditorBorradorCampos
      draft={draft}
      setDraft={setDraft}
      erroresCampo={erroresCampo}
      guardando={guardando}
      sucio={sucio}
      // Origen de la cotizacion: acota el precio sugerido al historial de este cliente.
      clienteTipo={cotizacion.origenTipo}
      clienteId={cotizacion.origenId}
      onGuardar={() => void onGuardar()}
      textoFooter="El borrador reemplaza el contenido anterior al guardarse."
      textoBoton="Guardar borrador"
      textoBotonGuardando="Guardando..."
    />
  );
}
