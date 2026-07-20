"use client"

import { type FormEvent, useMemo, useState } from "react"
import { Pencil, Plus, Search, Trash2 } from "lucide-react"

import { extraerMensajeError, obtenerStatusError } from "@/compartido/api/formato-error"
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
import { Input } from "@/compartido/componentes/ui/input"
import { Label } from "@/compartido/componentes/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/compartido/componentes/ui/sheet"
import { TablaDatos } from "@/compartido/componentes/tabla-datos/tabla-datos"
import type {
  AccionTabla,
  ColumnaTabla,
} from "@/compartido/componentes/tabla-datos/tabla-datos.tipos"
import type {
  FuenteTipoUnidad,
  TipoUnidadOpcion,
} from "@/modulos/comercial/cotizaciones/tipos/cotizaciones.tipos"

import {
  useActualizarTipoUnidadTerceroMutation,
  useCatalogoTiposUnidadQuery,
  useCrearTipoUnidadTerceroMutation,
  useEliminarTipoUnidadTerceroMutation,
} from "../servicios/tipos-unidad-queries"

// ---------------------------------------------------------------------------
// Badge de fuente
// ---------------------------------------------------------------------------

function BadgeFuente({ fuente }: { fuente: FuenteTipoUnidad }) {
  return fuente === "ACTIVOS" ? (
    <Badge variant="secondary">En Activos</Badge>
  ) : (
    <Badge variant="outline">Tercero</Badge>
  )
}

// ---------------------------------------------------------------------------
// Sheet — Crear / Editar tercero (solo captura `nombre`)
// ---------------------------------------------------------------------------

function SheetFormularioTercero({
  modo,
  item,
  abierto,
  onCerrar,
  onGuardado,
}: {
  modo: "crear" | "editar"
  item: TipoUnidadOpcion | null
  abierto: boolean
  onCerrar: () => void
  onGuardado: () => void
}) {
  const [error, setError] = useState<string | null>(null)

  const crear = useCrearTipoUnidadTerceroMutation({
    onSuccess: manejarExito,
    onError: (err) => setError(extraerMensajeError(err)),
  })
  const actualizar = useActualizarTipoUnidadTerceroMutation(item?.id ?? "", {
    onSuccess: manejarExito,
    onError: (err) => setError(extraerMensajeError(err)),
  })

  const enProgreso = crear.isPending || actualizar.isPending

  function manejarExito() {
    setError(null)
    onGuardado()
    onCerrar()
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nombre = String(new FormData(event.currentTarget).get("nombre") ?? "").trim()
    if (!nombre) {
      setError("El nombre es obligatorio.")
      return
    }
    setError(null)
    if (modo === "crear") crear.mutate({ nombre })
    else actualizar.mutate({ nombre })
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setError(null)
      onCerrar()
    }
  }

  return (
    <Sheet open={abierto} onOpenChange={handleOpenChange} key={item?.id ?? "nuevo"}>
      <SheetContent side="right" className="w-full gap-0 data-[side=right]:sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <SheetHeader className="border-b border-border">
            <SheetTitle>
              {modo === "crear" ? "Nuevo tipo de unidad" : "Editar tipo de unidad"}
            </SheetTitle>
            <SheetDescription>
              Tipo de unidad de tercero (subcontratado). La flota propia se administra en Activos.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col gap-5">
              {error ? (
                <Alert variant="destructive">
                  <AlertTitle>
                    {modo === "crear"
                      ? "No se pudo crear el tipo de unidad"
                      : "No se pudo actualizar el tipo de unidad"}
                  </AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <div className="grid gap-1.5">
                <Label htmlFor="tercero-nombre">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="tercero-nombre"
                  name="nombre"
                  defaultValue={item?.nombre ?? ""}
                  placeholder="Ej. Lowboy X"
                  required
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  El codigo interno se deriva del nombre. Renombrar recalcula ese codigo.
                </p>
              </div>
            </div>
          </div>

          <SheetFooter className="flex-row justify-end gap-2">
            <SheetClose asChild>
              <Button type="button" variant="outline" disabled={enProgreso}>
                Cancelar
              </Button>
            </SheetClose>
            <Button type="submit" disabled={enProgreso}>
              {enProgreso
                ? "Guardando..."
                : modo === "crear"
                  ? "Crear"
                  : "Guardar"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

// ---------------------------------------------------------------------------
// AlertDialog — Eliminar tercero (soft-delete)
// ---------------------------------------------------------------------------

function DialogEliminar({
  item,
  onCerrar,
  onEliminado,
}: {
  item: TipoUnidadOpcion | null
  onCerrar: () => void
  onEliminado: () => void
}) {
  const [error, setError] = useState<string | null>(null)

  const eliminar = useEliminarTipoUnidadTerceroMutation(item?.id ?? "", {
    onSuccess: () => {
      setError(null)
      onEliminado()
      onCerrar()
    },
    onError: (err) => setError(extraerMensajeError(err)),
  })

  function handleOpenChange(open: boolean) {
    if (!open) {
      setError(null)
      onCerrar()
    }
  }

  return (
    <AlertDialog open={item !== null} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar tipo de unidad</AlertDialogTitle>
          <AlertDialogDescription>
            {`"${item?.nombre}" dejara de aparecer en el catalogo y en el select de la carga. Las cotizaciones historicas no se ven afectadas (conservan su snapshot).`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>No se pudo eliminar el tipo de unidad</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={eliminar.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              setError(null)
              eliminar.mutate()
            }}
            disabled={eliminar.isPending}
          >
            {eliminar.isPending ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ---------------------------------------------------------------------------
// Columnas
// ---------------------------------------------------------------------------

const COLUMNAS: ColumnaTabla<TipoUnidadOpcion>[] = [
  {
    id: "nombre",
    encabezado: "Nombre",
    ancho: "w-[45%]",
    principal: true,
    className: "truncate",
    celda: (item) => item.nombre,
  },
  {
    id: "clase",
    encabezado: "Clase",
    ancho: "w-[30%]",
    celda: (item) => item.clase ?? "—",
  },
  {
    id: "fuente",
    encabezado: "Origen",
    ancho: "w-[25%]",
    celda: (item) => <BadgeFuente fuente={item.fuente} />,
  },
]

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function CatalogoTiposUnidadListado() {
  const consulta = useCatalogoTiposUnidadQuery()
  const todos = useMemo(() => consulta.data ?? [], [consulta.data])

  const [busqueda, setBusqueda] = useState("")
  const [fuente, setFuente] = useState<FuenteTipoUnidad | "TODOS">("TODOS")

  const [crearAbierto, setCrearAbierto] = useState(false)
  const [itemEditando, setItemEditando] = useState<TipoUnidadOpcion | null>(null)
  const [itemEliminando, setItemEliminando] = useState<TipoUnidadOpcion | null>(null)

  // Filtro en cliente: ~30 items, el endpoint no pagina ni filtra en server.
  const filas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return todos.filter((item) => {
      if (fuente !== "TODOS" && item.fuente !== fuente) return false
      if (!texto) return true
      return (
        item.nombre.toLowerCase().includes(texto) ||
        (item.clase?.toLowerCase().includes(texto) ?? false)
      )
    })
  }, [todos, busqueda, fuente])

  function handleRefetch() {
    void consulta.refetch()
  }

  // Solo los terceros se administran desde Comercial; ACTIVOS es de solo lectura.
  function accionesTipoUnidad(item: TipoUnidadOpcion): AccionTabla<TipoUnidadOpcion>[] {
    if (item.fuente !== "TERCERO") return []
    return [
      {
        etiqueta: "Editar",
        icono: Pencil,
        alSeleccionar: () => setItemEditando(item),
      },
      {
        etiqueta: "Eliminar",
        icono: Trash2,
        destructiva: true,
        alSeleccionar: () => setItemEliminando(item),
      },
    ]
  }

  // El GET unido devuelve 503 cuando ACTIVOS no responde y no hay cache: en ese
  // caso no hay catalogo que mostrar (ni siquiera terceros). Lo separamos del
  // error generico para dar una explicacion accionable.
  const status = consulta.error ? obtenerStatusError(consulta.error) : null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setCrearAbierto(true)}>
          <Plus />
          Nuevo tipo de unidad
        </Button>
      </div>

      {consulta.error ? (
        <Alert variant="destructive">
          <AlertTitle>
            {status === 503
              ? "Catalogo de flota propia no disponible"
              : "No se pudo cargar el catalogo"}
          </AlertTitle>
          <AlertDescription>
            {status === 503
              ? "El servicio de Activos (BC-02) no responde y no hay copia en cache. Reintenta en unos minutos."
              : extraerMensajeError(consulta.error)}
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Filtros en cliente */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid min-w-64 flex-1 gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Busqueda</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por nombre o clase..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>
        <div className="grid min-w-44 flex-1 gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Origen</span>
          <Select value={fuente} onValueChange={(v) => setFuente(v as FuenteTipoUnidad | "TODOS")}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              <SelectItem value="ACTIVOS">Flota propia</SelectItem>
              <SelectItem value="TERCERO">Tercero</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <TablaDatos
        columnas={COLUMNAS}
        datos={filas}
        obtenerId={(item) => `${item.fuente}:${item.id}`}
        acciones={accionesTipoUnidad}
        cargando={consulta.isLoading}
        vacioTitulo="Sin tipos de unidad"
        vacioDescripcion="No hay tipos de unidad para los filtros aplicados."
      />

      <SheetFormularioTercero
        modo="crear"
        item={null}
        abierto={crearAbierto}
        onCerrar={() => setCrearAbierto(false)}
        onGuardado={handleRefetch}
      />
      <SheetFormularioTercero
        modo="editar"
        item={itemEditando}
        abierto={itemEditando !== null}
        onCerrar={() => setItemEditando(null)}
        onGuardado={handleRefetch}
      />
      <DialogEliminar
        item={itemEliminando}
        onCerrar={() => setItemEliminando(null)}
        onEliminado={handleRefetch}
      />
    </div>
  )
}
