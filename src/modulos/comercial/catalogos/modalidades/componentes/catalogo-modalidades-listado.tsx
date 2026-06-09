"use client"

import { useState } from "react"
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
  margenObjetivo: string
  requiereAprobacion: string // "SI" | "NO"
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
  margenObjetivo: "",
  requiereAprobacion: "NO",
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
    margenObjetivo: item.margenObjetivo != null ? String(item.margenObjetivo) : "",
    requiereAprobacion: item.requiereAprobacion ? "SI" : "NO",
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
  if (form.margenObjetivo.trim()) {
    const n = Number(form.margenObjetivo)
    if (!isNaN(n)) payload.margenObjetivo = n
  }
  payload.requiereAprobacion = form.requiereAprobacion === "SI"

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
          max={100}
          step="0.01"
          value={form.margenObjetivo}
          onChange={(e) => onChange({ margenObjetivo: e.target.value })}
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

  const totalPaginas = Math.max(1, Math.ceil(total / porPagina))
  const desdeVisible = total ? (pagina - 1) * porPagina + 1 : 0
  const hastaVisible = Math.min(pagina * porPagina, total)

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

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Modalidades</CardTitle>
            <CardDescription>
              {total} {total === 1 ? "registro" : "registros"} encontrados
            </CardDescription>
          </div>
          <Button onClick={() => setDialogCrearAbierto(true)}>
            <Plus />
            Nueva modalidad
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
        <div className="overflow-hidden rounded-xl border border-border">
          <Table className="w-full table-fixed [&_td]:px-2 [&_th]:px-2">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[10%]">Codigo</TableHead>
                <TableHead className="w-[22%]">Nombre</TableHead>
                <TableHead className="w-[16%]">Tipo de linea</TableHead>
                <TableHead className="w-[15%]">Unidad de cobro</TableHead>
                <TableHead className="w-[9%]">Moneda</TableHead>
                <TableHead className="w-[12%]">Estado</TableHead>
                <TableHead className="w-[12%] text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consulta.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-7 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                    No hay modalidades para los filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : (
                filas.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="truncate font-mono text-sm">{item.codigo}</TableCell>
                    <TableCell className="truncate text-sm font-medium">{item.nombre}</TableCell>
                    <TableCell className="truncate text-sm">{etiquetaTipo(item.tipoLinea)}</TableCell>
                    <TableCell className="truncate text-sm">
                      {etiquetaUnidadCobro(item.unidadCobro)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {etiquetaMoneda(item.moneda)}
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
                          aria-label={item.estado === "ACTIVA" ? "Desactivar" : "Activar"}
                        >
                          {item.estado === "ACTIVA" ? <PowerOff /> : <Power />}
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
