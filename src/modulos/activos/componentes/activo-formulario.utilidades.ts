// Funciones puras de apoyo del formulario de activos (sin estado ni JSX),
// extraidas de activo-formulario.tsx para reducir su tamano.

import type {
  Activo,
  TipoCambioConfiguracionHistorica,
} from "../tipos/activo.tipos";

export type DatosConfiguracionActual = {
  vehiculo?: {
    placa?: string | null;
    carroceria?: string | null;
  };
};

export function inferirTipoCambioConfiguracion(
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

export function construirMotivoConfiguracionHistorica(
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
    return `Replaqueo registrado: ${placaAnterior} -> ${placaNueva}.`;
  }

  if (tipoCambio === "CAMBIO_CARROCERIA") {
    return `Cambio de carroceria registrado desde replaqueo: ${carroceriaAnterior} -> ${carroceriaNueva}.`;
  }

  return "Replaqueo registrado desde unidad de baja.";
}

export function normalizarValorHistorico(value: unknown) {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}

export function etiquetaValorHistorico(value: unknown) {
  const texto = String(value ?? "").trim();
  return texto || "sin dato";
}

export function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function agregarQueryParam(url: string, key: string, value: string) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
}

export function construirMetadataCambio(returnTo?: string, motivoCambio?: string) {
  if (!returnTo?.startsWith("/activos/inventario-fisico/")) {
    return {
      origenCambio: "MAESTRO_ACTIVOS" as const,
      referenciaTipo: "ACTIVO",
      motivoCambio:
        motivoCambio?.trim() || "Actualizacion desde maestro de activos.",
      usuarioCambio: "activos.web",
    };
  }

  const inventarioId = Number(
    returnTo.match(/^\/activos\/inventario-fisico\/(\d+)/)?.[1]
  );

  return {
    origenCambio: "INVENTARIO_FISICO" as const,
    referenciaTipo: "INVENTARIO_FISICO",
    referenciaId: Number.isFinite(inventarioId) ? inventarioId : undefined,
    motivoCambio:
      motivoCambio?.trim() ||
      "Correccion durante revision fisica del inventario.",
    usuarioCambio: "activos.web",
  };
}

export function obtenerOrigenCambioVisual(returnTo?: string) {
  return returnTo?.startsWith("/activos/inventario-fisico/")
    ? "Inventario fisico"
    : "Maestro de activos";
}

/**
 * Origen para las operaciones de imagenes/documentos. Solo devuelve metadata
 * cuando se edita desde un inventario fisico; en el flujo normal devuelve
 * undefined para que el backend use sus defaults (origen maestro + referencia
 * al subrecurso afectado). No incluye motivo: cada operacion conserva su
 * motivo especifico ("Imagen eliminada del activo.", etc.).
 */
export function construirOrigenSubrecursos(returnTo?: string) {
  if (!returnTo?.startsWith("/activos/inventario-fisico/")) return undefined;

  const inventarioId = Number(
    returnTo.match(/^\/activos\/inventario-fisico\/(\d+)/)?.[1]
  );

  return {
    origenCambio: "INVENTARIO_FISICO" as const,
    referenciaTipo: "INVENTARIO_FISICO",
    referenciaId: Number.isFinite(inventarioId) ? inventarioId : undefined,
    usuarioCambio: "activos.web",
  };
}

export function formatearEstadoActivo(value?: string | null) {
  if (value === "ACTIVO") return "Activo";
  if (value === "SINIESTRADO") return "Baja / Siniestro";
  if (value === "INACTIVO") return "Baja / De baja";
  return value ?? "";
}

export function formatSummaryValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "Pendiente";

  return String(value);
}

export function toDateInputValue(value: string | null | undefined) {
  if (!value) return undefined;
  return value.slice(0, 10);
}
