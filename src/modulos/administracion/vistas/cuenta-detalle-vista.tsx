"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"

import { SiteHeader } from "@/compartido/componentes/site-header"
import {
  ArrowLeft,
  Ban,
  Copy,
  Key,
  Pencil,
  Play,
  RefreshCw,
  Trash2,
} from "lucide-react"

import { extraerMensajeError } from "@/compartido/api"
import {
  Avatar,
  AvatarFallback,
} from "@/compartido/componentes/ui/avatar"
import { Button } from "@/compartido/componentes/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/compartido/componentes/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/compartido/componentes/ui/field"
import { Input } from "@/compartido/componentes/ui/input"
import { Skeleton } from "@/compartido/componentes/ui/skeleton"
import { cn } from "@/compartido/utilidades/utils"

import { RolesAsignadosSeccion } from "../componentes/roles-asignados-seccion"
import { SesionesActivasSeccion } from "../componentes/sesiones-activas-seccion"
import { SocioAsignadoSeccion } from "../componentes/socio-asignado-seccion"
import { useCuenta } from "../ganchos/use-cuenta"
import {
  useActualizarCuenta,
  useDesactivarCuenta,
  useReactivarCuenta,
  useResetPasswordAdmin,
  useSetPassword,
  useSuspenderCuenta,
} from "../ganchos/use-mutaciones-cuenta"
import type { CuentaResponse, EstadoCuenta } from "../tipos/administracion.tipos"

const PUNTO_ESTADO: Record<EstadoCuenta, string> = {
  activo: "bg-emerald-500",
  suspendido: "bg-red-500",
  inactivo: "bg-zinc-400",
}

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return "?"
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

function EstadoBadge({ estado }: { estado: EstadoCuenta }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm capitalize text-muted-foreground">
      <span
        className={cn(
          "size-1.5 rounded-md",
          PUNTO_ESTADO[estado] ?? "bg-zinc-400",
        )}
      />
      {estado}
    </span>
  )
}

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  )
}

interface PropsAccion {
  cuenta: CuentaResponse
  onActualizado?: () => unknown
}

function DialogSuspender({ cuenta, onActualizado }: PropsAccion) {
  const [abierto, setAbierto] = useState(false)
  const [razon, setRazon] = useState("")
  const [error, setError] = useState<string | null>(null)
  const mutation = useSuspenderCuenta(cuenta.id, { onSuccess: onActualizado })

  async function confirmar() {
    if (!razon.trim()) {
      setError("La razon es obligatoria.")
      return
    }
    setError(null)
    try {
      await mutation.mutateAsync({ razon: razon.trim() })
      toast.success("Cuenta suspendida")
      setAbierto(false)
      setRazon("")
    } catch (err) {
      const mensaje = extraerMensajeError(err, "No se pudo suspender la cuenta.")
      setError(mensaje)
      toast.error(mensaje)
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-md">
          <Ban />
          Suspender
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-md">
        <DialogHeader>
          <DialogTitle>Suspender cuenta</DialogTitle>
          <DialogDescription>
            La cuenta {cuenta.email} no podra iniciar sesion hasta ser reactivada.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="razon">Razon</FieldLabel>
            <Input
              id="razon"
              className="rounded-md"
              value={razon}
              onChange={(e) => setRazon(e.target.value)}
              placeholder="Por que se suspende esta cuenta"
              maxLength={500}
            />
          </Field>
          {error ? (
            <Field data-invalid>
              <FieldError>{error}</FieldError>
            </Field>
          ) : null}
        </FieldGroup>
        <DialogFooter>
          <Button
            variant="ghost"
            className="rounded-md"
            onClick={() => setAbierto(false)}
            disabled={mutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            className="rounded-md"
            onClick={() => void confirmar()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Suspendiendo..." : "Suspender"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function BotonReactivar({ cuenta, onActualizado }: PropsAccion) {
  const mutation = useReactivarCuenta(cuenta.id, { onSuccess: onActualizado })

  async function confirmar() {
    try {
      await mutation.mutateAsync()
      toast.success("Cuenta reactivada")
    } catch (err) {
      toast.error(extraerMensajeError(err, "No se pudo reactivar la cuenta."))
    }
  }

  return (
    <Button size="sm" className="rounded-md" onClick={() => void confirmar()} disabled={mutation.isPending}>
      <Play />
      {mutation.isPending ? "Reactivando..." : "Reactivar"}
    </Button>
  )
}

function DialogSetPassword({ cuenta }: PropsAccion) {
  const [abierto, setAbierto] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const mutation = useSetPassword(cuenta.id)

  async function confirmar() {
    if (password.length < 8) {
      setError("La password debe tener al menos 8 caracteres.")
      return
    }
    setError(null)
    try {
      await mutation.mutateAsync({ password })
      toast.success("Password actualizada")
      setAbierto(false)
      setPassword("")
    } catch (err) {
      const mensaje = extraerMensajeError(err, "No se pudo cambiar la password.")
      setError(mensaje)
      toast.error(mensaje)
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-md">
          <Key />
          Cambiar password
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-md">
        <DialogHeader>
          <DialogTitle>Cambiar password</DialogTitle>
          <DialogDescription>
            Le seteas una nueva password a {cuenta.email}. El usuario debera cambiarla en su proximo login.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="password">Nueva password</FieldLabel>
            <Input
              id="password"
              className="rounded-md"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
            />
          </Field>
          {error ? (
            <Field data-invalid>
              <FieldError>{error}</FieldError>
            </Field>
          ) : null}
        </FieldGroup>
        <DialogFooter>
          <Button
            variant="ghost"
            className="rounded-md"
            onClick={() => setAbierto(false)}
            disabled={mutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            className="rounded-md"
            onClick={() => void confirmar()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DialogResetPassword({ cuenta }: PropsAccion) {
  const [abierto, setAbierto] = useState(false)
  const [passwordTemporal, setPasswordTemporal] = useState<string | null>(null)
  const mutation = useResetPasswordAdmin(cuenta.id)

  async function generar() {
    try {
      const respuesta = await mutation.mutateAsync()
      setPasswordTemporal(respuesta.passwordTemporal)
      toast.success("Password temporal generada")
    } catch (err) {
      toast.error(extraerMensajeError(err, "No se pudo generar la password."))
    }
  }

  async function copiar() {
    if (!passwordTemporal) return
    await navigator.clipboard.writeText(passwordTemporal)
    toast.success("Copiada al portapapeles")
  }

  function cerrar(siguienteAbierto: boolean) {
    setAbierto(siguienteAbierto)
    if (!siguienteAbierto) setPasswordTemporal(null)
  }

  return (
    <Dialog open={abierto} onOpenChange={cerrar}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-md">
          <RefreshCw />
          Reset password
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-md">
        <DialogHeader>
          <DialogTitle>Reset de password</DialogTitle>
          <DialogDescription>
            {passwordTemporal
              ? "Anota o copia esta password temporal. Por seguridad solo se muestra una vez."
              : `Se generara una password temporal para ${cuenta.email}.`}
          </DialogDescription>
        </DialogHeader>
        {passwordTemporal ? (
          <FieldGroup>
            <Field>
              <FieldLabel>Password temporal</FieldLabel>
              <div className="flex gap-2">
                <Input value={passwordTemporal} readOnly className="rounded-md font-mono" />
                <Button variant="outline" size="icon" className="rounded-md" onClick={() => void copiar()}>
                  <Copy />
                </Button>
              </div>
            </Field>
          </FieldGroup>
        ) : null}
        <DialogFooter>
          {passwordTemporal ? (
            <Button className="rounded-md" onClick={() => cerrar(false)}>Cerrar</Button>
          ) : (
            <>
              <Button
                variant="ghost"
                className="rounded-md"
                onClick={() => cerrar(false)}
                disabled={mutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                className="rounded-md"
                onClick={() => void generar()}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Generando..." : "Generar"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DialogEditarCuenta({ cuenta, onActualizado }: PropsAccion) {
  const [abierto, setAbierto] = useState(false)
  const [nombreCompleto, setNombreCompleto] = useState(cuenta.nombreCompleto)
  const [documentoIdentidad, setDocumentoIdentidad] = useState(
    cuenta.documentoIdentidad ?? "",
  )
  const [error, setError] = useState<string | null>(null)
  const mutation = useActualizarCuenta(cuenta.id, { onSuccess: onActualizado })

  function abrir(siguiente: boolean) {
    if (siguiente) {
      setNombreCompleto(cuenta.nombreCompleto)
      setDocumentoIdentidad(cuenta.documentoIdentidad ?? "")
      setError(null)
    }
    setAbierto(siguiente)
  }

  async function confirmar() {
    const nombreTrim = nombreCompleto.trim()
    const docTrim = documentoIdentidad.trim()

    if (!nombreTrim) {
      setError("El nombre es obligatorio.")
      return
    }
    setError(null)

    const cambios: { nombreCompleto?: string; documentoIdentidad?: string | null } = {}
    if (nombreTrim !== cuenta.nombreCompleto) {
      cambios.nombreCompleto = nombreTrim
    }
    if (docTrim !== (cuenta.documentoIdentidad ?? "")) {
      cambios.documentoIdentidad = docTrim || null
    }

    if (Object.keys(cambios).length === 0) {
      setAbierto(false)
      return
    }

    try {
      await mutation.mutateAsync(cambios)
      toast.success("Cuenta actualizada")
      setAbierto(false)
    } catch (err) {
      const mensaje = extraerMensajeError(err, "No se pudo actualizar la cuenta.")
      setError(mensaje)
      toast.error(mensaje)
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={abrir}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-md">
          <Pencil />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-md">
        <DialogHeader>
          <DialogTitle>Editar cuenta</DialogTitle>
          <DialogDescription>
            Cambia el nombre completo o el documento de identidad. El email y
            el tipo de cuenta no son editables.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="nombre-editar">Nombre completo</FieldLabel>
            <Input
              id="nombre-editar"
              className="rounded-md"
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              maxLength={200}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="documento-editar">
              Documento de identidad
            </FieldLabel>
            <Input
              id="documento-editar"
              className="rounded-md"
              value={documentoIdentidad}
              onChange={(e) => setDocumentoIdentidad(e.target.value)}
              placeholder="Dejar vacio para quitar"
              maxLength={50}
            />
          </Field>
          {error ? (
            <Field data-invalid>
              <FieldError>{error}</FieldError>
            </Field>
          ) : null}
        </FieldGroup>
        <DialogFooter>
          <Button
            variant="ghost"
            className="rounded-md"
            onClick={() => setAbierto(false)}
            disabled={mutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            className="rounded-md"
            onClick={() => void confirmar()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DialogDesactivar({ cuenta, onActualizado }: PropsAccion) {
  const [abierto, setAbierto] = useState(false)
  const [razon, setRazon] = useState("")
  const [error, setError] = useState<string | null>(null)
  const mutation = useDesactivarCuenta(cuenta.id, { onSuccess: onActualizado })

  async function confirmar() {
    if (!razon.trim()) {
      setError("La razon es obligatoria.")
      return
    }
    setError(null)
    try {
      await mutation.mutateAsync({ razon: razon.trim() })
      toast.success("Cuenta desactivada")
      setAbierto(false)
      setRazon("")
    } catch (err) {
      const mensaje = extraerMensajeError(err, "No se pudo desactivar la cuenta.")
      setError(mensaje)
      toast.error(mensaje)
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-md text-destructive hover:text-destructive">
          <Trash2 />
          Desactivar
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-md">
        <DialogHeader>
          <DialogTitle>Desactivar cuenta</DialogTitle>
          <DialogDescription>
            La cuenta {cuenta.email} se marcara como inactiva. Es una accion
            permanente — no podra volver a iniciar sesion y sus sesiones
            activas se revocaran. Usa &quot;Suspender&quot; si la baja es temporal.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="razon-desactivar">Razon</FieldLabel>
            <Input
              id="razon-desactivar"
              className="rounded-md"
              value={razon}
              onChange={(e) => setRazon(e.target.value)}
              placeholder="Por que se desactiva esta cuenta"
              maxLength={500}
            />
          </Field>
          {error ? (
            <Field data-invalid>
              <FieldError>{error}</FieldError>
            </Field>
          ) : null}
        </FieldGroup>
        <DialogFooter>
          <Button
            variant="ghost"
            className="rounded-md"
            onClick={() => setAbierto(false)}
            disabled={mutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            className="rounded-md"
            onClick={() => void confirmar()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Desactivando..." : "Desactivar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface PropsCuentaDetalleVista {
  cuentaId: string
}

export function CuentaDetalleVista({ cuentaId }: PropsCuentaDetalleVista) {
  const { data, isLoading, isError, error, refetch } = useCuenta(cuentaId)
  const inactiva = data?.estado === "inactivo"

  return (
    <>
      <SiteHeader
        title="Detalle de cuenta"
        breadcrumbs={[
          { title: "IAM y administración" },
          { title: "Cuentas", href: "/admin/cuentas" },
          { title: "Detalle" },
        ]}
      />
      <div className="flex flex-col gap-6 p-6">
      <Button asChild variant="ghost" size="sm" className="rounded-md -ml-2 w-fit text-muted-foreground">
        <Link href="/admin/cuentas">
          <ArrowLeft />
          Volver a cuentas
        </Link>
      </Button>

      {isLoading ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="size-10 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="space-y-3 border p-5">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        </div>
      ) : isError ? (
        <div className="border border-destructive/30 p-5 text-sm text-destructive">
          {extraerMensajeError(error, "No se pudo cargar la cuenta.")}
        </div>
      ) : data ? (
        <>
          {/* Cabecera de identidad */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar size="lg" className="rounded-md after:rounded-md">
                <AvatarFallback className="rounded-md bg-primary/10 font-medium text-primary">
                  {iniciales(data.nombreCompleto)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h1
                    className={cn(
                      "text-2xl font-semibold tracking-tight",
                      inactiva && "text-muted-foreground line-through",
                    )}
                  >
                    {data.nombreCompleto}
                  </h1>
                  <EstadoBadge estado={data.estado} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {data.nombreUsuario ? `@${data.nombreUsuario}` : "sin usuario"}
                  {" · "}
                  {data.email}
                </p>
              </div>
            </div>

            {!inactiva ? (
              <div className="flex flex-wrap items-center gap-2">
                <DialogEditarCuenta cuenta={data} onActualizado={refetch} />
                {data.estado === "activo" ? (
                  <DialogSuspender cuenta={data} onActualizado={refetch} />
                ) : null}
                {data.estado === "suspendido" ? (
                  <BotonReactivar cuenta={data} onActualizado={refetch} />
                ) : null}
                <DialogSetPassword cuenta={data} />
                <DialogResetPassword cuenta={data} />
                <DialogDesactivar cuenta={data} onActualizado={refetch} />
              </div>
            ) : null}
          </div>

          {/* Datos de la cuenta */}
          <dl className="grid grid-cols-1 gap-x-8 gap-y-4 border p-5 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <Dato etiqueta="Nombre de usuario">
              {data.nombreUsuario ? `@${data.nombreUsuario}` : "—"}
            </Dato>
            <Dato etiqueta="Tipo de cuenta">
              <span className="capitalize">{data.tipoCuenta}</span>
            </Dato>
            <Dato etiqueta="Documento de identidad">
              {data.documentoIdentidad ?? "—"}
            </Dato>
            <Dato etiqueta="Creada el">
              {new Date(data.createdAt).toLocaleString("es-PE")}
            </Dato>
            <Dato etiqueta="Ultima actualizacion">
              {new Date(data.updatedAt).toLocaleString("es-PE")}
            </Dato>
            <Dato etiqueta="ID">
              <span className="font-mono text-xs">{data.id}</span>
            </Dato>
          </dl>

          {data.socio ? <SocioAsignadoSeccion socio={data.socio} /> : null}

          <RolesAsignadosSeccion cuentaId={data.id} />

          <SesionesActivasSeccion cuentaId={data.id} />
        </>
      ) : null}
      </div>
    </>
  )
}
