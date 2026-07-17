"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import {
  esError404,
  esError409,
  esErrorValidacion,
  extraerMensajeError,
  obtenerErroresPorCampo,
} from "@/compartido/api";

import { useAgregarCotizacionMutation } from "../../solicitudes-cliente/servicios/solicitudes-cliente-queries";
import { Button } from "@/compartido/componentes/ui/button";

import type { OrigenTipo } from "../tipos/cotizaciones.tipos";
import type { DraftBorrador, ModoServicio } from "../servicios/cotizaciones-editor.utils";
import {
  armarPayloadBorrador,
  lineaVacia,
  seccionDefectoVacia,
  tipoLineaInicial,
  validarBorrador,
} from "../servicios/cotizaciones-editor.utils";
import { EditorBorradorCampos } from "./editor-borrador-campos";
import { CotizacionTipoServicioModal } from "./cotizacion-tipo-servicio-modal";

type Props = {
  // SC sobre la que se crea la cotizacion (POST /solicitudes-cliente/:id/cotizaciones).
  solicitudClienteId: string;
  // Origen de la SC (acota el precio sugerido al historial de este cliente). La vista
  // que renderiza este editor ya tiene la SC cargada, asi que los pasa desde ahi.
  clienteTipo?: OrigenTipo;
  clienteId?: string;
};

function contarLineas(draft: DraftBorrador): number {
  return draft.secciones.reduce((acc, s) => acc + s.lineas.length, 0);
}

// Editor en MODO CREACION: arma un borrador en memoria y lo persiste con el
// primer "Crear" via POST /solicitudes-cliente/:id/cotizaciones (la cotizacion
// nace poblada). Al exito redirige al editor de la cotizacion ya creada, donde
// las ediciones siguientes usan PATCH /borrador.
export function CotizacionEditorNuevo({ solicitudClienteId, clienteTipo, clienteId }: Props) {
  const router = useRouter();
  const [draft, setDraft] = React.useState<DraftBorrador>({
    moneda: "PEN",
    validezDias: 10,
    secciones: [],
  });
  const [erroresCampo, setErroresCampo] = React.useState<Record<string, string>>({});
  const [guardando, setGuardando] = React.useState(false);
  // Modo de servicio (frontend): se elige en el gate inicial. null = aún sin elegir
  // (se muestra el gate). Determina la línea sembrada y acota el selector por línea.
  const [modoServicio, setModoServicio] = React.useState<ModoServicio | null>(null);
  const [gateAbierto, setGateAbierto] = React.useState(true);

  const agregarMutation = useAgregarCotizacionMutation();

  // Al elegir el modo: siembra una sección por defecto con una línea vacía del tipo
  // inicial (TRANSPORTE → transporte; OTROS → alquiler de equipo) y abre el editor.
  function elegirModo(modo: ModoServicio) {
    const seccion = seccionDefectoVacia();
    seccion.lineas = [lineaVacia(tipoLineaInicial(modo))];
    setDraft((d) => ({ ...d, secciones: [seccion] }));
    setModoServicio(modo);
    setGateAbierto(false);
  }

  async function onCrear() {
    setErroresCampo({});

    // Guard cliente: el backend exige >=1 linea activa (422 si no hay ninguna).
    if (contarLineas(draft) === 0) {
      toast.error("Agrega al menos una linea para crear la cotizacion.");
      return;
    }

    // Validacion client-side previa (ej: nombre de seccion obligatorio).
    const erroresValidacion = validarBorrador(draft);
    if (Object.keys(erroresValidacion).length > 0) {
      setErroresCampo(erroresValidacion);
      // No dejar el submit "mudo": mostrar el primer error concreto (mismo patron
      // que el formulario de solicitud). El generico no dice QUE campo esta mal.
      const primerError = Object.values(erroresValidacion)[0];
      toast.error(primerError ?? "Revise los campos marcados antes de crear.");
      return;
    }

    setGuardando(true);
    const payload = armarPayloadBorrador(draft);

    try {
      const { idCotizacion } = await agregarMutation.mutateAsync({
        id: solicitudClienteId,
        payload,
      });
      toast.success("Cotizacion creada en BORRADOR.");
      // No reseteamos guardando: navegamos fuera y el componente se desmonta.
      // Al crear vamos al DETALLE (no al editor): el alta ya quedó persistida;
      // editar el borrador es una acción posterior y explícita desde el detalle.
      router.push(`/comercial/cotizaciones/${idCotizacion}`);
    } catch (err) {
      aplicarErrorApi(err);
      setGuardando(false);
    }
  }

  function aplicarErrorApi(err: unknown) {
    if (esError404(err)) {
      toast.error(extraerMensajeError(err, "Solicitud no encontrada."));
      return;
    }
    if (esError409(err)) {
      toast.error(
        extraerMensajeError(err, "No se pudo crear la cotizacion: conflicto de origen.")
      );
      return;
    }
    // 422: regla de negocio (SC en estado final, sin lineas) — mensaje del backend verbatim.
    if (esErrorValidacion(err)) {
      toast.error(extraerMensajeError(err, "No se pudo crear la cotizacion."));
      return;
    }

    // 400: mapear errores por campo a los inputs del editor.
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

    toast.error(
      extraerMensajeError(err, "Error al crear la cotizacion. Revisa los datos ingresados.")
    );
  }

  // Gate inicial: hasta que se elija el modo, no se muestra el editor.
  if (modoServicio === null) {
    return (
      <>
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Elige el tipo de servicio para comenzar a armar la cotización.
          </p>
          <Button type="button" variant="outline" onClick={() => setGateAbierto(true)}>
            Elegir tipo de servicio
          </Button>
        </div>
        <CotizacionTipoServicioModal
          abierto={gateAbierto}
          onElegir={elegirModo}
          onCerrar={() => setGateAbierto(false)}
        />
      </>
    );
  }

  return (
    <EditorBorradorCampos
      draft={draft}
      setDraft={setDraft}
      erroresCampo={erroresCampo}
      guardando={guardando}
      clienteTipo={clienteTipo}
      clienteId={clienteId}
      modoServicio={modoServicio}
      onGuardar={() => void onCrear()}
      textoFooter="Se creará una nueva cotización en BORRADOR vinculada a esta solicitud."
      textoBoton="Crear cotización"
      textoBotonGuardando="Creando..."
    />
  );
}
