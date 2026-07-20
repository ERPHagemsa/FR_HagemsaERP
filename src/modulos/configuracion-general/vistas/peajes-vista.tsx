"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, Coins, MapPin, Pencil, Plus, Receipt, Route } from "lucide-react"

import { ApiError } from "@/compartido/api/axios"
import { SiteHeader } from "@/compartido/componentes/site-header"
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert"
import { Badge } from "@/compartido/componentes/ui/badge"
import { Button } from "@/compartido/componentes/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/compartido/componentes/ui/dialog"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/compartido/componentes/ui/empty"
import { Field, FieldLabel } from "@/compartido/componentes/ui/field"
import { Input } from "@/compartido/componentes/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
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

import { useSesion } from "@/modulos/autenticacion/ganchos/use-sesion"
import { useListarPorTipoQuery } from "../servicios/configuracion-general-queries"
import {
  useModificarPeajeMutation,
  useModificarTarifaPeajeMutation,
  usePeajesQuery,
  useRegistrarPeajeMutation,
  useRegistrarTarifaPeajeMutation,
  useTarifasPeajeQuery,
} from "../servicios/rutas-peajes-queries"
import type {
  ModalidadCobroPeaje,
  PeajeResponse,
  TipoCobroPeaje,
} from "../tipos/rutas-peajes"

function obtenerMensajeError(error: unknown) {
  if (error instanceof ApiError) {
    const mensajes = error.errores?.map((item) => item.mensaje).filter(Boolean)
    if (mensajes?.length) return mensajes.join(" ")
    return error.message
  }
  if (error instanceof Error) return error.message
  return "No se pudo completar la operacion."
}

function formatearMonto(monto: number, moneda?: string) {
  return `${moneda ?? "PEN"} ${monto.toFixed(2)}`
}

const etiquetaTipoCobro: Record<TipoCobroPeaje, string> = {
  NORMAL: "Normal",
  PEX: "PEX",
}
const etiquetaModalidad: Record<ModalidadCobroPeaje, string> = {
  POR_UNIDAD: "Por unidad",
  POR_EJE: "Por eje",
}

// --- Dialogo de tarifas --------------------------------------------------------

function TarifasPeajeDialog({ peaje, onClose }: { peaje: PeajeResponse; onClose: () => void }) {
  const tarifasQuery = useTarifasPeajeQuery(peaje.id)
  const tarifas = tarifasQuery.data ?? []
  const [tipoCobro, setTipoCobro] = useState<TipoCobroPeaje>("NORMAL")
  const [monto, setMonto] = useState("")
  const [moneda, setMoneda] = useState("PEN")
  const [fechaInicio, setFechaInicio] = useState("")
  const [error, setError] = useState<string | null>(null)
  // Edicion puntual de una fila ya existente (ajustar solo su monto). El PUT no
  // recalcula el resto de la tabla; cambia unicamente esa tarifa.
  const [editId, setEditId] = useState<number | null>(null)
  const [editMonto, setEditMonto] = useState("")

  const crear = useRegistrarTarifaPeajeMutation(peaje.id, {
    onSuccess: () => void tarifasQuery.refetch(),
  })
  const modificar = useModificarTarifaPeajeMutation(peaje.id, editId ?? 0, {
    onSuccess: () => void tarifasQuery.refetch(),
  })
  const pendiente = crear.isPending || modificar.isPending

  function limpiar() {
    setMonto("")
    setFechaInicio("")
  }

  async function guardarEdicion() {
    const montoNum = Number(editMonto)
    if (!Number.isFinite(montoNum) || montoNum <= 0) {
      setError("El monto debe ser mayor que cero.")
      return
    }
    try {
      setError(null)
      await modificar.mutateAsync({ monto: montoNum })
      setEditId(null)
      setEditMonto("")
    } catch (err) {
      setError(obtenerMensajeError(err))
    }
  }

  // El front solo envia el precio unitario. El backend desactiva las tarifas
  // previas del mismo peaje + tipoCobro, guarda una base POR_UNIDAD y genera la
  // tabla POR_EJE de 2 a 20 ejes (monto x ejes). No se envia modalidad ni ejes.
  async function guardar() {
    const montoNum = Number(monto)
    if (!Number.isFinite(montoNum) || montoNum <= 0) {
      setError("El precio debe ser mayor que cero.")
      return
    }
    try {
      setError(null)
      await crear.mutateAsync({
        monto: montoNum,
        tipoCobro,
        moneda,
        fechaInicio: fechaInicio || undefined,
      })
      limpiar()
    } catch (err) {
      setError(obtenerMensajeError(err))
    }
  }

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>Tarifas de {peaje.nombre}</DialogTitle>
        <DialogDescription>
          Ingresa el precio por eje del peaje. El sistema arma automaticamente la tabla de 2 a 20
          ejes (precio × ejes) y una tarifa base fija. Reenviar el precio reemplaza las tarifas
          anteriores del mismo tipo de cobro. Tambien puedes ajustar el monto de una fila puntual
          con el boton Editar (no recalcula las demas).
        </DialogDescription>
      </DialogHeader>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudo guardar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-border">
        {tarifasQuery.isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : tarifas.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">Aun no hay tarifas registradas.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cobro</TableHead>
                <TableHead>Modalidad</TableHead>
                <TableHead>Ejes</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Desde</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Accion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tarifas.map((tarifa) => (
                <TableRow key={tarifa.id}>
                  <TableCell>
                    <Badge variant="outline">{etiquetaTipoCobro[tarifa.tipoCobro]}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{etiquetaModalidad[tarifa.modalidadCobro]}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {tarifa.numeroEjes != null ? `${tarifa.numeroEjes} ejes` : "-"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {editId === tarifa.id ? (
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={editMonto}
                        className="h-8 w-24 text-right"
                        onChange={(e) => setEditMonto(e.target.value)}
                      />
                    ) : (
                      formatearMonto(tarifa.monto, tarifa.moneda)
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{(tarifa.fechaInicio ?? "").slice(0, 10) || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={tarifa.estado === "INACTIVO" ? "secondary" : "outline"}>
                      {tarifa.estado === "INACTIVO" ? "Inactiva" : "Activa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {editId === tarifa.id ? (
                      <div className="flex justify-end gap-1">
                        <Button size="sm" onClick={() => void guardarEdicion()} disabled={pendiente}>
                          {pendiente ? "..." : "Guardar"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditId(null)}
                          disabled={pendiente}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditId(tarifa.id)
                          setEditMonto(String(tarifa.monto))
                          setError(null)
                        }}
                      >
                        <Pencil data-icon="inline-start" />
                        Editar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <p className="mb-3 text-sm font-medium">Definir precio del peaje</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel>Tipo de cobro</FieldLabel>
            <Select value={tipoCobro} onValueChange={(v) => setTipoCobro(v as TipoCobroPeaje)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="PEX">PEX</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Precio por eje</FieldLabel>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={monto}
              placeholder="7.60"
              onChange={(e) => setMonto(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Precio de un eje. El sistema multiplica por los ejes del vehiculo al calcular la ruta.
            </p>
          </Field>
          <Field>
            <FieldLabel>Moneda</FieldLabel>
            <Input value={moneda} onChange={(e) => setMoneda(e.target.value.toUpperCase())} />
          </Field>
          <Field>
            <FieldLabel>Vigente desde</FieldLabel>
            <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          </Field>
          {Number(monto) > 0 ? (
            <div className="rounded-md border border-border bg-background p-3 sm:col-span-2">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Tabla que generara el sistema ({moneda} {Number(monto).toFixed(2)} × ejes):
              </p>
              <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-xs sm:grid-cols-5">
                {Array.from({ length: 19 }, (_, i) => i + 2).map((ejes) => (
                  <div key={ejes} className="flex justify-between tabular-nums">
                    <span className="text-muted-foreground">{ejes} ejes</span>
                    <span className="font-medium">{(Number(monto) * ejes).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <Button type="button" onClick={() => void guardar()} disabled={pendiente}>
            {pendiente ? "Guardando..." : "Guardar precio"}
          </Button>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

// --- Dialogo crear/editar peaje -----------------------------------------------

function PeajeDialog({
  peaje,
  onClose,
}: {
  peaje?: PeajeResponse
  // creado llega solo al registrar un peaje nuevo, para encadenar sus tarifas.
  onClose: (actualizado: boolean, creado?: PeajeResponse) => void
}) {
  const { usuario } = useSesion()
  const usuarioId = usuario?.email ?? "admin"
  const [nombre, setNombre] = useState(peaje?.nombre ?? "")
  const [ubicacionId, setUbicacionId] = useState(
    peaje?.ubicacionId != null ? String(peaje.ubicacionId) : "",
  )
  const [error, setError] = useState<string | null>(null)

  // Un peaje debe apuntar a una ubicacion con tipoUbicacion = PEAJE.
  const ubicacionesQuery = useListarPorTipoQuery("UBICACION", {
    tipoUbicacion: "PEAJE",
    estado: "ACTIVO",
    estadoRegistro: "ACTIVO",
    pageSize: 100,
    sortBy: "nombre",
    sortOrder: "asc",
  })
  const ubicaciones = ubicacionesQuery.data?.datos ?? []

  const crear = useRegistrarPeajeMutation()
  const modificar = useModificarPeajeMutation(peaje?.id ?? 0)
  const pendiente = crear.isPending || modificar.isPending

  async function guardar() {
    if (!nombre.trim()) {
      setError("El nombre es obligatorio.")
      return
    }
    if (!ubicacionId) {
      setError("Selecciona la ubicacion del peaje.")
      return
    }
    try {
      setError(null)
      if (peaje) {
        await modificar.mutateAsync({
          nombre: nombre.trim(),
          ubicacionId: Number(ubicacionId),
          usuarioModificacion: usuarioId,
        })
        onClose(true)
      } else {
        const creado = await crear.mutateAsync({
          nombre: nombre.trim(),
          ubicacionId: Number(ubicacionId),
          usuarioCreacion: usuarioId,
        })
        onClose(true, creado)
      }
    } catch (err) {
      setError(obtenerMensajeError(err))
    }
  }

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{peaje ? "Editar peaje" : "Nuevo peaje"}</DialogTitle>
        <DialogDescription>
          El peaje se asocia a una ubicacion de tipo Peaje. Su tarifa se gestiona aparte.
        </DialogDescription>
      </DialogHeader>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudo guardar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-4">
        <Field>
          <FieldLabel>Nombre</FieldLabel>
          <Input value={nombre} placeholder="Peaje Uchumayo" onChange={(e) => setNombre(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel>Ubicacion (tipo Peaje)</FieldLabel>
          <Select value={ubicacionId} onValueChange={setUbicacionId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona la ubicacion del peaje" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {ubicaciones.length > 0 ? (
                  ubicaciones.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.codigo} - {u.nombre}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="__none" disabled>
                    No hay ubicaciones de tipo Peaje
                  </SelectItem>
                )}
              </SelectGroup>
            </SelectContent>
          </Select>
          {ubicaciones.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Primero registra una ubicacion con tipo Peaje en Ubicaciones.
            </p>
          ) : null}
        </Field>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onClose(false)} disabled={pendiente}>
          Cancelar
        </Button>
        <Button type="button" onClick={() => void guardar()} disabled={pendiente}>
          {pendiente ? "Guardando..." : "Guardar"}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

// --- Vista principal -----------------------------------------------------------

export function PeajesVista() {
  const [busqueda, setBusqueda] = useState("")
  const peajesQuery = usePeajesQuery({
    nombre: busqueda || undefined,
    estadoRegistro: "ACTIVO",
    page: 1,
    pageSize: 50,
  })
  const peajes = useMemo(() => peajesQuery.data?.datos ?? [], [peajesQuery.data])
  const [dialogo, setDialogo] = useState<{ modo: "crear" } | { modo: "editar"; peaje: PeajeResponse } | null>(
    null,
  )
  const [tarifasDe, setTarifasDe] = useState<PeajeResponse | null>(null)

  return (
    <>
      <SiteHeader
        title="Peajes"
        breadcrumbs={[
          { title: "CS-Configuracion General", href: "/configuracion" },
          { title: "Peajes" },
        ]}
      />
      <main className="min-h-screen bg-muted/30 px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="flex flex-col gap-4 border-l-4 border-l-primary px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                  <Coins className="size-6" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                    Configuracion general
                  </p>
                  <h1 className="text-xl font-semibold tracking-normal">Peajes</h1>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Peajes y sus tarifas, usados al calcular el costo de las rutas.
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link href="/configuracion">
                    <ArrowRight className="size-4 rotate-180" data-icon="inline-start" />
                    Inicio
                  </Link>
                </Button>
                <Button className="w-full sm:w-auto" onClick={() => setDialogo({ modo: "crear" })}>
                  <Plus data-icon="inline-start" />
                  Nuevo peaje
                </Button>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
            <div className="border-b border-border p-4">
              <Input
                value={busqueda}
                placeholder="Buscar peaje por nombre"
                className="max-w-sm"
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            {peajesQuery.error ? (
              <div className="p-4">
                <Alert variant="destructive">
                  <AlertTitle>Error de API</AlertTitle>
                  <AlertDescription>{obtenerMensajeError(peajesQuery.error)}</AlertDescription>
                </Alert>
              </div>
            ) : null}

            {peajesQuery.isLoading ? (
              <div className="flex flex-col gap-3 p-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : peajes.length === 0 ? (
              <Empty className="py-12">
                <EmptyHeader>
                  <EmptyTitle>Sin peajes</EmptyTitle>
                  <EmptyDescription>
                    Registra el primer peaje para gestionar sus tarifas. Cada peaje se asocia a una
                    ubicacion de tipo Peaje, asi que primero crea esa ubicacion en Ubicaciones.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                {peajes.map((peaje) => (
                  <article
                    key={peaje.id}
                    className="flex min-h-52 flex-col justify-between gap-4 rounded-xl border border-border bg-background p-4 shadow-sm transition-colors hover:bg-muted/30"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                          <Coins className="size-5" />
                        </span>
                        <Badge variant={peaje.estado === "ACTIVO" ? "outline" : "secondary"}>
                          {peaje.estado === "ACTIVO" ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-muted-foreground">{peaje.codigo}</p>
                        <h2 className="mt-1 line-clamp-2 text-base font-semibold">{peaje.nombre}</h2>
                      </div>
                      <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
                        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
                          <Route className="size-3.5" />
                          Ubicacion de cobro
                        </p>
                        <p className="flex items-start gap-2 text-sm">
                          <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                          <span className="line-clamp-2">{peaje.ubicacionNombre ?? peaje.ubicacionId}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button className="flex-1" size="sm" onClick={() => setTarifasDe(peaje)}>
                        <Receipt data-icon="inline-start" />
                        Tarifas
                      </Button>
                      <Button
                        className="flex-1 sm:flex-none"
                        size="sm"
                        variant="outline"
                        onClick={() => setDialogo({ modo: "editar", peaje })}
                      >
                        <Pencil data-icon="inline-start" />
                        Editar
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Dialog open={dialogo !== null} onOpenChange={(open) => !open && setDialogo(null)}>
        {dialogo ? (
          <PeajeDialog
            peaje={dialogo.modo === "editar" ? dialogo.peaje : undefined}
            onClose={(actualizado, creado) => {
              setDialogo(null)
              if (actualizado) void peajesQuery.refetch()
              // Encadena el flujo: recien creado el peaje, abre sus tarifas (sin
              // tarifa el peaje suma cero al calcular el costo de las rutas).
              if (creado) setTarifasDe(creado)
            }}
          />
        ) : null}
      </Dialog>

      <Dialog open={tarifasDe !== null} onOpenChange={(open) => !open && setTarifasDe(null)}>
        {tarifasDe ? <TarifasPeajeDialog peaje={tarifasDe} onClose={() => setTarifasDe(null)} /> : null}
      </Dialog>
    </>
  )
}
