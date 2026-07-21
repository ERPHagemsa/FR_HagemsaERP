import { redirect } from "next/navigation"

import {
  mapearPayloadAUsuario,
  obtenerSesionActual,
} from "@/compartido/autenticacion/sesion-servidor"
import { AppShell } from "@/compartido/componentes/app-shell"

// Guard server-side para todo el area privada: si no hay sesion (cookie
// httpOnly de access ausente o invalida), redirige a /login conservando la
// ruta destino en `next`. El gate corre antes de renderizar cualquier hijo
// para no exponer estructura ni datos del area autenticada.
//
// /admin/* tiene ademas su propio gate que exige SUPER_ADMIN.

export default async function PrivadoLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const sesion = await obtenerSesionActual()
  if (!sesion) {
    redirect("/login")
  }

  // Siembra el contexto de sesion en el cliente con lo que el servidor ya
  // resolvio del JWT: el sidebar nace filtrado y no parpadea "ve todo".
  const usuario = mapearPayloadAUsuario(sesion)

  return <AppShell sesionInicial={usuario}>{children}</AppShell>
}
