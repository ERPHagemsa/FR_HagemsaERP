"use client"

// La sesion ahora vive en un contexto sembrado desde el servidor
// (SesionProvider, montado en AppShell). Este modulo se mantiene como punto de
// import estable para los consumidores existentes de useSesion.
export {
  useSesion,
  type EstadoSesion,
} from "@/modulos/autenticacion/contexto/sesion-contexto"
