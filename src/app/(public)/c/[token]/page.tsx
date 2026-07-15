"use client"

import { useState } from "react"
import Image from "next/image"
import { useParams } from "next/navigation"
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileText,
  Handshake,
  Loader2,
  XCircle,
} from "lucide-react"

import { extraerMensajeError } from "@/compartido/api/formato-error"
import { useConsulta } from "@/compartido/api/use-consulta"
import {
  consultarCotizacionPublica,
  registrarRespuestaCliente,
  urlPdfCotizacionPublica,
} from "@/modulos/comercial/cotizaciones/servicios/respuesta-cliente-api"
import type {
  CotizacionPublica,
  DecisionCliente,
} from "@/modulos/comercial/cotizaciones/tipos/respuesta-cliente.tipos"

// Look claro comprometido (no depende del tema del sistema): es una pagina
// publica de cara al cliente, que llega desde un correo blanco y minimalista.
// Se mantiene esa continuidad visual y no se ofrece toggle de tema.

const OPCIONES: Array<{
  decision: DecisionCliente
  titulo: string
  descripcion: string
  icono: typeof CheckCircle2
  clase: string
  claseActiva: string
}> = [
  {
    decision: "ACEPTADA",
    titulo: "Acepto la cotización",
    descripcion: "Estamos de acuerdo con la propuesta.",
    icono: CheckCircle2,
    clase: "text-emerald-600",
    claseActiva: "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500",
  },
  {
    decision: "NEGOCIAR",
    titulo: "Deseo negociar",
    descripcion: "Queremos conversar algunos puntos antes de cerrar.",
    icono: Handshake,
    clase: "text-amber-600",
    claseActiva: "border-amber-500 bg-amber-50 ring-1 ring-amber-500",
  },
  {
    decision: "RECHAZADA",
    titulo: "No acepto la cotización",
    descripcion: "No continuaremos con esta propuesta.",
    icono: XCircle,
    clase: "text-red-600",
    claseActiva: "border-red-500 bg-red-50 ring-1 ring-red-500",
  },
]

// El comentario es obligatorio al rechazar (es el motivo de perdida) y al
// negociar (motivo de la nueva version). Misma regla que el dominio en BC-03.
function requiereComentario(decision: DecisionCliente | null): boolean {
  return decision === "RECHAZADA" || decision === "NEGOCIAR"
}

const TEXTO_RESPUESTA: Record<DecisionCliente, string> = {
  ACEPTADA: "aceptaste la cotización",
  RECHAZADA: "indicaste que no aceptas la cotización",
  NEGOCIAR: "solicitaste negociar la cotización",
}

function formatearFecha(iso: string): string {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return "—"
  return fecha.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

// ---------------------------------------------------------------------------
// Envoltorio: fondo, logo y tarjeta.
// ---------------------------------------------------------------------------

function Envoltorio({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center bg-zinc-100 px-4 py-8 text-zinc-800 sm:py-12">
      <div className="flex w-full max-w-3xl flex-col gap-5">
        <div className="flex justify-end">
          <Image
            src="/logo/logo.svg"
            alt="TRANSPORTES HAGEMSA S.A.C."
            width={140}
            height={56}
            className="h-11 w-auto object-contain"
            priority
          />
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200">
          {children}
        </div>

        <p className="text-center text-[11px] text-zinc-400">
          TRANSPORTES HAGEMSA S.A.C. · Comprometidos con la excelencia en el transporte.
        </p>
      </div>
    </main>
  )
}

function EstadoMensaje({
  icono: Icono,
  titulo,
  descripcion,
  tono,
}: {
  icono: typeof AlertTriangle
  titulo: string
  descripcion: string
  tono: "ok" | "error" | "aviso"
}) {
  const color = {
    ok: "bg-emerald-50 text-emerald-600 ring-emerald-200",
    error: "bg-red-50 text-red-600 ring-red-200",
    aviso: "bg-amber-50 text-amber-600 ring-amber-200",
  }[tono]
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
      <span className={`flex size-14 items-center justify-center rounded-2xl ring-1 ${color}`}>
        <Icono className="size-6" />
      </span>
      <div>
        <p className="text-base font-semibold text-zinc-900">{titulo}</p>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-zinc-500">{descripcion}</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Encabezado con los datos de la cotizacion.
// ---------------------------------------------------------------------------

function Encabezado({ cotizacion }: { cotizacion: CotizacionPublica }) {
  return (
    <div className="border-b border-zinc-100 px-6 py-6 sm:px-8">
      <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#e1251b]">
        Propuesta comercial
      </p>
      <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight text-zinc-900">
        Su cotización
      </h1>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-zinc-50 px-4 py-3">
          <span className="block text-[10px] font-medium uppercase tracking-wider text-zinc-400">
            Código
          </span>
          <span className="mt-0.5 block font-mono text-sm font-bold text-zinc-900">
            {cotizacion.codigoCotizacion}
          </span>
        </div>
        <div className="rounded-xl bg-zinc-50 px-4 py-3">
          <span className="block text-[10px] font-medium uppercase tracking-wider text-zinc-400">
            Cliente
          </span>
          <span className="mt-0.5 block truncate text-sm font-semibold text-zinc-900">
            {cotizacion.cliente}
          </span>
        </div>
        <div className="rounded-xl bg-zinc-50 px-4 py-3">
          <span className="block text-[10px] font-medium uppercase tracking-wider text-zinc-400">
            Válida hasta
          </span>
          <span className="mt-0.5 block text-sm font-semibold text-zinc-900">
            {formatearFecha(cotizacion.expiraEn)}
          </span>
        </div>
      </div>
    </div>
  )
}

// El documento completo que ve el cliente es el PDF. Se embebe, con enlace de
// escape: varios navegadores moviles no renderizan PDF dentro de un iframe.
function DocumentoPdf({ token }: { token: string }) {
  const url = urlPdfCotizacionPublica(token)
  return (
    <div className="border-b border-zinc-100 px-6 py-6 sm:px-8">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
          <FileText className="size-4 text-zinc-400" />
          Cotización completa
        </span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-[#e1251b] hover:underline"
        >
          Abrir en pestaña
          <ExternalLink className="size-3.5" />
        </a>
      </div>
      <iframe
        src={url}
        title="Cotización en PDF"
        className="h-[420px] w-full rounded-xl bg-zinc-50 ring-1 ring-zinc-200 sm:h-[560px]"
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Formulario de respuesta.
// ---------------------------------------------------------------------------

function Formulario({
  token,
  alEnviar,
}: {
  token: string
  alEnviar: (decision: DecisionCliente) => void
}) {
  const [decision, setDecision] = useState<DecisionCliente | null>(null)
  const [nombre, setNombre] = useState("")
  const [comentario, setComentario] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const comentarioObligatorio = requiereComentario(decision)
  const puedeEnviar =
    decision !== null &&
    nombre.trim().length > 0 &&
    (!comentarioObligatorio || comentario.trim().length > 0) &&
    !enviando

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    if (!decision || !puedeEnviar) return
    setEnviando(true)
    setError(null)
    try {
      await registrarRespuestaCliente(token, {
        decision,
        nombreRespondedor: nombre.trim(),
        comentario: comentario.trim() || undefined,
      })
      alEnviar(decision)
    } catch (err) {
      setError(
        extraerMensajeError(err, "No se pudo registrar tu respuesta. Intenta nuevamente.")
      )
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-6 px-6 py-6 sm:px-8">
      <div>
        <p className="text-sm font-semibold text-zinc-900">¿Cuál es su respuesta?</p>
        <p className="mt-0.5 text-sm text-zinc-500">
          Puede responder una sola vez. Su respuesta llegará al equipo comercial.
        </p>
      </div>

      <div className="grid gap-2.5">
        {OPCIONES.map((opcion) => {
          const activa = decision === opcion.decision
          const Icono = opcion.icono
          return (
            <label
              key={opcion.decision}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3.5 transition ${
                activa
                  ? opcion.claseActiva
                  : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              <input
                type="radio"
                name="decision"
                value={opcion.decision}
                checked={activa}
                onChange={() => setDecision(opcion.decision)}
                className="sr-only"
              />
              <Icono className={`mt-0.5 size-5 shrink-0 ${activa ? opcion.clase : "text-zinc-400"}`} />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-zinc-900">{opcion.titulo}</span>
                <span className="block text-xs text-zinc-500">{opcion.descripcion}</span>
              </span>
            </label>
          )
        })}
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="nombre" className="text-xs font-semibold text-zinc-700">
          Nombre de quien responde
        </label>
        <input
          id="nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          maxLength={150}
          placeholder="Nombre y apellido"
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="comentario" className="text-xs font-semibold text-zinc-700">
          Comentario{" "}
          <span className="font-normal text-zinc-400">
            {comentarioObligatorio ? "(obligatorio)" : "(opcional)"}
          </span>
        </label>
        <textarea
          id="comentario"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          maxLength={1000}
          rows={4}
          placeholder={
            decision === "RECHAZADA"
              ? "Cuéntenos el motivo por el que no acepta la cotización."
              : decision === "NEGOCIAR"
                ? "Indíquenos qué puntos desea negociar."
                : "Puede dejarnos un comentario."
          }
          className="resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
        />
      </div>

      {error ? (
        <p className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700 ring-1 ring-red-200">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!puedeEnviar}
        className="flex items-center justify-center gap-2 rounded-lg bg-[#e1251b] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#c41f16] disabled:cursor-not-allowed disabled:bg-zinc-300"
      >
        {enviando ? <Loader2 className="size-4 animate-spin" /> : null}
        {enviando ? "Enviando..." : "Enviar respuesta"}
      </button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Pagina
// ---------------------------------------------------------------------------

export default function RespuestaCotizacionPage() {
  const params = useParams<{ token: string }>()
  const token = Array.isArray(params.token) ? params.token[0] : params.token
  const [respondidaAhora, setRespondidaAhora] = useState<DecisionCliente | null>(null)

  const consulta = useConsulta(() => consultarCotizacionPublica(token), [token], {
    enabled: Boolean(token),
  })

  if (consulta.isLoading) {
    return (
      <Envoltorio>
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Loader2 className="size-6 animate-spin text-zinc-400" />
          <p className="text-sm text-zinc-500">Cargando su cotización...</p>
        </div>
      </Envoltorio>
    )
  }

  if (consulta.isError || !consulta.data) {
    return (
      <Envoltorio>
        <EstadoMensaje
          icono={AlertTriangle}
          tono="error"
          titulo="Enlace no válido"
          descripcion={
            extraerMensajeError(consulta.error) ||
            "Este enlace no existe o ya no está disponible. Contacte a su ejecutivo comercial."
          }
        />
      </Envoltorio>
    )
  }

  const cotizacion = consulta.data

  // Recien respondida en esta pantalla: se agradece sin re-consultar el backend.
  if (respondidaAhora) {
    return (
      <Envoltorio>
        <EstadoMensaje
          icono={CheckCircle2}
          tono="ok"
          titulo="¡Gracias por su respuesta!"
          descripcion={`Registramos que ${TEXTO_RESPUESTA[respondidaAhora]} ${cotizacion.codigoCotizacion}. Nuestro equipo comercial ya fue notificado y se pondrá en contacto.`}
        />
      </Envoltorio>
    )
  }

  if (cotizacion.estadoEnlace === "RESPONDIDA") {
    return (
      <Envoltorio>
        <Encabezado cotizacion={cotizacion} />
        <EstadoMensaje
          icono={CheckCircle2}
          tono="ok"
          titulo="Esta cotización ya fue respondida"
          descripcion={
            cotizacion.respuesta
              ? `Ya ${TEXTO_RESPUESTA[cotizacion.respuesta]}. Si necesita hacer un cambio, contacte a su ejecutivo comercial.`
              : "Si necesita hacer un cambio, contacte a su ejecutivo comercial."
          }
        />
      </Envoltorio>
    )
  }

  if (cotizacion.estadoEnlace === "EXPIRADA") {
    return (
      <Envoltorio>
        <Encabezado cotizacion={cotizacion} />
        <EstadoMensaje
          icono={AlertTriangle}
          tono="aviso"
          titulo="El enlace venció"
          descripcion={`Esta cotización estuvo vigente hasta el ${formatearFecha(cotizacion.expiraEn)}. Contacte a su ejecutivo comercial para recibir una propuesta actualizada.`}
        />
      </Envoltorio>
    )
  }

  return (
    <Envoltorio>
      <Encabezado cotizacion={cotizacion} />
      <DocumentoPdf token={token} />
      <Formulario token={token} alEnviar={setRespondidaAhora} />
    </Envoltorio>
  )
}
