import type { VehiculoFlota } from "../tipos/flota.tipos";

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

export function estadoOperativoVehiculo(vehiculo: VehiculoFlota) {
  return normalizarEstado(
    vehiculo.estadoOperativo ?? vehiculo.vehiculo?.estadoOperativo ?? vehiculo.estado
  );
}

export function estadoCalibracionVehiculo(vehiculo: VehiculoFlota) {
  return normalizarEstado(
    vehiculo.estadoCalibracion ?? vehiculo.vehiculo?.estadoCalibracion
  );
}

export function esVisibleEnFlota(vehiculo: VehiculoFlota) {
  return estadoActivoVehiculo(vehiculo) !== "ELIMINADO";
}

export function textoBusquedaVehiculo(vehiculo: VehiculoFlota) {
  return [
    vehiculo.id,
    vehiculo.codigo,
    vehiculo.descripcion,
    placaVehiculo(vehiculo),
    marcaVehiculo(vehiculo),
    modeloVehiculo(vehiculo),
    vehiculo.contrato,
    vehiculo.cuenta,
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
