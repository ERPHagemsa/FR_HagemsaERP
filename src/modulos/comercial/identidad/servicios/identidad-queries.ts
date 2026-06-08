"use client";

import { useConsulta } from "@/compartido/api";

import type { TipoDocumento } from "../../prospectos/tipos/prospecto.tipos";

import { resolverIdentidad } from "./identidad-api";

// Consulta reactiva: resuelve identidad cuando hay tipo + numero de documento.
// Deshabilitada hasta tener ambos valores (no dispara con campos vacios).
export function useResolverIdentidadQuery(
  tipoDocumento: TipoDocumento | "",
  numeroDocumento: string
) {
  return useConsulta(
    () => resolverIdentidad(tipoDocumento as TipoDocumento, numeroDocumento),
    [tipoDocumento, numeroDocumento],
    { enabled: Boolean(tipoDocumento && numeroDocumento) }
  );
}
