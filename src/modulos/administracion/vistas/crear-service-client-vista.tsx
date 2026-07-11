"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, Copy, KeyRound } from "lucide-react"

import { SiteHeader } from "@/compartido/componentes/site-header"
import { extraerMensajeError } from "@/compartido/api"
import { Button } from "@/compartido/componentes/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/compartido/componentes/ui/field"
import { Input } from "@/compartido/componentes/ui/input"
import { Textarea } from "@/compartido/componentes/ui/textarea"

import { RolesChecklist } from "../componentes/roles-checklist"
import { useCrearServiceClient } from "../ganchos/use-service-clients"

const FORMATO_CLIENT_ID = /^[a-z][a-z0-9-]{2,49}$/

interface SecretCreado {
  id: string
  clientId: string
  secret: string
}

// Panel que muestra el secret UNA sola vez tras crear el cliente.
function SecretGenerado({ creado }: { creado: SecretCreado }) {
  const router = useRouter()

  async function copiar() {
    await navigator.clipboard.writeText(creado.secret)
    toast.success("Secret copiado al portapapeles")
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <KeyRound className="size-5 text-emerald-600" />
          <h2 className="text-lg font-semibold">
            Cliente <span className="font-mono">{creado.clientId}</span> creado
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Copiá el secret ahora: se muestra <strong>una única vez</strong> y no se
          puede recuperar. Guardalo en el Secret Manager del backend que lo va a usar.
        </p>
      </div>

      <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-4">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Client secret
        </p>
        <div className="flex gap-2">
          <Input value={creado.secret} readOnly className="rounded-md font-mono" />
          <Button
            variant="outline"
            size="icon"
            className="rounded-md"
            onClick={() => void copiar()}
          >
            <Copy />
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          className="rounded-md"
          onClick={() => router.push(`/admin/service-clients/${creado.id}`)}
        >
          Ir al cliente
        </Button>
        <Button
          variant="outline"
          className="rounded-md"
          onClick={() => router.push("/admin/service-clients")}
        >
          Volver a la lista
        </Button>
      </div>
    </div>
  )
}

export function CrearServiceClientVista() {
  const [clientId, setClientId] = useState("")
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [roles, setRoles] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [creado, setCreado] = useState<SecretCreado | null>(null)

  const mutation = useCrearServiceClient({
    onSuccess: (data) =>
      setCreado({ id: data.id, clientId: data.clientId, secret: data.secret }),
  })

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault()
    const id = clientId.trim()
    const nombreTrim = nombre.trim()

    if (!FORMATO_CLIENT_ID.test(id)) {
      setError(
        "El clientId debe empezar con minúscula y tener 3-50 caracteres (a-z, 0-9, guiones). Ej: svc-flota",
      )
      return
    }
    if (!nombreTrim) {
      setError("El nombre es obligatorio.")
      return
    }
    setError(null)

    try {
      await mutation.mutateAsync({
        clientId: id,
        nombre: nombreTrim,
        descripcion: descripcion.trim() || undefined,
        roles: roles.map((rolId) => ({ rolId, scope: {} })),
      })
      toast.success("Cliente de servicio creado")
    } catch (err) {
      const mensaje = extraerMensajeError(err, "No se pudo crear el cliente.")
      setError(mensaje)
      toast.error(mensaje)
    }
  }

  return (
    <>
      <SiteHeader
        title="Nuevo cliente de servicio"
        breadcrumbs={[
          { title: "IAM y administración" },
          { title: "Clientes de servicio", href: "/admin/service-clients" },
          { title: "Nuevo" },
        ]}
      />
      <div className="flex flex-col gap-6 p-6">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="-ml-2 w-fit rounded-md text-muted-foreground"
        >
          <Link href="/admin/service-clients">
            <ArrowLeft />
            Volver a clientes de servicio
          </Link>
        </Button>

        {creado ? (
          <SecretGenerado creado={creado} />
        ) : (
          <form onSubmit={manejarSubmit} className="mx-auto w-full max-w-2xl">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="clientId">Client ID</FieldLabel>
                <Input
                  id="clientId"
                  className="rounded-md font-mono"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="svc-flota"
                  maxLength={50}
                  autoComplete="off"
                />
                <FieldDescription>
                  Identificador único. Minúsculas, números y guiones (3-50). No se
                  puede cambiar después.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="nombre">Nombre</FieldLabel>
                <Input
                  id="nombre"
                  className="rounded-md"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Servicio de Flota"
                  maxLength={255}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="descripcion">Descripción (opcional)</FieldLabel>
                <Textarea
                  id="descripcion"
                  className="rounded-md"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Para qué se usa este cliente"
                  rows={2}
                />
              </Field>

              <Field>
                <FieldLabel>Roles</FieldLabel>
                <FieldDescription>
                  Los permisos de estos roles viajan embebidos en el token del
                  cliente. Asigná solo lo necesario (least privilege). Se asignan con
                  scope global.
                </FieldDescription>
                <RolesChecklist
                  seleccionados={roles}
                  onChange={setRoles}
                  disabled={mutation.isPending}
                />
              </Field>

              {error ? (
                <Field data-invalid>
                  <FieldError>{error}</FieldError>
                </Field>
              ) : null}

              <div className="flex gap-2">
                <Button type="submit" className="rounded-md" disabled={mutation.isPending}>
                  {mutation.isPending ? "Creando..." : "Crear cliente"}
                </Button>
                <Button
                  asChild
                  type="button"
                  variant="ghost"
                  className="rounded-md"
                  disabled={mutation.isPending}
                >
                  <Link href="/admin/service-clients">Cancelar</Link>
                </Button>
              </div>
            </FieldGroup>
          </form>
        )}
      </div>
    </>
  )
}
