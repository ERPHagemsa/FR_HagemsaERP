import { Suspense } from "react"

import { LoginVista } from "@/modulos/autenticacion/vistas/login-vista"

export default function LoginPage() {
  return (
    <Suspense>
      <LoginVista />
    </Suspense>
  )
}
