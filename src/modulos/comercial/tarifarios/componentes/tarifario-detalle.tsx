"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Ban, CalendarClock, Pencil, Plus, Trash2 } from "lucide-react"

import { extraerMensajeError } from "@/compartido/api/formato-error"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/compartido/componentes/ui/alert"
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
import { Skeleton } from "@/compartido/componentes/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table"
import { useModalidadesQuery } from "@/modulos/comercial/catalogos/modalidades/servicios/catalogo-modalidades-queries"
import { useConsultarCotizacion } from "@/modulos/comercial/cotizaciones/servicios/cotizaciones-queries"
import { CrearContratoDesdeTarifario } from "@/modulos/comercial/contratos/componentes/crear-contrato-desde-tarifario"
import { useContratoDetalleQuery } from "@/modulos/comercial/contratos/servicios/contratos-queries"

import {
  useActualizarCargoMutation,
  useActualizarTarifaMutation,
  useAgregarCargoMutation,
  useAgregarTarifaMutation,
  useAnularTarifarioMutation,
  useEliminarCargoMutation,
  useEliminarTarifaMutation,
  useEstablecerVigenciaMutation,
  useTarifarioDetalleQuery,
} from "../servicios/tarifarios-queries"
import {
  etiquetaEstadoTarifario,
  etiquetaTipoOrigen,
  UNIDADES_COBRO,
  type PayloadTarifa,
  type PayloadTarifaCargo,
  type Tarifa,
  type TarifaCargo,
} from "../tipos/tarifarios.tipos"

type FormTarifa = {
  idModalidad: string
  origen: string
  destino: string
  tipoVehiculo: string
  condicion: string
  precio: string
  tarifaStandbyDia: string
}

const FORM_VACIO: FormTarifa = {
  idModalidad: "",
  origen: "",
  destino: "",
  tipoVehiculo: "",
  condicion: "",
  precio: "",
  tarifaStandbyDia: "",
}

function formDesdeTarifa(t: Tarifa): FormTarifa {
  return {
    idModalidad: t.idModalidad,
    origen: t.origen ?? "",
    destino: t.destino ?? "",
    tipoVehiculo: t.tipoVehiculo ?? "",
    condicion: t.condicion ?? "",
    precio: String(t.precio),
    tarifaStandbyDia: t.tarifaStandbyDia != null ? String(t.tarifaStandbyDia) : "",
  }
}

function payloadDesdeForm(form: FormTarifa): PayloadTarifa | null {
  const precio = Number(form.precio)
  if (!form.idModalidad || form.precio.trim() === "" || isNaN(precio) || precio < 0) {
    return null
  }
  const payload: PayloadTarifa = { idModalidad: form.idModalidad, precio }
  if (form.origen.trim()) payload.origen = form.origen.trim()
  if (form.destino.trim()) payload.destino = form.destino.trim()
  if (form.tipoVehiculo.trim()) payload.tipoVehiculo = form.tipoVehiculo.trim()
  if (form.condicion.trim()) payload.condicion = form.condicion.trim()
  if (form.tarifaStandbyDia.trim()) {
    const sb = Number(form.tarifaStandbyDia)
    if (!isNaN(sb)) payload.tarifaStandbyDia = sb
  }
  return payload
}

function CamposTarifa({
  form,
  onChange,
  modalidades,
}: {
  form: FormTarifa
  onChange: (parcial: Partial<FormTarifa>) => void
  modalidades: { id: string; nombre: string; codigo: string }[]
}) {
  return (
    <div className="flex flex-col gap-3 py-4">
      <div className="flex flex-col gap-1.5">
        <Label>Modalidad</Label>
        <Select
          value={form.idModalidad}
          onValueChange={(v) => onChange({ idModalidad: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar modalidad" />
          </SelectTrigger>
          <SelectContent>
            {modalidades.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.nombre} ({m.codigo})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="t-origen">Origen</Label>
          <Input
            id="t-origen"
            value={form.origen}
            onChange={(e) => onChange({ origen: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="t-destino">Destino</Label>
          <Input
            id="t-destino"
            value={form.destino}
            onChange={(e) => onChange({ destino: e.target.value })}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="t-vehiculo">Tipo de vehiculo</Label>
        <Input
          id="t-vehiculo"
          value={form.tipoVehiculo}
          onChange={(e) => onChange({ tipoVehiculo: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="t-condicion">Condicion</Label>
        <Input
          id="t-condicion"
          value={form.condicion}
          onChange={(e) => onChange({ condicion: e.target.value })}
          placeholder="Ej. Hasta 2 puntos de descarga"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="t-precio">Precio</Label>
          <Input
            id="t-precio"
            type="number"
            min={0}
            step="0.01"
            value={form.precio}
            onChange={(e) => onChange({ precio: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="t-standby">Standby/dia</Label>
          <Input
            id="t-standby"
            type="number"
            min={0}
            step="0.01"
            value={form.tarifaStandbyDia}
            onChange={(e) => onChange({ tarifaStandbyDia: e.target.value })}
          />
        </div>
      </div>
    </div>
  )
}

type FormCargo = {
  idModalidad: string
  concepto: string
  unidadCobro: string
  origen: string
  destino: string
  condicion: string
  precio: string
  tarifaStandbyDia: string
}

const FORM_CARGO_VACIO: FormCargo = {
  idModalidad: "",
  concepto: "",
  unidadCobro: "SERVICIO",
  origen: "",
  destino: "",
  condicion: "",
  precio: "",
  tarifaStandbyDia: "",
}

function formDesdeCargo(c: TarifaCargo): FormCargo {
  return {
    idModalidad: c.idModalidad,
    concepto: c.concepto,
    unidadCobro: c.unidadCobro,
    origen: c.origen ?? "",
    destino: c.destino ?? "",
    condicion: c.condicion ?? "",
    precio: String(c.precio),
    tarifaStandbyDia: c.tarifaStandbyDia != null ? String(c.tarifaStandbyDia) : "",
  }
}

function payloadCargoDesdeForm(form: FormCargo): PayloadTarifaCargo | null {
  const precio = Number(form.precio)
  if (
    !form.idModalidad ||
    form.concepto.trim() === "" ||
    !form.unidadCobro ||
    form.precio.trim() === "" ||
    isNaN(precio) ||
    precio < 0
  ) {
    return null
  }
  const payload: PayloadTarifaCargo = {
    idModalidad: form.idModalidad,
    concepto: form.concepto.trim(),
    unidadCobro: form.unidadCobro,
    precio,
  }
  if (form.origen.trim()) payload.origen = form.origen.trim()
  if (form.destino.trim()) payload.destino = form.destino.trim()
  if (form.condicion.trim()) payload.condicion = form.condicion.trim()
  if (form.tarifaStandbyDia.trim()) {
    const sb = Number(form.tarifaStandbyDia)
    if (!isNaN(sb)) payload.tarifaStandbyDia = sb
  }
  return payload
}

function CamposCargo({
  form,
  onChange,
  modalidades,
}: {
  form: FormCargo
  onChange: (parcial: Partial<FormCargo>) => void
  modalidades: { id: string; nombre: string; codigo: string }[]
}) {
  return (
    <div className="flex flex-col gap-3 py-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="c-concepto">Concepto</Label>
        <Input
          id="c-concepto"
          value={form.concepto}
          onChange={(e) => onChange({ concepto: e.target.value })}
          placeholder="Ej. Escolta, Movilizacion, Estudio de ruta"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Modalidad</Label>
          <Select
            value={form.idModalidad}
            onValueChange={(v) => onChange({ idModalidad: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar modalidad" />
            </SelectTrigger>
            <SelectContent>
              {modalidades.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.nombre} ({m.codigo})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Unidad de cobro</Label>
          <Select
            value={form.unidadCobro}
            onValueChange={(v) => onChange({ unidadCobro: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar unidad" />
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
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="c-origen">Origen</Label>
          <Input
            id="c-origen"
            value={form.origen}
            onChange={(e) => onChange({ origen: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="c-destino">Destino</Label>
          <Input
            id="c-destino"
            value={form.destino}
            onChange={(e) => onChange({ destino: e.target.value })}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="c-condicion">Condicion</Label>
        <Input
          id="c-condicion"
          value={form.condicion}
          onChange={(e) => onChange({ condicion: e.target.value })}
          placeholder="Ej. Por evento"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="c-precio">Precio</Label>
          <Input
            id="c-precio"
            type="number"
            min={0}
            step="0.01"
            value={form.precio}
            onChange={(e) => onChange({ precio: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="c-standby">Standby/dia</Label>
          <Input
            id="c-standby"
            type="number"
            min={0}
            step="0.01"
            value={form.tarifaStandbyDia}
            onChange={(e) => onChange({ tarifaStandbyDia: e.target.value })}
          />
        </div>
      </div>
    </div>
  )
}

interface Props {
  idTarifario: string
}

export function TarifarioDetalle({ idTarifario }: Props) {
  const consulta = useTarifarioDetalleQuery(idTarifario)
  const tarifario = consulta.data
  const modalidadesQuery = useModalidadesQuery({ estado: "ACTIVA", porPagina: 200 })
  const modalidades = (modalidadesQuery.data?.data ?? []).map((m) => ({
    id: m.id,
    nombre: m.nombre,
    codigo: m.codigo,
  }))
  const nombreModalidad = (id: string) =>
    modalidades.find((m) => m.id === id)?.nombre ?? id

  // Código de la cotización origen (COT-AAAA-NNNNN) en vez del UUID.
  const cotizacionOrigenQuery = useConsultarCotizacion(
    tarifario?.idCotizacionOrigen ?? "",
  )
  const codigoCotizacionOrigen =
    cotizacionOrigenQuery.data?.codigoCotizacion ?? null

  // Código del contrato vinculado (CONT-AAAA-N) en vez del UUID.
  const contratoQuery = useContratoDetalleQuery(tarifario?.idContrato ?? "")
  const codigoContratoVinculado = contratoQuery.data?.codigoContrato ?? null

  const [agregarAbierto, setAgregarAbierto] = useState(false)
  const [tarifaEditando, setTarifaEditando] = useState<Tarifa | null>(null)
  const [tarifaEliminando, setTarifaEliminando] = useState<Tarifa | null>(null)
  const [agregarCargoAbierto, setAgregarCargoAbierto] = useState(false)
  const [cargoEditando, setCargoEditando] = useState<TarifaCargo | null>(null)
  const [cargoEliminando, setCargoEliminando] = useState<TarifaCargo | null>(null)
  const [anularAbierto, setAnularAbierto] = useState(false)
  const [editarVigenciaAbierto, setEditarVigenciaAbierto] = useState(false)

  const vigente = tarifario?.estado === "VIGENTE"
  // El contrato nace del tarifario: solo si esta vigente, tiene cliente y aun no
  // pertenece a un contrato.
  const puedeCrearContrato =
    vigente &&
    Boolean(tarifario?.idClienteExterno) &&
    !tarifario?.idContrato

  if (consulta.isLoading) {
    return <Skeleton className="h-96 w-full" />
  }

  if (consulta.error || !tarifario) {
    return (
      <Alert variant="destructive">
        <AlertTitle>No se pudo cargar el tarifario</AlertTitle>
        <AlertDescription>
          {consulta.error ? extraerMensajeError(consulta.error) : "No encontrado."}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/comercial/tarifarios">
            <ArrowLeft />
            Tarifarios
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          {puedeCrearContrato ? (
            <CrearContratoDesdeTarifario idTarifario={idTarifario} />
          ) : null}
          {tarifario.idContrato ? (
            <Button variant="outline" asChild>
              <Link href={`/comercial/contratos/${tarifario.idContrato}`}>
                Ver contrato
              </Link>
            </Button>
          ) : null}
          {vigente ? (
            <Button
              variant="outline"
              onClick={() => setEditarVigenciaAbierto(true)}
            >
              <CalendarClock />
              Editar vigencia
            </Button>
          ) : null}
          {vigente ? (
            <Button variant="outline" onClick={() => setAnularAbierto(true)}>
              <Ban />
              Anular tarifario
            </Button>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Tarifario</CardTitle>
            <Badge variant={vigente ? "default" : "secondary"}>
              {etiquetaEstadoTarifario(tarifario.estado)}
            </Badge>
          </div>
          <CardDescription>
            {etiquetaTipoOrigen(tarifario.tipoOrigen)} · {tarifario.moneda}
            {tarifario.nombreClienteExterno ?? tarifario.idClienteExterno
              ? ` · Cliente ${tarifario.nombreClienteExterno ?? tarifario.idClienteExterno}`
              : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 pt-5 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Cotizacion origen</p>
            <p className="truncate">
              {!tarifario.idCotizacionOrigen
                ? "—"
                : (codigoCotizacionOrigen ??
                  (cotizacionOrigenQuery.isLoading
                    ? "Cargando…"
                    : tarifario.idCotizacionOrigen))}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Contrato</p>
            <p className="truncate">
              {!tarifario.idContrato
                ? "—"
                : (codigoContratoVinculado ??
                  (contratoQuery.isLoading ? "Cargando…" : tarifario.idContrato))}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Vigencia</p>
            <p>
              {tarifario.vigenciaInicio
                ? new Date(tarifario.vigenciaInicio).toLocaleDateString("es-PE")
                : "—"}
              {" → "}
              {tarifario.vigenciaFin
                ? new Date(tarifario.vigenciaFin).toLocaleDateString("es-PE")
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tarifas</p>
            <p>{tarifario.tarifas.length}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Tarifas</CardTitle>
            {vigente ? (
              <Button size="sm" onClick={() => setAgregarAbierto(true)}>
                <Plus />
                Agregar tarifa
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="overflow-hidden rounded-xl border border-border">
            <Table className="w-full [&_td]:px-2 [&_th]:px-2">
              <TableHeader>
                <TableRow>
                  <TableHead>Modalidad</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Vehiculo</TableHead>
                  <TableHead>Condicion</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Standby</TableHead>
                  {vigente ? <TableHead className="text-center">Acciones</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tarifario.tarifas.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={vigente ? 8 : 7}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Sin tarifas. {vigente ? "Agrega la primera." : ""}
                    </TableCell>
                  </TableRow>
                ) : (
                  tarifario.tarifas.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-sm">{nombreModalidad(t.idModalidad)}</TableCell>
                      <TableCell className="text-sm">{t.origen ?? "—"}</TableCell>
                      <TableCell className="text-sm">{t.destino ?? "—"}</TableCell>
                      <TableCell className="text-sm">{t.tipoVehiculo ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {t.condicion ?? "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {t.precio.toLocaleString("es-PE")}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {t.tarifaStandbyDia != null
                          ? t.tarifaStandbyDia.toLocaleString("es-PE")
                          : "—"}
                      </TableCell>
                      {vigente ? (
                        <TableCell>
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              size="icon-sm"
                              variant="outline"
                              aria-label="Editar"
                              onClick={() => setTarifaEditando(t)}
                            >
                              <Pencil />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="outline"
                              aria-label="Eliminar"
                              onClick={() => setTarifaEliminando(t)}
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Cargos adicionales</CardTitle>
              <CardDescription>
                Accesorios derivados de la cotizacion (los de nivel seccion usan
                la modalidad SIN_MODALIDAD).
              </CardDescription>
            </div>
            {vigente ? (
              <Button size="sm" onClick={() => setAgregarCargoAbierto(true)}>
                <Plus />
                Agregar cargo
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="overflow-hidden rounded-xl border border-border">
            <Table className="w-full [&_td]:px-2 [&_th]:px-2">
              <TableHeader>
                <TableRow>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Modalidad</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Condicion</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Standby</TableHead>
                  {vigente ? <TableHead className="text-center">Acciones</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tarifario.cargos.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={vigente ? 9 : 8}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Sin cargos adicionales. {vigente ? "Agrega el primero." : ""}
                    </TableCell>
                  </TableRow>
                ) : (
                  tarifario.cargos.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-sm">{c.concepto}</TableCell>
                      <TableCell className="text-sm">
                        {nombreModalidad(c.idModalidad)}
                      </TableCell>
                      <TableCell className="text-sm">{c.origen ?? "—"}</TableCell>
                      <TableCell className="text-sm">{c.destino ?? "—"}</TableCell>
                      <TableCell className="text-sm">{c.unidadCobro}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.condicion ?? "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {c.precio.toLocaleString("es-PE")}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {c.tarifaStandbyDia != null
                          ? c.tarifaStandbyDia.toLocaleString("es-PE")
                          : "—"}
                      </TableCell>
                      {vigente ? (
                        <TableCell>
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              size="icon-sm"
                              variant="outline"
                              aria-label="Editar"
                              onClick={() => setCargoEditando(c)}
                            >
                              <Pencil />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="outline"
                              aria-label="Eliminar"
                              onClick={() => setCargoEliminando(c)}
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <SheetAgregarTarifa
        idTarifario={idTarifario}
        abierto={agregarAbierto}
        onCerrar={() => setAgregarAbierto(false)}
        modalidades={modalidades}
      />
      <SheetEditarTarifa
        idTarifario={idTarifario}
        tarifa={tarifaEditando}
        onCerrar={() => setTarifaEditando(null)}
        modalidades={modalidades}
      />
      <DialogEliminarTarifa
        idTarifario={idTarifario}
        tarifa={tarifaEliminando}
        onCerrar={() => setTarifaEliminando(null)}
      />
      <SheetAgregarCargo
        idTarifario={idTarifario}
        abierto={agregarCargoAbierto}
        onCerrar={() => setAgregarCargoAbierto(false)}
        modalidades={modalidades}
      />
      <SheetEditarCargo
        idTarifario={idTarifario}
        cargo={cargoEditando}
        onCerrar={() => setCargoEditando(null)}
        modalidades={modalidades}
      />
      <DialogEliminarCargo
        idTarifario={idTarifario}
        cargo={cargoEliminando}
        onCerrar={() => setCargoEliminando(null)}
      />
      <DialogEditarVigencia
        idTarifario={idTarifario}
        abierto={editarVigenciaAbierto}
        vigenciaInicio={tarifario.vigenciaInicio}
        vigenciaFin={tarifario.vigenciaFin}
        onCerrar={() => setEditarVigenciaAbierto(false)}
      />
      <DialogAnular
        idTarifario={idTarifario}
        abierto={anularAbierto}
        onCerrar={() => setAnularAbierto(false)}
      />
    </div>
  )
}

function SheetAgregarTarifa({
  idTarifario,
  abierto,
  onCerrar,
  modalidades,
}: {
  idTarifario: string
  abierto: boolean
  onCerrar: () => void
  modalidades: { id: string; nombre: string; codigo: string }[]
}) {
  const [form, setForm] = useState<FormTarifa>(FORM_VACIO)
  const [error, setError] = useState<string | null>(null)
  const agregar = useAgregarTarifaMutation(idTarifario, {
    onSuccess: () => {
      setError(null)
      setForm(FORM_VACIO)
      onCerrar()
    },
    onError: (err) => setError(extraerMensajeError(err)),
  })

  function handleConfirmar() {
    const payload = payloadDesdeForm(form)
    if (!payload) return
    setError(null)
    agregar.mutate(payload)
  }

  return (
    <Sheet
      open={abierto}
      onOpenChange={(o) => {
        if (!o) {
          setError(null)
          setForm(FORM_VACIO)
          onCerrar()
        }
      }}
    >
      <SheetContent side="right" className="w-full gap-0 data-[side=right]:sm:max-w-lg">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Agregar tarifa</SheetTitle>
          <SheetDescription>Define la ruta, modalidad y precio.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6">
          {error ? (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>No se pudo agregar</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <CamposTarifa
            form={form}
            onChange={(p) => setForm((prev) => ({ ...prev, ...p }))}
            modalidades={modalidades}
          />
        </div>
        <Separator />
        <SheetFooter className="flex-row justify-end gap-2">
          <SheetClose asChild>
            <Button variant="outline" disabled={agregar.isPending}>
              Cancelar
            </Button>
          </SheetClose>
          <Button
            onClick={handleConfirmar}
            disabled={agregar.isPending || payloadDesdeForm(form) === null}
          >
            {agregar.isPending ? "Agregando..." : "Agregar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function SheetEditarTarifa({
  idTarifario,
  tarifa,
  onCerrar,
  modalidades,
}: {
  idTarifario: string
  tarifa: Tarifa | null
  onCerrar: () => void
  modalidades: { id: string; nombre: string; codigo: string }[]
}) {
  const [form, setForm] = useState<FormTarifa>(tarifa ? formDesdeTarifa(tarifa) : FORM_VACIO)
  const [claveActual, setClaveActual] = useState<string | null>(tarifa?.id ?? null)
  const [error, setError] = useState<string | null>(null)

  const idEntrante = tarifa?.id ?? null
  if (idEntrante !== claveActual) {
    setClaveActual(idEntrante)
    setForm(tarifa ? formDesdeTarifa(tarifa) : FORM_VACIO)
    setError(null)
  }

  const actualizar = useActualizarTarifaMutation(idTarifario, tarifa?.id ?? "", {
    onSuccess: () => {
      setError(null)
      onCerrar()
    },
    onError: (err) => setError(extraerMensajeError(err)),
  })

  function handleConfirmar() {
    const payload = payloadDesdeForm(form)
    if (!payload) return
    setError(null)
    actualizar.mutate(payload)
  }

  return (
    <Sheet open={tarifa !== null} onOpenChange={(o) => !o && onCerrar()}>
      <SheetContent side="right" className="w-full gap-0 data-[side=right]:sm:max-w-lg">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Editar tarifa</SheetTitle>
          <SheetDescription>Ajusta la condicion, el precio u otros campos.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6">
          {error ? (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>No se pudo actualizar</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <CamposTarifa
            form={form}
            onChange={(p) => setForm((prev) => ({ ...prev, ...p }))}
            modalidades={modalidades}
          />
        </div>
        <Separator />
        <SheetFooter className="flex-row justify-end gap-2">
          <SheetClose asChild>
            <Button variant="outline" disabled={actualizar.isPending}>
              Cancelar
            </Button>
          </SheetClose>
          <Button
            onClick={handleConfirmar}
            disabled={actualizar.isPending || payloadDesdeForm(form) === null}
          >
            {actualizar.isPending ? "Guardando..." : "Guardar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function DialogEliminarTarifa({
  idTarifario,
  tarifa,
  onCerrar,
}: {
  idTarifario: string
  tarifa: Tarifa | null
  onCerrar: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const eliminar = useEliminarTarifaMutation(idTarifario, tarifa?.id ?? "", {
    onSuccess: () => {
      setError(null)
      onCerrar()
    },
    onError: (err) => setError(extraerMensajeError(err)),
  })

  return (
    <AlertDialog open={tarifa !== null} onOpenChange={(o) => !o && onCerrar()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Quitar tarifa</AlertDialogTitle>
          <AlertDialogDescription>
            Se quitara la tarifa del tarifario. Esta accion no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>No se pudo quitar</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={eliminar.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => eliminar.mutate()} disabled={eliminar.isPending}>
            {eliminar.isPending ? "Quitando..." : "Quitar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function SheetAgregarCargo({
  idTarifario,
  abierto,
  onCerrar,
  modalidades,
}: {
  idTarifario: string
  abierto: boolean
  onCerrar: () => void
  modalidades: { id: string; nombre: string; codigo: string }[]
}) {
  const [form, setForm] = useState<FormCargo>(FORM_CARGO_VACIO)
  const [error, setError] = useState<string | null>(null)
  const agregar = useAgregarCargoMutation(idTarifario, {
    onSuccess: () => {
      setError(null)
      setForm(FORM_CARGO_VACIO)
      onCerrar()
    },
    onError: (err) => setError(extraerMensajeError(err)),
  })

  function handleConfirmar() {
    const payload = payloadCargoDesdeForm(form)
    if (!payload) return
    setError(null)
    agregar.mutate(payload)
  }

  return (
    <Sheet
      open={abierto}
      onOpenChange={(o) => {
        if (!o) {
          setError(null)
          setForm(FORM_CARGO_VACIO)
          onCerrar()
        }
      }}
    >
      <SheetContent side="right" className="w-full gap-0 data-[side=right]:sm:max-w-lg">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Agregar cargo</SheetTitle>
          <SheetDescription>Define el concepto, modalidad y precio.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6">
          {error ? (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>No se pudo agregar</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <CamposCargo
            form={form}
            onChange={(p) => setForm((prev) => ({ ...prev, ...p }))}
            modalidades={modalidades}
          />
        </div>
        <Separator />
        <SheetFooter className="flex-row justify-end gap-2">
          <SheetClose asChild>
            <Button variant="outline" disabled={agregar.isPending}>
              Cancelar
            </Button>
          </SheetClose>
          <Button
            onClick={handleConfirmar}
            disabled={agregar.isPending || payloadCargoDesdeForm(form) === null}
          >
            {agregar.isPending ? "Agregando..." : "Agregar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function SheetEditarCargo({
  idTarifario,
  cargo,
  onCerrar,
  modalidades,
}: {
  idTarifario: string
  cargo: TarifaCargo | null
  onCerrar: () => void
  modalidades: { id: string; nombre: string; codigo: string }[]
}) {
  const [form, setForm] = useState<FormCargo>(cargo ? formDesdeCargo(cargo) : FORM_CARGO_VACIO)
  const [claveActual, setClaveActual] = useState<string | null>(cargo?.id ?? null)
  const [error, setError] = useState<string | null>(null)

  const idEntrante = cargo?.id ?? null
  if (idEntrante !== claveActual) {
    setClaveActual(idEntrante)
    setForm(cargo ? formDesdeCargo(cargo) : FORM_CARGO_VACIO)
    setError(null)
  }

  const actualizar = useActualizarCargoMutation(idTarifario, cargo?.id ?? "", {
    onSuccess: () => {
      setError(null)
      onCerrar()
    },
    onError: (err) => setError(extraerMensajeError(err)),
  })

  function handleConfirmar() {
    const payload = payloadCargoDesdeForm(form)
    if (!payload) return
    setError(null)
    actualizar.mutate(payload)
  }

  return (
    <Sheet open={cargo !== null} onOpenChange={(o) => !o && onCerrar()}>
      <SheetContent side="right" className="w-full gap-0 data-[side=right]:sm:max-w-lg">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Editar cargo</SheetTitle>
          <SheetDescription>Ajusta el concepto, el precio u otros campos.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6">
          {error ? (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>No se pudo actualizar</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <CamposCargo
            form={form}
            onChange={(p) => setForm((prev) => ({ ...prev, ...p }))}
            modalidades={modalidades}
          />
        </div>
        <Separator />
        <SheetFooter className="flex-row justify-end gap-2">
          <SheetClose asChild>
            <Button variant="outline" disabled={actualizar.isPending}>
              Cancelar
            </Button>
          </SheetClose>
          <Button
            onClick={handleConfirmar}
            disabled={actualizar.isPending || payloadCargoDesdeForm(form) === null}
          >
            {actualizar.isPending ? "Guardando..." : "Guardar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function DialogEliminarCargo({
  idTarifario,
  cargo,
  onCerrar,
}: {
  idTarifario: string
  cargo: TarifaCargo | null
  onCerrar: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const eliminar = useEliminarCargoMutation(idTarifario, cargo?.id ?? "", {
    onSuccess: () => {
      setError(null)
      onCerrar()
    },
    onError: (err) => setError(extraerMensajeError(err)),
  })

  return (
    <AlertDialog open={cargo !== null} onOpenChange={(o) => !o && onCerrar()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Quitar cargo</AlertDialogTitle>
          <AlertDialogDescription>
            Se quitara el cargo del tarifario. Esta accion no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>No se pudo quitar</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={eliminar.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => eliminar.mutate()} disabled={eliminar.isPending}>
            {eliminar.isPending ? "Quitando..." : "Quitar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function DialogEditarVigencia({
  idTarifario,
  abierto,
  vigenciaInicio,
  vigenciaFin,
  onCerrar,
}: {
  idTarifario: string
  abierto: boolean
  vigenciaInicio: string | null
  vigenciaFin: string | null
  onCerrar: () => void
}) {
  const aFecha = (v: string | null) => (v ? v.slice(0, 10) : "")
  const [inicio, setInicio] = useState(aFecha(vigenciaInicio))
  const [fin, setFin] = useState(aFecha(vigenciaFin))
  const [visto, setVisto] = useState(abierto)
  const [error, setError] = useState<string | null>(null)

  // Reinicia los campos desde las props cada vez que se (re)abre el sheet.
  if (abierto !== visto) {
    setVisto(abierto)
    if (abierto) {
      setInicio(aFecha(vigenciaInicio))
      setFin(aFecha(vigenciaFin))
      setError(null)
    }
  }

  const guardar = useEstablecerVigenciaMutation(idTarifario, {
    onSuccess: () => {
      setError(null)
      onCerrar()
    },
    onError: (err) => setError(extraerMensajeError(err)),
  })

  const rangoInvalido = Boolean(inicio && fin && fin < inicio)

  function handleConfirmar() {
    if (rangoInvalido) return
    setError(null)
    guardar.mutate({
      vigenciaInicio: inicio || null,
      vigenciaFin: fin || null,
    })
  }

  return (
    <Sheet open={abierto} onOpenChange={(o) => !o && onCerrar()}>
      <SheetContent
        side="right"
        className="w-full gap-0 data-[side=right]:sm:max-w-md"
      >
        <SheetHeader className="border-b border-border">
          <SheetTitle>Editar vigencia</SheetTitle>
          <SheetDescription>
            Define el rango de fechas. Dejalas en blanco para quitar la vigencia.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-6 py-4">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>No se pudo guardar</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ev-ini">Vigencia inicio</Label>
            <Input
              id="ev-ini"
              type="date"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ev-fin">Vigencia fin</Label>
            <Input
              id="ev-fin"
              type="date"
              value={fin}
              onChange={(e) => setFin(e.target.value)}
            />
          </div>
          {rangoInvalido ? (
            <p className="text-xs text-destructive">
              La fecha de fin no puede ser anterior a la de inicio.
            </p>
          ) : null}
        </div>
        <Separator />
        <SheetFooter className="flex-row justify-end gap-2">
          <SheetClose asChild>
            <Button variant="outline" disabled={guardar.isPending}>
              Cancelar
            </Button>
          </SheetClose>
          <Button
            onClick={handleConfirmar}
            disabled={guardar.isPending || rangoInvalido}
          >
            {guardar.isPending ? "Guardando..." : "Guardar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function DialogAnular({
  idTarifario,
  abierto,
  onCerrar,
}: {
  idTarifario: string
  abierto: boolean
  onCerrar: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const anular = useAnularTarifarioMutation(idTarifario, {
    onSuccess: () => {
      setError(null)
      onCerrar()
    },
    onError: (err) => setError(extraerMensajeError(err)),
  })

  return (
    <AlertDialog open={abierto} onOpenChange={(o) => !o && onCerrar()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Anular tarifario</AlertDialogTitle>
          <AlertDialogDescription>
            El tarifario quedara ANULADO y no se podran editar sus tarifas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>No se pudo anular</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={anular.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => anular.mutate()} disabled={anular.isPending}>
            {anular.isPending ? "Anulando..." : "Anular"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
