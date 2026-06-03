"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  Delete02Icon,
  Edit02Icon,
} from "@hugeicons/core-free-icons"

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table"

import {
  useActualizarPermiso,
  useCrearPermiso,
  useEliminarPermiso,
  usePermisos,
} from "../ganchos/use-roles"
import type { PermisoResponse } from "../tipos/administracion.tipos"

// Debe coincidir con PermissionCode VO en el backend. Si el VO cambia, este
// regex tambien. Validacion client-side para feedback temprano — el server
// re-valida igual.
const FORMATO_CODIGO = /^[a-z][a-z0-9-]*(:[a-z][a-z0-9-]*){1,2}$/

interface PropsDialogCrearPermiso {
  onActualizado: () => unknown
}

function DialogCrearPermiso({ onActualizado }: PropsDialogCrearPermiso) {
  const [abierto, setAbierto] = useState(false)
  const [codigo, setCodigo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [modulo, setModulo] = useState("")
  const [error, setError] = useState<string | null>(null)
  const mutation = useCrearPermiso({ onSuccess: () => onActualizado() })

  function abrir(siguiente: boolean) {
    if (siguiente) {
      setCodigo("")
      setDescripcion("")
      setModulo("")
      setError(null)
    }
    setAbierto(siguiente)
  }

  async function confirmar() {
    const codigoTrim = codigo.trim()
    if (!FORMATO_CODIGO.test(codigoTrim)) {
      setError(
        "Codigo invalido. Formato: modulo:accion o modulo:recurso:accion (minusculas, digitos y guion).",
      )
      return
    }
    if (!descripcion.trim()) {
      setError("La descripcion es obligatoria.")
      return
    }
    setError(null)

    try {
      await mutation.mutateAsync({
        codigo: codigoTrim,
        descripcion: descripcion.trim(),
        modulo: modulo.trim() || undefined,
      })
      toast.success("Permiso creado")
      setAbierto(false)
    } catch (err) {
      const mensaje = extraerMensajeError(err, "No se pudo crear el permiso.")
      setError(mensaje)
      toast.error(mensaje)
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={abrir}>
      <DialogTrigger asChild>
        <Button>
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
          Nuevo permiso
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear permiso</DialogTitle>
          <DialogDescription>
            El codigo identifica al permiso y debe seguir el formato{" "}
            <code className="font-mono">modulo:recurso:accion</code> en minusculas.
            Ej: <code className="font-mono">wms:inventario:read</code>.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="codigo-permiso">Codigo</FieldLabel>
            <Input
              id="codigo-permiso"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toLowerCase())}
              placeholder="wms:inventario:read"
              maxLength={100}
              className="font-mono"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="descripcion-permiso">Descripcion</FieldLabel>
            <Input
              id="descripcion-permiso"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Permite leer el inventario del WMS"
              maxLength={500}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="modulo-permiso">
              Modulo (opcional — se infiere del codigo)
            </FieldLabel>
            <Input
              id="modulo-permiso"
              value={modulo}
              onChange={(e) => setModulo(e.target.value)}
              placeholder="wms"
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
            {mutation.isPending ? "Creando..." : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface PropsDialogEditarPermiso {
  permiso: PermisoResponse
  onActualizado: () => unknown
}

function DialogEditarPermiso({ permiso, onActualizado }: PropsDialogEditarPermiso) {
  const [abierto, setAbierto] = useState(false)
  const [descripcion, setDescripcion] = useState(permiso.descripcion)
  const [error, setError] = useState<string | null>(null)
  const mutation = useActualizarPermiso(permiso.id, {
    onSuccess: () => onActualizado(),
  })

  function abrir(siguiente: boolean) {
    if (siguiente) {
      setDescripcion(permiso.descripcion)
      setError(null)
    }
    setAbierto(siguiente)
  }

  async function confirmar() {
    if (!descripcion.trim()) {
      setError("La descripcion es obligatoria.")
      return
    }
    if (descripcion.trim() === permiso.descripcion) {
      setAbierto(false)
      return
    }
    setError(null)

    try {
      await mutation.mutateAsync({ descripcion: descripcion.trim() })
      toast.success("Permiso actualizado")
      setAbierto(false)
    } catch (err) {
      const mensaje = extraerMensajeError(err, "No se pudo actualizar.")
      setError(mensaje)
      toast.error(mensaje)
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={abrir}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Editar descripcion">
          <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar permiso</DialogTitle>
          <DialogDescription>
            Solo la descripcion es editable. El codigo y el modulo son
            inmutables — para cambiarlos hay que crear un permiso nuevo.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel>Codigo</FieldLabel>
            <Input value={permiso.codigo} readOnly className="font-mono" />
          </Field>
          <Field>
            <FieldLabel htmlFor="editar-descripcion-permiso">
              Descripcion
            </FieldLabel>
            <Input
              id="editar-descripcion-permiso"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
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

interface PropsDialogEliminarPermiso {
  permiso: PermisoResponse
  onEliminado: () => unknown
}

function DialogEliminarPermiso({
  permiso,
  onEliminado,
}: PropsDialogEliminarPermiso) {
  const [abierto, setAbierto] = useState(false)
  const [confirmacion, setConfirmacion] = useState("")
  const [error, setError] = useState<string | null>(null)
  const mutation = useEliminarPermiso({ onSuccess: () => onEliminado() })

  function abrir(siguiente: boolean) {
    if (!siguiente) {
      setConfirmacion("")
      setError(null)
    }
    setAbierto(siguiente)
  }

  async function confirmar() {
    if (confirmacion !== permiso.codigo) {
      setError(`Escribe "${permiso.codigo}" para confirmar.`)
      return
    }
    setError(null)
    try {
      await mutation.mutateAsync(permiso.id)
      toast.success("Permiso eliminado")
      setAbierto(false)
      setConfirmacion("")
    } catch (err) {
      const mensaje = extraerMensajeError(err, "No se pudo eliminar el permiso.")
      setError(mensaje)
      toast.error(mensaje)
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={abrir}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Eliminar permiso">
          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar permiso</DialogTitle>
          <DialogDescription>
            Se eliminara <code className="font-mono">{permiso.codigo}</code>{" "}
            del catalogo. Si algun rol lo tiene asignado el servidor lo
            rechazara — primero quita el permiso de los roles que lo usan.
            Escribe el codigo para confirmar.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="confirmar-eliminar-permiso">
              Escribe <code className="font-mono">{permiso.codigo}</code>{" "}
              para confirmar
            </FieldLabel>
            <Input
              id="confirmar-eliminar-permiso"
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              autoComplete="off"
              className="font-mono"
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
            disabled={mutation.isPending || confirmacion !== permiso.codigo}
          >
            {mutation.isPending ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function PermisosVista() {
  const [busqueda, setBusqueda] = useState("")
  const { data, isLoading, isError, error, refetch } = usePermisos()

  const catalogoFiltrado = useMemo(() => {
    if (!data) return []
    const q = busqueda.trim().toLowerCase()
    const lista = !q
      ? data.datos
      : data.datos.filter(
          (p) =>
            p.codigo.toLowerCase().includes(q) ||
            p.descripcion.toLowerCase().includes(q) ||
            p.modulo.toLowerCase().includes(q),
        )
    // Orden estable: por modulo y luego por codigo, asi las filas del mismo
    // modulo quedan juntas.
    return [...lista].sort(
      (a, b) =>
        (a.modulo || "otros").localeCompare(b.modulo || "otros") ||
        a.codigo.localeCompare(b.codigo),
    )
  }, [data, busqueda])

  const totalPermisos = catalogoFiltrado.length
  const totalModulos = useMemo(
    () => new Set(catalogoFiltrado.map((p) => p.modulo || "otros")).size,
    [catalogoFiltrado],
  )

  return (
    <div className="flex flex-col gap-4 p-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Catalogo de permisos</CardTitle>
              <CardDescription>
                Permisos disponibles en el sistema. Estos son los permisos que
                se asignan a los roles.
              </CardDescription>
            </div>
            <DialogCrearPermiso onActualizado={refetch} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <Input
              placeholder="Buscar por codigo, descripcion o modulo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="md:max-w-sm"
            />
            {!isLoading && !isError && totalPermisos > 0 ? (
              <p className="text-xs text-muted-foreground">
                {totalPermisos} permiso{totalPermisos === 1 ? "" : "s"} en{" "}
                {totalModulos} modulo{totalModulos === 1 ? "" : "s"}
              </p>
            ) : null}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Codigo</TableHead>
                <TableHead>Modulo</TableHead>
                <TableHead>Descripcion</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-destructive"
                  >
                    {extraerMensajeError(error, "No se pudo cargar el catalogo.")}
                  </TableCell>
                </TableRow>
              ) : totalPermisos > 0 ? (
                catalogoFiltrado.map((permiso) => (
                  <TableRow key={permiso.id}>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                        {permiso.codigo}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {permiso.modulo || "otros"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {permiso.descripcion}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <DialogEditarPermiso
                          permiso={permiso}
                          onActualizado={refetch}
                        />
                        <DialogEliminarPermiso
                          permiso={permiso}
                          onEliminado={refetch}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    {busqueda
                      ? "Ningun permiso coincide con la busqueda."
                      : "El catalogo esta vacio. Crea el primero para comenzar."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
