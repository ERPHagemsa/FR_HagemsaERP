"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  ArrowLeft01Icon,
  Copy01Icon,
  Delete02Icon,
  Edit02Icon,
  Key01Icon,
  PlayIcon,
  StopCircleIcon,
  UserBlock01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { extraerMensajeError } from "@/compartido/api"
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

import { RolesAsignadosSeccion } from "../componentes/roles-asignados-seccion"
import { SesionesActivasSeccion } from "../componentes/sesiones-activas-seccion"
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

function variantePorEstado(
  estado: EstadoCuenta,
): "default" | "secondary" | "destructive" | "outline" {
  switch (estado) {
    case "activo":
      return "default"
    case "suspendido":
      return "destructive"
    case "inactivo":
      return "secondary"
    default:
      return "outline"
  }
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
        <Button variant="destructive">
          <HugeiconsIcon icon={UserBlock01Icon} strokeWidth={2} />
          Suspender
        </Button>
      </DialogTrigger>
      <DialogContent>
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
            onClick={() => setAbierto(false)}
            disabled={mutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
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
    <Button onClick={() => void confirmar()} disabled={mutation.isPending}>
      <HugeiconsIcon icon={PlayIcon} strokeWidth={2} />
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
        <Button variant="outline">
          <HugeiconsIcon icon={Key01Icon} strokeWidth={2} />
          Cambiar password
        </Button>
      </DialogTrigger>
      <DialogContent>
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
            onClick={() => setAbierto(false)}
            disabled={mutation.isPending}
          >
            Cancelar
          </Button>
          <Button
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
        <Button variant="outline">
          <HugeiconsIcon icon={StopCircleIcon} strokeWidth={2} />
          Reset password
        </Button>
      </DialogTrigger>
      <DialogContent>
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
                <Input value={passwordTemporal} readOnly className="font-mono" />
                <Button variant="outline" size="icon" onClick={() => void copiar()}>
                  <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} />
                </Button>
              </div>
            </Field>
          </FieldGroup>
        ) : null}
        <DialogFooter>
          {passwordTemporal ? (
            <Button onClick={() => cerrar(false)}>Cerrar</Button>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => cerrar(false)}
                disabled={mutation.isPending}
              >
                Cancelar
              </Button>
              <Button
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
        <Button variant="outline">
          <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent>
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
            onClick={() => setAbierto(false)}
            disabled={mutation.isPending}
          >
            Cancelar
          </Button>
          <Button
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
        <Button variant="destructive">
          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
          Desactivar
        </Button>
      </DialogTrigger>
      <DialogContent>
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
            onClick={() => setAbierto(false)}
            disabled={mutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
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

      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
          </CardContent>
        </Card>
      ) : isError ? (
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              {extraerMensajeError(error, "No se pudo cargar la cuenta.")}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : data ? (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>{data.nombreCompleto}</CardTitle>
                <CardDescription>{data.email}</CardDescription>
              </div>
              <Badge variant={variantePorEstado(data.estado)}>
                {data.estado}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm md:grid-cols-2">
              <div>
                <dt className="font-medium text-muted-foreground">ID</dt>
                <dd className="font-mono text-xs">{data.id}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">
                  Tipo de cuenta
                </dt>
                <dd className="capitalize">{data.tipoCuenta}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">
                  Documento de identidad
                </dt>
                <dd>{data.documentoIdentidad ?? "—"}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">
                  Creada el
                </dt>
                <dd>{new Date(data.createdAt).toLocaleString("es-PE")}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">
                  Ultima actualizacion
                </dt>
                <dd>{new Date(data.updatedAt).toLocaleString("es-PE")}</dd>
              </div>
            </dl>

            {data.estado !== "inactivo" ? (
              <div className="flex flex-wrap items-center gap-2 border-t pt-4">
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

            <RolesAsignadosSeccion cuentaId={data.id} />

            <SesionesActivasSeccion cuentaId={data.id} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
