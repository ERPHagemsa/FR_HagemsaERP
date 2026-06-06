"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Pencil, Plus, Search, Trash2 } from "lucide-react"

import { extraerMensajeError } from "@/compartido/api"
import { Badge } from "@/compartido/componentes/ui/badge"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table"

import { PiePaginacion } from "../componentes/paginacion-tabla"
import {
  useActualizarPermiso,
  useCrearPermiso,
  useEliminarPermiso,
  usePermisos,
} from "../ganchos/use-roles"
import type {
  ListarPermisosQuery,
  PermisoResponse,
} from "../tipos/administracion.tipos"

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
        <Button className="rounded-md">
          <Plus />
          Nuevo permiso
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-md">
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
              className="rounded-md font-mono"
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
              className="rounded-md"
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
        <Button variant="ghost" size="icon-sm" title="Editar descripción" className="rounded-md">
          <Pencil />
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-md">
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
            <Input value={permiso.codigo} readOnly className="rounded-md font-mono" />
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
        <Button
          variant="ghost"
          size="icon-sm"
          title="Eliminar permiso"
          className="rounded-md text-muted-foreground hover:text-destructive"
        >
          <Trash2 />
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-md">
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
              className="rounded-md font-mono"
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
            disabled={mutation.isPending || confirmacion !== permiso.codigo}
            className="rounded-md"
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
  // `pagina` es 1-based — coincide con el paginador del backend.
  const [pagina, setPagina] = useState(1)
  const [limite, setLimite] = useState(20)

  const query = useMemo<ListarPermisosQuery>(
    () => ({ pagina, limite, busqueda: busqueda.trim() || undefined }),
    [pagina, limite, busqueda],
  )

  const { data, isLoading, isError, error, refetch } = usePermisos(query)
  const total = data?.paginacion.total ?? 0

  function cambiarBusqueda(valor: string) {
    setBusqueda(valor)
    setPagina(1)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Cabecera */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight">Permisos</h1>
            {data ? (
              <Badge variant="secondary" className="rounded-md tabular-nums">
                {total}
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            Catálogo de permisos que se asignan a los roles.
          </p>
        </div>
        <DialogCrearPermiso onActualizado={refetch} />
      </div>

      {/* Busqueda */}
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por código, descripción o módulo…"
          value={busqueda}
          onChange={(e) => cambiarBusqueda(e.target.value)}
          className="rounded-md pl-9"
        />
      </div>

      {/* Tabla */}
      <div className="overflow-hidden border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Código</TableHead>
                <TableHead>Módulo</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="w-20 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-transparent [&>td]:py-1.5">
                    <TableCell>
                      <Skeleton className="h-4 w-40 rounded-md" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16 rounded-md" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-56 rounded-md" />
                    </TableCell>
                    <TableCell />
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={4}
                    className="py-12 text-center text-sm text-destructive"
                  >
                    {extraerMensajeError(error, "No se pudo cargar el catálogo.")}
                  </TableCell>
                </TableRow>
              ) : data && data.datos.length > 0 ? (
                data.datos.map((permiso) => (
                  <TableRow key={permiso.id} className="[&>td]:py-1.5">
                    <TableCell>
                      <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs">
                        {permiso.codigo}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-md font-normal">
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
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={4}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    {busqueda
                      ? "Ningún permiso coincide con la búsqueda."
                      : "El catálogo está vacío. Crea el primero para comenzar."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {data && total > 0 ? (
          <PiePaginacion
            pagina={pagina}
            limite={limite}
            total={total}
            onPagina={setPagina}
            onLimite={(l) => {
              setLimite(l)
              setPagina(1)
            }}
          />
        ) : null}
      </div>
    </div>
  )
}
