"use client"

import { type FormEvent, useState } from "react"
import { MoreHorizontal, Pencil, Plus, Power, PowerOff, Search } from "lucide-react"

import { extraerMensajeError } from "@/compartido/api/formato-error"
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/compartido/componentes/ui/alert-dialog"
import { Badge } from "@/compartido/componentes/ui/badge"
import { Button } from "@/compartido/componentes/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/compartido/componentes/ui/dropdown-menu"
import { Input } from "@/compartido/componentes/ui/input"
import { Label } from "@/compartido/componentes/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select"
import { Skeleton } from "@/compartido/componentes/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table"
import { Textarea } from "@/compartido/componentes/ui/textarea"
import { PiePaginacion } from "@/modulos/administracion/componentes/paginacion-tabla"
import type {
  CatalogoCargoAdicional,
  EstadoCatalogoCargoAdicional,
  FiltrosCatalogosCargoAdicional,
} from "@/modulos/comercial/cotizaciones/tipos/cotizaciones.tipos"

import {
  useActualizarCatalogoCargoAdicionalMutation,
  useCambiarEstadoCatalogoCargoAdicionalMutation,
  useCatalogosCargoAdicionalQuery,
  useCrearCatalogoCargoAdicionalMutation,
} from "../servicios/catalogos-cargo-adicional-queries"

// ---------------------------------------------------------------------------
// Dialog — Crear
// ---------------------------------------------------------------------------

function DialogCrear({
  abierto,
  onCerrar,
  onCreado,
}: {
  abierto: boolean
  onCerrar: () => void
  onCreado: () => void
}) {
  const [errorCrear, setErrorCrear] = useState<string | null>(null)

  const crear = useCrearCatalogoCargoAdicionalMutation({
    onSuccess: () => {
      setErrorCrear(null)
      onCreado()
      onCerrar()
    },
    onError: (err) => {
      setErrorCrear(extraerMensajeError(err))
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const nombre = String(formData.get("nombre") ?? "").trim()
    const descripcion = String(formData.get("descripcion") ?? "").trim()

    setErrorCrear(null)
    crear.mutate({ nombre, descripcion: descripcion || undefined })
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setErrorCrear(null)
      onCerrar()
    }
  }

  return (
    <AlertDialog open={abierto} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <form onSubmit={(e) => void handleSubmit(e)}>
          <AlertDialogHeader>
            <AlertDialogTitle>Nuevo cargo adicional</AlertDialogTitle>
            <AlertDialogDescription>
              Ingresa el nombre y la descripcion opcional del cargo adicional.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {errorCrear ? (
            <div className="py-2">
              <Alert variant="destructive">
                <AlertTitle>No se pudo crear el cargo</AlertTitle>
                <AlertDescription>{errorCrear}</AlertDescription>
              </Alert>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 py-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="crear-nombre">Nombre</Label>
              <Input
                id="crear-nombre"
                name="nombre"
                placeholder="Ej. Seguro de carga"
                required
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="crear-descripcion">Descripcion (opcional)</Label>
              <Textarea
                id="crear-descripcion"
                name="descripcion"
                placeholder="Descripcion del cargo adicional"
                rows={3}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={crear.isPending} type="button">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction type="submit" disabled={crear.isPending}>
              {crear.isPending ? "Creando..." : "Crear"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ---------------------------------------------------------------------------
// Dialog — Editar
// ---------------------------------------------------------------------------

function DialogEditar({
  item,
  onCerrar,
  onActualizado,
}: {
  item: CatalogoCargoAdicional | null
  onCerrar: () => void
  onActualizado: () => void
}) {
  const [errorEditar, setErrorEditar] = useState<string | null>(null)

  const actualizar = useActualizarCatalogoCargoAdicionalMutation(item?.id ?? "", {
    onSuccess: () => {
      setErrorEditar(null)
      onActualizado()
      onCerrar()
    },
    onError: (err) => {
      setErrorEditar(extraerMensajeError(err))
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const nombre = String(formData.get("nombre") ?? "").trim()
    const descripcion = String(formData.get("descripcion") ?? "").trim()

    setErrorEditar(null)
    actualizar.mutate({ nombre, descripcion: descripcion || undefined })
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setErrorEditar(null)
      onCerrar()
    }
  }

  return (
    <AlertDialog open={item !== null} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <form onSubmit={(e) => void handleSubmit(e)}>
          <AlertDialogHeader>
            <AlertDialogTitle>Editar cargo adicional</AlertDialogTitle>
            <AlertDialogDescription>
              Actualiza el nombre y la descripcion del cargo adicional.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {errorEditar ? (
            <div className="py-2">
              <Alert variant="destructive">
                <AlertTitle>No se pudo actualizar el cargo</AlertTitle>
                <AlertDescription>{errorEditar}</AlertDescription>
              </Alert>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 py-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="editar-nombre">Nombre</Label>
              <Input
                id="editar-nombre"
                name="nombre"
                defaultValue={item?.nombre ?? ""}
                required
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="editar-descripcion">Descripcion (opcional)</Label>
              <Textarea
                id="editar-descripcion"
                name="descripcion"
                defaultValue={item?.descripcion ?? ""}
                placeholder="Descripcion del cargo adicional"
                rows={3}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={actualizar.isPending} type="button">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction type="submit" disabled={actualizar.isPending}>
              {actualizar.isPending ? "Guardando..." : "Guardar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ---------------------------------------------------------------------------
// Dialog — Cambiar estado (activar / desactivar)
// ---------------------------------------------------------------------------

function DialogCambiarEstado({
  item,
  onCerrar,
  onActualizado,
}: {
  item: CatalogoCargoAdicional | null
  onCerrar: () => void
  onActualizado: () => void
}) {
  const [errorEstado, setErrorEstado] = useState<string | null>(null)

  const cambiarEstado = useCambiarEstadoCatalogoCargoAdicionalMutation(item?.id ?? "", {
    onSuccess: () => {
      setErrorEstado(null)
      onActualizado()
      onCerrar()
    },
    onError: (err) => {
      setErrorEstado(extraerMensajeError(err))
    },
  })

  const accion = item?.estado === "ACTIVO" ? "DESACTIVAR" : "ACTIVAR"
  const etiquetaAccion = accion === "DESACTIVAR" ? "Desactivar" : "Activar"

  function handleConfirmar() {
    setErrorEstado(null)
    cambiarEstado.mutate({ accion })
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setErrorEstado(null)
      onCerrar()
    }
  }

  return (
    <AlertDialog open={item !== null} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{etiquetaAccion} cargo adicional</AlertDialogTitle>
          <AlertDialogDescription>
            {accion === "DESACTIVAR"
              ? `El cargo "${item?.nombre}" quedara inactivo y no podra seleccionarse en nuevas cotizaciones.`
              : `El cargo "${item?.nombre}" quedara activo y podra seleccionarse en cotizaciones.`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {errorEstado ? (
          <Alert variant="destructive">
            <AlertTitle>No se pudo cambiar el estado</AlertTitle>
            <AlertDescription>{errorEstado}</AlertDescription>
          </Alert>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={cambiarEstado.isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmar}
            disabled={cambiarEstado.isPending}
          >
            {cambiarEstado.isPending ? "Procesando..." : etiquetaAccion}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ---------------------------------------------------------------------------
// Row actions
// ---------------------------------------------------------------------------

function AccionesFila({
  item,
  onEditar,
  onCambiarEstado,
}: {
  item: CatalogoCargoAdicional
  onEditar: (item: CatalogoCargoAdicional) => void
  onCambiarEstado: (item: CatalogoCargoAdicional) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Acciones">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => onEditar(item)}>
            <Pencil className="size-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {item.estado === "ACTIVO" ? (
            <DropdownMenuItem onSelect={() => onCambiarEstado(item)}>
              <PowerOff className="size-4" />
              Desactivar
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => onCambiarEstado(item)}>
              <Power className="size-4" />
              Activar
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ---------------------------------------------------------------------------
// Badge de estado
// ---------------------------------------------------------------------------

function BadgeEstado({ estado }: { estado: EstadoCatalogoCargoAdicional }) {
  return (
    <Badge variant={estado === "ACTIVO" ? "outline" : "secondary"}>
      {estado === "ACTIVO" ? "Activo" : "Inactivo"}
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

interface PropsCatalogoCargosAdicionalesListado {
  filtros: FiltrosCatalogosCargoAdicional
  onFiltrosChange: (f: Partial<FiltrosCatalogosCargoAdicional>) => void
}

export function CatalogoCargosAdicionalesListado({
  filtros,
  onFiltrosChange,
}: PropsCatalogoCargosAdicionalesListado) {
  const consulta = useCatalogosCargoAdicionalQuery(filtros)
  const filas = consulta.data?.data ?? []
  const total = consulta.data?.total ?? 0
  const pagina = consulta.data?.pagina ?? filtros.pagina ?? 1
  const limite = consulta.data?.porPagina ?? filtros.porPagina ?? 10

  const [dialogCrearAbierto, setDialogCrearAbierto] = useState(false)
  const [itemEditando, setItemEditando] = useState<CatalogoCargoAdicional | null>(null)
  const [itemCambiandoEstado, setItemCambiandoEstado] = useState<CatalogoCargoAdicional | null>(null)

  function handleRefetch() {
    void consulta.refetch()
  }

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
      {/* Cabecera */}
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold">Catalogo de cargos adicionales</h2>
          <p className="text-sm text-muted-foreground">
            Maestro de cargos adicionales disponibles para cotizaciones.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="w-fit">
            {total} registros
          </Badge>
          <Button size="sm" onClick={() => setDialogCrearAbierto(true)}>
            <Plus className="size-4" />
            Nuevo cargo
          </Button>
        </div>
      </div>

      {/* Error de carga */}
      {consulta.error ? (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertTitle>No se pudo cargar la informacion</AlertTitle>
            <AlertDescription>{extraerMensajeError(consulta.error)}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {/* Filtros */}
      <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filtros.busqueda ?? ""}
            onChange={(e) =>
              onFiltrosChange({ busqueda: e.target.value || undefined, pagina: 1 })
            }
            placeholder="Buscar por nombre"
            className="pl-9"
          />
        </div>
        <Select
          value={filtros.estado ?? "TODOS"}
          onValueChange={(value) =>
            onFiltrosChange({
              estado: value === "TODOS" ? undefined : (value as EstadoCatalogoCargoAdicional),
              pagina: 1,
            })
          }
        >
          <SelectTrigger className="lg:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Estado: todos</SelectItem>
            <SelectItem value="ACTIVO">Activo</SelectItem>
            <SelectItem value="INACTIVO">Inactivo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      {consulta.isLoading ? (
        <div className="flex flex-col gap-3 p-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : filas.length === 0 ? (
        <div className="p-6 text-sm text-muted-foreground">
          No hay cargos adicionales para los filtros aplicados.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">Acciones</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripcion</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((item) => (
                <TableRow key={item.id} className="border-border/80">
                  <TableCell>
                    <AccionesFila
                      item={item}
                      onEditar={(i) => setItemEditando(i)}
                      onCambiarEstado={(i) => setItemCambiandoEstado(i)}
                    />
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{item.nombre}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {item.descripcion ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <BadgeEstado estado={item.estado} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Paginacion */}
      {total > 0 ? (
        <PiePaginacion
          pagina={pagina}
          limite={limite}
          total={total}
          onPagina={(p) => onFiltrosChange({ pagina: p })}
          onLimite={(l) => onFiltrosChange({ porPagina: l, pagina: 1 })}
        />
      ) : null}

      {/* Dialogs */}
      <DialogCrear
        abierto={dialogCrearAbierto}
        onCerrar={() => setDialogCrearAbierto(false)}
        onCreado={handleRefetch}
      />
      <DialogEditar
        item={itemEditando}
        onCerrar={() => setItemEditando(null)}
        onActualizado={handleRefetch}
      />
      <DialogCambiarEstado
        item={itemCambiandoEstado}
        onCerrar={() => setItemCambiandoEstado(null)}
        onActualizado={handleRefetch}
      />
    </section>
  )
}
