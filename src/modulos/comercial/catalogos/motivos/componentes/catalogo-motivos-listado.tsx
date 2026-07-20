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
import { Checkbox } from "@/compartido/componentes/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/compartido/componentes/ui/dialog"
import { Input } from "@/compartido/componentes/ui/input"
import { Label } from "@/compartido/componentes/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select"
import { TablaDatos } from "@/compartido/componentes/tabla-datos/tabla-datos"
import type {
  AccionTabla,
  ColumnaTabla,
} from "@/compartido/componentes/tabla-datos/tabla-datos.tipos"

import type {
  CatalogoMotivo,
  EstadoCatalogoMotivo,
  FiltrosCatalogosMotivo,
  TipoMotivo,
} from "../tipos/motivos.tipos"
import { ETIQUETAS_TIPO_MOTIVO } from "../tipos/motivos.tipos"
import {
  useActualizarCatalogoMotivoMutation,
  useCambiarEstadoCatalogoMotivoMutation,
  useCatalogosMotivoQuery,
  useCrearCatalogoMotivoMutation,
} from "../servicios/catalogos-motivo-queries"

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------

function BadgeEstado({ estado }: { estado: EstadoCatalogoMotivo }) {
  return estado === "ACTIVO" ? (
    <Badge variant="outline" className="border-emerald-500/40 text-emerald-600">
      Activo
    </Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground">
      Inactivo
    </Badge>
  )
}

function BadgeTipo({ tipo }: { tipo: TipoMotivo }) {
  return (
    <Badge variant="secondary" className="font-normal">
      {ETIQUETAS_TIPO_MOTIVO[tipo]}
    </Badge>
  )
}

const COLUMNAS: ColumnaTabla<CatalogoMotivo>[] = [
  {
    id: "codigo",
    encabezado: "Código",
    ancho: "w-[14%]",
    celda: (m) => <span className="font-mono text-xs">{m.codigo}</span>,
  },
  {
    id: "etiqueta",
    encabezado: "Etiqueta (lo que ve el cliente)",
    principal: true,
    celda: (m) => m.etiqueta,
  },
  {
    id: "tipo",
    encabezado: "Tipo",
    ancho: "w-[13%]",
    celda: (m) => <BadgeTipo tipo={m.tipo} />,
  },
  {
    id: "requiereDetalle",
    encabezado: "Detalle",
    ancho: "w-[10%]",
    alineacion: "centro",
    celda: (m) =>
      m.requiereDetalle ? (
        <Badge variant="outline" className="text-xs">
          Obligatorio
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
  },
  {
    id: "orden",
    encabezado: "Orden",
    ancho: "w-[8%]",
    alineacion: "centro",
    celda: (m) => <span className="text-muted-foreground">{m.ordenSugerido}</span>,
  },
  {
    id: "estado",
    encabezado: "Estado",
    ancho: "w-[10%]",
    celda: (m) => <BadgeEstado estado={m.estado} />,
  },
]

// ---------------------------------------------------------------------------
// Sheet — Crear
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
  const [error, setError] = useState<string | null>(null)
  const [tipo, setTipo] = useState<TipoMotivo | "">("")
  const [requiereDetalle, setRequiereDetalle] = useState(false)

  const crear = useCrearCatalogoMotivoMutation({
    onSuccess: () => {
      setError(null)
      onCreado()
      cerrar()
    },
    onError: (err) => setError(extraerMensajeError(err)),
  })

  function cerrar() {
    setError(null)
    setTipo("")
    setRequiereDetalle(false)
    onCerrar()
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fd = new FormData(event.currentTarget)
    const codigo = String(fd.get("codigo") ?? "").trim()
    const etiqueta = String(fd.get("etiqueta") ?? "").trim()
    const ordenRaw = String(fd.get("ordenSugerido") ?? "").trim()
    if (!tipo) {
      setError("Debe seleccionar un tipo.")
      return
    }
    setError(null)
    crear.mutate({
      codigo,
      etiqueta,
      tipo,
      requiereDetalle,
      ordenSugerido: ordenRaw ? parseInt(ordenRaw, 10) : 0,
    })
  }

  return (
    <Dialog open={abierto} onOpenChange={(o) => !o && cerrar()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>Nuevo motivo</DialogTitle>
            <DialogDescription>
              El código y el tipo se fijan al crear y no se pueden cambiar luego.
            </DialogDescription>
          </DialogHeader>

          {error ? (
            <Alert variant="destructive">
              <AlertTitle>No se pudo crear el motivo</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-1.5">
            <Label htmlFor="crear-tipo">
              Tipo <span className="text-destructive">*</span>
            </Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoMotivo)}>
              <SelectTrigger id="crear-tipo">
                <SelectValue placeholder="¿Rechazo o negociación?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RECHAZO">Rechazo</SelectItem>
                <SelectItem value="NEGOCIACION">Negociación</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="crear-codigo">
              Código <span className="text-destructive">*</span>
            </Label>
            <Input
              id="crear-codigo"
              name="codigo"
              placeholder="Ej. PRECIO"
              required
              autoFocus
              className="font-mono uppercase"
            />
            <p className="text-xs text-muted-foreground">
              Identificador estable para reportes. Único por tipo. Se guarda en
              mayúsculas.
            </p>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="crear-etiqueta">
              Etiqueta <span className="text-destructive">*</span>
            </Label>
            <Input
              id="crear-etiqueta"
              name="etiqueta"
              placeholder="El precio es más alto de lo esperado"
              required
            />
            <p className="text-xs text-muted-foreground">
              El texto que ve el cliente al responder.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="crear-orden">Orden sugerido</Label>
              <Input
                id="crear-orden"
                name="ordenSugerido"
                type="number"
                min={0}
                defaultValue={0}
              />
            </div>
            <div className="flex items-end gap-2 pb-0.5">
              <Checkbox
                id="crear-detalle"
                checked={requiereDetalle}
                onCheckedChange={(v) => setRequiereDetalle(Boolean(v))}
              />
              <Label htmlFor="crear-detalle" className="cursor-pointer">
                Exige detalle
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={cerrar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={crear.isPending}>
              {crear.isPending ? "Creando..." : "Crear motivo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Sheet — Editar (código y tipo son de solo lectura)
// ---------------------------------------------------------------------------

function DialogEditar({
  item,
  onCerrar,
  onActualizado,
}: {
  item: CatalogoMotivo | null
  onCerrar: () => void
  onActualizado: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [requiereDetalle, setRequiereDetalle] = useState(item?.requiereDetalle ?? false)

  const actualizar = useActualizarCatalogoMotivoMutation(item?.id ?? "", {
    onSuccess: () => {
      setError(null)
      onActualizado()
      onCerrar()
    },
    onError: (err) => setError(extraerMensajeError(err)),
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fd = new FormData(event.currentTarget)
    const etiqueta = String(fd.get("etiqueta") ?? "").trim()
    const ordenRaw = String(fd.get("ordenSugerido") ?? "").trim()
    setError(null)
    actualizar.mutate({
      etiqueta,
      requiereDetalle,
      ordenSugerido: ordenRaw ? parseInt(ordenRaw, 10) : 0,
    })
  }

  return (
    <Dialog open={item !== null} onOpenChange={(o) => !o && onCerrar()}>
      <DialogContent className="sm:max-w-md">
        {item ? (
          <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-5">
            <DialogHeader>
              <DialogTitle>Editar motivo</DialogTitle>
              <DialogDescription>
                <span className="font-mono">{item.codigo}</span> ·{" "}
                {ETIQUETAS_TIPO_MOTIVO[item.tipo]} (no editables)
              </DialogDescription>
            </DialogHeader>

            {error ? (
              <Alert variant="destructive">
                <AlertTitle>No se pudo actualizar</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-1.5">
              <Label htmlFor="editar-etiqueta">
                Etiqueta <span className="text-destructive">*</span>
              </Label>
              <Input
                id="editar-etiqueta"
                name="etiqueta"
                defaultValue={item.etiqueta}
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="editar-orden">Orden sugerido</Label>
                <Input
                  id="editar-orden"
                  name="ordenSugerido"
                  type="number"
                  min={0}
                  defaultValue={item.ordenSugerido}
                />
              </div>
              <div className="flex items-end gap-2 pb-0.5">
                <Checkbox
                  id="editar-detalle"
                  checked={requiereDetalle}
                  onCheckedChange={(v) => setRequiereDetalle(Boolean(v))}
                />
                <Label htmlFor="editar-detalle" className="cursor-pointer">
                  Exige detalle
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onCerrar}>
                Cancelar
              </Button>
              <Button type="submit" disabled={actualizar.isPending}>
                {actualizar.isPending ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// AlertDialog — Activar / Desactivar
// ---------------------------------------------------------------------------

function DialogCambiarEstado({
  item,
  onCerrar,
  onActualizado,
}: {
  item: CatalogoMotivo | null
  onCerrar: () => void
  onActualizado: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const desactivar = item?.estado === "ACTIVO"

  const cambiar = useCambiarEstadoCatalogoMotivoMutation(item?.id ?? "", {
    onSuccess: () => {
      setError(null)
      onActualizado()
      onCerrar()
    },
    onError: (err) => setError(extraerMensajeError(err)),
  })

  return (
    <AlertDialog open={item !== null} onOpenChange={(o) => !o && onCerrar()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {desactivar ? "Desactivar motivo" : "Activar motivo"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {desactivar
              ? "Dejará de ofrecerse en el formulario del cliente. Las respuestas ya registradas conservan su motivo."
              : "Volverá a ofrecerse en el formulario del cliente."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCerrar}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              cambiar.mutate({ accion: desactivar ? "DESACTIVAR" : "ACTIVAR" })
            }}
          >
            {desactivar ? "Desactivar" : "Activar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

interface Props {
  filtros: FiltrosCatalogosMotivo
  onFiltrosChange: (f: Partial<FiltrosCatalogosMotivo>) => void
}

export function CatalogoMotivosListado({ filtros, onFiltrosChange }: Props) {
  const consulta = useCatalogosMotivoQuery(filtros)
  const filas = consulta.data?.data ?? []
  const total = consulta.data?.total ?? 0
  const pagina = consulta.data?.pagina ?? filtros.pagina ?? 1
  const porPagina = consulta.data?.porPagina ?? filtros.porPagina ?? 10

  const [busquedaLocal, setBusquedaLocal] = useState(filtros.busqueda ?? "")
  const [tipoLocal, setTipoLocal] = useState<string>(filtros.tipo ?? "TODOS")
  const [estadoLocal, setEstadoLocal] = useState<string>(filtros.estado ?? "TODOS")

  const [crearAbierto, setCrearAbierto] = useState(false)
  const [editando, setEditando] = useState<CatalogoMotivo | null>(null)
  const [cambiandoEstado, setCambiandoEstado] = useState<CatalogoMotivo | null>(null)

  function refetch() {
    void consulta.refetch()
  }

  function aplicarFiltros() {
    onFiltrosChange({
      busqueda: busquedaLocal.trim() || undefined,
      tipo: tipoLocal === "TODOS" ? undefined : (tipoLocal as TipoMotivo),
      estado: estadoLocal === "TODOS" ? undefined : (estadoLocal as EstadoCatalogoMotivo),
      pagina: 1,
    })
  }

  function acciones(item: CatalogoMotivo): AccionTabla<CatalogoMotivo>[] {
    return [
      {
        etiqueta: "Editar",
        icono: Pencil,
        alSeleccionar: () => setEditando(item),
      },
      {
        etiqueta: item.estado === "ACTIVO" ? "Desactivar" : "Activar",
        icono: item.estado === "ACTIVO" ? CircleX : CircleCheck,
        destructiva: item.estado === "ACTIVO",
        alSeleccionar: () => setCambiandoEstado(item),
      },
    ]
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setCrearAbierto(true)}>
          <Plus />
          Nuevo motivo
        </Button>
      </div>

      {consulta.error ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudo cargar la información</AlertTitle>
          <AlertDescription>{extraerMensajeError(consulta.error)}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-end gap-3">
        <div className="grid min-w-64 flex-1 gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Búsqueda</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por código o etiqueta..."
              value={busquedaLocal}
              onChange={(e) => setBusquedaLocal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && aplicarFiltros()}
            />
          </div>
        </div>
        <div className="grid min-w-44 flex-1 gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Tipo</span>
          <Select value={tipoLocal} onValueChange={setTipoLocal}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              <SelectItem value="RECHAZO">Rechazo</SelectItem>
              <SelectItem value="NEGOCIACION">Negociación</SelectItem>
            </SelectContent>
          </Select>
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

      <TablaDatos
        columnas={COLUMNAS}
        datos={filas}
        obtenerId={(item) => item.id}
        acciones={acciones}
        cargando={consulta.isLoading}
        paginacion={{
          pagina,
          porPagina,
          total,
          alCambiarPagina: (nueva) => onFiltrosChange({ pagina: nueva }),
        }}
        vacioTitulo="Sin motivos"
        vacioDescripcion="No hay motivos para los filtros aplicados."
      />

      <DialogCrear
        abierto={crearAbierto}
        onCerrar={() => setCrearAbierto(false)}
        onCreado={refetch}
      />
      <DialogEditar
        key={editando?.id ?? "sin-edicion"}
        item={editando}
        onCerrar={() => setEditando(null)}
        onActualizado={refetch}
      />
      <DialogCambiarEstado
        item={cambiandoEstado}
        onCerrar={() => setCambiandoEstado(null)}
        onActualizado={refetch}
      />
    </div>
  )
}
