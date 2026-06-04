"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"

import { extraerMensajeError } from "@/compartido/api"
import { Button } from "@/compartido/componentes/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select"

import { useCrearCuenta } from "../ganchos/use-mutaciones-cuenta"
import type { TipoCuenta } from "../tipos/administracion.tipos"

export function CrearCuentaVista() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [nombreUsuario, setNombreUsuario] = useState("")
  const [nombreCompleto, setNombreCompleto] = useState("")
  const [tipoCuenta, setTipoCuenta] = useState<TipoCuenta>("interno")
  const [documentoIdentidad, setDocumentoIdentidad] = useState("")
  const [error, setError] = useState<string | null>(null)

  const crearMutation = useCrearCuenta()

  async function manejarSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    try {
      const respuesta = await crearMutation.mutateAsync({
        email: email.trim(),
        nombreUsuario: nombreUsuario.trim(),
        nombreCompleto: nombreCompleto.trim(),
        tipoCuenta,
        documentoIdentidad: documentoIdentidad.trim() || undefined,
      })
      toast.success("Cuenta creada correctamente")
      router.push(`/admin/cuentas/${respuesta.id}`)
    } catch (err) {
      const mensaje = extraerMensajeError(err, "No se pudo crear la cuenta.")
      setError(mensaje)
      toast.error(mensaje)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/cuentas">
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
            Volver a cuentas
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nueva cuenta</CardTitle>
          <CardDescription>
            Crea una nueva cuenta. Despues podras asignarle roles desde el detalle.
          </CardDescription>
        </CardHeader>
        <form onSubmit={(event) => void manejarSubmit(event)}>
          <CardContent>
            <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="email">Correo</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={255}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="nombreUsuario">Nombre de usuario</FieldLabel>
                <Input
                  id="nombreUsuario"
                  type="text"
                  autoComplete="off"
                  value={nombreUsuario}
                  onChange={(e) => setNombreUsuario(e.target.value)}
                  required
                  minLength={3}
                  maxLength={30}
                  pattern="[A-Za-z][A-Za-z0-9._\-]{2,29}"
                  title="3 a 30 caracteres, empieza con letra y solo letras, digitos, punto, guion o guion bajo"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="nombreCompleto">Nombre completo</FieldLabel>
                <Input
                  id="nombreCompleto"
                  type="text"
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  required
                  maxLength={255}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="tipoCuenta">Tipo de cuenta</FieldLabel>
                <Select
                  value={tipoCuenta}
                  onValueChange={(v) => setTipoCuenta(v as TipoCuenta)}
                >
                  <SelectTrigger id="tipoCuenta">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interno">Interno</SelectItem>
                    <SelectItem value="cliente">Cliente</SelectItem>
                    <SelectItem value="proveedor">Proveedor</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="documentoIdentidad">
                  Documento de identidad (opcional)
                </FieldLabel>
                <Input
                  id="documentoIdentidad"
                  type="text"
                  value={documentoIdentidad}
                  onChange={(e) => setDocumentoIdentidad(e.target.value)}
                  maxLength={50}
                />
              </Field>
              {error ? (
                <Field data-invalid className="sm:col-span-2">
                  <FieldError>{error}</FieldError>
                </Field>
              ) : null}
            </FieldGroup>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button asChild variant="ghost" type="button">
              <Link href="/admin/cuentas">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={crearMutation.isPending}>
              {crearMutation.isPending ? "Creando..." : "Crear cuenta"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
