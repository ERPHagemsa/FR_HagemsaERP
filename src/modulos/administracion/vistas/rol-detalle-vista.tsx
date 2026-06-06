"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, Pencil, ShieldCheck, Trash2, X } from "lucide-react"

import { extraerMensajeError } from "@/compartido/api"
import { Badge } from "@/compartido/componentes/ui/badge"
import { Button } from "@/compartido/componentes/ui/button"
import { Checkbox } from "@/compartido/componentes/ui/checkbox"
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

import {
  useActualizarRol,
  useEditarPermisosRol,
  useEliminarRol,
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

function agruparPermisosPorModulo(
  permisos: ReadonlyArray<PermisoResponse>,
): Record<string, PermisoResponse[]> {
  const grupos: Record<string, PermisoResponse[]> = {}
  for (const permiso of permisos) {
    const modulo = permiso.modulo || "otros"
    if (!grupos[modulo]) grupos[modulo] = []
    grupos[modulo].push(permiso)
  }
  return grupos
}

interface PropsDialogEditarPermisosRol {
  rol: RolResponse
  catalogo: ReadonlyArray<PermisoResponse>
  onActualizado: () => unknown
}

// Editor bulk: muestra todo el catalogo agrupado por modulo, con checkboxes
// pre-marcados para los permisos que el rol ya tiene. Al guardar, el hook
// calcula el diff y dispara add/remove por cada cambio.
function DialogEditarPermisosRol({
  rol,
  catalogo,
  onActualizado,
}: PropsDialogEditarPermisosRol) {
  const [abierto, setAbierto] = useState(false)
  const [seleccionados, setSeleccionados] = useState<Set<string>>(
    () => new Set(rol.permisos),
  )
  const [busqueda, setBusqueda] = useState("")
  const mutation = useEditarPermisosRol(rol.id, rol.permisos, {
    onSuccess: () => onActualizado(),
  })

  // Re-sembramos cuando el dialog abre — asi capturamos cambios externos.
  function abrir(siguiente: boolean) {
    if (siguiente) {
      setSeleccionados(new Set(rol.permisos))
      setBusqueda("")
    }
    setAbierto(siguiente)
  }

  const catalogoFiltrado = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return catalogo
    return catalogo.filter(
      (p) =>
        p.codigo.toLowerCase().includes(q) ||
        p.descripcion.toLowerCase().includes(q) ||
        p.modulo.toLowerCase().includes(q),
    )
  }, [catalogo, busqueda])

  const grupos = useMemo(
    () => agruparPermisosPorModulo(catalogoFiltrado),
    [catalogoFiltrado],
  )

  const { cantidadAgregar, cantidadQuitar } = useMemo(() => {
    const setActual = new Set(rol.permisos)
    let agregar = 0
    let quitar = 0
    for (const codigo of seleccionados) {
      if (!setActual.has(codigo)) agregar++
    }
    for (const codigo of rol.permisos) {
      if (!seleccionados.has(codigo)) quitar++
    }
    return { cantidadAgregar: agregar, cantidadQuitar: quitar }
  }, [rol.permisos, seleccionados])

  const sinCambios = cantidadAgregar === 0 && cantidadQuitar === 0

  function alternar(codigo: string) {
    setSeleccionados((actual) => {
      const siguiente = new Set(actual)
      if (siguiente.has(codigo)) siguiente.delete(codigo)
      else siguiente.add(codigo)
      return siguiente
    })
  }

  function alternarModulo(modulo: string, codigosDelModulo: string[]) {
    setSeleccionados((actual) => {
      const siguiente = new Set(actual)
      const todosSeleccionados = codigosDelModulo.every((c) =>
        siguiente.has(c),
      )
      if (todosSeleccionados) {
        for (const c of codigosDelModulo) siguiente.delete(c)
      } else {
        for (const c of codigosDelModulo) siguiente.add(c)
      }
      return siguiente
    })
  }

  async function guardar() {
    try {
      const resultado = await mutation.mutateAsync([...seleccionados])
      const totalFallos =
        resultado.fallaronAgregar.length + resultado.fallaronRemover.length
      if (totalFallos === 0) {
        toast.success("Permisos actualizados")
        setAbierto(false)
      } else {
        toast.error(
          `Se aplicaron ${resultado.agregados.length + resultado.removidos.length} cambios, ${totalFallos} fallaron`,
        )
        // No cerramos para que el admin vea lo que quedo pendiente tras el refetch.
      }
    } catch (err) {
      toast.error(extraerMensajeError(err, "No se pudieron guardar los cambios."))
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={abrir}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-md">
          <Pencil />
          Editar permisos
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-md max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar permisos del rol</DialogTitle>
          <DialogDescription>
            Marca o desmarca permisos del catalogo. Al guardar se aplican
            todos los cambios.
          </DialogDescription>
        </DialogHeader>

        <Input
          placeholder="Buscar por codigo, descripcion o modulo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="rounded-md"
        />

        <div className="max-h-[50vh] space-y-4 overflow-y-auto pr-1">
          {Object.keys(grupos).length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No hay permisos que coincidan con la busqueda.
            </p>
          ) : (
            Object.entries(grupos).map(([modulo, permisos]) => {
              const codigosDelModulo = permisos.map((p) => p.codigo)
              const todosSeleccionados = codigosDelModulo.every((c) =>
                seleccionados.has(c),
              )
              const algunoSeleccionado = codigosDelModulo.some((c) =>
                seleccionados.has(c),
              )
              return (
                <div key={modulo} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {modulo}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-md h-6 text-xs"
                      onClick={() => alternarModulo(modulo, codigosDelModulo)}
                    >
                      {todosSeleccionados
                        ? "Desmarcar todos"
                        : algunoSeleccionado
                          ? "Marcar todos"
                          : "Marcar todos"}
                    </Button>
                  </div>
                  <div className="space-y-1.5 rounded-md border p-2">
                    {permisos.map((permiso) => {
                      const checked = seleccionados.has(permiso.codigo)
                      return (
                        <label
                          key={permiso.id}
                          className="flex cursor-pointer items-start gap-2 rounded-md px-1 py-1 hover:bg-muted/60"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => alternar(permiso.codigo)}
                            className="mt-0.5"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-mono text-xs">
                              {permiso.codigo}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {permiso.descripcion}
                            </p>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>

        <DialogFooter className="flex-row items-center justify-between gap-3 sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {sinCambios
              ? "Sin cambios pendientes"
              : `Pendiente: +${cantidadAgregar} / -${cantidadQuitar}`}
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setAbierto(false)}
              disabled={mutation.isPending}
              className="rounded-md"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => void guardar()}
              disabled={mutation.isPending || sinCambios}
              className="rounded-md"
            >
              {mutation.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
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
    <Badge variant="outline" className="rounded-md gap-1 pr-1 font-mono">
      {codigo}
      <button
        type="button"
        onClick={() => void revocar()}
        disabled={mutation.isPending}
        className="ml-1 inline-flex size-4 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/15 hover:text-destructive disabled:opacity-50"
        aria-label={`Revocar ${codigo}`}
      >
        <X className="size-3" />
      </button>
    </Badge>
  )
}

interface PropsDialogEditarRol {
  rol: RolResponse
  onActualizado: () => unknown
}

function DialogEditarRol({ rol, onActualizado }: PropsDialogEditarRol) {
  const [abierto, setAbierto] = useState(false)
  const [nombre, setNombre] = useState(rol.nombre)
  const [descripcion, setDescripcion] = useState(rol.descripcion)
  const [error, setError] = useState<string | null>(null)
  const mutation = useActualizarRol(rol.id, { onSuccess: onActualizado })

  function abrir(siguiente: boolean) {
    if (siguiente) {
      setNombre(rol.nombre)
      setDescripcion(rol.descripcion)
      setError(null)
    }
    setAbierto(siguiente)
  }

  async function confirmar() {
    const nombreTrim = nombre.trim()
    const descripcionTrim = descripcion.trim()

    if (!nombreTrim) {
      setError("El nombre es obligatorio.")
      return
    }
    setError(null)

    const cambios: { nombre?: string; descripcion?: string } = {}
    if (nombreTrim !== rol.nombre) cambios.nombre = nombreTrim
    if (descripcionTrim !== rol.descripcion) cambios.descripcion = descripcionTrim

    if (Object.keys(cambios).length === 0) {
      setAbierto(false)
      return
    }

    try {
      await mutation.mutateAsync(cambios)
      toast.success("Rol actualizado")
      setAbierto(false)
    } catch (err) {
      const mensaje = extraerMensajeError(err, "No se pudo actualizar el rol.")
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
          <DialogTitle>Editar rol</DialogTitle>
          <DialogDescription>
            Cambia el nombre o la descripcion. El nombre debe estar en
            UPPER_SNAKE_CASE (ej. SUPERVISOR_ALMACEN).
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="nombre-editar-rol">Nombre</FieldLabel>
            <Input
              id="nombre-editar-rol"
              value={nombre}
              onChange={(e) => setNombre(e.target.value.toUpperCase())}
              maxLength={50}
              className="rounded-md font-mono"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="descripcion-editar-rol">Descripcion</FieldLabel>
            <Input
              id="descripcion-editar-rol"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              maxLength={500}
              className="rounded-md"
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
            className="rounded-md"
          >
            Cancelar
          </Button>
          <Button
            onClick={() => void confirmar()}
            disabled={mutation.isPending}
            className="rounded-md"
          >
            {mutation.isPending ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface PropsDialogEliminarRol {
  rol: RolResponse
  onEliminado: () => unknown
}

function DialogEliminarRol({ rol, onEliminado }: PropsDialogEliminarRol) {
  const [abierto, setAbierto] = useState(false)
  const [confirmacion, setConfirmacion] = useState("")
  const [error, setError] = useState<string | null>(null)
  const mutation = useEliminarRol({ onSuccess: onEliminado })

  async function confirmar() {
    if (confirmacion !== rol.nombre) {
      setError(`Escribe "${rol.nombre}" para confirmar.`)
      return
    }
    setError(null)
    try {
      await mutation.mutateAsync(rol.id)
      toast.success("Rol eliminado")
      setAbierto(false)
      setConfirmacion("")
    } catch (err) {
      const mensaje = extraerMensajeError(err, "No se pudo eliminar el rol.")
      setError(mensaje)
      toast.error(mensaje)
    }
  }

  return (
    <Dialog
      open={abierto}
      onOpenChange={(v) => {
        setAbierto(v)
        if (!v) {
          setConfirmacion("")
          setError(null)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-md text-destructive hover:text-destructive"
        >
          <Trash2 />
          Eliminar
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-md">
        <DialogHeader>
          <DialogTitle>Eliminar rol</DialogTitle>
          <DialogDescription>
            Esta accion es permanente. Si el rol esta asignado a alguna cuenta
            (activa o historica) el servidor lo va a rechazar — primero revoca
            las asignaciones. Escribe el nombre del rol para confirmar.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="confirmar-eliminar-rol">
              Escribe <code className="font-mono">{rol.nombre}</code> para confirmar
            </FieldLabel>
            <Input
              id="confirmar-eliminar-rol"
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              autoComplete="off"
              className="rounded-md"
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
            className="rounded-md"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => void confirmar()}
            disabled={mutation.isPending || confirmacion !== rol.nombre}
            className="rounded-md"
          >
            {mutation.isPending ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function RolDetalleVista({ rolId }: PropsRolDetalleVista) {
  const router = useRouter()
  const { data, isLoading, isError, error, refetch } = useRol(rolId)
  const permisosCatalogo = usePermisos()

  const gruposPermisos = useMemo(
    () => (data ? agruparPermisos(data.permisos) : {}),
    [data],
  )

  function volverAListado() {
    router.push("/admin/roles")
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

      {isLoading ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="size-10 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="rounded-md h-6 w-48" />
              <Skeleton className="rounded-md h-4 w-64" />
            </div>
          </div>
          <div className="space-y-3 border p-5">
            <Skeleton className="rounded-md h-5 w-full" />
            <Skeleton className="rounded-md h-5 w-3/4" />
          </div>
        </div>
      ) : isError ? (
        <div className="border border-destructive/30 p-5 text-sm text-destructive">
          {extraerMensajeError(error, "No se pudo cargar el rol.")}
        </div>
      ) : data ? (
        <>
          {/* Cabecera de identidad */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <ShieldCheck className="size-5" />
              </span>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h1 className="font-mono text-2xl font-semibold tracking-tight">
                    {data.nombre}
                  </h1>
                  <Badge
                    variant={data.esSistema ? "secondary" : "outline"}
                    className="rounded-md font-normal"
                  >
                    {data.esSistema ? "Sistema" : "Custom"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {data.descripcion}
                </p>
              </div>
            </div>

            {!data.esSistema ? (
              <div className="flex flex-wrap items-center gap-2">
                <DialogEditarRol rol={data} onActualizado={refetch} />
                <DialogEliminarRol rol={data} onEliminado={volverAListado} />
              </div>
            ) : null}
          </div>

          {/* Datos del rol */}
          <dl className="grid grid-cols-1 gap-x-8 gap-y-4 border p-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground">Permisos</dt>
              <dd className="mt-0.5 tabular-nums">{data.permisos.length}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Creado el</dt>
              <dd className="mt-0.5">
                {new Date(data.createdAt).toLocaleString("es-PE")}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                Última actualización
              </dt>
              <dd className="mt-0.5">
                {new Date(data.updatedAt).toLocaleString("es-PE")}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">ID</dt>
              <dd className="mt-0.5 font-mono text-xs">{data.id}</dd>
            </div>
          </dl>

          {/* Permisos asignados */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold">Permisos asignados</h2>
                <p className="text-xs text-muted-foreground">
                  {data.esSistema
                    ? "Rol de sistema — nombre y descripción son inmutables, pero podés ajustar sus permisos."
                    : "Editar masivamente o quitar uno a uno con la X."}
                </p>
              </div>
              {permisosCatalogo.data ? (
                <DialogEditarPermisosRol
                  rol={data}
                  catalogo={permisosCatalogo.data.datos}
                  onActualizado={refetch}
                />
              ) : null}
            </div>

            {data.permisos.length === 0 ? (
              <div className="border border-dashed p-8 text-center text-sm text-muted-foreground">
                Este rol no tiene permisos asignados todavía.
              </div>
            ) : (
              <div className="space-y-4 border p-5">
                {Object.entries(gruposPermisos).map(([modulo, permisos]) => (
                  <div key={modulo}>
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {modulo}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {permisos.map((codigo) => (
                        <BadgePermisoRevocable
                          key={codigo}
                          codigo={codigo}
                          rolId={data.id}
                          onActualizado={refetch}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}
