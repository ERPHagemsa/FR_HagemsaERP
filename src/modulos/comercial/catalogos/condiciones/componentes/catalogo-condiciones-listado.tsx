"use client"

import { type FormEvent, useState } from "react"
import { CircleCheck, CircleX, Pencil, Plus, Search, Trash2 } from "lucide-react"

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
import { Input } from "@/compartido/componentes/ui/input"
import { Label } from "@/compartido/componentes/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select"
import { Separator } from "@/compartido/componentes/ui/separator"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/compartido/componentes/ui/sheet"
import { Textarea } from "@/compartido/componentes/ui/textarea"
import { TablaDatos } from "@/compartido/componentes/tabla-datos/tabla-datos"
import type {
  AccionTabla,
  ColumnaTabla,
} from "@/compartido/componentes/tabla-datos/tabla-datos.tipos"
import type {
  CatalogoCondicion,
  CategoriaCondicion,
  EstadoCatalogoCondicion,
  FiltrosCatalogosCondicion,
  ParametroCondicion,
} from "@/modulos/comercial/cotizaciones/tipos/cotizaciones.tipos"

import {
  useActualizarCatalogoCondicionMutation,
  useCambiarEstadoCatalogoCondicionMutation,
  useCatalogosCondicionQuery,
  useCrearCatalogoCondicionMutation,
} from "../servicios/catalogos-condicion-queries"

// ---------------------------------------------------------------------------
// Constantes de etiquetas de categoria
// ---------------------------------------------------------------------------

const ETIQUETAS_CATEGORIA: Record<CategoriaCondicion, string> = {
  CONSIDERACIONES_SERVICIO: "Consideraciones del servicio",
  TARIFAS_INCLUYEN: "Nuestras tarifas incluyen",
}

// ---------------------------------------------------------------------------
// Editor de parametros (array dinamico)
// ---------------------------------------------------------------------------

type ParametroDraft = {
  nombre: string
  fuente: "AUTO" | "MANUAL"
  tipoEntrada: "ENUM" | "TEXTO" | ""
  opcionesTexto: string // comma-separated raw input
}

function parametrosDraftDesde(parametros: ParametroCondicion[]): ParametroDraft[] {
  return parametros.map((p) => ({
    nombre: p.nombre,
    fuente: p.fuente,
    tipoEntrada: p.tipoEntrada ?? "",
    opcionesTexto: (p.opciones ?? []).join(", "),
  }))
}

function parametrosDraftAPayload(drafts: ParametroDraft[]): ParametroCondicion[] {
  return drafts.map((d) => {
    const base: ParametroCondicion = { nombre: d.nombre.trim(), fuente: d.fuente }
    if (d.fuente === "MANUAL") {
      if (d.tipoEntrada) base.tipoEntrada = d.tipoEntrada as "ENUM" | "TEXTO"
      if (d.tipoEntrada === "ENUM" && d.opcionesTexto.trim()) {
        base.opciones = d.opcionesTexto
          .split(",")
          .map((o) => o.trim())
          .filter(Boolean)
      }
    }
    return base
  })
}

function EditorParametros({
  drafts,
  onChange,
}: {
  drafts: ParametroDraft[]
  onChange: (siguiente: ParametroDraft[]) => void
}) {
  function agregarFila() {
    onChange([...drafts, { nombre: "", fuente: "MANUAL", tipoEntrada: "TEXTO", opcionesTexto: "" }])
  }

  function eliminarFila(indice: number) {
    onChange(drafts.filter((_, i) => i !== indice))
  }

  function actualizarFila(indice: number, cambios: Partial<ParametroDraft>) {
    onChange(
      drafts.map((d, i) => {
        if (i !== indice) return d
        const siguiente = { ...d, ...cambios }
        // Si se cambia a AUTO, limpiar tipoEntrada y opciones
        if (cambios.fuente === "AUTO") {
          siguiente.tipoEntrada = ""
          siguiente.opcionesTexto = ""
        }
        // Si se cambia tipoEntrada a TEXTO, limpiar opciones
        if (cambios.tipoEntrada === "TEXTO") {
          siguiente.opcionesTexto = ""
        }
        return siguiente
      })
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Parametros de placeholder</span>
        <Button type="button" variant="outline" size="sm" onClick={agregarFila}>
          <Plus className="size-3.5" />
          Agregar
        </Button>
      </div>

      {drafts.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Sin parametros — la condicion no contiene placeholders.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {drafts.map((draft, indice) => (
            <div key={indice} className="rounded-md border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Parametro {indice + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="size-7 p-0 text-destructive hover:text-destructive"
                  onClick={() => eliminarFila(indice)}
                >
                  <Trash2 className="size-3.5" />
                  <span className="sr-only">Eliminar parametro</span>
                </Button>
              </div>

              <div className="flex flex-col gap-2">
                <div className="grid gap-1">
                  <Label className="text-xs">Nombre del placeholder</Label>
                  <Input
                    placeholder="ej. dias_validez"
                    value={draft.nombre}
                    onChange={(e) => actualizarFila(indice, { nombre: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>

                <div className="grid gap-1">
                  <Label className="text-xs">Fuente de resolucion</Label>
                  <Select
                    value={draft.fuente}
                    onValueChange={(v) =>
                      actualizarFila(indice, { fuente: v as "AUTO" | "MANUAL" })
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AUTO">AUTO (del contexto de la cotizacion)</SelectItem>
                      <SelectItem value="MANUAL">MANUAL (el usuario lo ingresa)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {draft.fuente === "MANUAL" ? (
                  <div className="grid gap-1">
                    <Label className="text-xs">Tipo de entrada</Label>
                    <Select
                      value={draft.tipoEntrada}
                      onValueChange={(v) =>
                        actualizarFila(indice, { tipoEntrada: v as "ENUM" | "TEXTO" })
                      }
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TEXTO">Texto libre</SelectItem>
                        <SelectItem value="ENUM">Seleccion de opciones</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}

                {draft.fuente === "MANUAL" && draft.tipoEntrada === "ENUM" ? (
                  <div className="grid gap-1">
                    <Label className="text-xs">Opciones (separadas por coma)</Label>
                    <Input
                      placeholder="ej. 10, 15, 30"
                      value={draft.opcionesTexto}
                      onChange={(e) => actualizarFila(indice, { opcionesTexto: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

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
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<CategoriaCondicion | "">("")
  const [esConstante, setEsConstante] = useState(true)
  const [parametros, setParametros] = useState<ParametroDraft[]>([])

  const crear = useCrearCatalogoCondicionMutation({
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
    const titulo = String(formData.get("titulo") ?? "").trim()
    const texto = String(formData.get("texto") ?? "").trim()
    const ordenSugeridoRaw = String(formData.get("ordenSugerido") ?? "").trim()
    const ordenSugerido = ordenSugeridoRaw ? parseInt(ordenSugeridoRaw, 10) : 0

    if (!categoriaSeleccionada) {
      setErrorCrear("Debe seleccionar una categoria.")
      return
    }

    setErrorCrear(null)
    crear.mutate({
      titulo,
      texto,
      categoria: categoriaSeleccionada,
      ordenSugerido,
      esConstante,
      parametros: parametrosDraftAPayload(parametros),
    })
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setErrorCrear(null)
      setCategoriaSeleccionada("")
      setEsConstante(true)
      setParametros([])
      onCerrar()
    }
  }

  return (
    <Sheet open={abierto} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full gap-0 data-[side=right]:sm:max-w-xl">
        <form onSubmit={(e) => void handleSubmit(e)} className="flex h-full flex-col">
          <SheetHeader className="border-b border-border">
            <SheetTitle>Nueva condicion</SheetTitle>
            <SheetDescription>
              Ingresa los datos de la clausula de condicion para cotizaciones.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col gap-5">
              {errorCrear ? (
                <Alert variant="destructive">
                  <AlertTitle>No se pudo crear la condicion</AlertTitle>
                  <AlertDescription>{errorCrear}</AlertDescription>
                </Alert>
              ) : null}

              <div className="grid gap-1.5">
                <Label htmlFor="crear-titulo">
                  Titulo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="crear-titulo"
                  name="titulo"
                  placeholder="Ej. Validez de la cotizacion"
                  required
                  autoFocus
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="crear-categoria">
                  Categoria <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={categoriaSeleccionada}
                  onValueChange={(v) => setCategoriaSeleccionada(v as CategoriaCondicion)}
                >
                  <SelectTrigger id="crear-categoria">
                    <SelectValue placeholder="Seleccionar categoria..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONSIDERACIONES_SERVICIO">
                      Consideraciones del servicio
                    </SelectItem>
                    <SelectItem value="TARIFAS_INCLUYEN">Nuestras tarifas incluyen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="crear-texto">
                  Texto <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="crear-texto"
                  name="texto"
                  placeholder="Texto de la clausula. Usa {nombre_placeholder} para variables."
                  rows={5}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Usa {"{nombre_placeholder}"} para indicar variables que se reemplazaran al seleccionar la condicion en una cotizacion.
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
                    placeholder="0"
                  />
                </div>
                <div className="flex items-end gap-2 pb-0.5">
                  <Checkbox
                    id="crear-esConstante"
                    checked={esConstante}
                    onCheckedChange={(v) => setEsConstante(Boolean(v))}
                  />
                  <div className="grid gap-0.5">
                    <Label htmlFor="crear-esConstante" className="cursor-pointer">
                      Preseleccionar por defecto
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Se incluye automaticamente en nuevas cotizaciones.
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <EditorParametros drafts={parametros} onChange={setParametros} />
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
  item: CatalogoCondicion | null
  onCerrar: () => void
  onActualizado: () => void
}) {
  const [errorEditar, setErrorEditar] = useState<string | null>(null)
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<CategoriaCondicion | "">(
    item?.categoria ?? ""
  )
  const [esConstante, setEsConstante] = useState(item?.esConstante ?? true)
  const [parametros, setParametros] = useState<ParametroDraft[]>(
    item ? parametrosDraftDesde(item.parametros) : []
  )

  const actualizar = useActualizarCatalogoCondicionMutation(item?.id ?? "", {
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
    const titulo = String(formData.get("titulo") ?? "").trim()
    const texto = String(formData.get("texto") ?? "").trim()
    const ordenSugeridoRaw = String(formData.get("ordenSugerido") ?? "").trim()
    const ordenSugerido = ordenSugeridoRaw ? parseInt(ordenSugeridoRaw, 10) : 0

    if (!categoriaSeleccionada) {
      setErrorEditar("Debe seleccionar una categoria.")
      return
    }

    setErrorEditar(null)
    actualizar.mutate({
      titulo,
      texto,
      categoria: categoriaSeleccionada,
      ordenSugerido,
      esConstante,
      parametros: parametrosDraftAPayload(parametros),
    })
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setErrorEditar(null)
      onCerrar()
    }
  }

  return (
    <Sheet open={item !== null} onOpenChange={handleOpenChange} key={item?.id}>
      <SheetContent side="right" className="w-full gap-0 data-[side=right]:sm:max-w-xl">
        <form onSubmit={(e) => void handleSubmit(e)} className="flex h-full flex-col">
          <SheetHeader className="border-b border-border">
            <SheetTitle>Editar condicion</SheetTitle>
            <SheetDescription>
              Actualiza los datos de la clausula de condicion.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col gap-5">
              {errorEditar ? (
                <Alert variant="destructive">
                  <AlertTitle>No se pudo actualizar la condicion</AlertTitle>
                  <AlertDescription>{errorEditar}</AlertDescription>
                </Alert>
              ) : null}

              <div className="grid gap-1.5">
                <Label htmlFor="editar-titulo">
                  Titulo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="editar-titulo"
                  name="titulo"
                  defaultValue={item?.titulo ?? ""}
                  required
                  autoFocus
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="editar-categoria">
                  Categoria <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={categoriaSeleccionada}
                  onValueChange={(v) => setCategoriaSeleccionada(v as CategoriaCondicion)}
                >
                  <SelectTrigger id="editar-categoria">
                    <SelectValue placeholder="Seleccionar categoria..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONSIDERACIONES_SERVICIO">
                      Consideraciones del servicio
                    </SelectItem>
                    <SelectItem value="TARIFAS_INCLUYEN">Nuestras tarifas incluyen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="editar-texto">
                  Texto <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="editar-texto"
                  name="texto"
                  defaultValue={item?.texto ?? ""}
                  placeholder="Texto de la clausula. Usa {nombre_placeholder} para variables."
                  rows={5}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Usa {"{nombre_placeholder}"} para indicar variables que se reemplazaran al seleccionar la condicion en una cotizacion.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="editar-orden">Orden sugerido</Label>
                  <Input
                    id="editar-orden"
                    name="ordenSugerido"
                    type="number"
                    min={0}
                    defaultValue={item?.ordenSugerido ?? 0}
                    placeholder="0"
                  />
                </div>
                <div className="flex items-end gap-2 pb-0.5">
                  <Checkbox
                    id="editar-esConstante"
                    checked={esConstante}
                    onCheckedChange={(v) => setEsConstante(Boolean(v))}
                  />
                  <div className="grid gap-0.5">
                    <Label htmlFor="editar-esConstante" className="cursor-pointer">
                      Preseleccionar por defecto
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Se incluye automaticamente en nuevas cotizaciones.
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <EditorParametros drafts={parametros} onChange={setParametros} />
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
  item: CatalogoCondicion | null
  onCerrar: () => void
  onActualizado: () => void
}) {
  const [errorEstado, setErrorEstado] = useState<string | null>(null)

  const cambiarEstado = useCambiarEstadoCatalogoCondicionMutation(item?.id ?? "", {
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
          <AlertDialogTitle>{etiquetaAccion} condicion</AlertDialogTitle>
          <AlertDialogDescription>
            {accion === "DESACTIVAR"
              ? `La condicion "${item?.titulo}" quedara inactiva y no podra seleccionarse en nuevas cotizaciones.`
              : `La condicion "${item?.titulo}" quedara activa y podra seleccionarse en cotizaciones.`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {errorEstado ? (
          <Alert variant="destructive">
            <AlertTitle>No se pudo cambiar el estado</AlertTitle>
            <AlertDescription>{errorEstado}</AlertDescription>
          </Alert>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={cambiarEstado.isPending}>Cancelar</AlertDialogCancel>
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

function BadgeEstado({ estado }: { estado: EstadoCatalogoCondicion }) {
  return (
    <Badge variant={estado === "ACTIVO" ? "default" : "secondary"}>
      {estado === "ACTIVO" ? "Activo" : "Inactivo"}
    </Badge>
  )
}

function BadgeCategoria({ categoria }: { categoria: CategoriaCondicion }) {
  return (
    <Badge variant="outline" className="truncate text-xs">
      {ETIQUETAS_CATEGORIA[categoria]}
    </Badge>
  )
}

function BadgeConstante({ esConstante }: { esConstante: boolean }) {
  return (
    <Badge variant={esConstante ? "secondary" : "outline"} className="text-xs">
      {esConstante ? "Constante" : "Variable"}
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// Columnas de la tabla
// ---------------------------------------------------------------------------

const COLUMNAS: ColumnaTabla<CatalogoCondicion>[] = [
  {
    id: "titulo",
    encabezado: "Titulo",
    ancho: "w-[28%]",
    principal: true,
    className: "truncate",
    celda: (item) => item.titulo,
  },
  {
    id: "categoria",
    encabezado: "Categoria",
    ancho: "w-[26%]",
    celda: (item) => <BadgeCategoria categoria={item.categoria} />,
  },
  {
    id: "texto",
    encabezado: "Texto",
    className: "truncate max-w-0",
    celda: (item) => (
      <span className="block truncate text-sm text-muted-foreground" title={item.texto}>
        {item.texto}
      </span>
    ),
  },
  {
    id: "tipo",
    encabezado: "Tipo",
    ancho: "w-[10%]",
    celda: (item) => <BadgeConstante esConstante={item.esConstante} />,
  },
  {
    id: "estado",
    encabezado: "Estado",
    ancho: "w-[10%]",
    celda: (item) => <BadgeEstado estado={item.estado} />,
  },
]

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

interface PropsCatalogoCondicionesListado {
  filtros: FiltrosCatalogosCondicion
  onFiltrosChange: (f: Partial<FiltrosCatalogosCondicion>) => void
}

export function CatalogoCondicionesListado({
  filtros,
  onFiltrosChange,
}: PropsCatalogoCondicionesListado) {
  const consulta = useCatalogosCondicionQuery(filtros)
  const filas = consulta.data?.data ?? []
  const total = consulta.data?.total ?? 0
  const pagina = consulta.data?.pagina ?? filtros.pagina ?? 1
  const porPagina = consulta.data?.porPagina ?? filtros.porPagina ?? 10

  const [busquedaLocal, setBusquedaLocal] = useState(filtros.busqueda ?? "")
  const [estadoLocal, setEstadoLocal] = useState<string>(filtros.estado ?? "TODOS")
  const [categoriaLocal, setCategoriaLocal] = useState<string>(filtros.categoria ?? "TODAS")

  const [dialogCrearAbierto, setDialogCrearAbierto] = useState(false)
  const [itemEditando, setItemEditando] = useState<CatalogoCondicion | null>(null)
  const [itemCambiandoEstado, setItemCambiandoEstado] = useState<CatalogoCondicion | null>(null)

  function handleRefetch() {
    void consulta.refetch()
  }

  function aplicarFiltros() {
    onFiltrosChange({
      busqueda: busquedaLocal.trim() || undefined,
      estado: estadoLocal === "TODOS" ? undefined : (estadoLocal as EstadoCatalogoCondicion),
      categoria:
        categoriaLocal === "TODAS" ? undefined : (categoriaLocal as CategoriaCondicion),
      pagina: 1,
    })
  }

  function accionesCondicion(
    item: CatalogoCondicion,
  ): AccionTabla<CatalogoCondicion>[] {
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
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setDialogCrearAbierto(true)}>
          <Plus />
          Nueva condicion
        </Button>
      </div>

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
              placeholder="Buscar por titulo..."
              value={busquedaLocal}
              onChange={(e) => setBusquedaLocal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && aplicarFiltros()}
            />
          </div>
        </div>
        <div className="grid min-w-52 flex-1 gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Categoria</span>
          <Select value={categoriaLocal} onValueChange={setCategoriaLocal}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODAS">Todas</SelectItem>
              <SelectItem value="CONSIDERACIONES_SERVICIO">
                Consideraciones del servicio
              </SelectItem>
              <SelectItem value="TARIFAS_INCLUYEN">Nuestras tarifas incluyen</SelectItem>
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

      {/* Tabla */}
      <TablaDatos
        columnas={COLUMNAS}
        datos={filas}
        obtenerId={(item) => item.id}
        acciones={accionesCondicion}
        cargando={consulta.isLoading}
        paginacion={{
          pagina,
          porPagina,
          total,
          alCambiarPagina: (nuevaPagina) => onFiltrosChange({ pagina: nuevaPagina }),
        }}
        vacioTitulo="Sin condiciones"
        vacioDescripcion="No hay condiciones para los filtros aplicados."
      />

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
    </div>
  )
}
