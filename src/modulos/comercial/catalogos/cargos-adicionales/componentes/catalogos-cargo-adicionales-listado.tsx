"use client"

import { type FormEvent, useState } from "react"
import { CircleCheck, CircleX, Pencil, Plus, Search } from "lucide-react"

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
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/compartido/componentes/ui/sheet"
import { Separator } from "@/compartido/componentes/ui/separator"
import {
  Card,
  CardContent,
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
import { Textarea } from "@/compartido/componentes/ui/textarea"
import { TablaDatos } from "@/compartido/componentes/tabla-datos/tabla-datos"
import type {
  AccionTabla,
  ColumnaTabla,
} from "@/compartido/componentes/tabla-datos/tabla-datos.tipos"
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
    <Sheet open={abierto} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full gap-0 data-[side=right]:sm:max-w-lg">
        <form onSubmit={(e) => void handleSubmit(e)} className="flex h-full flex-col">
          <SheetHeader className="border-b border-border">
            <SheetTitle>Nuevo cargo adicional</SheetTitle>
            <SheetDescription>
              Ingresa el nombre y la descripcion opcional del cargo adicional.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col gap-5">
              {errorCrear ? (
                <Alert variant="destructive">
                  <AlertTitle>No se pudo crear el cargo</AlertTitle>
                  <AlertDescription>{errorCrear}</AlertDescription>
                </Alert>
              ) : null}

              <div className="grid gap-1.5">
                <Label htmlFor="crear-nombre">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="crear-nombre"
                  name="nombre"
                  placeholder="Ej. Seguro de carga"
                  required
                  autoFocus
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="crear-descripcion">Descripcion (opcional)</Label>
                <Textarea
                  id="crear-descripcion"
                  name="descripcion"
                  placeholder="Descripcion del cargo adicional"
                  rows={4}
                />
              </div>
            </div>
          </div>

          <Separator />
          <SheetFooter className="flex-row justify-end gap-2">
            <SheetClose asChild>
              <Button type="button" variant="outline" disabled={crear.isPending}>
                Cancelar
              </Button>
            </SheetClose>
            <Button type="submit" disabled={crear.isPending}>
              {crear.isPending ? "Creando..." : "Crear"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
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
    <Sheet open={item !== null} onOpenChange={handleOpenChange} key={item?.id}>
      <SheetContent side="right" className="w-full gap-0 data-[side=right]:sm:max-w-lg">
        <form onSubmit={(e) => void handleSubmit(e)} className="flex h-full flex-col">
          <SheetHeader className="border-b border-border">
            <SheetTitle>Editar cargo adicional</SheetTitle>
            <SheetDescription>
              Actualiza el nombre y la descripcion del cargo adicional.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col gap-5">
              {errorEditar ? (
                <Alert variant="destructive">
                  <AlertTitle>No se pudo actualizar el cargo</AlertTitle>
                  <AlertDescription>{errorEditar}</AlertDescription>
                </Alert>
              ) : null}

              <div className="grid gap-1.5">
                <Label htmlFor="editar-nombre">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="editar-nombre"
                  name="nombre"
                  defaultValue={item?.nombre ?? ""}
                  required
                  autoFocus
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="editar-descripcion">Descripcion (opcional)</Label>
                <Textarea
                  id="editar-descripcion"
                  name="descripcion"
                  defaultValue={item?.descripcion ?? ""}
                  placeholder="Descripcion del cargo adicional"
                  rows={4}
                />
              </div>
            </div>
          </div>

          <Separator />
          <SheetFooter className="flex-row justify-end gap-2">
            <SheetClose asChild>
              <Button type="button" variant="outline" disabled={actualizar.isPending}>
                Cancelar
              </Button>
            </SheetClose>
            <Button type="submit" disabled={actualizar.isPending}>
              {actualizar.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
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
// Columnas de la tabla (la tabla generica solo las renderiza)
// ---------------------------------------------------------------------------

const COLUMNAS: ColumnaTabla<CatalogoCargoAdicional>[] = [
  {
    id: "nombre",
    encabezado: "Nombre",
    ancho: "w-[32%]",
    principal: true,
    className: "truncate",
    celda: (item) => item.nombre,
  },
  {
    id: "descripcion",
    encabezado: "Descripcion",
    className: "truncate",
    celda: (item) => item.descripcion ?? "—",
  },
  {
    id: "estado",
    encabezado: "Estado",
    ancho: "w-[14%]",
    celda: (item) => <BadgeEstado estado={item.estado} />,
  },
]

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

  function accionesCargo(
    item: CatalogoCargoAdicional,
  ): AccionTabla<CatalogoCargoAdicional>[] {
    return [
      {
        etiqueta: "Editar",
        icono: Pencil,
        alSeleccionar: () => setItemEditando(item),
      },
      {
        etiqueta: item.estado === "ACTIVO" ? "Desactivar" : "Activar",
        icono: item.estado === "ACTIVO" ? CircleX : CircleCheck,
        alSeleccionar: () => setItemCambiandoEstado(item),
      },
    ]
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <CardTitle>Cargos adicionales</CardTitle>
          <Button onClick={() => setDialogCrearAbierto(true)}>
            <Plus />
            Nuevo cargo
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
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
        <TablaDatos
          columnas={COLUMNAS}
          datos={filas}
          obtenerId={(item) => item.id}
          acciones={accionesCargo}
          cargando={consulta.isLoading}
          paginacion={{
            pagina,
            porPagina,
            total,
            alCambiarPagina: (nuevaPagina) => onFiltrosChange({ pagina: nuevaPagina }),
          }}
          vacioTitulo="Sin cargos adicionales"
          vacioDescripcion="No hay cargos adicionales para los filtros aplicados."
        />
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
