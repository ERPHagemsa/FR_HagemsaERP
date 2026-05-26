"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  Add01Icon,
  ArrowLeft01Icon,
  Cancel01Icon,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select"
import { Skeleton } from "@/compartido/componentes/ui/skeleton"

import {
  useAgregarPermisoARol,
  usePermisos,
  useRevocarPermisoDeRol,
  useRol,
} from "../ganchos/use-roles"
import type {
  PermisoResponse,
  RolResponse,
} from "../tipos/administracion.tipos"

interface PropsRolDetalleVista {
  rolId: string
}

function agruparPermisos(
  permisos: ReadonlyArray<string>,
): Record<string, string[]> {
  const grupos: Record<string, string[]> = {}
  for (const codigo of permisos) {
    const partes = codigo.split(":")
    const modulo = partes[0] ?? "otros"
    if (!grupos[modulo]) grupos[modulo] = []
    grupos[modulo].push(codigo)
  }
  return grupos
}

interface PropsDialogAgregarPermiso {
  rol: RolResponse
  catalogo: ReadonlyArray<PermisoResponse>
  onActualizado: () => unknown
}

function DialogAgregarPermiso({
  rol,
  catalogo,
  onActualizado,
}: PropsDialogAgregarPermiso) {
  const [abierto, setAbierto] = useState(false)
  const [codigoPermiso, setCodigoPermiso] = useState("")
  const [error, setError] = useState<string | null>(null)
  const mutation = useAgregarPermisoARol(rol.id, { onSuccess: onActualizado })

  const disponibles = useMemo(
    () => catalogo.filter((p) => !rol.permisos.includes(p.codigo)),
    [catalogo, rol.permisos],
  )

  function resetear() {
    setCodigoPermiso("")
    setError(null)
  }

  async function confirmar() {
    if (!codigoPermiso) {
      setError("Selecciona un permiso.")
      return
    }
    setError(null)

    try {
      await mutation.mutateAsync({ codigoPermiso })
      toast.success("Permiso agregado al rol")
      setAbierto(false)
      resetear()
    } catch (err) {
      const mensaje = extraerMensajeError(err, "No se pudo agregar el permiso.")
      setError(mensaje)
      toast.error(mensaje)
    }
  }

  return (
    <Dialog
      open={abierto}
      onOpenChange={(v) => {
        setAbierto(v)
        if (!v) resetear()
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
          Agregar permiso
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar permiso al rol</DialogTitle>
          <DialogDescription>
            Selecciona un permiso del catalogo. Solo aparecen los que aun no
            estan asignados al rol.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="codigoPermiso">Permiso</FieldLabel>
            <Select value={codigoPermiso} onValueChange={setCodigoPermiso}>
              <SelectTrigger id="codigoPermiso">
                <SelectValue placeholder="Selecciona un permiso..." />
              </SelectTrigger>
              <SelectContent>
                {disponibles.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Este rol ya tiene todos los permisos del catalogo.
                  </div>
                ) : (
                  disponibles.map((permiso) => (
                    <SelectItem key={permiso.id} value={permiso.codigo}>
                      <span className="font-mono">{permiso.codigo}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {permiso.descripcion}
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
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
            disabled={mutation.isPending || disponibles.length === 0}
          >
            {mutation.isPending ? "Agregando..." : "Agregar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface PropsBadgePermisoRevocable {
  codigo: string
  rolId: string
  onActualizado: () => unknown
}

function BadgePermisoRevocable({
  codigo,
  rolId,
  onActualizado,
}: PropsBadgePermisoRevocable) {
  const mutation = useRevocarPermisoDeRol(rolId, { onSuccess: onActualizado })

  async function revocar() {
    if (!confirm(`Revocar el permiso "${codigo}" del rol?`)) return

    try {
      await mutation.mutateAsync(codigo)
      toast.success("Permiso revocado")
    } catch (err) {
      toast.error(extraerMensajeError(err, "No se pudo revocar el permiso."))
    }
  }

  return (
    <Badge variant="outline" className="gap-1 pr-1 font-mono">
      {codigo}
      <button
        type="button"
        onClick={() => void revocar()}
        disabled={mutation.isPending}
        className="ml-1 inline-flex size-4 items-center justify-center rounded-sm text-muted-foreground hover:bg-destructive/15 hover:text-destructive disabled:opacity-50"
        aria-label={`Revocar ${codigo}`}
      >
        <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3" />
      </button>
    </Badge>
  )
}

export function RolDetalleVista({ rolId }: PropsRolDetalleVista) {
  const { data, isLoading, isError, error, refetch } = useRol(rolId)
  const permisosCatalogo = usePermisos()

  const gruposPermisos = useMemo(
    () => (data ? agruparPermisos(data.permisos) : {}),
    [data],
  )

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

      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
          </CardContent>
        </Card>
      ) : isError ? (
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              {extraerMensajeError(error, "No se pudo cargar el rol.")}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : data ? (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>{data.nombre}</CardTitle>
                <CardDescription>{data.descripcion}</CardDescription>
              </div>
              <Badge variant={data.esSistema ? "secondary" : "outline"}>
                {data.esSistema ? "Sistema" : "Custom"}
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
                  Cantidad de permisos
                </dt>
                <dd>{data.permisos.length}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Creado</dt>
                <dd>{new Date(data.createdAt).toLocaleString("es-PE")}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">
                  Ultima actualizacion
                </dt>
                <dd>{new Date(data.updatedAt).toLocaleString("es-PE")}</dd>
              </div>
            </dl>

            <div className="space-y-3 border-t pt-6">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold">Permisos asignados</h3>
                  <p className="text-xs text-muted-foreground">
                    {data.esSistema
                      ? "Los roles de sistema no se pueden modificar."
                      : "Agrega o quita permisos del catalogo."}
                  </p>
                </div>
                {!data.esSistema && permisosCatalogo.data ? (
                  <DialogAgregarPermiso
                    rol={data}
                    catalogo={permisosCatalogo.data.items}
                    onActualizado={refetch}
                  />
                ) : null}
              </div>

              {data.permisos.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Este rol no tiene permisos asignados todavia.
                </p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(gruposPermisos).map(([modulo, permisos]) => (
                    <div key={modulo}>
                      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {modulo}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {permisos.map((codigo) =>
                          data.esSistema ? (
                            <Badge
                              key={codigo}
                              variant="outline"
                              className="font-mono"
                            >
                              {codigo}
                            </Badge>
                          ) : (
                            <BadgePermisoRevocable
                              key={codigo}
                              codigo={codigo}
                              rolId={data.id}
                              onActualizado={refetch}
                            />
                          ),
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
