"use client"

import Image from "next/image"
import { useParams } from "next/navigation"
import {
  AlertTriangle,
  Loader2,
  MapPin,
  ScanLine,
  ShieldCheck,
  Truck,
} from "lucide-react"

import { extraerMensajeError } from "@/compartido/api/formato-error"
import { useConsulta } from "@/compartido/api/use-consulta"
import { consultarEtiquetaPublica } from "@/modulos/activos/servicios/etiquetas-api"
import type { EtiquetaPublicaActivo } from "@/modulos/activos/tipos/etiquetas.tipos"

const MENSAJE_MOTIVO: Record<string, string> = {
  SIN_ASIGNAR: "Este codigo QR todavia no esta vinculado a ningun activo.",
  REEMPLAZADA: "Este codigo QR ya no esta vigente: fue reemplazado por uno mas reciente.",
}

// estadoOperativo (OPERATIVO/MANTENIMIENTO/NO_OPERATIVO) es distinto de
// estadoActivo (ACTIVO/INACTIVO/SINIESTRADO): el primero dice si la unidad
// trabaja hoy, el segundo el estado administrativo del registro. No se fusionan.
const ESTILO_OPERATIVO: Record<string, { texto: string; clase: string; punto: string }> = {
  OPERATIVO: {
    texto: "Operativo",
    clase: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    punto: "bg-emerald-400",
  },
  MANTENIMIENTO: {
    texto: "En mantenimiento",
    clase: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    punto: "bg-amber-400",
  },
  NO_OPERATIVO: {
    texto: "No operativo",
    clase: "bg-red-500/10 text-red-300 border-red-500/30",
    punto: "bg-red-400",
  },
}

// Alerta administrativa: solo se muestra cuando NO es el caso normal (ACTIVO).
const ALERTA_ESTADO_ACTIVO: Record<string, { texto: string; clase: string }> = {
  SINIESTRADO: {
    texto: "Activo siniestrado",
    clase: "bg-red-500/10 text-red-300 border-red-500/30",
  },
  INACTIVO: {
    texto: "Activo inactivo / dado de baja",
    clase: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  },
}

function combinar(a: string | null, b: string | null): string | null {
  const partes = [a, b].filter((v): v is string => Boolean(v))
  return partes.length ? partes.join(" / ") : null
}

// ---------------------------------------------------------------------------
// Envoltorio: fondo, logo y pill de estado de la consulta.
// Look oscuro comprometido (no depende del tema del sistema): es una pantalla
// publica de verificacion, sin toggle de tema.
// ---------------------------------------------------------------------------

type TonoPill = "ok" | "error" | "aviso" | "cargando"

const PILL: Record<TonoPill, { texto: string; clase: string; punto: string; pulso: boolean }> = {
  ok: {
    texto: "Consulta verificada",
    clase: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
    punto: "bg-emerald-400",
    pulso: true,
  },
  error: {
    texto: "Codigo no valido",
    clase: "text-red-300 bg-red-500/10 border-red-500/20",
    punto: "bg-red-400",
    pulso: false,
  },
  aviso: {
    texto: "Sin vinculacion",
    clase: "text-amber-300 bg-amber-500/10 border-amber-500/20",
    punto: "bg-amber-400",
    pulso: false,
  },
  cargando: {
    texto: "Verificando...",
    clase: "text-zinc-400 bg-white/5 border-white/10",
    punto: "bg-zinc-400",
    pulso: true,
  },
}

function Envoltorio({ tono, children }: { tono: TonoPill; children: React.ReactNode }) {
  const pill = PILL[tono]
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-zinc-900 to-black px-4 py-10 text-zinc-100">
      <div className="flex w-full max-w-md flex-col gap-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <Image
            src="/logo/logo.svg"
            alt="Hagemsa"
            width={120}
            height={48}
            className="h-11 w-auto object-contain opacity-95"
            priority
          />
          <div
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-wide ${pill.clase}`}
          >
            <span className="relative flex size-2">
              {pill.pulso ? (
                <span
                  className={`absolute inline-flex size-full animate-ping rounded-full opacity-60 ${pill.punto}`}
                />
              ) : null}
              <span className={`relative inline-flex size-2 rounded-full ${pill.punto}`} />
            </span>
            {pill.texto}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 shadow-2xl backdrop-blur-sm">
          {children}
        </div>

        <p className="text-center text-[11px] text-zinc-600">
          Informacion oficial del maestro de activos · Hagemsa
        </p>
      </div>
    </main>
  )
}

// ---------------------------------------------------------------------------
// Estados no-exitosos (error / sin vinculacion) y carga.
// ---------------------------------------------------------------------------

function EstadoMensaje({
  icono: Icono,
  titulo,
  descripcion,
  tono,
}: {
  icono: typeof AlertTriangle
  titulo: string
  descripcion: string
  tono: "error" | "aviso"
}) {
  const color =
    tono === "error"
      ? "bg-red-500/10 text-red-300 border-red-500/20"
      : "bg-amber-500/10 text-amber-300 border-amber-500/20"
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
      <span className={`flex size-14 items-center justify-center rounded-2xl border ${color}`}>
        <Icono className="size-6" />
      </span>
      <div>
        <p className="text-base font-semibold text-zinc-100">{titulo}</p>
        <p className="mt-1.5 text-sm text-zinc-400">{descripcion}</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-componentes de la ficha exitosa.
// ---------------------------------------------------------------------------

function CeldaRapida({ etiqueta, valor, mono }: { etiqueta: string; valor: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <span className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
        {etiqueta}
      </span>
      <span className={`mt-0.5 block text-sm font-semibold text-zinc-100 ${mono ? "font-mono" : ""}`}>
        {valor}
      </span>
    </div>
  )
}

function Identificador({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
        {etiqueta}
      </span>
      <span className="block select-all rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-xs tracking-wide text-zinc-300">
        {valor}
      </span>
    </div>
  )
}

function FichaActivo({ activo }: { activo: EtiquetaPublicaActivo }) {
  const operativo = activo.estadoOperativo ? ESTILO_OPERATIVO[activo.estadoOperativo] : undefined
  const alerta = ALERTA_ESTADO_ACTIVO[activo.estadoActivo]

  const rapidos: Array<{ etiqueta: string; valor: string; mono?: boolean }> = [
    activo.anioFabricacion != null
      ? { etiqueta: "Año de fab.", valor: String(activo.anioFabricacion) }
      : null,
    activo.categoria ? { etiqueta: "Categoria", valor: activo.categoria } : null,
    combinar(activo.marca, activo.modelo)
      ? { etiqueta: "Marca / Modelo", valor: combinar(activo.marca, activo.modelo) as string }
      : null,
    combinar(activo.color, activo.carroceria)
      ? { etiqueta: "Color / Carroceria", valor: combinar(activo.color, activo.carroceria) as string }
      : null,
    activo.ejes != null ? { etiqueta: "Ejes", valor: String(activo.ejes) } : null,
    activo.cantidadRuedas != null ? { etiqueta: "Ruedas", valor: String(activo.cantidadRuedas) } : null,
  ].filter((c): c is { etiqueta: string; valor: string; mono?: boolean } => c !== null)

  return (
    <>
      {/* Hero / resumen ejecutivo */}
      <div className="border-b border-zinc-800 bg-gradient-to-r from-zinc-800/40 to-transparent p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <span className="rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 font-mono text-[11px] text-zinc-400">
            {activo.codigo}
          </span>
          {operativo ? (
            <span
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${operativo.clase}`}
            >
              <span className={`size-1.5 rounded-full ${operativo.punto}`} />
              {operativo.texto}
            </span>
          ) : (
            <span className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-zinc-300">
              {activo.estadoActivo}
            </span>
          )}
        </div>

        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300">
            <Truck className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-white">
              {activo.descripcion}
            </h1>
            <p className="mt-0.5 text-xs text-zinc-400">
              {activo.tipoActivo}
              {activo.clase ? ` · ${activo.clase}` : ""}
            </p>
          </div>
        </div>

        {activo.placa ? (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              Placa
            </span>
            <span className="font-mono text-lg font-bold tracking-widest text-white">
              {activo.placa}
            </span>
          </div>
        ) : null}
      </div>

      {/* Alerta administrativa solo si el activo NO esta en estado normal */}
      {alerta ? (
        <div className={`flex items-center gap-2 border-b border-zinc-800 px-5 py-2.5 text-xs font-semibold ${alerta.clase}`}>
          <AlertTriangle className="size-4 shrink-0" />
          {alerta.texto}
        </div>
      ) : null}

      {/* Contenido */}
      <div className="flex flex-col gap-6 p-5">
        {rapidos.length > 0 ? (
          <section className="grid grid-cols-2 gap-3">
            {rapidos.map((c) => (
              <CeldaRapida key={c.etiqueta} etiqueta={c.etiqueta} valor={c.valor} mono={c.mono} />
            ))}
          </section>
        ) : null}

        {activo.serieChasis || activo.serieMotor ? (
          <section className="space-y-3 border-t border-zinc-800/80 pt-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Identificadores
            </p>
            {activo.serieChasis ? (
              <Identificador etiqueta="Numero de chasis" valor={activo.serieChasis} />
            ) : null}
            {activo.serieMotor ? (
              <Identificador etiqueta="Numero de motor" valor={activo.serieMotor} />
            ) : null}
          </section>
        ) : null}

        {activo.ubicacion || activo.zonaRegistral ? (
          <section className="flex items-center gap-3 border-t border-zinc-800/80 pt-5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-300">
              <MapPin className="size-4" />
            </span>
            <div className="min-w-0">
              <span className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Ubicacion / Base
              </span>
              <span className="block text-sm font-medium text-zinc-200">
                {activo.ubicacion ?? "—"}
              </span>
              {activo.zonaRegistral ? (
                <span className="block text-xs text-zinc-500">{activo.zonaRegistral}</span>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Pagina
// ---------------------------------------------------------------------------

export default function EtiquetaEscaneadaPage() {
  const params = useParams<{ token: string }>()
  const token = Array.isArray(params.token) ? params.token[0] : params.token

  const consulta = useConsulta(
    () => consultarEtiquetaPublica(token),
    [token],
    { enabled: Boolean(token) },
  )

  const datos = consulta.data
  const activo = datos?.vinculado ? datos.activo : undefined

  if (consulta.isLoading) {
    return (
      <Envoltorio tono="cargando">
        <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <Loader2 className="size-6 animate-spin text-zinc-500" />
          <p className="text-sm text-zinc-400">Consultando el activo...</p>
        </div>
      </Envoltorio>
    )
  }

  if (consulta.isError) {
    return (
      <Envoltorio tono="error">
        <EstadoMensaje
          icono={AlertTriangle}
          tono="error"
          titulo="Codigo QR no valido"
          descripcion={
            extraerMensajeError(consulta.error) ||
            "Este codigo no existe, fue anulado o no esta disponible."
          }
        />
      </Envoltorio>
    )
  }

  if (datos && !datos.vinculado) {
    return (
      <Envoltorio tono="aviso">
        <EstadoMensaje
          icono={datos.motivo === "REEMPLAZADA" ? ShieldCheck : ScanLine}
          tono="aviso"
          titulo={datos.motivo === "REEMPLAZADA" ? "Codigo QR no vigente" : "Sin vinculacion"}
          descripcion={
            MENSAJE_MOTIVO[datos.motivo ?? ""] ??
            "Este codigo QR no tiene una vinculacion valida."
          }
        />
      </Envoltorio>
    )
  }

  if (!activo) return <Envoltorio tono="aviso">{null}</Envoltorio>

  return (
    <Envoltorio tono="ok">
      <FichaActivo activo={activo} />
    </Envoltorio>
  )
}
