"use client";

import { useConsulta, useMutar } from "@/compartido/api";

import type {
  FiltrosProspectos,
  PayloadAgregarContacto,
  PayloadActualizarProspecto,
  PayloadDescartarProspecto,
  PayloadRegistrarProspecto,
} from "../tipos/prospecto.tipos";
import {
  actualizarProspecto,
  agregarContacto,
  cambiarContactoPrincipal,
  consultarProspecto,
  descartarProspecto,
  eliminarContacto,
  listarProspectos,
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

export function useAgregarContactoMutation(idProspecto: string) {
  return useMutar<
    PayloadAgregarContacto,
    Awaited<ReturnType<typeof agregarContacto>>
  >({
    fn: (payload) => agregarContacto(idProspecto, payload),
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
