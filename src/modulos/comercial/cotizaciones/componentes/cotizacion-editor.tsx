"use client";

import * as React from "react";
import { toast } from "sonner";

import {
  esErrorValidacion,
  extraerMensajeError,
  obtenerErroresPorCampo,
} from "@/compartido/api";
import { Button } from "@/compartido/componentes/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
import { Separator } from "@/compartido/componentes/ui/separator";

import type { Cotizacion } from "../tipos/cotizaciones.tipos";
import type { DraftBorrador } from "../servicios/cotizaciones-editor.utils";
import {
  derivarDraft,
  armarPayloadBorrador,
} from "../servicios/cotizaciones-editor.utils";
import { useActualizarBorradorMutation, useConsultarCotizacion } from "../servicios/cotizaciones-queries";
import { EditorLineas } from "./editor-lineas";
import { EditorSecciones } from "./editor-secciones";
import { EditorStandby, LabelStandby } from "./editor-standby";

type Props = {
  cotizacion: Cotizacion;
};

export function CotizacionEditor({ cotizacion }: Props) {
  // Encontrar la version vigente editable
  const versionVigente = cotizacion.versiones.find(
    (v) => v.numeroVersion === cotizacion.versionVigente && !v.congelada
  );

  // Inicializar draft desde la version vigente (o vacio si no existe aun)
  const [draft, setDraft] = React.useState<DraftBorrador>(() => {
    if (versionVigente) return derivarDraft(versionVigente);
    return { secciones: [], lineasSinSeccion: [], standbySinSeccion: [] };
  });

  const [erroresCampo, setErroresCampo] = React.useState<Record<string, string>>({});
  const [guardando, setGuardando] = React.useState(false);

  // useConsultarCotizacion para el refetch post-204
  const { refetch } = useConsultarCotizacion(cotizacion.id);
  const guardarMutation = useActualizarBorradorMutation(cotizacion.id);

  // Draft se inicializa al montar y se re-deriva explicitamente en onGuardar
  // tras el refetch exitoso. No se usa useEffect para sincronizacion adicional
  // porque este componente vive bajo un Server Component que lo re-monta si la
  // ruta cambia.

  async function onGuardar() {
    setErroresCampo({});
    setGuardando(true);

    const payload = armarPayloadBorrador(draft);

    try {
      await guardarMutation.mutateAsync(payload);
      // 204 exitoso: refetch para traer totales recalculados e idSeccion re-asignados
      const { data: cotizacionActualizada } = await refetch();
      if (cotizacionActualizada) {
        const vActualizada = cotizacionActualizada.versiones.find(
          (v) => v.numeroVersion === cotizacionActualizada.versionVigente && !v.congelada
        );
        if (vActualizada) {
          setDraft(derivarDraft(vActualizada));
        }
      }
      toast.success("Borrador guardado correctamente.");
    } catch (err) {
      aplicarErrorApi(err);
    } finally {
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
    // OQ-3: NestJS class-validator emite strings como "secciones.0.lineas.0.concepto must be..."
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
    <div className="flex flex-col gap-5">
      {/* Secciones */}
      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base">
            Secciones ({draft.secciones.length})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Las lineas y standby dentro de una seccion quedan agrupadas en el borrador.
          </p>
        </CardHeader>
        <CardContent className="pt-5">
          <EditorSecciones
            secciones={draft.secciones}
            erroresCampo={erroresCampo}
            disabled={guardando}
            onChange={(secciones) => setDraft((d) => ({ ...d, secciones }))}
          />
        </CardContent>
      </Card>

      {/* Lineas sin seccion */}
      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base">
            Lineas sin seccion ({draft.lineasSinSeccion.length})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Servicios sueltos que no pertenecen a ninguna seccion.
          </p>
        </CardHeader>
        <CardContent className="pt-5">
          <EditorLineas
            lineas={draft.lineasSinSeccion}
            erroresCampo={erroresCampo}
            disabled={guardando}
            onChange={(lineasSinSeccion) =>
              setDraft((d) => ({ ...d, lineasSinSeccion }))
            }
          />
        </CardContent>
      </Card>

      {/* Standby sin seccion */}
      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base">
            <LabelStandby count={draft.standbySinSeccion.length} />
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Tarifas de standby a nivel de version (sin seccion asociada).
          </p>
        </CardHeader>
        <CardContent className="pt-5">
          <EditorStandby
            standby={draft.standbySinSeccion}
            disabled={guardando}
            onChange={(standbySinSeccion) =>
              setDraft((d) => ({ ...d, standbySinSeccion }))
            }
          />
        </CardContent>
      </Card>

      <Separator />

      {/* Footer de guardado */}
      <div className="flex items-center justify-end gap-3">
        <p className="text-sm text-muted-foreground">
          El borrador reemplaza el contenido anterior al guardarse.
        </p>
        <Button
          type="button"
          disabled={guardando}
          onClick={() => void onGuardar()}
        >
          {guardando ? "Guardando..." : "Guardar borrador"}
        </Button>
      </div>
    </div>
  );
}
