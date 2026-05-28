"use client"

import { FormEvent, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { Login03Icon } from "@hugeicons/core-free-icons"

import { extraerMensajeError } from "@/compartido/api"
import { clienteHttp } from "@/compartido/api/cliente-http"
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert"
import { Button } from "@/compartido/componentes/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/compartido/componentes/ui/field"
import { Input } from "@/compartido/componentes/ui/input"

export function LoginVista() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const motivo = searchParams.get("motivo")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function iniciarSesion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCargando(true)
    setError(null)

    try {
      await clienteHttp.post("/api/auth/login", { email, password })
      router.replace(searchParams.get("next") || "/")
      router.refresh()
    } catch (err) {
      setError(extraerMensajeError(err, "No se pudo iniciar sesion."))
    } finally {
      setCargando(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-8 text-foreground">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex size-16 items-center justify-center">
            <img src="/logo/logo.svg" alt="Hagemsa" className="size-full object-contain" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold">Hagemsa ERP</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Ingresa con tu cuenta para continuar.
            </p>
          </div>
        </div>

        {motivo === "sesion_expirada" ? (
          <Alert>
            <AlertTitle>Tu sesion expiro</AlertTitle>
            <AlertDescription>
              Por seguridad, te pedimos que vuelvas a ingresar tus credenciales.
            </AlertDescription>
          </Alert>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Inicio de sesion</CardTitle>
            <CardDescription>Acceso privado a los modulos operativos.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(event) => void iniciarSesion(event)}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Correo</FieldLabel>
                  <Input
                    id="email"
                    autoComplete="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">Contrasena</FieldLabel>
                  <Input
                    id="password"
                    autoComplete="current-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </Field>
                <Button type="submit" disabled={cargando}>
                  <HugeiconsIcon
                    data-icon="inline-start"
                    icon={Login03Icon}
                    strokeWidth={2}
                  />
                  {cargando ? "Ingresando..." : "Ingresar"}
                </Button>
                {error ? (
                  <Field data-invalid>
                    <FieldError>{error}</FieldError>
                  </Field>
                ) : null}
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
