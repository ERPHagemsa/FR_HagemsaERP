"use client"

import { FormEvent, useEffect, useState } from "react"
import { toast } from "sonner"

import { extraerMensajeError } from "@/compartido/api"
import { useMutar } from "@/compartido/api"
import { useSesion } from "@/modulos/autenticacion/ganchos/use-sesion"
import type { UsuarioSesion } from "@/compartido/autenticacion/sesion"
import { SiteHeader } from "@/compartido/componentes/site-header"
import { Avatar, AvatarFallback } from "@/compartido/componentes/ui/avatar"
import { Badge } from "@/compartido/componentes/ui/badge"
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
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/compartido/componentes/ui/field"
import { Input } from "@/compartido/componentes/ui/input"
import { Skeleton } from "@/compartido/componentes/ui/skeleton"

import { cambiarCodigos, cambiarPassword } from "../servicios/perfil-api"

// Normaliza un código: mayúsculas, solo alfanuméricos, máx 20 (regla del dominio).
function normalizarCodigo(valor: string): string {
  return valor
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 20)
}

function calcularIniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return "HG"
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

export function PerfilVista() {
  const { usuario, estaCargando, recargar } = useSesion()

  return (
    <>
      <SiteHeader title="Mi perfil" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 lg:p-6">
        <BannerIdentidad usuario={usuario} cargando={estaCargando} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SeccionCodigos
            codigoSocioInicial={usuario?.codigoSocio ?? ""}
            codigoCuentaInicial={usuario?.codigoCuenta ?? ""}
            cargando={estaCargando}
            onCambio={recargar}
          />
          <SeccionPassword />
        </div>
      </div>
    </>
  )
}

function BannerIdentidad({
  usuario,
  cargando,
}: {
  usuario: UsuarioSesion | null | undefined
  cargando: boolean
}) {
  if (cargando || !usuario) {
    return (
      <Card>
        <CardContent className="flex items-center gap-4 py-6">
          <Skeleton className="size-16 rounded-2xl" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const iniciales = calcularIniciales(usuario.nombre || usuario.email)

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col gap-6 py-6 md:flex-row md:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Avatar className="size-16 rounded-2xl">
            <AvatarFallback className="rounded-2xl bg-red-100 text-lg font-semibold text-red-700">
              {iniciales}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold">{usuario.nombre}</h2>
            <p className="truncate text-sm text-muted-foreground">
              {usuario.email}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className="capitalize">
                {usuario.tipo}
              </Badge>
              {usuario.nombreUsuario ? (
                <span className="text-xs text-muted-foreground">
                  @{usuario.nombreUsuario}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:min-w-64 md:border-l md:pl-6">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Roles
            </span>
            <div className="flex flex-wrap gap-1">
              {usuario.roles.length > 0 ? (
                usuario.roles.map((rol) => (
                  <Badge key={rol} variant="secondary">
                    {rol}
                  </Badge>
                ))
              ) : (
                <span className="text-sm">—</span>
              )}
            </div>
          </div>
          {usuario.socioNombre ? (
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium text-muted-foreground">
                Socio de negocio (BC01)
              </span>
              <span className="text-sm font-medium">{usuario.socioNombre}</span>
              {usuario.socioDocumento ? (
                <span className="text-xs text-muted-foreground">
                  Doc. {usuario.socioDocumento}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

function SeccionCodigos({
  codigoSocioInicial,
  codigoCuentaInicial,
  cargando,
  onCambio,
}: {
  codigoSocioInicial: string
  codigoCuentaInicial: string
  cargando: boolean
  onCambio: () => void
}) {
  const [codigoSocio, setCodigoSocio] = useState(codigoSocioInicial)
  const [codigoCuenta, setCodigoCuenta] = useState(codigoCuentaInicial)

  // Sincroniza con la sesión cuando termina de cargar o cambia tras guardar.
  useEffect(() => {
    setCodigoSocio(codigoSocioInicial)
    setCodigoCuenta(codigoCuentaInicial)
  }, [codigoSocioInicial, codigoCuentaInicial])

  const mutacion = useMutar<
    { codigoSocio: string | null; codigoCuenta: string | null },
    unknown
  >({
    fn: ({ codigoSocio, codigoCuenta }) =>
      cambiarCodigos(codigoSocio, codigoCuenta),
    onSuccess: () => {
      toast.success("Códigos actualizados.")
      onCambio()
    },
    onError: (error) => toast.error(extraerMensajeError(error)),
  })

  const ambosVacios = codigoSocio === "" && codigoCuenta === ""
  const ambosCompletos = codigoSocio.length > 0 && codigoCuenta.length > 0

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!ambosVacios && !ambosCompletos) {
      toast.error(
        "Completá ambos códigos o dejá los dos vacíos para quitarlos.",
      )
      return
    }
    if (ambosCompletos && codigoSocio === codigoCuenta) {
      toast.error("El código de socio y el de cuenta deben ser distintos.")
      return
    }
    mutacion.mutate({
      codigoSocio: ambosVacios ? null : codigoSocio,
      codigoCuenta: ambosVacios ? null : codigoCuenta,
    })
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Códigos internos</CardTitle>
        <CardDescription>
          Dos códigos alfanuméricos (hasta 20 caracteres).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <form onSubmit={onSubmit} className="flex h-full flex-col">
          <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="codigoSocio">Código de socio</FieldLabel>
              <Input
                id="codigoSocio"
                className="rounded-md font-mono uppercase"
                autoComplete="off"
                value={codigoSocio}
                onChange={(e) => setCodigoSocio(normalizarCodigo(e.target.value))}
                maxLength={20}
                disabled={cargando || mutacion.isPending}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="codigoCuenta">Código de cuenta</FieldLabel>
              <Input
                id="codigoCuenta"
                className="rounded-md font-mono uppercase"
                autoComplete="off"
                value={codigoCuenta}
                onChange={(e) =>
                  setCodigoCuenta(normalizarCodigo(e.target.value))
                }
                maxLength={20}
                disabled={cargando || mutacion.isPending}
              />
            </Field>
            <FieldDescription className="sm:col-span-2">
              Dejá ambos vacíos y guardá para quitar tus códigos.
            </FieldDescription>
          </FieldGroup>
          <div className="mt-auto pt-6">
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={cargando || mutacion.isPending}
            >
              {mutacion.isPending ? "Guardando…" : "Guardar códigos"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function SeccionPassword() {
  const [actual, setActual] = useState("")
  const [nueva, setNueva] = useState("")
  const [confirmar, setConfirmar] = useState("")

  const mutacion = useMutar<{ actual: string; nueva: string }, unknown>({
    fn: ({ actual, nueva }) => cambiarPassword(actual, nueva),
    onSuccess: () => {
      toast.success("Contraseña actualizada.")
      setActual("")
      setNueva("")
      setConfirmar("")
    },
    onError: (error) => toast.error(extraerMensajeError(error)),
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (nueva.length < 8) {
      toast.error("La nueva contraseña debe tener al menos 8 caracteres.")
      return
    }
    if (nueva !== confirmar) {
      toast.error("La confirmación no coincide con la nueva contraseña.")
      return
    }
    mutacion.mutate({ actual, nueva })
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Cambiar contraseña</CardTitle>
        <CardDescription>
          Ingresá tu contraseña actual y la nueva (mínimo 8 caracteres).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <form onSubmit={onSubmit} className="flex h-full flex-col">
          <FieldGroup className="grid grid-cols-1 gap-4">
            <Field>
              <FieldLabel htmlFor="passwordActual">Contraseña actual</FieldLabel>
              <Input
                id="passwordActual"
                type="password"
                autoComplete="current-password"
                value={actual}
                onChange={(e) => setActual(e.target.value)}
                disabled={mutacion.isPending}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="passwordNueva">Nueva contraseña</FieldLabel>
              <Input
                id="passwordNueva"
                type="password"
                autoComplete="new-password"
                value={nueva}
                onChange={(e) => setNueva(e.target.value)}
                disabled={mutacion.isPending}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="passwordConfirmar">
                Repetir nueva contraseña
              </FieldLabel>
              <Input
                id="passwordConfirmar"
                type="password"
                autoComplete="new-password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                disabled={mutacion.isPending}
              />
            </Field>
          </FieldGroup>
          <div className="mt-auto pt-6">
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={mutacion.isPending || !actual || !nueva || !confirmar}
            >
              {mutacion.isPending ? "Guardando…" : "Cambiar contraseña"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
