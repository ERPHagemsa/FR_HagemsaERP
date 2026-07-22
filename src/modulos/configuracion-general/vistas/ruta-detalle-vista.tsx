"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Calculator,
  ChevronDown,
  ChevronUp,
  Coins,
  Flag,
  MapPin,
  Play,
  Plus,
  Route,
  Save,
  Trash2,
} from "lucide-react"

import { ApiError } from "@/compartido/api/axios"
import { obtenerUsuarioAuditoria } from "@/compartido/autenticacion/usuario-auditoria"
import { SiteHeader } from "@/compartido/componentes/site-header"
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert"
import { Badge } from "@/compartido/componentes/ui/badge"
import { Button } from "@/compartido/componentes/ui/button"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/compartido/componentes/ui/dropdown-menu"

import { useListarPorTipoQuery } from "../servicios/configuracion-general-queries"
import {
  useActualizarEstructuraRutaMutation,
  useCostoPeajesResumenQuery,
  useCostoPeajesRutaQuery,
  useDetalleRutaQuery,
  usePeajesQuery,
} from "../servicios/rutas-peajes-queries"
import { useSesion } from "@/modulos/autenticacion/ganchos/use-sesion"
import type {
  CostoPeajesResumenResponse,
  CostoPeajesRutaResponse,
  PeajeRutaInput,
  PuntoRutaInput,
  SentidoPeajeRuta,
  TipoCobroPeaje,
  TipoPuntoRuta,
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

const tiposPunto: Array<{ value: TipoPuntoRuta; label: string }> = [
  { value: "ORIGEN", label: "Origen" },
  { value: "PARADA", label: "Parada" },
  { value: "DESTINO", label: "Destino" },
]

export function RutaDetalleVista({ rutaId }: { rutaId: number }) {
  const { usuario } = useSesion()
  const usuarioId = obtenerUsuarioAuditoria(usuario)
  const detalleQuery = useDetalleRutaQuery(rutaId)
  const detalle = detalleQuery.data

  const ubicacionesQuery = useListarPorTipoQuery("UBICACION", {
    estado: "ACTIVO",
    estadoRegistro: "ACTIVO",
    pageSize: 100,
    sortBy: "nombre",
    sortOrder: "asc",
  })
  const ubicaciones = useMemo(
    () => ubicacionesQuery.data?.datos ?? [],
    [ubicacionesQuery.data],
  )
  const peajesQuery = usePeajesQuery({ estadoRegistro: "ACTIVO", pageSize: 100 })
  const peajes = peajesQuery.data?.datos ?? []

  const [puntos, setPuntos] = useState<PuntoRutaInput[]>([])
  const [peajesRuta, setPeajesRuta] = useState<PeajeRutaInput[]>([])
  const [sincronizadoId, setSincronizadoId] = useState<number | null>(null)
  const [errorPuntos, setErrorPuntos] = useState<string | null>(null)
  const [errorPeajes, setErrorPeajes] = useState<string | null>(null)

  // Sincroniza el estado editable con el detalle cargado (patron de ajuste de
  // estado en render, una vez por ruta). Evita un useEffect con setState.
  if (detalle && detalle.id !== sincronizadoId) {
    setSincronizadoId(detalle.id)
    setPuntos(
      detalle.puntos.map((p) => ({
        orden: p.orden,
        ubicacionId: p.ubicacionId,
        tipoPunto: p.tipoPunto,
      })),
    )
    setPeajesRuta(
      detalle.peajes.map((p) => ({
        orden: p.orden,
        peajeId: p.peajeId,
        sentido: p.sentido ?? "IDA",
        cobra: p.cobra ?? true,
        ubicacionDesdeId: p.ubicacionDesdeId ?? 0,
        ubicacionHastaId: p.ubicacionHastaId ?? 0,
      })),
    )
  }

  // Costo
  const [tipoCobro, setTipoCobro] = useState<TipoCobroPeaje>("NORMAL")
  const [numeroEjes, setNumeroEjes] = useState("")
  const [costo, setCosto] = useState<CostoPeajesRutaResponse | null>(null)
  const [errorCosto, setErrorCosto] = useState<string | null>(null)
  const costoQuery = useCostoPeajesRutaQuery(
    rutaId,
    { tipoCobro, sentido: "IDA", numeroEjes: numeroEjes ? Number(numeroEjes) : undefined },
    false,
  )
  // Para rutas de ida y vuelta calculamos tambien el REGRESO y sumamos el total.
  const [costoRegreso, setCostoRegreso] = useState<CostoPeajesRutaResponse | null>(null)
  const costoRegresoQuery = useCostoPeajesRutaQuery(
    rutaId,
    { tipoCobro, sentido: "REGRESO", numeroEjes: numeroEjes ? Number(numeroEjes) : undefined },
    false,
  )

  // Resumen: costo para varios numeros de ejes (LIVIANO=2 .. 8) de una llamada.
  const [resumen, setResumen] = useState<CostoPeajesResumenResponse | null>(null)
  const [errorResumen, setErrorResumen] = useState<string | null>(null)
  const resumenQuery = useCostoPeajesResumenQuery(rutaId, { tipoCobro }, false)

  const guardarEstructura = useActualizarEstructuraRutaMutation(rutaId, {
    onSuccess: () => void detalleQuery.refetch(),
  })

  // Opciones de ubicacion para "desde/hasta" de peajes: las ubicaciones de la ruta.
  const ubicacionesRuta = useMemo(() => {
    const ids = new Set(puntos.map((p) => p.ubicacionId).filter(Boolean))
    return ubicaciones.filter((u) => ids.has(u.id))
  }, [puntos, ubicaciones])

  const puntosOrdenados = puntos.map((punto, index) => ({ ...punto, orden: index + 1 }))

  // La naturaleza del recorrido se infiere de los puntos (la ruta ya no guarda
  // un tipoRecorrido). Si el ORIGEN y el DESTINO son la misma ubicacion, el
  // recorrido vuelve al inicio (A -> ... -> A) = ida y vuelta: ahi los peajes
  // pueden ser IDA o REGRESO. Si no, es solo ida (A -> B) y solo aplica IDA.
  const origenUbic = puntos.find((p) => p.tipoPunto === "ORIGEN")?.ubicacionId || 0
  const destinoUbic = puntos.find((p) => p.tipoPunto === "DESTINO")?.ubicacionId || 0
  const esIdaVuelta = origenUbic !== 0 && origenUbic === destinoUbic
  const esSoloIda = !esIdaVuelta

  function obtenerNombreUbicacion(ubicacionId: number) {
    return ubicaciones.find((ubicacion) => ubicacion.id === ubicacionId)?.nombre ?? "Ubicacion pendiente"
  }

  function obtenerNombrePeaje(peajeId: number) {
    return peajes.find((peaje) => peaje.id === peajeId)?.nombre ?? "Peaje pendiente"
  }

  // Ubicacion donde esta fisicamente el peaje (la caseta). Se muestra bajo el
  // nombre en el nodo del mapa para no confundir el cobro con el lugar.
  function obtenerUbicacionPeaje(peajeId: number) {
    return peajes.find((peaje) => peaje.id === peajeId)?.ubicacionNombre ?? null
  }

  // Numero de segmentos (tramos entre dos puntos consecutivos) del mapa.
  const numSegmentos = Math.max(puntosOrdenados.length - 1, 0)

  // Asignacion estable de peajes a segmentos del mapa.
  //
  // En una ruta ida y vuelta los puntos regresan al inicio (A -> ... -> A), asi
  // que un mismo par de ubicaciones aparece dos veces: la PRIMERA vez que se
  // recorre es la IDA, la SEGUNDA es la VUELTA. Usar la ocurrencia del par (y no
  // la posicion respecto al punto medio) hace que insertar una parada no mueva
  // los peajes ya colocados.
  //
  // Cada fila de peaje se coloca en EXACTAMENTE un segmento (sin duplicar ni
  // perder filas). El backend ya no usa "AMBOS": un peaje bidireccional son dos
  // filas (una IDA y otra REGRESO), cada una cae en su propia ocurrencia.
  const { peajesPorSegmento, segmentoEsVuelta } = useMemo(() => {
    const buckets: Array<Array<{ peaje: PeajeRutaInput; esVuelta: boolean }>> =
      Array.from({ length: numSegmentos }, () => [])
    const esVueltaSeg: boolean[] = Array.from({ length: numSegmentos }, () => false)
    if (numSegmentos === 0) return { peajesPorSegmento: buckets, segmentoEsVuelta: esVueltaSeg }

    const segDesde = (s: number) => puntosOrdenados[s].ubicacionId
    const segHasta = (s: number) => puntosOrdenados[s + 1].ubicacionId
    const claveSeg = (s: number) => {
      const a = segDesde(s)
      const b = segHasta(s)
      return a < b ? `${a}-${b}` : `${b}-${a}`
    }

    // Ocurrencia (1 = ida, 2 = vuelta, ...) de cada segmento segun su par de puntos.
    const ocurrencia: number[] = []
    const visto = new Map<string, number>()
    for (let s = 0; s < numSegmentos; s++) {
      const n = (visto.get(claveSeg(s)) ?? 0) + 1
      visto.set(claveSeg(s), n)
      ocurrencia[s] = n
      // Un segmento es de vuelta solo en rutas ida y vuelta, a partir de la 2a vez.
      esVueltaSeg[s] = esIdaVuelta && n >= 2
    }

    const todos = Array.from({ length: numSegmentos }, (_, i) => i)

    for (const peaje of peajesRuta) {
      // En ruta solo ida todo se trata como ida (no perder peajes REGRESO viejos
      // del backend). En ida y vuelta el sentido decide la ocurrencia buscada.
      const buscaVuelta = esIdaVuelta && (peaje.sentido ?? "IDA") === "REGRESO"
      const ocurrenciaQuiere = buscaVuelta ? 2 : 1
      const desde = peaje.ubicacionDesdeId || 0
      const hasta = peaje.ubicacionHastaId || 0
      const sinTramo = !desde && !hasta

      let elegido = -1
      if (!sinTramo) {
        // Segmentos cuyo par de puntos coincide con el tramo (en cualquier
        // orientacion), o tramo a medias (solo desde).
        const coincidencias = todos.filter(
          (s) =>
            (segDesde(s) === desde && segHasta(s) === hasta) ||
            (segDesde(s) === hasta && segHasta(s) === desde) ||
            (!hasta && segDesde(s) === desde),
        )
        // Preferir la ocurrencia que pide el sentido (1a para ida, 2a para vuelta);
        // si no existe, la primera coincidencia disponible.
        elegido =
          coincidencias.find((s) => ocurrencia[s] === ocurrenciaQuiere) ??
          coincidencias[0] ??
          -1
      }
      // Sin tramo o sin coincidencia: primer segmento de la mitad que corresponde.
      if (elegido < 0) {
        elegido = todos.find((s) => esVueltaSeg[s] === buscaVuelta) ?? 0
      }
      buckets[elegido].push({ peaje, esVuelta: buscaVuelta })
    }
    return { peajesPorSegmento: buckets, segmentoEsVuelta: esVueltaSeg }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peajesRuta, puntosOrdenados, esIdaVuelta, numSegmentos])

  const esSegmentoVuelta = (indice: number) => segmentoEsVuelta[indice] ?? false

  // Estado del flujo guiado (paso a paso). Cada paso se habilita cuando el
  // anterior quedo GUARDADO en el backend (detalle), no solo editado en local.

  // Reordena un punto hacia arriba (-1) o abajo (+1) en el recorrido. El orden
  // de la lista ES el orden de la ruta; al guardar se renumera 1..n.
  function moverPunto(index: number, dir: -1 | 1) {
    setPuntos((prev) => {
      const destino = index + dir
      if (destino < 0 || destino >= prev.length) return prev
      const copia = [...prev]
      const [movido] = copia.splice(index, 1)
      copia.splice(destino, 0, movido)
      return copia
    })
  }

  // Agrega un punto al recorrido con la ubicacion ya elegida. El tipo se propone
  // por posicion: primero ORIGEN, luego DESTINO, el resto PARADA (editable).
  function agregarPunto(ubicacionId: number) {
    setPuntos((prev) => {
      const hayOrigen = prev.some((p) => p.tipoPunto === "ORIGEN")
      const hayDestino = prev.some((p) => p.tipoPunto === "DESTINO")
      const tipoPunto: TipoPuntoRuta = !hayOrigen ? "ORIGEN" : !hayDestino ? "DESTINO" : "PARADA"
      return [
        ...prev,
        { orden: prev.length + 1, ubicacionId, tipoPunto },
      ]
    })
  }

  // Inserta una PARADA con la ubicacion elegida justo despues del punto `index`
  // (es decir, dentro del tramo del mapa entre `index` e `index+1`).
  function insertarPuntoEnTramo(index: number, ubicacionId: number) {
    setPuntos((prev) => {
      const copia = [...prev]
      copia.splice(index + 1, 0, {
        orden: index + 2,
        ubicacionId,
        tipoPunto: "PARADA",
      })
      return copia
    })
  }

  // Agrega un peaje ya seleccionado y apuntado a un tramo concreto (desde/hasta)
  // del mapa. Atajo del boton "+" entre dos puntos del recorrido: el menu ofrece
  // los peajes disponibles y aqui se inserta el elegido.
  function agregarPeajeEnTramo(
    desdeId: number,
    hastaId: number,
    peajeId: number,
    sentido: SentidoPeajeRuta,
  ) {
    setPeajesRuta((prev) => [
      ...prev,
      {
        orden: prev.length + 1,
        peajeId,
        // El sentido lo decide el segmento donde se agrega: IDA en los tramos de
        // avance, REGRESO en los de regreso. El usuario puede cambiarlo luego.
        sentido,
        cobra: true,
        ubicacionDesdeId: desdeId,
        ubicacionHastaId: hastaId,
      },
    ])
  }

  // Guarda puntos y peajes en una sola transaccion (endpoint /estructura). El
  // backend valida tramos contra los puntos del MISMO request, asi que ya no es
  // necesario guardar los puntos antes para poder asignar tramos de peaje.
  async function persistirEstructura() {
    setErrorPuntos(null)
    setErrorPeajes(null)

    // --- Validar puntos ---
    const conUbicacion = puntos.filter((p) => p.ubicacionId)
    const origenes = conUbicacion.filter((p) => p.tipoPunto === "ORIGEN").length
    const destinos = conUbicacion.filter((p) => p.tipoPunto === "DESTINO").length
    if (conUbicacion.length === 0) {
      setErrorPuntos("Agrega al menos un Origen y un Destino con su ubicacion.")
      return
    }
    if (origenes !== 1 || destinos !== 1) {
      setErrorPuntos("La ruta debe tener exactamente un Origen y un Destino.")
      return
    }

    // --- Validar peajes ---
    if (peajesRuta.some((p) => !p.peajeId)) {
      setErrorPeajes("Selecciona el peaje en cada fila antes de guardar.")
      return
    }
    const tramoIncompleto = peajesRuta.some(
      (p) => Boolean(p.ubicacionDesdeId) !== Boolean(p.ubicacionHastaId),
    )
    if (tramoIncompleto) {
      setErrorPeajes(
        "Cuando defines un tramo, indica tanto la ubicacion Desde como la Hasta (o deja ambas vacias).",
      )
      return
    }
    // El tramo debe apuntar a puntos de la ruta. Como guardamos todo junto, basta
    // validar contra los puntos LOCALES (los que se enviaran en este request).
    const idsPuntos = new Set(conUbicacion.map((p) => p.ubicacionId))
    const tramoFueraDeRuta = peajesRuta.some(
      (p) =>
        (p.ubicacionDesdeId && !idsPuntos.has(p.ubicacionDesdeId)) ||
        (p.ubicacionHastaId && !idsPuntos.has(p.ubicacionHastaId)),
    )
    if (tramoFueraDeRuta) {
      setErrorPeajes(
        "El tramo (Desde / Hasta) debe usar ubicaciones que esten en los puntos de la ruta.",
      )
      return
    }
    // No duplicar mismo peaje + sentido + tramo. Distinto sentido o tramo si vale.
    const claves = new Set<string>()
    for (const p of peajesRuta) {
      const sentido = p.sentido ?? "IDA"
      const clave = `${p.peajeId}|${sentido}|${p.ubicacionDesdeId || 0}|${p.ubicacionHastaId || 0}`
      if (claves.has(clave)) {
        setErrorPeajes(
          "Hay un peaje repetido con el mismo sentido y tramo. Cambia el sentido (ida/regreso), usa otro tramo o quita la fila duplicada.",
        )
        return
      }
      claves.add(clave)
    }

    // --- Guardar todo junto ---
    try {
      await guardarEstructura.mutateAsync({
        puntos: conUbicacion.map((p, i) => ({ ...p, orden: i + 1 })),
        peajes: peajesRuta.map((p, i) => ({
          orden: i + 1,
          peajeId: p.peajeId,
          // En rutas SOLO_IDA el backend solo acepta IDA: lo forzamos.
          sentido: esSoloIda ? "IDA" : (p.sentido ?? "IDA"),
          cobra: p.cobra ?? true,
          ubicacionDesdeId: p.ubicacionDesdeId || null,
          ubicacionHastaId: p.ubicacionHastaId || null,
        })),
        usuarioModificacion: usuarioId,
      })
    } catch (err) {
      // El backend ahora responde validacion legible (errores[]); extraerMensaje
      // junta los mensajes de campo.
      setErrorPeajes(obtenerMensajeError(err))
    }
  }

  async function calcularCosto() {
    setErrorCosto(null)
    setCosto(null)
    setCostoRegreso(null)
    const resultado = await costoQuery.refetch()
    if (resultado.error) {
      setErrorCosto(obtenerMensajeError(resultado.error))
      return
    }
    setCosto(resultado.data ?? null)
    // En ida y vuelta sumamos tambien el regreso para el total del viaje redondo.
    if (esIdaVuelta) {
      const reg = await costoRegresoQuery.refetch()
      if (!reg.error) setCostoRegreso(reg.data ?? null)
    }
  }

  async function calcularResumen() {
    setErrorResumen(null)
    setResumen(null)
    const resultado = await resumenQuery.refetch()
    if (resultado.error) {
      setErrorResumen(obtenerMensajeError(resultado.error))
      return
    }
    setResumen(resultado.data ?? null)
  }

  return (
    <>
      <SiteHeader
        title="Estructura de la ruta"
        breadcrumbs={[
          { title: "CS-Configuracion General", href: "/configuracion" },
          { title: "Rutas", href: "/configuracion/rutas" },
          { title: detalle?.nombre ?? `Ruta #${rutaId}` },
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
                    Ruta
                  </p>
                  <h1 className="text-xl font-semibold tracking-normal">
                    {detalle?.nombre ?? `Ruta #${rutaId}`}
                  </h1>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Define el orden de las ubicaciones y los peajes del recorrido.
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" className="shrink-0">
                <Link href="/configuracion/rutas">
                  <ArrowLeft data-icon="inline-start" />
                  Volver a rutas
                </Link>
              </Button>
            </div>
          </section>

          {detalleQuery.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : detalleQuery.error ? (
            <Alert variant="destructive">
              <AlertTitle>Error de API</AlertTitle>
              <AlertDescription>{obtenerMensajeError(detalleQuery.error)}</AlertDescription>
            </Alert>
          ) : (
            <div className="flex flex-col gap-5">
              <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="flex flex-col gap-4 border-b border-border px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-base font-semibold">Mapa del recorrido</h2>
                    <p className="text-sm text-muted-foreground">
                      Vista rapida del orden de avance y de los peajes asignados entre ubicaciones.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="default">{esSoloIda ? "Solo ida" : "Ida y vuelta"}</Badge>
                    <Badge variant="outline">{puntos.length} puntos</Badge>
                    <Badge variant="secondary">{peajesRuta.length} peajes</Badge>
                    {/* Boton unico: guarda puntos y peajes juntos en una sola
                        transaccion (PUT /rutas/:id/estructura). */}
                    <Button
                      className="ml-1"
                      onClick={() => void persistirEstructura()}
                      disabled={guardarEstructura.isPending}
                    >
                      <Save data-icon="inline-start" />
                      {guardarEstructura.isPending ? "Guardando..." : "Guardar ruta"}
                    </Button>
                  </div>
                </div>

                {puntosOrdenados.length === 0 ? (
                  <div className="px-5 py-8">
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                      {/* Cards interactivas: arrancan la ruta con un Origen y un
                          Destino listos para elegir ubicacion abajo. */}
                      <button
                        type="button"
                        onClick={() =>
                          setPuntos([
                            { orden: 1, ubicacionId: 0, tipoPunto: "ORIGEN" },
                            { orden: 2, ubicacionId: 0, tipoPunto: "DESTINO" },
                          ])
                        }
                        className="flex w-56 flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-background p-5 text-center transition-colors hover:border-primary hover:bg-primary/5"
                      >
                        <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Plus className="size-5" />
                        </span>
                        <span className="text-sm font-medium">Iniciar recorrido</span>
                        <span className="text-xs text-muted-foreground">
                          Crea un Origen y un Destino para empezar.
                        </span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto px-5 py-6">
                    <div className="flex min-w-max items-start gap-3">
                      {puntosOrdenados.map((punto, index) => {
                        const siguiente = puntosOrdenados[index + 1]
                        const tramoEsVuelta = esSegmentoVuelta(index)
                        const peajesTramo = siguiente ? peajesPorSegmento[index] ?? [] : []
                        const esOrigen = punto.tipoPunto === "ORIGEN"
                        const esDestino = punto.tipoPunto === "DESTINO"

                        // Color del icono y borde superior segun el rol del punto.
                        const acento = esOrigen
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : esDestino
                            ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                            : "bg-primary/10 text-primary"
                        const IconoPunto = esOrigen ? Play : esDestino ? Flag : MapPin

                        return (
                          <div key={`${punto.orden}-${punto.ubicacionId}-${index}`} className="flex items-start gap-3">
                            <div className="flex w-48 flex-col gap-2.5 rounded-xl border border-border bg-background p-3 shadow-sm">
                              <div className="flex items-center justify-between gap-2">
                                <Badge variant={esOrigen || esDestino ? "default" : "outline"}>
                                  {esOrigen ? "Inicio" : esDestino ? "Fin" : `Parada ${punto.orden}`}
                                </Badge>
                                <span className="text-xs tabular-nums text-muted-foreground">#{punto.orden}</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${acento}`}>
                                  <IconoPunto className="size-4" />
                                </span>
                                <p className="line-clamp-2 text-sm font-medium">
                                  {punto.ubicacionId ? obtenerNombreUbicacion(punto.ubicacionId) : "Selecciona ubicacion"}
                                </p>
                              </div>
                              {esDestino && esIdaVuelta ? (
                                <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-center text-[10px] font-medium text-amber-600 dark:text-amber-400">
                                  Vuelve al inicio (ida y vuelta)
                                </span>
                              ) : null}
                            </div>

                            {siguiente ? (
                              // Conector horizontal: los peajes del tramo se
                              // colocan EN LINEA entre los dos puntos, como nodos
                              // sobre la ruta. Asi el recorrido se lee de
                              // izquierda a derecha pasando por cada peaje.
                              <div className="flex items-center gap-1.5 self-stretch pt-7">
                                <span className="h-px w-4 shrink-0 bg-border" />

                                {peajesTramo.map(({ peaje, esVuelta }) => {
                                  const ordenRuta = peajesRuta.indexOf(peaje) + 1
                                  return (
                                    <div key={`${peaje.peajeId}-${ordenRuta}-${esVuelta ? "v" : "i"}`} className="flex items-center gap-1.5">
                                      <div
                                        className={`flex w-36 flex-col gap-1.5 rounded-xl border bg-background p-2.5 shadow-sm ${
                                          (peaje.cobra ?? true) ? "border-border" : "border-dashed border-border opacity-80"
                                        }`}
                                      >
                                        <div className="flex items-center gap-1.5">
                                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold tabular-nums text-primary">
                                            {ordenRuta}
                                          </span>
                                          <p className="min-w-0 flex-1 truncate text-xs font-medium leading-tight">
                                            {obtenerNombrePeaje(peaje.peajeId)}
                                          </p>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            className="size-5 shrink-0 text-muted-foreground hover:text-destructive"
                                            aria-label="Quitar peaje"
                                            onClick={() =>
                                              setPeajesRuta((prev) => prev.filter((p) => p !== peaje))
                                            }
                                          >
                                            <Trash2 className="size-3.5" />
                                          </Button>
                                        </div>
                                        {/* Ubicacion fisica del peaje (la caseta),
                                            para distinguir el cobro del lugar. */}
                                        {obtenerUbicacionPeaje(peaje.peajeId) ? (
                                          <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                            <MapPin className="size-3 shrink-0" />
                                            <span className="truncate">{obtenerUbicacionPeaje(peaje.peajeId)}</span>
                                          </p>
                                        ) : null}
                                        <div className="flex flex-wrap items-center gap-1">
                                          {/* En el mapa desplegado etiquetamos el cruce concreto de este
                                              segmento: "ida" en los tramos de avance, "vuelta" en los de
                                              regreso. Un peaje bidireccional son dos filas: aparece una
                                              vez en su tramo de ida y otra en su tramo de vuelta. */}
                                          <span
                                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                                              esVuelta
                                                ? "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                                                : "bg-muted text-muted-foreground"
                                            }`}
                                          >
                                            {esVuelta ? "vuelta" : "ida"}
                                          </span>
                                          {/* Toggle cobra / no cobra con punto indicador. */}
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setPeajesRuta((prev) =>
                                                prev.map((p) =>
                                                  p === peaje ? { ...p, cobra: !(p.cobra ?? true) } : p,
                                                ),
                                              )
                                            }
                                            className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                                              (peaje.cobra ?? true)
                                                ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-400"
                                                : "bg-muted text-muted-foreground hover:bg-muted/70"
                                            }`}
                                            title="Cambiar si este peaje suma al costo"
                                          >
                                            <span
                                              className={`size-1.5 rounded-full ${
                                                (peaje.cobra ?? true) ? "bg-emerald-500" : "bg-muted-foreground/50"
                                              }`}
                                            />
                                            {(peaje.cobra ?? true) ? "Cobra" : "No cobra"}
                                          </button>
                                        </div>
                                      </div>
                                      <span className="h-px w-4 shrink-0 bg-border" />
                                    </div>
                                  )
                                })}

                                {/* Menu en dos niveles: primero QUE agregar
                                    (peaje o ubicacion) y luego la lista concreta. */}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="outline"
                                      className="size-8 shrink-0 rounded-full"
                                      title="Agregar en este tramo"
                                    >
                                      <Plus className="size-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="center">
                                    <DropdownMenuLabel>Agregar en este tramo</DropdownMenuLabel>
                                    <DropdownMenuSeparator />

                                    {/* Peaje */}
                                    <DropdownMenuSub>
                                      <DropdownMenuSubTrigger>
                                        <Coins className="size-3.5 text-muted-foreground" />
                                        Peaje
                                      </DropdownMenuSubTrigger>
                                      <DropdownMenuSubContent className="max-h-72 overflow-y-auto">
                                        {peajes.length === 0 ? (
                                          <DropdownMenuItem disabled>
                                            No hay peajes registrados
                                          </DropdownMenuItem>
                                        ) : (
                                          peajes.map((p) => (
                                            <DropdownMenuItem
                                              key={p.id}
                                              onSelect={() =>
                                                agregarPeajeEnTramo(
                                                  punto.ubicacionId,
                                                  siguiente.ubicacionId,
                                                  p.id,
                                                  tramoEsVuelta ? "REGRESO" : "IDA",
                                                )
                                              }
                                            >
                                              <Coins className="size-3.5 text-muted-foreground" />
                                              {p.nombre}
                                            </DropdownMenuItem>
                                          ))
                                        )}
                                      </DropdownMenuSubContent>
                                    </DropdownMenuSub>

                                    {/* Ubicacion (parada intermedia) */}
                                    <DropdownMenuSub>
                                      <DropdownMenuSubTrigger>
                                        <MapPin className="size-3.5 text-muted-foreground" />
                                        Ubicacion (parada)
                                      </DropdownMenuSubTrigger>
                                      <DropdownMenuSubContent className="max-h-72 overflow-y-auto">
                                        {ubicaciones.length === 0 ? (
                                          <DropdownMenuItem disabled>
                                            No hay ubicaciones
                                          </DropdownMenuItem>
                                        ) : (
                                          ubicaciones.map((u) => (
                                            <DropdownMenuItem
                                              key={u.id}
                                              onSelect={() => insertarPuntoEnTramo(index, u.id)}
                                            >
                                              <MapPin className="size-3.5 text-muted-foreground" />
                                              {u.nombre}
                                            </DropdownMenuItem>
                                          ))
                                        )}
                                      </DropdownMenuSubContent>
                                    </DropdownMenuSub>
                                  </DropdownMenuContent>
                                </DropdownMenu>

                                <span className="h-px w-4 shrink-0 bg-border" />
                              </div>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </section>

              <div className="grid gap-5 xl:grid-cols-2">
              {/* Puntos */}
              <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold">Puntos del recorrido</h2>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus data-icon="inline-start" />
                        Agregar punto
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
                      <DropdownMenuLabel>Elige una ubicacion</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {ubicaciones.length === 0 ? (
                        <DropdownMenuItem disabled>No hay ubicaciones</DropdownMenuItem>
                      ) : (
                        ubicaciones.map((u) => (
                          <DropdownMenuItem key={u.id} onSelect={() => agregarPunto(u.id)}>
                            <MapPin className="size-3.5 text-muted-foreground" />
                            {u.nombre}
                          </DropdownMenuItem>
                        ))
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-xs text-muted-foreground">
                  Debe haber exactamente un Origen y un Destino.
                </p>

                {errorPuntos ? (
                  <Alert variant="destructive">
                    <AlertDescription>{errorPuntos}</AlertDescription>
                  </Alert>
                ) : null}

                <div className="flex flex-col gap-3">
                  {puntos.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aun no hay puntos.</p>
                  ) : (
                    puntos.map((punto, index) => {
                      const esOrigen = punto.tipoPunto === "ORIGEN"
                      const esDestino = punto.tipoPunto === "DESTINO"
                      return (
                        <div
                          key={index}
                          className="flex flex-col gap-3 rounded-xl border border-border/70 bg-background p-4 shadow-sm"
                        >
                          {/* Cabecera de la card: posicion, etiqueta y acciones */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                {index + 1}
                              </span>
                              <Badge variant={esOrigen || esDestino ? "default" : "outline"}>
                                {esOrigen ? "Origen" : esDestino ? "Destino" : "Parada"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label="Subir"
                                disabled={index === 0}
                                onClick={() => moverPunto(index, -1)}
                              >
                                <ChevronUp className="size-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label="Bajar"
                                disabled={index === puntos.length - 1}
                                onClick={() => moverPunto(index, 1)}
                              >
                                <ChevronDown className="size-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label="Quitar"
                                onClick={() => setPuntos((prev) => prev.filter((_, i) => i !== index))}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Ubicacion a ancho completo */}
                          <Field>
                            <FieldLabel>Ubicacion</FieldLabel>
                            <Select
                              value={punto.ubicacionId ? String(punto.ubicacionId) : ""}
                              onValueChange={(v) =>
                                setPuntos((prev) =>
                                  prev.map((p, i) =>
                                    i === index ? { ...p, ubicacionId: Number(v) } : p,
                                  ),
                                )
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecciona una ubicacion" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  {ubicaciones.map((u) => (
                                    <SelectItem key={u.id} value={String(u.id)}>
                                      {u.nombre}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </Field>

                          {/* Tipo de punto en el recorrido */}
                          <Field>
                            <FieldLabel>Tipo</FieldLabel>
                            <Select
                              value={punto.tipoPunto}
                              onValueChange={(v) =>
                                setPuntos((prev) =>
                                  prev.map((p, i) =>
                                    i === index ? { ...p, tipoPunto: v as TipoPuntoRuta } : p,
                                  ),
                                )
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  {tiposPunto.map((t) => (
                                    <SelectItem key={t.value} value={t.value}>
                                      {t.label}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </Field>
                        </div>
                      )
                    })
                  )}
                </div>
              </section>

              {/* Peajes */}
              <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold">Peajes de la ruta</h2>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setPeajesRuta((prev) => [
                        ...prev,
                        {
                          orden: prev.length + 1,
                          peajeId: 0,
                          // Default IDA (ver agregarPeajeEnTramo).
                          sentido: "IDA",
                          cobra: true,
                          ubicacionDesdeId: 0,
                          ubicacionHastaId: 0,
                        },
                      ])
                    }
                  >
                    <Plus data-icon="inline-start" />
                    Agregar peaje
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Elige el peaje que se cobra en el recorrido. El tramo (Desde / Hasta) es
                  opcional: uselo solo cuando el peaje aplique entre dos ubicaciones puntuales de
                  la ruta.
                </p>
                {peajes.length === 0 && !peajesQuery.isLoading ? (
                  <Alert>
                    <AlertDescription>
                      No hay peajes registrados todavia. Registralos en la seccion{" "}
                      <Link href="/configuracion/peajes" className="font-medium underline">
                        Peajes
                      </Link>{" "}
                      para poder asignarlos a la ruta.
                    </AlertDescription>
                  </Alert>
                ) : null}

                {errorPeajes ? (
                  <Alert variant="destructive">
                    <AlertDescription>{errorPeajes}</AlertDescription>
                  </Alert>
                ) : null}

                <div className="flex flex-col gap-3">
                  {peajesRuta.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin peajes asignados.</p>
                  ) : (
                    peajesRuta.map((peaje, index) => (
                      <div
                        key={index}
                        className="flex flex-col gap-3 rounded-xl border border-border/70 bg-background p-3"
                      >
                        <div className="flex items-center gap-2">
                          <Select
                            value={peaje.peajeId ? String(peaje.peajeId) : ""}
                            onValueChange={(v) =>
                              setPeajesRuta((prev) =>
                                prev.map((p, i) => (i === index ? { ...p, peajeId: Number(v) } : p)),
                              )
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Peaje" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {peajes.length > 0 ? (
                                  peajes.map((p) => (
                                    <SelectItem key={p.id} value={String(p.id)}>
                                      {p.nombre}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="__none" disabled>
                                    No hay peajes registrados
                                  </SelectItem>
                                )}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label="Quitar"
                            onClick={() => setPeajesRuta((prev) => prev.filter((_, i) => i !== index))}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground">Sentido</span>
                            {esSoloIda ? (
                              // Recorrido solo ida (origen != destino): siempre IDA.
                              <div className="flex h-9 items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground">
                                Ida
                              </div>
                            ) : (
                              <Select
                                value={peaje.sentido ?? "IDA"}
                                onValueChange={(v) =>
                                  setPeajesRuta((prev) =>
                                    prev.map((p, i) =>
                                      i === index ? { ...p, sentido: v as SentidoPeajeRuta } : p,
                                    ),
                                  )
                                }
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    <SelectItem value="IDA">Ida</SelectItem>
                                    <SelectItem value="REGRESO">Regreso</SelectItem>
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground">Cobra</span>
                            <Select
                              value={(peaje.cobra ?? true) ? "si" : "no"}
                              onValueChange={(v) =>
                                setPeajesRuta((prev) =>
                                  prev.map((p, i) => (i === index ? { ...p, cobra: v === "si" } : p)),
                                )
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectItem value="si">Si, suma al costo</SelectItem>
                                  <SelectItem value="no">No cobra</SelectItem>
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Tramo (opcional)
                          {ubicacionesRuta.length === 0
                            ? " — agrega y guarda primero los puntos de la ruta para elegir Desde / Hasta."
                            : null}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <Select
                            value={peaje.ubicacionDesdeId ? String(peaje.ubicacionDesdeId) : ""}
                            onValueChange={(v) =>
                              setPeajesRuta((prev) =>
                                prev.map((p, i) =>
                                  i === index ? { ...p, ubicacionDesdeId: Number(v) } : p,
                                ),
                              )
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Desde" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {ubicacionesRuta.map((u) => (
                                  <SelectItem key={u.id} value={String(u.id)}>
                                    {u.nombre}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                          <Select
                            value={peaje.ubicacionHastaId ? String(peaje.ubicacionHastaId) : ""}
                            onValueChange={(v) =>
                              setPeajesRuta((prev) =>
                                prev.map((p, i) =>
                                  i === index ? { ...p, ubicacionHastaId: Number(v) } : p,
                                ),
                              )
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Hasta" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {ubicacionesRuta.map((u) => (
                                  <SelectItem key={u.id} value={String(u.id)}>
                                    {u.nombre}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Costo de peajes */}
              <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm xl:col-span-2">
                <h2 className="text-base font-semibold">Calcular costo de peajes</h2>
                <p className="text-xs text-muted-foreground">
                  Usa la tarifa vigente de cada peaje asignado. Un peaje sin tarifa registrada suma
                  cero: registra sus tarifas en la seccion{" "}
                  <Link href="/configuracion/peajes" className="font-medium underline">
                    Peajes
                  </Link>
                  .
                </p>
                {detalle && detalle.peajes.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      Asigna y guarda al menos un peaje en la ruta antes de calcular el costo.
                    </AlertDescription>
                  </Alert>
                ) : null}
                <div className="flex flex-wrap items-end gap-3">
                  <Field className="w-40">
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
                  <Field className="w-48">
                    <FieldLabel>Numero de ejes</FieldLabel>
                    <Input
                      type="number"
                      min="1"
                      value={numeroEjes}
                      placeholder="Ejes del vehiculo"
                      onChange={(e) => setNumeroEjes(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Necesario para tarifas por eje: multiplica el precio por eje. Si lo dejas vacio,
                      solo se usan tarifas fijas (por unidad) y no multiplica.
                    </p>
                  </Field>
                  <Button
                    onClick={() => void calcularCosto()}
                    disabled={costoQuery.isFetching || (detalle?.peajes.length ?? 0) === 0}
                  >
                    <Calculator data-icon="inline-start" />
                    {costoQuery.isFetching ? "Calculando..." : "Calcular"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void calcularResumen()}
                    disabled={resumenQuery.isFetching || (detalle?.peajes.length ?? 0) === 0}
                    title="Costo para liviano y de 2 a 8 ejes"
                  >
                    <Calculator data-icon="inline-start" />
                    {resumenQuery.isFetching ? "Calculando..." : "Tabla por ejes"}
                  </Button>
                </div>

                {errorCosto ? (
                  <Alert variant="destructive">
                    <AlertDescription>{errorCosto}</AlertDescription>
                  </Alert>
                ) : null}

                {costo ? (
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    {esIdaVuelta && costoRegreso ? (
                      <>
                        <p className="text-sm text-muted-foreground">
                          Costo del viaje redondo (ida + vuelta)
                        </p>
                        <p className="text-2xl font-semibold tabular-nums">
                          {costo.moneda ?? "PEN"}{" "}
                          {((costo.total ?? 0) + (costoRegreso.total ?? 0)).toFixed(2)}
                        </p>
                        <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                          <span>Ida: {costo.moneda ?? "PEN"} {(costo.total ?? 0).toFixed(2)}</span>
                          <span>
                            Vuelta: {costoRegreso.moneda ?? "PEN"} {(costoRegreso.total ?? 0).toFixed(2)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">Costo total estimado de peajes</p>
                        <p className="text-2xl font-semibold tabular-nums">
                          {costo.moneda ?? "PEN"} {(costo.total ?? 0).toFixed(2)}
                        </p>
                      </>
                    )}
                    {(costo.total ?? 0) === 0 ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        El total es cero: revisa que los peajes de la ruta tengan una tarifa vigente
                        para el tipo de cobro
                        {numeroEjes ? " y numero de ejes" : ""} seleccionado.
                      </p>
                    ) : null}
                    {costo.detalle && costo.detalle.length > 0 ? (
                      <div className="mt-3 flex flex-col gap-1">
                        {costo.detalle.map((d) => (
                          <div
                            key={d.peajeId}
                            className="flex items-center justify-between gap-2 text-sm"
                          >
                            <span className="flex items-center gap-1.5">
                              <MapPin className="size-3.5 text-muted-foreground" />
                              {d.peajeNombre ?? `Peaje ${d.peajeId}`}
                              {d.cantidad && d.cantidad > 1 ? (
                                <span className="text-xs text-muted-foreground">
                                  ({d.montoBase ?? 0} x {d.cantidad})
                                </span>
                              ) : null}
                            </span>
                            <span className="tabular-nums">
                              {costo.moneda ?? "PEN"} {(d.subtotal ?? 0).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {errorResumen ? (
                  <Alert variant="destructive">
                    <AlertDescription>{errorResumen}</AlertDescription>
                  </Alert>
                ) : null}

                {resumen && resumen.costos.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40 text-muted-foreground">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium">Vehiculo</th>
                          <th className="px-4 py-2 text-right font-medium">Ejes</th>
                          <th className="px-4 py-2 text-right font-medium">Costo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resumen.costos.map((c) => (
                          <tr key={c.numeroEjes} className="border-t border-border">
                            <td className="px-4 py-2">{c.etiqueta}</td>
                            <td className="px-4 py-2 text-right tabular-nums">{c.numeroEjes}</td>
                            <td className="px-4 py-2 text-right font-medium tabular-nums">
                              {c.costo.moneda ?? "PEN"} {(c.costo.total ?? 0).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}

                {detalle && detalle.peajes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {detalle.peajes.map((p) => {
                      const sinTarifa = !p.tarifas || p.tarifas.length === 0
                      return (
                        <Badge
                          key={`${p.orden}-${p.peajeId}`}
                          variant={sinTarifa ? "secondary" : "outline"}
                          title={sinTarifa ? "Este peaje no tiene tarifas y sumara cero" : undefined}
                        >
                          {p.peajeNombre ?? `Peaje ${p.peajeId}`}
                          {sinTarifa ? " · sin tarifa" : ""}
                        </Badge>
                      )
                    })}
                  </div>
                ) : null}
              </section>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
