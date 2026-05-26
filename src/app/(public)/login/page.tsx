import { Suspense } from "react"

import { modoDesarrolloActivo } from "@/compartido/autenticacion/jwt-dev"
import { LoginVista } from "@/modulos/autenticacion/vistas/login-vista"

export default function LoginPage() {
  return (
    <Suspense>
      <LoginVista modoDesarrolloActivo={modoDesarrolloActivo()} />
    </Suspense>
  )
}
