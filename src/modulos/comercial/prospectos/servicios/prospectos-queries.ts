"use client";

import { useConsulta, useMutar } from "@/compartido/api";

import type {
  FiltrosHistorial,
  FiltrosProspectos,
  PayloadAgregarContacto,
  PayloadActualizarProspecto,
  PayloadDescartarProspecto,
  PayloadEditarContacto,
  PayloadRegistrarProspecto,
} from "../tipos/prospecto.tipos";
import {
  actualizarProspecto,
  agregarContacto,
  cambiarContactoPrincipal,
  consultarProspecto,
  descartarProspecto,
  editarContacto,
  eliminarContacto,
  eliminarProspecto,
  listarProspectos,
  obtenerHistorialProspectos,
  reactivarProspecto,
  registrarProspecto,
} from "./prospectos-api";

// ---------------------------------------------------------------------------
// Consultas (reads)
// ---------------------------------------------------------------------------

export function useProspectosQuery(filtros: FiltrosProspectos = {}) {
  return useConsulta(() => listarProspectos(filtros), [JSON.stringify(filtros)]);
}

export function useProspectoQuery(id: string) {
  return useConsulta(() => consultarProspecto(id), [id], {
    enabled: Boolean(id),
  });
}

export function useHistorialProspectosQuery(filtros: FiltrosHistorial = {}) {
  return useConsulta(
    () => obtenerHistorialProspectos(filtros),
    [JSON.stringify(filtros)]
  );
}

// ---------------------------------------------------------------------------
// Mutaciones (writes)
// ---------------------------------------------------------------------------

export function useRegistrarProspectoMutation() {
  return useMutar<
    PayloadRegistrarProspecto,
    Awaited<ReturnType<typeof registrarProspecto>>
  >({
    fn: registrarProspecto,
  });
}

export function useActualizarProspectoMutation() {
  return useMutar<
    { id: string; payload: PayloadActualizarProspecto },
    Awaited<ReturnType<typeof actualizarProspecto>>
  >({
    fn: ({ id, payload }) => actualizarProspecto(id, payload),
  });
}

export function useDescartarProspectoMutation() {
  return useMutar<
    { id: string; payload: PayloadDescartarProspecto },
    Awaited<ReturnType<typeof descartarProspecto>>
  >({
    fn: ({ id, payload }) => descartarProspecto(id, payload),
  });
}

export function useReactivarProspectoMutation() {
  return useMutar<string, Awaited<ReturnType<typeof reactivarProspecto>>>({
    fn: (id) => reactivarProspecto(id),
  });
}

export function useEliminarProspectoMutation() {
  return useMutar<string, Awaited<ReturnType<typeof eliminarProspecto>>>({
    fn: (id) => eliminarProspecto(id),
  });
}

export function useAgregarContactoMutation(idProspecto: string) {
  return useMutar<
    PayloadAgregarContacto,
    Awaited<ReturnType<typeof agregarContacto>>
  >({
    fn: (payload) => agregarContacto(idProspecto, payload),
  });
}

export function useEditarContactoMutation(idProspecto: string) {
  return useMutar<
    { idContacto: string; payload: PayloadEditarContacto },
    Awaited<ReturnType<typeof editarContacto>>
  >({
    fn: ({ idContacto, payload }) =>
      editarContacto(idProspecto, idContacto, payload),
  });
}

export function useEliminarContactoMutation(idProspecto: string) {
  return useMutar<
    string,
    Awaited<ReturnType<typeof eliminarContacto>>
  >({
    fn: (idContacto) => eliminarContacto(idProspecto, idContacto),
  });
}

export function useCambiarContactoPrincipalMutation(idProspecto: string) {
  return useMutar<
    string,
    Awaited<ReturnType<typeof cambiarContactoPrincipal>>
  >({
    fn: (idContacto) => cambiarContactoPrincipal(idProspecto, idContacto),
  });
}
