"use client";

import * as React from "react";
import { toast } from "sonner";

import { obtenerPdfCotizacion } from "../servicios/cotizaciones-api";
import { normalizarErrorAccion } from "../servicios/cotizaciones-error-handler";

// Descarga el PDF de la cotizacion y lo abre en una pestaña nueva.
//
// El `window.open("", "_blank")` se dispara SINCRONICAMENTE dentro del gesto
// del click (antes del await) para que el navegador no lo bloquee como popup;
// recien con el blob ya descargado le asignamos el objectURL. Si el popup fue
// bloqueado de todas formas, caemos a un window.open directo como fallback.
//
// `imprimir(version?)`: sin version imprime la vigente; con version imprime esa.
export function useImprimirPdf(idCotizacion: string) {
  const [generando, setGenerando] = React.useState(false);

  const imprimir = React.useCallback(
    async (version?: number) => {
      if (generando) return;
      const ventana = window.open("", "_blank");
      setGenerando(true);
      try {
        const blob = await obtenerPdfCotizacion(idCotizacion, version);
        const url = URL.createObjectURL(blob);
        if (ventana) {
          ventana.location.href = url;
        } else {
          window.open(url, "_blank");
        }
        // Revocar tras dar tiempo a que el visor cargue el blob.
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      } catch (err) {
        ventana?.close();
        const { mensaje } = normalizarErrorAccion(err, "No se pudo generar el PDF");
        toast.error(mensaje);
      } finally {
        setGenerando(false);
      }
    },
    [idCotizacion, generando]
  );

  return { imprimir, generando };
}
