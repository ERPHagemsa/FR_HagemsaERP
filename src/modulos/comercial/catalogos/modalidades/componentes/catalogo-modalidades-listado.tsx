"use client"

import { useState } from "react"
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/compartido/componentes/ui/tooltip"
import { TablaDatos } from "@/compartido/componentes/tabla-datos/tabla-datos"
import type {
  AccionTabla,
  ColumnaTabla,
} from "@/compartido/componentes/tabla-datos/tabla-datos.tipos"
import type {
  EstadoModalidad,
  FiltrosModalidades,
  Modalidad,
  Moneda,
  PayloadActualizarModalidad,
  PayloadCrearModalidad,
  TipoLinea,
  TipoModalidad,
  UnidadCobro,
} from "@/modulos/comercial/cotizaciones/tipos/cotizaciones.tipos"
import {
  etiquetaTipo,
  TIPOS_LINEA,
} from "@/modulos/comercial/cotizaciones/componentes/lineas-grid.utils"

import {
  useActualizarModalidadMutation,
  useCambiarEstadoModalidadMutation,
  useCrearModalidadMutation,
  useModalidadesQuery,
} from "../servicios/catalogo-modalidades-queries"
import {
  etiquetaMoneda,
  etiquetaUnidadCobro,
  formatearMargen,
  formatearTarifa,
  MONEDAS,
  TIPOS_MODALIDAD,
  UNIDADES_COBRO,
} from "./modalidades.utils"

// ---------------------------------------------------------------------------
// Estado inicial del formulario de crear/editar
// ---------------------------------------------------------------------------

type EstadoFormulario = {
  codigo: string
  nombre: string
  descripcion: string
  tipoLinea: TipoLinea | ""
  tipo: TipoModalidad | ""
  unidadCobro: UnidadCobro | ""
  moneda: Moneda | ""
  tarifaBaseReferencial: string
  margenPct: string
  requiereAprobacion: string // "SI" | "NO"
  documentacionRequerida: string // un documento por linea
}

// Convierte el textarea (un documento por linea) en array sin vacios ni duplicados.
function parsearDocumentacion(texto: string): string[] {
  const vistos = new Set<string>()
  const docs: string[] = []
  for (const linea of texto.split("\n")) {
    const doc = linea.trim()
    if (!doc) continue
    const clave = doc.toLowerCase()
    if (vistos.has(clave)) continue
    vistos.add(clave)
    docs.push(doc)
  }
  return docs
}

const FORMULARIO_VACIO: EstadoFormulario = {
  codigo: "",
  nombre: "",
  descripcion: "",
  tipoLinea: "",
  tipo: "",
  unidadCobro: "",
  moneda: "",
  tarifaBaseReferencial: "",
  margenPct: "",
  requiereAprobacion: "NO",
  documentacionRequerida: "",
}

function formularioDesdeModalidad(item: Modalidad): EstadoFormulario {
  return {
    codigo: item.codigo,
    nombre: item.nombre,
    descripcion: item.descripcion ?? "",
    tipoLinea: item.tipoLinea,
    tipo: item.tipo,
    unidadCobro: item.unidadCobro,
    moneda: item.moneda ?? "",
    tarifaBaseReferencial: item.tarifaBaseReferencial != null ? String(item.tarifaBaseReferencial) : "",
    margenPct: item.margenPct != null ? String(item.margenPct) : "",
    requiereAprobacion: item.requiereAprobacion ? "SI" : "NO",
    documentacionRequerida: item.documentacionRequerida.join("\n"),
  }
}

function payloadDesdeFormulario(form: EstadoFormulario): PayloadCrearModalidad | null {
  const codigo = form.codigo.trim()
  const nombre = form.nombre.trim()
  if (!codigo || !nombre || !form.tipoLinea || !form.unidadCobro) return null

  const payload: PayloadCrearModalidad = {
    codigo,
    nombre,
    tipoLinea: form.tipoLinea as TipoLinea,
    unidadCobro: form.unidadCobro as UnidadCobro,
  }

  if (form.descripcion.trim()) payload.descripcion = form.descripcion.trim()
  if (form.tipo) payload.tipo = form.tipo as TipoModalidad
  if (form.moneda) payload.moneda = form.moneda as Moneda
  if (form.tarifaBaseReferencial.trim()) {
    const n = Number(form.tarifaBaseReferencial)
    if (!isNaN(n)) payload.tarifaBaseReferencial = n
  }
  if (form.margenPct.trim()) {
    const n = Number(form.margenPct)
    if (!isNaN(n)) payload.margenPct = n
  }
  payload.requiereAprobacion = form.requiereAprobacion === "SI"
  // Siempre se envia (incluso vacio) para permitir limpiar la lista al editar.
  payload.documentacionRequerida = parsearDocumentacion(form.documentacionRequerida)

  return payload
}

// ---------------------------------------------------------------------------
// Campos del formulario compartidos
// ---------------------------------------------------------------------------

function CamposFormulario({
  form,
  onChange,
}: {
  form: EstadoFormulario
  onChange: (parcial: Partial<EstadoFormulario>) => void
}) {
  return (
    <div className="flex flex-col gap-3 py-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="form-codigo">Codigo</Label>
        <Input
          id="form-codigo"
          value={form.codigo}
          onChange={(e) => onChange({ codigo: e.target.value })}
          placeholder="Ej. TRANS-001"
          required
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="form-nombre">Nombre</Label>
        <Input
          id="form-nombre"
          value={form.nombre}
          onChange={(e) => onChange({ nombre: e.target.value })}
          placeholder="Ej. Transporte terrestre"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="form-descripcion">Descripcion (opcional)</Label>
        <Textarea
          id="form-descripcion"
          value={form.descripcion}
          onChange={(e) => onChange({ descripcion: e.target.value })}
          placeholder="Descripcion de la modalidad"
          rows={2}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Tipo de linea</Label>
        <Select
          value={form.tipoLinea}
          onValueChange={(v) => onChange({ tipoLinea: v as TipoLinea })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar tipo de linea" />
          </SelectTrigger>
          <SelectContent>
            {TIPOS_LINEA.map((t) => (
              <SelectItem key={t.valor} value={t.valor}>
                {t.etiqueta}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Unidad de cobro</Label>
        <Select
          value={form.unidadCobro}
          onValueChange={(v) => onChange({ unidadCobro: v as UnidadCobro })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar unidad de cobro" />
          </SelectTrigger>
          <SelectContent>
            {UNIDADES_COBRO.map((u) => (
              <SelectItem key={u.valor} value={u.valor}>
                {u.etiqueta}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Tipo de modalidad (opcional)</Label>
        <Select
          value={form.tipo || "NINGUNO"}
          onValueChange={(v) => onChange({ tipo: v === "NINGUNO" ? "" : (v as TipoModalidad) })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NINGUNO">Sin especificar</SelectItem>
            {TIPOS_MODALIDAD.map((t) => (
              <SelectItem key={t.valor} value={t.valor}>
                {t.etiqueta}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Moneda (opcional)</Label>
        <Select
          value={form.moneda || "NINGUNO"}
          onValueChange={(v) => onChange({ moneda: v === "NINGUNO" ? "" : (v as Moneda) })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar moneda" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NINGUNO">Sin especificar</SelectItem>
            {MONEDAS.map((m) => (
              <SelectItem key={m.valor} value={m.valor}>
                {m.etiqueta}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="form-tarifa">Tarifa base referencial (opcional)</Label>
        <Input
          id="form-tarifa"
          type="number"
          min={0}
          step="0.01"
          value={form.tarifaBaseReferencial}
          onChange={(e) => onChange({ tarifaBaseReferencial: e.target.value })}
          placeholder="0.00"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="form-margen">Margen objetivo % (opcional)</Label>
        <Input
          id="form-margen"
          type="number"
          min={0}
          step="0.01"
          value={form.margenPct}
          onChange={(e) => onChange({ margenPct: e.target.value })}
          placeholder="0.00"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Requiere aprobacion</Label>
        <Select
          value={form.requiereAprobacion}
          onValueChange={(v) => onChange({ requiereAprobacion: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NO">No</SelectItem>
            <SelectItem value="SI">Si</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="form-documentacion">Documentacion requerida (opcional)</Label>
        <Textarea
          id="form-documentacion"
          value={form.documentacionRequerida}
          onChange={(e) => onChange({ documentacionRequerida: e.target.value })}
          placeholder={"Un documento por linea. Ej:\nPermiso de transito SUTRAN\nAutorizacion de ruta\nEscolta"}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Documentos que exige esta modalidad (ej. sobredimensionado: permisos de transito,
          escolta). Uno por linea.
        </p>
      </div>
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
  const [form, setForm] = useState<EstadoFormulario>(FORMULARIO_VACIO)
  const [errorCrear, setErrorCrear] = useState<string | null>(null)

  const crear = useCrearModalidadMutation({
    onSuccess: () => {
      setErrorCrear(null)
      setForm(FORMULARIO_VACIO)
      onCreado()
      onCerrar()
    },
    onError: (err) => {
      setErrorCrear(extraerMensajeError(err))
    },
  })

  function handleCampo(parcial: Partial<EstadoFormulario>) {
    setForm((prev) => ({ ...prev, ...parcial }))
  }

  function handleConfirmar() {
    const payload = payloadDesdeFormulario(form)
    if (!payload) return
    setErrorCrear(null)
    crear.mutate(payload)
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setErrorCrear(null)
      setForm(FORMULARIO_VACIO)
      onCerrar()
    }
  }

  const payloadValido = payloadDesdeFormulario(form) !== null

  return (
    <Sheet open={abierto} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full gap-0 data-[side=right]:sm:max-w-lg">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Nueva modalidad</SheetTitle>
          <SheetDescription>
            Completa los datos para crear una nueva modalidad.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6">
          {errorCrear ? (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>No se pudo crear la modalidad</AlertTitle>
              <AlertDescription>{errorCrear}</AlertDescription>
            </Alert>
          ) : null}

          <CamposFormulario form={form} onChange={handleCampo} />
        </div>

        <Separator />
        <SheetFooter className="flex-row justify-end gap-2">
          <SheetClose asChild>
            <Button type="button" variant="outline" disabled={crear.isPending}>
              Cancelar
            </Button>
          </SheetClose>
          <Button
            onClick={handleConfirmar}
            disabled={crear.isPending || !payloadValido}
          >
            {crear.isPending ? "Creando..." : "Crear"}
          </Button>
        </SheetFooter>
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
  item: Modalidad | null
  onCerrar: () => void
  onActualizado: () => void
}) {
  const [form, setForm] = useState<EstadoFormulario>(
    item ? formularioDesdeModalidad(item) : FORMULARIO_VACIO,
  )
  const [claveActual, setClaveActual] = useState<string | null>(item?.id ?? null)
  const [errorEditar, setErrorEditar] = useState<string | null>(null)

  // Re-sincronizar el formulario cuando entra otra modalidad (o cambia el item),
  // sin useEffect: ajuste de estado durante el render, patron recomendado por React.
  const idEntrante = item?.id ?? null
  if (idEntrante !== claveActual) {
    setClaveActual(idEntrante)
    setForm(item ? formularioDesdeModalidad(item) : FORMULARIO_VACIO)
    setErrorEditar(null)
  }

  const actualizar = useActualizarModalidadMutation(item?.id ?? "", {
    onSuccess: () => {
      setErrorEditar(null)
      onActualizado()
      onCerrar()
    },
    onError: (err) => {
      setErrorEditar(extraerMensajeError(err))
    },
  })

  function handleCampo(parcial: Partial<EstadoFormulario>) {
    setForm((prev) => ({ ...prev, ...parcial }))
  }

  function handleConfirmar() {
    const payload = payloadDesdeFormulario(form)
    if (!payload) return
    // Enviar como PayloadActualizarModalidad (Partial)
    const delta: PayloadActualizarModalidad = payload
    setErrorEditar(null)
    actualizar.mutate(delta)
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setErrorEditar(null)
      onCerrar()
    }
  }

  const payloadValido = payloadDesdeFormulario(form) !== null

  return (
    <Sheet open={item !== null} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full gap-0 data-[side=right]:sm:max-w-lg">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Editar modalidad</SheetTitle>
          <SheetDescription>Actualiza los datos de la modalidad.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6">
          {errorEditar ? (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>No se pudo actualizar la modalidad</AlertTitle>
              <AlertDescription>{errorEditar}</AlertDescription>
            </Alert>
          ) : null}

          <CamposFormulario form={form} onChange={handleCampo} />
        </div>

        <Separator />
        <SheetFooter className="flex-row justify-end gap-2">
          <SheetClose asChild>
            <Button type="button" variant="outline" disabled={actualizar.isPending}>
              Cancelar
            </Button>
          </SheetClose>
          <Button
            onClick={handleConfirmar}
            disabled={actualizar.isPending || !payloadValido}
          >
            {actualizar.isPending ? "Guardando..." : "Guardar"}
          </Button>
        </SheetFooter>
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
  item: Modalidad | null
  onCerrar: () => void
  onActualizado: () => void
}) {
  const [errorEstado, setErrorEstado] = useState<string | null>(null)

  const cambiarEstado = useCambiarEstadoModalidadMutation(item?.id ?? "", {
    onSuccess: () => {
      setErrorEstado(null)
      onActualizado()
      onCerrar()
    },
    onError: (err) => {
      setErrorEstado(extraerMensajeError(err))
    },
  })

  const accion = item?.estado === "ACTIVA" ? "DESACTIVAR" : "ACTIVAR"
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
          <AlertDialogTitle>{etiquetaAccion} modalidad</AlertDialogTitle>
          <AlertDialogDescription>
            {accion === "DESACTIVAR"
              ? `La modalidad "${item?.nombre}" quedara inactiva y no podra seleccionarse en nuevas cotizaciones.`
              : `La modalidad "${item?.nombre}" quedara activa y podra seleccionarse en cotizaciones.`}
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

function BadgeEstado({ estado }: { estado: EstadoModalidad }) {
  return (
    <Badge variant={estado === "ACTIVA" ? "default" : "secondary"}>
      {estado === "ACTIVA" ? "Activa" : "Inactiva"}
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// Columnas de la tabla (la tabla generica solo las renderiza)
// ---------------------------------------------------------------------------

const COLUMNAS: ColumnaTabla<Modalidad>[] = [
  {
    id: "codigo",
    encabezado: "Codigo",
    ancho: "w-[10%]",
    className: "truncate tabular-nums",
    celda: (item) => item.codigo,
  },
  {
    id: "nombre",
    encabezado: "Nombre",
    ancho: "w-[19%]",
    principal: true,
    celda: (item) => (
      <div className="flex items-center gap-1.5">
        <span className="truncate">{item.nombre}</span>
        {item.documentacionRequerida.length > 0 ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="shrink-0 font-normal">
                {item.documentacionRequerida.length} doc.
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <ul className="list-disc pl-4">
                {item.documentacionRequerida.map((doc, i) => (
                  <li key={i}>{doc}</li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>
    ),
  },
  {
    id: "tipoLinea",
    encabezado: "Tipo de linea",
    ancho: "w-[13%]",
    className: "truncate",
    celda: (item) => etiquetaTipo(item.tipoLinea),
  },
  {
    id: "unidadCobro",
    encabezado: "Unidad de cobro",
    ancho: "w-[12%]",
    className: "truncate",
    celda: (item) => etiquetaUnidadCobro(item.unidadCobro),
  },
  {
    id: "tarifa",
    encabezado: "Tarifa base",
    ancho: "w-[12%]",
    alineacion: "derecha",
    className: "tabular-nums text-foreground",
    celda: (item) => formatearTarifa(item.tarifaBaseReferencial),
  },
  {
    id: "margen",
    encabezado: "Margen",
    ancho: "w-[9%]",
    alineacion: "derecha",
    className: "tabular-nums text-foreground",
    celda: (item) => formatearMargen(item.margenPct),
  },
  {
    id: "moneda",
    encabezado: "Moneda",
    ancho: "w-[8%]",
    celda: (item) => etiquetaMoneda(item.moneda),
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

interface PropsCatalogoModalidadesListado {
  filtros: FiltrosModalidades
  onFiltrosChange: (f: Partial<FiltrosModalidades>) => void
}

export function CatalogoModalidadesListado({
  filtros,
  onFiltrosChange,
}: PropsCatalogoModalidadesListado) {
  const consulta = useModalidadesQuery(filtros)
  const filas = consulta.data?.data ?? []
  const total = consulta.data?.total ?? 0
  const pagina = consulta.data?.pagina ?? filtros.pagina ?? 1
  const porPagina = consulta.data?.porPagina ?? filtros.porPagina ?? 10

  const [busquedaLocal, setBusquedaLocal] = useState(filtros.busqueda ?? "")
  const [estadoLocal, setEstadoLocal] = useState<string>(filtros.estado ?? "TODOS")
  const [tipoLineaLocal, setTipoLineaLocal] = useState<string>(filtros.tipoLinea ?? "TODOS")
  const [tipoLocal, setTipoLocal] = useState<string>(filtros.tipo ?? "TODOS")

  const [dialogCrearAbierto, setDialogCrearAbierto] = useState(false)
  const [itemEditando, setItemEditando] = useState<Modalidad | null>(null)
  const [itemCambiandoEstado, setItemCambiandoEstado] = useState<Modalidad | null>(null)

  function handleRefetch() {
    void consulta.refetch()
  }

  function aplicarFiltros() {
    onFiltrosChange({
      busqueda: busquedaLocal.trim() || undefined,
      estado: estadoLocal === "TODOS" ? undefined : (estadoLocal as EstadoModalidad),
      tipoLinea: tipoLineaLocal === "TODOS" ? undefined : (tipoLineaLocal as TipoLinea),
      tipo: tipoLocal === "TODOS" ? undefined : (tipoLocal as TipoModalidad),
      pagina: 1,
    })
  }

  function accionesModalidad(item: Modalidad): AccionTabla<Modalidad>[] {
    return [
      {
        etiqueta: "Editar",
        icono: Pencil,
        alSeleccionar: () => setItemEditando(item),
      },
      {
        etiqueta: item.estado === "ACTIVA" ? "Desactivar" : "Activar",
        icono: item.estado === "ACTIVA" ? CircleX : CircleCheck,
        alSeleccionar: () => setItemCambiandoEstado(item),
      },
    ]
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <CardTitle>Modalidades</CardTitle>
          <Button onClick={() => setDialogCrearAbierto(true)}>
            <Plus />
            Nueva modalidad
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
          <div className="grid min-w-56 flex-1 gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Busqueda</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar por codigo o nombre..."
                value={busquedaLocal}
                onChange={(e) => setBusquedaLocal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && aplicarFiltros()}
              />
            </div>
          </div>
          <div className="grid min-w-36 gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Estado</span>
            <Select value={estadoLocal} onValueChange={setEstadoLocal}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="ACTIVA">Activa</SelectItem>
                <SelectItem value="INACTIVA">Inactiva</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid min-w-44 gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Tipo de linea</span>
            <Select value={tipoLineaLocal} onValueChange={setTipoLineaLocal}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                {TIPOS_LINEA.map((t) => (
                  <SelectItem key={t.valor} value={t.valor}>
                    {t.etiqueta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid min-w-36 gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Tipo</span>
            <Select value={tipoLocal} onValueChange={setTipoLocal}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                {TIPOS_MODALIDAD.map((t) => (
                  <SelectItem key={t.valor} value={t.valor}>
                    {t.etiqueta}
                  </SelectItem>
                ))}
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
          acciones={accionesModalidad}
          cargando={consulta.isLoading}
          paginacion={{
            pagina,
            porPagina,
            total,
            alCambiarPagina: (nuevaPagina) => onFiltrosChange({ pagina: nuevaPagina }),
          }}
          vacioTitulo="Sin modalidades"
          vacioDescripcion="No hay modalidades para los filtros aplicados."
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
