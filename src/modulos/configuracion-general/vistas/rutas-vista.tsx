"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, Coins, Flag, MapPin, MapPinned, Pencil, Plus, Route, Settings2 } from "lucide-react"

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
import { Skeleton } from "@/compartido/componentes/ui/skeleton"

import { useSesion } from "@/modulos/autenticacion/ganchos/use-sesion"
import {
  useDetalleRutaQuery,
  useModificarRutaMutation,
  useRegistrarRutaMutation,
  useRutasQuery,
} from "../servicios/rutas-peajes-queries"
import type { RutaResponse } from "../tipos/rutas-peajes"

function obtenerMensajeError(error: unknown) {
  if (error instanceof ApiError) {
    const mensajes = error.errores?.map((item) => item.mensaje).filter(Boolean)
    if (mensajes?.length) return mensajes.join(" ")
    return error.message
  }
  if (error instanceof Error) return error.message
  return "No se pudo completar la operacion."
}

function RutaDialog({
  ruta,
  onClose,
}: {
  ruta?: RutaResponse
  onClose: (actualizado: boolean) => void
}) {
  const { usuario } = useSesion()
  const usuarioId = usuario?.email ?? "admin"
  const [nombre, setNombre] = useState(ruta?.nombre ?? "")
  const [error, setError] = useState<string | null>(null)
  // El backend normaliza el nombre: recorta y reemplaza bloques de espacios por un
  // solo guion. Lo replicamos aca para enviar ya el nombre final y mostrar preview.
  const nombreNormalizado = nombre.trim().replace(/\s+/g, "-")

  const crear = useRegistrarRutaMutation()
  const modificar = useModificarRutaMutation(ruta?.id ?? 0)
  const pendiente = crear.isPending || modificar.isPending

  // Al editar, traemos la estructura real (puntos + peajes) para el minimapa.
  const detalleQuery = useDetalleRutaQuery(ruta?.id ?? null, Boolean(ruta))
  const detalle = detalleQuery.data
  const puntos = detalle?.puntos ?? []
  const peajesPorTramo = (desdeId: number, hastaId: number) =>
    (detalle?.peajes ?? []).filter(
      (p) => p.ubicacionDesdeId === desdeId && p.ubicacionHastaId === hastaId,
    )

  async function guardar() {
    if (!nombre.trim()) {
      setError("El nombre es obligatorio.")
      return
    }
    try {
      setError(null)
      if (ruta) {
        await modificar.mutateAsync({ nombre: nombreNormalizado, usuarioModificacion: usuarioId })
      } else {
        await crear.mutateAsync({ nombre: nombreNormalizado, usuarioCreacion: usuarioId })
      }
      onClose(true)
    } catch (err) {
      setError(obtenerMensajeError(err))
    }
  }

  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{ruta ? "Editar ruta" : "Nueva ruta"}</DialogTitle>
        <DialogDescription>
          Primero registra el nombre del recorrido. Luego abre el mapa de la ruta para ordenar origen,
          paradas, destino y peajes por tramo.
        </DialogDescription>
      </DialogHeader>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudo guardar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel>Nombre del recorrido</FieldLabel>
            <Input
              value={nombre}
              placeholder="Arequipa Mina Constancia"
              onChange={(e) => setNombre(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Los espacios se reemplazan por guiones. El nombre debe ser unico entre rutas activas.
              {nombreNormalizado ? (
                <>
                  {" "}Se guardara como: <span className="font-medium">{nombreNormalizado}</span>
                </>
              ) : null}
            </p>
          </Field>

          <div className={`rounded-xl border border-border bg-muted/30 p-4 ${ruta ? "hidden" : ""}`}>
            <p className="text-sm font-medium">Como se arma una ruta</p>
            <div className="mt-3 flex flex-col gap-3 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  1
                </span>
                <p>Creas el registro con un nombre claro del recorrido.</p>
              </div>
              <div className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  2
                </span>
                <p>Entras a Ver mapa y agregas las ubicaciones en orden: origen, paradas y destino.</p>
              </div>
              <div className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  3
                </span>
                <p>Asignas los peajes al recorrido completo o a un tramo especifico.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Recorrido actual</p>
              <p className="text-xs text-muted-foreground">
                {ruta ? "Puntos y peajes de esta ruta" : "Se vera al completar el mapa"}
              </p>
            </div>
            {ruta ? (
              <Button asChild size="sm" variant="outline">
                <Link href={`/configuracion/rutas/${ruta.id}`}>
                  <Settings2 data-icon="inline-start" />
                  Ver mapa
                </Link>
              </Button>
            ) : (
              <Badge variant="secondary">Mapa</Badge>
            )}
          </div>

          <div className="mt-5">
            {!ruta ? (
              <p className="text-sm text-muted-foreground">
                Guarda la ruta y entra a Ver mapa para ordenar origen, paradas, destino y peajes.
              </p>
            ) : detalleQuery.isLoading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : puntos.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                Esta ruta aun no tiene recorrido. Entra a{" "}
                <Link href={`/configuracion/rutas/${ruta.id}`} className="font-medium underline">
                  Ver mapa
                </Link>{" "}
                para agregar origen, paradas y destino.
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {puntos.map((punto, index) => {
                  const siguiente = puntos[index + 1]
                  const esOrigen = punto.tipoPunto === "ORIGEN"
                  const esDestino = punto.tipoPunto === "DESTINO"
                  const tramo = siguiente
                    ? peajesPorTramo(punto.ubicacionId, siguiente.ubicacionId)
                    : []
                  return (
                    <div key={`${punto.orden}-${punto.ubicacionId}`} className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                            esDestino
                              ? "bg-primary text-primary-foreground"
                              : esOrigen
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {esDestino ? <Flag className="size-4" /> : <MapPin className="size-4" />}
                        </span>
                        <div className="min-w-0 flex-1 rounded-lg border border-border/70 p-2">
                          <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                            {esOrigen ? "Inicio" : esDestino ? "Fin" : `Parada ${punto.orden}`}
                          </p>
                          <p className="truncate text-sm">
                            {punto.ubicacionNombre ?? `Ubicacion ${punto.ubicacionId}`}
                          </p>
                        </div>
                      </div>
                      {siguiente ? (
                        <div className="ml-4 flex items-center gap-2 py-0.5">
                          <span className="h-6 w-px bg-border" />
                          {tramo.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {tramo.map((p, i) => (
                                <Badge key={`${p.peajeId}-${i}`} variant="outline" className="gap-1">
                                  <Coins className="size-3" />
                                  {p.peajeNombre ?? `Peaje ${p.peajeId}`}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sin peaje</span>
                          )}
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
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

export function RutasVista() {
  const [busqueda, setBusqueda] = useState("")
  const rutasQuery = useRutasQuery({
    nombre: busqueda || undefined,
    estadoRegistro: "ACTIVO",
    page: 1,
    pageSize: 50,
  })
  const rutas = useMemo(() => rutasQuery.data?.datos ?? [], [rutasQuery.data])
  const [dialogo, setDialogo] = useState<{ modo: "crear" } | { modo: "editar"; ruta: RutaResponse } | null>(
    null,
  )

  return (
    <>
      <SiteHeader
        title="Rutas"
        breadcrumbs={[
          { title: "CS-Configuracion General", href: "/configuracion" },
          { title: "Rutas" },
        ]}
      />
      <main className="min-h-screen bg-muted/30 px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="flex flex-col gap-4 border-l-4 border-l-primary px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                  <Route className="size-6" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                    Configuracion general
                  </p>
                  <h1 className="text-xl font-semibold tracking-normal">Rutas</h1>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Recorridos entre ubicaciones, con sus puntos (origen, paradas, destino) y peajes.
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
                  Nueva ruta
                </Button>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
            <div className="border-b border-border p-4">
              <Input
                value={busqueda}
                placeholder="Buscar ruta por nombre"
                className="max-w-sm"
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            {rutasQuery.error ? (
              <div className="p-4">
                <Alert variant="destructive">
                  <AlertTitle>Error de API</AlertTitle>
                  <AlertDescription>{obtenerMensajeError(rutasQuery.error)}</AlertDescription>
                </Alert>
              </div>
            ) : null}

            {rutasQuery.isLoading ? (
              <div className="flex flex-col gap-3 p-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : rutas.length === 0 ? (
              <Empty className="py-12">
                <EmptyHeader>
                  <EmptyTitle>Sin rutas</EmptyTitle>
                  <EmptyDescription>Crea la primera ruta y define sus puntos y peajes.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                {rutas.map((ruta) => (
                  <article
                    key={ruta.id}
                    className="flex min-h-48 flex-col justify-between gap-4 rounded-xl border border-border bg-background p-4 shadow-sm transition-colors hover:bg-muted/30"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                          <MapPinned className="size-5" />
                        </span>
                        <Badge variant={ruta.estado === "ACTIVO" ? "outline" : "secondary"}>
                          {ruta.estado === "ACTIVO" ? "Activa" : "Inactiva"}
                        </Badge>
                      </div>
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-muted-foreground">{ruta.codigo}</p>
                        <h2 className="mt-1 line-clamp-2 text-base font-semibold">{ruta.nombre}</h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Abre la estructura para ordenar origen, paradas, destino y peajes del recorrido.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button asChild className="flex-1" size="sm">
                        <Link href={`/configuracion/rutas/${ruta.id}`}>
                          <Settings2 data-icon="inline-start" />
                          Ver mapa
                        </Link>
                      </Button>
                      <Button
                        className="flex-1 sm:flex-none"
                        size="sm"
                        variant="outline"
                        onClick={() => setDialogo({ modo: "editar", ruta })}
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
          <RutaDialog
            ruta={dialogo.modo === "editar" ? dialogo.ruta : undefined}
            onClose={(actualizado) => {
              setDialogo(null)
              if (actualizado) void rutasQuery.refetch()
            }}
          />
        ) : null}
      </Dialog>
    </>
  )
}
