"use client";

import { invalidarConsulta, useConsulta, useMutar } from "@/compartido/api";
import { toast } from "sonner";

import type {
  FiltrosCatalogosCargoAdicional,
  FiltrosCotizaciones,
  FiltrosModalidades,
  FiltrosResumenCotizaciones,
  ParamsPrecioSugerido,
  PayloadActualizarCondicionesVersion,
  PayloadBorrador,
  PayloadEnviar,
  PayloadNuevaVersion,
  PayloadPerdida,
} from "../tipos/cotizaciones.tipos";
import {
  actualizarBorrador,
  actualizarCondicionesVersion,
  cancelarCotizacion,
  consultarCotizacion,
  enviarCotizacion,
  listarCotizaciones,
  marcarGanada,
  marcarPerdida,
  nuevaVersion,
  obtenerEjecutivosCotizaciones,
  obtenerPrecioSugerido,
  obtenerResumenCotizaciones,
  obtenerSugerenciasCarga,
} from "./cotizaciones-api";
import { listarCatalogosCargoAdicional } from "./catalogos-cargo-adicional-api";
import { listarModalidades } from "./modalidades-api";

import {
  CLAVE_CARGOS_ADICIONALES,
  CLAVE_COTIZACION_DETALLE,
  CLAVE_COTIZACIONES,
  CLAVE_COTIZACIONES_EJECUTIVOS,
  CLAVE_COTIZACIONES_RESUMEN,
  CLAVE_MODALIDADES,
} from "../../claves-consulta";

// ---------------------------------------------------------------------------
// Consultas (reads)
// ---------------------------------------------------------------------------

export function useListarCotizaciones(filtros: FiltrosCotizaciones = {}) {
  return useConsulta(
    () => listarCotizaciones(filtros),
    [JSON.stringify(filtros)],
    { clave: CLAVE_COTIZACIONES }
  );
}

// KPIs del pipeline. Solo depende del contexto (origenTipo/idEjecutivoResponsable/busqueda):
// no refetchea al cambiar de bucket o de pagina, porque la franja muestra
// SIEMPRE todos los buckets bajo el mismo contexto.
export function useResumenCotizacionesQuery(filtros: FiltrosResumenCotizaciones = {}) {
  return useConsulta(
    () => obtenerResumenCotizaciones(filtros),
    [JSON.stringify(filtros)],
    { clave: CLAVE_COTIZACIONES_RESUMEN }
  );
}

export function useConsultarCotizacion(id: string) {
  return useConsulta(() => consultarCotizacion(id), [id], {
    enabled: Boolean(id),
    clave: CLAVE_COTIZACION_DETALLE,
  });
}

// Autocompletado de cargas. Espeja la regla del backend: con <2 chars (tras trim)
// no dispara la query. OJO: useConsulta NO limpia `data` al deshabilitarse, asi que
// el consumidor debe gatear el render del dropdown por `q.trim().length >= 2`.
export function useSugerenciasCarga(q: string, limit = 10) {
  const termino = q.trim();
  return useConsulta(
    () => obtenerSugerenciasCarga(termino, limit),
    [termino, limit],
    { enabled: termino.length >= 2 }
  );
}

// Precio sugerido para una linea de TRANSPORTE (API §5.3.2). El backend exige 5 campos
// del query (modalidadId, origen, destino, moneda y pesoTotal > 0); por eso la query SOLO
// dispara cuando los cinco estan presentes — sin peso no hay sugerencia (es requerido).
// OJO: igual que useSugerenciasCarga, useConsulta NO limpia `data` al deshabilitarse —
// el consumidor debe gatear el render por la misma condicion de `habilitado`.
export function usePrecioSugerido(
  params: ParamsPrecioSugerido,
  habilitado = true
) {
  const origen = params.origen.trim();
  const destino = params.destino.trim();
  const listo =
    habilitado &&
    Boolean(params.modalidadId) &&
    origen.length > 0 &&
    destino.length > 0 &&
    params.pesoTotal > 0;
  return useConsulta(
    () => obtenerPrecioSugerido({ ...params, origen, destino }),
    [
      params.modalidadId,
      origen,
      destino,
      params.moneda,
      params.pesoTotal,
      params.toleranciaPeso,
      params.clienteTipo,
      params.clienteId,
    ],
    { enabled: listo }
  );
}

// ---------------------------------------------------------------------------
// Mutaciones (writes)
// ---------------------------------------------------------------------------

export function useActualizarBorradorMutation(id: string) {
  return useMutar<
    PayloadBorrador,
    Awaited<ReturnType<typeof actualizarBorrador>>
  >({
    fn: (payload) => actualizarBorrador(id, payload),
    onSuccess: () => {
      invalidarConsulta(CLAVE_COTIZACION_DETALLE);
    },
  });
}

export function useActualizarCondicionesVersionMutation(idCotizacion: string) {
  return useMutar<
    PayloadActualizarCondicionesVersion,
    Awaited<ReturnType<typeof actualizarCondicionesVersion>>
  >({
    fn: (payload) => actualizarCondicionesVersion(idCotizacion, payload),
    onSuccess: () => {
      invalidarConsulta(CLAVE_COTIZACION_DETALLE);
      toast.success("Condiciones guardadas correctamente.");
    },
  });
}

export function useEnviarCotizacionMutation(id: string) {
  return useMutar<
    PayloadEnviar,
    Awaited<ReturnType<typeof enviarCotizacion>>
  >({
    fn: (payload) => enviarCotizacion(id, payload),
    onSuccess: () => {
      invalidarConsulta(CLAVE_COTIZACIONES);
      invalidarConsulta(CLAVE_COTIZACIONES_RESUMEN);
      invalidarConsulta(CLAVE_COTIZACION_DETALLE);
    },
  });
}

export function useNuevaVersionMutation(id: string) {
  return useMutar<
    PayloadNuevaVersion,
    Awaited<ReturnType<typeof nuevaVersion>>
  >({
    fn: (payload) => nuevaVersion(id, payload),
    onSuccess: () => {
      invalidarConsulta(CLAVE_COTIZACIONES);
      invalidarConsulta(CLAVE_COTIZACION_DETALLE);
    },
  });
}

export function useMarcarGanadaMutation(id: string) {
  return useMutar<undefined, Awaited<ReturnType<typeof marcarGanada>>>({
    fn: () => marcarGanada(id),
    onSuccess: () => {
      invalidarConsulta(CLAVE_COTIZACIONES);
      invalidarConsulta(CLAVE_COTIZACIONES_RESUMEN);
      invalidarConsulta(CLAVE_COTIZACION_DETALLE);
    },
  });
}

export function useMarcarPerdidaMutation(id: string) {
  return useMutar<
    PayloadPerdida,
    Awaited<ReturnType<typeof marcarPerdida>>
  >({
    fn: (payload) => marcarPerdida(id, payload),
    onSuccess: () => {
      invalidarConsulta(CLAVE_COTIZACIONES);
      invalidarConsulta(CLAVE_COTIZACIONES_RESUMEN);
      invalidarConsulta(CLAVE_COTIZACION_DETALLE);
    },
  });
}

export function useCancelarCotizacionMutation(id: string) {
  return useMutar<undefined, Awaited<ReturnType<typeof cancelarCotizacion>>>({
    fn: () => cancelarCotizacion(id),
    onSuccess: () => {
      invalidarConsulta(CLAVE_COTIZACIONES);
      invalidarConsulta(CLAVE_COTIZACIONES_RESUMEN);
      invalidarConsulta(CLAVE_COTIZACION_DETALLE);
    },
  });
}

// Lista de ejecutivos que tienen cotizaciones (GET /cotizaciones/ejecutivos).
// Se usa para poblar el selector de filtro en CotizacionesTabla.
// No tiene deps variables — siempre trae todos los ejecutivos del BC.
export function useEjecutivosCotizacionesQuery() {
  return useConsulta(
    () => obtenerEjecutivosCotizaciones(),
    [],
    { clave: CLAVE_COTIZACIONES_EJECUTIVOS }
  );
}

// ---------------------------------------------------------------------------
// Modalidades (catalogo de lectura)
// ---------------------------------------------------------------------------

export function useListarModalidades(filtros: FiltrosModalidades = {}) {
  return useConsulta(
    () => listarModalidades(filtros),
    [JSON.stringify(filtros)],
    { clave: CLAVE_MODALIDADES }
  );
}

// ---------------------------------------------------------------------------
// Catalogo de cargos adicionales (lectura, cache unico en el editor)
// ---------------------------------------------------------------------------

export function useListarCatalogosCargoAdicional(
  filtros: FiltrosCatalogosCargoAdicional = {}
) {
  return useConsulta(
    () => listarCatalogosCargoAdicional(filtros),
    [JSON.stringify(filtros)],
    { clave: CLAVE_CARGOS_ADICIONALES }
  );
}
