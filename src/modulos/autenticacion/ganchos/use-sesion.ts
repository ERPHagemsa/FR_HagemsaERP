"use client"

import { isAxiosError } from "axios"

import { clienteHttp } from "@/compartido/api/cliente-http"
import { useConsulta } from "@/compartido/api/use-consulta"
import type { UsuarioSesion } from "@/compartido/autenticacion/sesion"

type RespuestaYo = {
  usuario: UsuarioSesion
}

async function consultarSesion(): Promise<UsuarioSesion | null> {
  try {
    const { data } = await clienteHttp.get<RespuestaYo>("/api/auth/yo")
    return data.usuario
  } catch (error: unknown) {
    if (isAxiosError(error) && error.response?.status === 401) {
      return null
    }
    throw error
  }
}

export function useSesion() {
  const { data, isLoading, error, refetch } = useConsulta(consultarSesion, [])

  return {
    usuario: data,
    estaAutenticado: Boolean(data),
    estaCargando: isLoading,
    error,
    recargar: refetch,
  }
}
