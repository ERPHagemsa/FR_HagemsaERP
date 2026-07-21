"use client"

import { isAxiosError } from "axios"
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { clienteHttp } from "@/compartido/api/cliente-http"
import type { UsuarioSesion } from "@/compartido/autenticacion/sesion"

type RespuestaYo = {
  usuario: UsuarioSesion
}

// Estado de sesion expuesto a la UI. Mismo shape que devolvia el antiguo
// useSesion basado en useConsulta, para no tocar a sus consumidores.
export type EstadoSesion = {
  usuario: UsuarioSesion | null
  estaAutenticado: boolean
  // Solo la carga inicial sin datos (para un skeleton). Con la sesion sembrada
  // desde el servidor nace en false y no dispara skeletons.
  estaCargando: boolean
  error: unknown
  // Fuerza una relectura de /api/auth/yo (ej. tras editar el perfil). Devuelve
  // el usuario recargado, o null si la sesion ya no es valida.
  recargar: () => Promise<UsuarioSesion | null>
}

// Relee la sesion del backend decodificando la cookie httpOnly server-side.
// Un 401 significa "sin sesion" (devuelve null); cualquier otro error se propaga.
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

const SesionContext = createContext<EstadoSesion | null>(null)

// Provee la sesion a todo el arbol cliente, SEMBRADA con el valor que el
// servidor ya resolvio del JWT (mapearPayloadAUsuario, en el layout privado).
//
// Al haber datos desde el primer render (incluso en el HTML del SSR), la UI que
// depende de roles/permisos nace correcta:
//   - El sidebar se filtra bien de entrada: no hay parpadeo de "ve todo"
//     mientras carga la sesion (antes usePermisos devolvia [] hasta que resolvia
//     el fetch, y [] cae en el fallback "sin permisos = ve todo").
//   - Se hace UN solo /api/auth/yo (via recargar, bajo demanda) en vez de uno
//     por cada consumidor de useSesion, que no compartian cache.
export function SesionProvider({
  sesionInicial,
  children,
}: {
  sesionInicial: UsuarioSesion | null
  children: ReactNode
}) {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(sesionInicial)
  const [error, setError] = useState<unknown>(null)

  const recargar = useCallback(async (): Promise<UsuarioSesion | null> => {
    setError(null)
    try {
      const actual = await consultarSesion()
      setUsuario(actual)
      return actual
    } catch (err) {
      setError(err)
      return null
    }
  }, [])

  const valor = useMemo<EstadoSesion>(
    () => ({
      usuario,
      estaAutenticado: Boolean(usuario),
      // Sembrado desde el servidor: si hay usuario, nunca esta "cargando".
      estaCargando: false,
      error,
      recargar,
    }),
    [usuario, error, recargar],
  )

  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>
}

// Lee la sesion del contexto. Debe usarse bajo <SesionProvider> (montado en
// AppShell, que envuelve toda el area privada).
export function useSesion(): EstadoSesion {
  const contexto = useContext(SesionContext)
  if (contexto === null) {
    throw new Error("useSesion debe usarse dentro de <SesionProvider>.")
  }
  return contexto
}
