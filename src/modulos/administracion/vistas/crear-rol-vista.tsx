"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

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
    <div className="flex flex-col gap-4 p-6">
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/roles">
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
            Volver a roles
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nuevo rol</CardTitle>
          <CardDescription>
            Crea un nuevo rol. Despues podras asignarle permisos del catalogo.
          </CardDescription>
        </CardHeader>
        <form onSubmit={(event) => void manejarSubmit(event)}>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="nombre">Nombre</FieldLabel>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="ALMACENERO_LIMA"
                  required
                  maxLength={50}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="descripcion">Descripcion</FieldLabel>
                <Input
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Quien hace que con este rol"
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
                      Un rol de sistema no se puede renombrar ni eliminar despues
                      de crearlo; solo se ajustan sus permisos. Dejalo sin marcar
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
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button asChild variant="ghost" type="button">
              <Link href="/admin/roles">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={crearMutation.isPending}>
              {crearMutation.isPending ? "Creando..." : "Crear rol"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
