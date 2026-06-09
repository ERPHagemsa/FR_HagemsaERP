"use client"

import { type FormEvent, useState } from "react"
import { Pencil, Plus, Power, PowerOff, Search } from "lucide-react"

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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card"
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
// Badge de estado
// ---------------------------------------------------------------------------

function BadgeEstado({ estado }: { estado: EstadoCatalogoCargoAdicional }) {
  return (
    <Badge variant={estado === "ACTIVO" ? "default" : "secondary"}>
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
  const porPagina = consulta.data?.porPagina ?? filtros.porPagina ?? 10

  const totalPaginas = Math.max(1, Math.ceil(total / porPagina))
  const desdeVisible = total ? (pagina - 1) * porPagina + 1 : 0
  const hastaVisible = Math.min(pagina * porPagina, total)

  const [busquedaLocal, setBusquedaLocal] = useState(filtros.busqueda ?? "")
  const [estadoLocal, setEstadoLocal] = useState<string>(filtros.estado ?? "TODOS")

  const [dialogCrearAbierto, setDialogCrearAbierto] = useState(false)
  const [itemEditando, setItemEditando] = useState<CatalogoCargoAdicional | null>(null)
  const [itemCambiandoEstado, setItemCambiandoEstado] = useState<CatalogoCargoAdicional | null>(null)

  function handleRefetch() {
    void consulta.refetch()
  }

  function aplicarFiltros() {
    onFiltrosChange({
      busqueda: busquedaLocal.trim() || undefined,
      estado: estadoLocal === "TODOS" ? undefined : (estadoLocal as EstadoCatalogoCargoAdicional),
      pagina: 1,
    })
  }

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Cargos adicionales</CardTitle>
            <CardDescription>
              {total} {total === 1 ? "registro" : "registros"} encontrados
            </CardDescription>
          </div>
          <Button onClick={() => setDialogCrearAbierto(true)}>
            <Plus />
            Nuevo cargo
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 pt-5">
        {/* Error de carga */}
        {consulta.error ? (
          <Alert variant="destructive">
            <AlertTitle>No se pudo cargar la informacion</AlertTitle>
            <AlertDescription>{extraerMensajeError(consulta.error)}</AlertDescription>
          </Alert>
        ) : null}

        {/* Filtros */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="grid min-w-64 flex-1 gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Busqueda</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar por nombre..."
                value={busquedaLocal}
                onChange={(e) => setBusquedaLocal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && aplicarFiltros()}
              />
            </div>
          </div>
          <div className="grid min-w-36 flex-1 gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Estado</span>
            <Select value={estadoLocal} onValueChange={setEstadoLocal}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="ACTIVO">Activo</SelectItem>
                <SelectItem value="INACTIVO">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="button" onClick={aplicarFiltros}>
            Buscar
          </Button>
        </div>

        {/* Tabla */}
        <div className="overflow-hidden rounded-xl border border-border">
          <Table className="w-full table-fixed [&_td]:px-2 [&_th]:px-2">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[32%]">Nombre</TableHead>
                <TableHead>Descripcion</TableHead>
                <TableHead className="w-[14%]">Estado</TableHead>
                <TableHead className="w-[14%] text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consulta.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}>
                      <Skeleton className="h-7 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-28 text-center text-muted-foreground">
                    No hay cargos adicionales para los filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : (
                filas.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="truncate text-sm font-medium">{item.nombre}</TableCell>
                    <TableCell className="truncate text-sm text-muted-foreground">
                      {item.descripcion ?? "—"}
                    </TableCell>
                    <TableCell>
                      <BadgeEstado estado={item.estado} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          size="icon-sm"
                          variant="outline"
                          onClick={() => setItemEditando(item)}
                          aria-label="Editar"
                        >
                          <Pencil />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="outline"
                          onClick={() => setItemCambiandoEstado(item)}
                          aria-label={item.estado === "ACTIVO" ? "Desactivar" : "Activar"}
                        >
                          {item.estado === "ACTIVO" ? <PowerOff /> : <Power />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginacion */}
        <div className="flex flex-col gap-3 border-t border-border pt-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>
            {total > 0
              ? `Mostrando ${desdeVisible}-${hastaVisible} de ${total} registros`
              : "Sin resultados"}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pagina <= 1}
              onClick={() => onFiltrosChange({ pagina: pagina - 1 })}
            >
              Anterior
            </Button>
            <span className="min-w-20 text-center">
              {pagina} / {totalPaginas}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pagina >= totalPaginas}
              onClick={() => onFiltrosChange({ pagina: pagina + 1 })}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </CardContent>

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
    </Card>
  )
}
