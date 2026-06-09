"use client"

import { useState } from "react"
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
    <AlertDialog open={abierto} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>Nueva modalidad</AlertDialogTitle>
          <AlertDialogDescription>
            Completa los datos para crear una nueva modalidad.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {errorCrear ? (
          <div className="py-2">
            <Alert variant="destructive">
              <AlertTitle>No se pudo crear la modalidad</AlertTitle>
              <AlertDescription>{errorCrear}</AlertDescription>
            </Alert>
          </div>
        ) : null}

        <CamposFormulario form={form} onChange={handleCampo} />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={crear.isPending} type="button">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmar}
            disabled={crear.isPending || !payloadValido}
          >
            {crear.isPending ? "Creando..." : "Crear"}
          </AlertDialogAction>
        </AlertDialogFooter>
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
  item: Modalidad | null
  onCerrar: () => void
  onActualizado: () => void
}) {
  const [form, setForm] = useState<EstadoFormulario>(
    item ? formularioDesdeModalidad(item) : FORMULARIO_VACIO,
  )
  const [errorEditar, setErrorEditar] = useState<string | null>(null)

  // Sincronizar cuando se abre con un item diferente
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

  // Re-inicializar formulario cuando cambia el item
  const itemId = item?.id
  const payloadValido = payloadDesdeFormulario(form) !== null

  return (
    <AlertDialog
      open={item !== null}
      onOpenChange={handleOpenChange}
      key={itemId}
    >
      <AlertDialogContent className="max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>Editar modalidad</AlertDialogTitle>
          <AlertDialogDescription>
            Actualiza los datos de la modalidad.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {errorEditar ? (
          <div className="py-2">
            <Alert variant="destructive">
              <AlertTitle>No se pudo actualizar la modalidad</AlertTitle>
              <AlertDescription>{errorEditar}</AlertDescription>
            </Alert>
          </div>
        ) : null}

        <CamposFormulario form={form} onChange={handleCampo} />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={actualizar.isPending} type="button">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmar}
            disabled={actualizar.isPending || !payloadValido}
          >
            {actualizar.isPending ? "Guardando..." : "Guardar"}
          </AlertDialogAction>
        </AlertDialogFooter>
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
// Acciones por fila
// ---------------------------------------------------------------------------

function AccionesFila({
  item,
  onEditar,
  onCambiarEstado,
}: {
  item: Modalidad
  onEditar: (item: Modalidad) => void
  onCambiarEstado: (item: Modalidad) => void
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
          {item.estado === "ACTIVA" ? (
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

function BadgeEstado({ estado }: { estado: EstadoModalidad }) {
  return (
    <Badge variant={estado === "ACTIVA" ? "outline" : "secondary"}>
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
  const limite = consulta.data?.porPagina ?? filtros.porPagina ?? 10

  const [dialogCrearAbierto, setDialogCrearAbierto] = useState(false)
  const [itemEditando, setItemEditando] = useState<Modalidad | null>(null)
  const [itemCambiandoEstado, setItemCambiandoEstado] = useState<Modalidad | null>(null)

  function handleRefetch() {
    void consulta.refetch()
  }

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
      {/* Cabecera */}
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold">Modalidades</h2>
          <p className="text-sm text-muted-foreground">
            Maestro de modalidades disponibles para cotizaciones.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="w-fit">
            {total} registros
          </Badge>
          <Button size="sm" onClick={() => setDialogCrearAbierto(true)}>
            <Plus className="size-4" />
            Nueva modalidad
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
      <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filtros.busqueda ?? ""}
            onChange={(e) =>
              onFiltrosChange({ busqueda: e.target.value || undefined, pagina: 1 })
            }
            placeholder="Buscar por codigo o nombre"
            className="pl-9"
          />
        </div>

        <Select
          value={filtros.estado ?? "TODOS"}
          onValueChange={(value) =>
            onFiltrosChange({
              estado: value === "TODOS" ? undefined : (value as EstadoModalidad),
              pagina: 1,
            })
          }
        >
          <SelectTrigger className="lg:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Estado: todos</SelectItem>
            <SelectItem value="ACTIVA">Activa</SelectItem>
            <SelectItem value="INACTIVA">Inactiva</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filtros.tipoLinea ?? "TODOS"}
          onValueChange={(value) =>
            onFiltrosChange({
              tipoLinea: value === "TODOS" ? undefined : (value as TipoLinea),
              pagina: 1,
            })
          }
        >
          <SelectTrigger className="lg:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Tipo linea: todos</SelectItem>
            {TIPOS_LINEA.map((t) => (
              <SelectItem key={t.valor} value={t.valor}>
                {t.etiqueta}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filtros.tipo ?? "TODOS"}
          onValueChange={(value) =>
            onFiltrosChange({
              tipo: value === "TODOS" ? undefined : (value as TipoModalidad),
              pagina: 1,
            })
          }
        >
          <SelectTrigger className="lg:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Tipo: todos</SelectItem>
            {TIPOS_MODALIDAD.map((t) => (
              <SelectItem key={t.valor} value={t.valor}>
                {t.etiqueta}
              </SelectItem>
            ))}
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
          No hay modalidades para los filtros aplicados.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">Acciones</TableHead>
                <TableHead>Codigo</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo de linea</TableHead>
                <TableHead>Unidad de cobro</TableHead>
                <TableHead>Moneda</TableHead>
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
                    <span className="font-mono text-sm">{item.codigo}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{item.nombre}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{etiquetaTipo(item.tipoLinea)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{etiquetaUnidadCobro(item.unidadCobro)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {etiquetaMoneda(item.moneda)}
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
