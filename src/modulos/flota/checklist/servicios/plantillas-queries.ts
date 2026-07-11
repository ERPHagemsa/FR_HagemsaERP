"use client";

import { invalidarConsulta, useConsulta } from "@/compartido/api/use-consulta";
import { useMutar } from "@/compartido/api/use-mutar";
import {
  anularPlantilla,
  anularVersionPlantilla,
  crearPlantilla,
  crearVersionPlantilla,
  editarPlantilla,
  listarPlantillas,
  listarVersionesPlantilla,
  obtenerVersionPlantilla,
  publicarVersionPlantilla,
  redefinirEstructuraVersion,
} from "./checklist-api";
import type {
  CrearPlantillaPayload,
  CrearVersionPayload,
  EditarPlantillaPayload,
  FiltrosPlantillas,
  FiltrosVersionesPlantilla,
  Plantilla,
  PlantillaVersion,
  RedefinirEstructuraPayload,
} from "../tipos/checklist.tipos";

const CLAVE_PLANTILLAS = "flota:checklist:plantillas";
const claveVersionesPlantilla = (plantillaId: string) =>
  `flota:checklist:plantillas:${plantillaId}:versiones`;

export interface OpcionesMutacion {
  onSuccess?: () => unknown;
  onError?: (err: unknown) => unknown;
}

// ── Plantillas ─────────────────────────────────────────────────────────────────

export function usePlantillasQuery(filtros: FiltrosPlantillas = {}) {
  return useConsulta(() => listarPlantillas(filtros), [JSON.stringify(filtros)], {
    clave: CLAVE_PLANTILLAS,
  });
}

export function useCrearPlantillaMutation(opciones: OpcionesMutacion = {}) {
  return useMutar<CrearPlantillaPayload, Plantilla>({
    fn: (payload) => crearPlantilla(payload),
    onSuccess: () => {
      invalidarConsulta(CLAVE_PLANTILLAS);
      opciones.onSuccess?.();
    },
    onError: (err) => opciones.onError?.(err),
  });
}

export function useEditarPlantillaMutation(id: string, opciones: OpcionesMutacion = {}) {
  return useMutar<EditarPlantillaPayload, Plantilla>({
    fn: (payload) => editarPlantilla(id, payload),
    onSuccess: () => {
      invalidarConsulta(CLAVE_PLANTILLAS);
      opciones.onSuccess?.();
    },
    onError: (err) => opciones.onError?.(err),
  });
}

export function useAnularPlantillaMutation(id: string, opciones: OpcionesMutacion = {}) {
  return useMutar<void, Plantilla>({
    fn: () => anularPlantilla(id),
    onSuccess: () => {
      invalidarConsulta(CLAVE_PLANTILLAS);
      opciones.onSuccess?.();
    },
    onError: (err) => opciones.onError?.(err),
  });
}

// ── Versiones de una plantilla ────────────────────────────────────────────────

export function useVersionesPlantillaQuery(
  plantillaId: string,
  filtros: FiltrosVersionesPlantilla = {},
) {
  return useConsulta(
    () => listarVersionesPlantilla(plantillaId, filtros),
    [plantillaId, JSON.stringify(filtros)],
    { enabled: Boolean(plantillaId), clave: claveVersionesPlantilla(plantillaId) },
  );
}

export function useCrearVersionMutation(plantillaId: string, opciones: OpcionesMutacion = {}) {
  return useMutar<CrearVersionPayload, PlantillaVersion>({
    fn: (payload) => crearVersionPlantilla(plantillaId, payload),
    onSuccess: () => {
      invalidarConsulta(claveVersionesPlantilla(plantillaId));
      opciones.onSuccess?.();
    },
    onError: (err) => opciones.onError?.(err),
  });
}

// ── Una versión puntual (editor de estructura) ────────────────────────────────

export function useVersionPlantillaQuery(versionId: string) {
  return useConsulta(() => obtenerVersionPlantilla(versionId), [versionId], {
    enabled: Boolean(versionId),
  });
}

export function useRedefinirEstructuraMutation(versionId: string, opciones: OpcionesMutacion = {}) {
  return useMutar<RedefinirEstructuraPayload, PlantillaVersion>({
    fn: (payload) => redefinirEstructuraVersion(versionId, payload),
    onSuccess: () => opciones.onSuccess?.(),
    onError: (err) => opciones.onError?.(err),
  });
}

export function usePublicarVersionMutation(versionId: string, opciones: OpcionesMutacion = {}) {
  return useMutar<void, PlantillaVersion>({
    fn: () => publicarVersionPlantilla(versionId),
    onSuccess: () => opciones.onSuccess?.(),
    onError: (err) => opciones.onError?.(err),
  });
}

export function useAnularVersionMutation(
  versionId: string,
  plantillaId: string,
  opciones: OpcionesMutacion = {},
) {
  return useMutar<void, PlantillaVersion>({
    fn: () => anularVersionPlantilla(versionId),
    onSuccess: () => {
      invalidarConsulta(claveVersionesPlantilla(plantillaId));
      opciones.onSuccess?.();
    },
    onError: (err) => opciones.onError?.(err),
  });
}
