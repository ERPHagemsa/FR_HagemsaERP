"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"

import { extraerMensajeError } from "@/compartido/api"
import { Button } from "@/compartido/componentes/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/compartido/componentes/ui/field"
import { Checkbox } from "@/compartido/componentes/ui/checkbox"
import { Input } from "@/compartido/componentes/ui/input"

import { useCrearRol } from "../ganchos/use-roles"

export function CrearRolVista() {
  const router = useRouter()
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [esSistema, setEsSistema] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const crearMutation = useCrearRol()

  async function manejarSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    try {
      const respuesta = await crearMutation.mutateAsync({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        esSistema,
      })
      toast.success("Rol creado correctamente")
      router.push(`/admin/roles/${respuesta.id}`)
    } catch (err) {
      const mensaje = extraerMensajeError(err, "No se pudo crear el rol.")
      setError(mensaje)
      toast.error(mensaje)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="rounded-md -ml-2 w-fit text-muted-foreground"
      >
        <Link href="/admin/roles">
          <ArrowLeft />
          Volver a roles
        </Link>
      </Button>

      <div className="max-w-2xl space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Nuevo rol</h1>
          <p className="text-sm text-muted-foreground">
            Crea un nuevo rol. Después podrás asignarle permisos del catálogo.
          </p>
        </div>

        <form onSubmit={(event) => void manejarSubmit(event)}>
          <div className="border p-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="nombre">Nombre</FieldLabel>
                <Input
                  id="nombre"
                  className="rounded-md"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="ALMACENERO_LIMA"
                  required
                  maxLength={50}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="descripcion">Descripción</FieldLabel>
                <Input
                  id="descripcion"
                  className="rounded-md"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Quién hace qué con este rol"
                  required
                  maxLength={500}
                />
              </Field>
              <Field>
                <label className="flex cursor-pointer items-start gap-2">
                  <Checkbox
                    checked={esSistema}
                    onCheckedChange={(v) => setEsSistema(v === true)}
                    className="mt-0.5"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">
                      Rol de sistema (protegido)
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      Un rol de sistema no se puede renombrar ni eliminar después
                      de crearlo; solo se ajustan sus permisos. Déjalo sin marcar
                      para un rol normal.
                    </span>
                  </span>
                </label>
              </Field>
              {error ? (
                <Field data-invalid>
                  <FieldError>{error}</FieldError>
                </Field>
              ) : null}
            </FieldGroup>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button asChild variant="ghost" type="button" className="rounded-md">
              <Link href="/admin/roles">Cancelar</Link>
            </Button>
            <Button type="submit" className="rounded-md" disabled={crearMutation.isPending}>
              {crearMutation.isPending ? "Creando..." : "Crear rol"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
