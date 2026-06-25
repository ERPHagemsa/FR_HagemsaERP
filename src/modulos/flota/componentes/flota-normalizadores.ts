import type { VehiculoFlota } from "../tipos/flota.tipos";

export type ContratoRef = { id: string; codigo: string; nombre: string } | null;

/** 
 * Parsea seguramente un campo JSON de contrato/cuenta.
 * Soporta tres formas de llegada:
 *   1. Ya es un objeto  → lo retorna directamente
 *   2. Es un string JSON → lo parsea
 *   3. null / undefined  → retorna null
 */
export function parseRef(raw: unknown): ContratoRef {
  if (!raw) return null;
  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (typeof obj.id === "string" && typeof obj.codigo === "string" && typeof obj.nombre === "string") {
      return { id: obj.id, codigo: obj.codigo, nombre: obj.nombre };
    }
    return null;
  }
  if (typeof raw === "string") {
    try {
      return parseRef(JSON.parse(raw));
    } catch {
      return null;
    }
  }
  return null;
}

export type AsignacionVehiculo = {
  contrato: ContratoRef;
  cuenta: ContratoRef;
  fechaInicio?: string | null;
  fechaFin?: string | null;
};

export function asignacionesVehiculo(vehiculo: VehiculoFlota): AsignacionVehiculo[] {
  return (vehiculo.asignaciones ?? []).map((a) => ({
    contrato: parseRef(a.contrato),
    cuenta: parseRef(a.cuenta),
    fechaInicio: a.fechaInicio ?? null,
    fechaFin: a.fechaFin ?? null,
  }));
}

export function placaVehiculo(vehiculo: VehiculoFlota) {
  return (
    vehiculo.placa ??
    vehiculo.placaRodaje ??
    vehiculo.vehiculo?.placaRodaje ??
    vehiculo.codigo ??
    vehiculo.id
  );
}

export function marcaVehiculo(vehiculo: VehiculoFlota) {
  return vehiculo.marca ?? vehiculo.vehiculo?.marca ?? "-";
}

export function modeloVehiculo(vehiculo: VehiculoFlota) {
  return vehiculo.modelo ?? vehiculo.vehiculo?.modelo ?? "";
}

export function carroceriaVehiculo(vehiculo: VehiculoFlota) {
  return vehiculo.carroceria ?? vehiculo.vehiculo?.carroceria ?? vehiculo.descripcion ?? "-";
}

export function estadoActivoVehiculo(vehiculo: VehiculoFlota) {
  return normalizarEstado(vehiculo.estadoActivo ?? vehiculo.estado);
}

export function estadoRegistroVehiculo(vehiculo: VehiculoFlota) {
  return normalizarEstado(vehiculo.estadoRegistro);
}

export function estadoOperativoVehiculo(vehiculo: VehiculoFlota) {
  return normalizarEstado(
    vehiculo.estadoOperativo ?? vehiculo.vehiculo?.estadoOperativo ?? vehiculo.estado
  );
}

export function esVisibleEnFlota(vehiculo: VehiculoFlota) {
  return estadoActivoVehiculo(vehiculo) !== "ELIMINADO";
}

export function textoBusquedaVehiculo(vehiculo: VehiculoFlota) {
  const asignaciones = asignacionesVehiculo(vehiculo);
  return [
    vehiculo.id,
    vehiculo.codigo,
    vehiculo.descripcion,
    placaVehiculo(vehiculo),
    marcaVehiculo(vehiculo),
    modeloVehiculo(vehiculo),
    ...asignaciones.flatMap((a) => [a.contrato?.codigo, a.contrato?.nombre, a.cuenta?.codigo, a.cuenta?.nombre]),
  ]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();
}

export function formatear(value?: string | null) {
  if (!value) return "Sin detalle";

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizarEstado(value?: string | null) {
  return value?.trim().replace(/\s+/g, "_").toUpperCase() ?? null;
}

