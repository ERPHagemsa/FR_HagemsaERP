"use client"

import { useState } from "react"
import Image from "next/image"
import { useParams } from "next/navigation"
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ExternalLink,
  FileText,
  Handshake,
  Loader2,
  ShieldCheck,
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
  MotivoDisponible,
  MotivosPorTipo,
} from "@/modulos/comercial/cotizaciones/tipos/respuesta-cliente.tipos"

// Look claro comprometido (no depende del tema del sistema): es una pagina
// publica de cara al cliente, que llega desde un correo blanco y minimalista.
// Se mantiene esa continuidad visual y no se ofrece toggle de tema.

const ROJO = "#e1251b"

// Sellos de certificacion (los mismos que van en los correos). Assets publicos
// fijos en el bucket de marca; se usan por URL directa (imgs sin optimizar para
// no depender de la config de dominios de next/image).
const URL_MARCA = "https://storage.googleapis.com/hagemsa-public/marca"
const SELLOS: ReadonlyArray<{ archivo: string; alt: string }> = [
  { archivo: "ISO-9001-2022.png", alt: "ISO 9001 · Calidad" },
  { archivo: "ISO-14001-2022.png", alt: "ISO 14001 · Ambiente" },
  { archivo: "ISO-45001-2022.png", alt: "ISO 45001 · Seguridad y salud" },
  { archivo: "aenor.png", alt: "AENOR ISO 39001 · Seguridad vial" },
  { archivo: "basc.png", alt: "BASC · Comercio seguro" },
]

// Estilo por decision: cada respuesta tiene su color semantico (aceptar/negociar/
// rechazar). Clases explicitas para que Tailwind las incluya (no se construyen
// dinamicamente).
const OPCIONES: Array<{
  decision: DecisionCliente
  titulo: string
  descripcion: string
  icono: typeof CheckCircle2
  chipInactivo: string
  chipActivo: string
  tarjetaActiva: string
  puntoActivo: string
}> = [
  {
    decision: "ACEPTADA",
    titulo: "Acepto la cotización",
    descripcion: "Estamos de acuerdo con la propuesta.",
    icono: CheckCircle2,
    chipInactivo: "bg-zinc-100 text-zinc-400",
    chipActivo: "bg-emerald-500 text-white",
    tarjetaActiva: "border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500",
    puntoActivo: "border-emerald-500 bg-emerald-500",
  },
  {
    decision: "NEGOCIAR",
    titulo: "Deseo negociar",
    descripcion: "Queremos conversar algunos puntos antes de cerrar.",
    icono: Handshake,
    chipInactivo: "bg-zinc-100 text-zinc-400",
    chipActivo: "bg-amber-500 text-white",
    tarjetaActiva: "border-amber-500 bg-amber-50/70 ring-1 ring-amber-500",
    puntoActivo: "border-amber-500 bg-amber-500",
  },
  {
    decision: "RECHAZADA",
    titulo: "No acepto la cotización",
    descripcion: "No continuaremos con esta propuesta.",
    icono: XCircle,
    chipInactivo: "bg-zinc-100 text-zinc-400",
    chipActivo: "bg-red-500 text-white",
    tarjetaActiva: "border-red-500 bg-red-50/70 ring-1 ring-red-500",
    puntoActivo: "border-red-500 bg-red-500",
  },
]

// Al rechazar o negociar el cliente debe elegir un motivo del catalogo; al
// aceptar no. Misma regla que el dominio en BC-03.
function requiereMotivo(decision: DecisionCliente | null): boolean {
  return decision === "RECHAZADA" || decision === "NEGOCIAR"
}

// Los motivos que corresponden a la decision elegida. Tolera un `motivos`
// ausente (backend viejo durante una ventana de despliegue) devolviendo [].
function motivosDe(
  decision: DecisionCliente | null,
  motivos: MotivosPorTipo | undefined,
): MotivoDisponible[] {
  if (decision === "RECHAZADA") return motivos?.rechazo ?? []
  if (decision === "NEGOCIAR") return motivos?.negociacion ?? []
  return []
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
// Sellos de certificacion: la firma de marca. HAGEMSA es una transportista
// certificada; mostrar los sellos donde el cliente decide refuerza la confianza.
// ---------------------------------------------------------------------------

function SellosCertificacion() {
  return (
    <div className="border-y border-zinc-100 bg-zinc-50/60 px-6 py-5 sm:px-8">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-4" style={{ color: ROJO }} />
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
          Sistemas de gestión certificados
        </p>
      </div>
      <div className="mt-3.5 flex flex-wrap items-center gap-x-6 gap-y-3.5">
        {SELLOS.map((s) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={s.archivo}
            src={`${URL_MARCA}/${s.archivo}`}
            alt={s.alt}
            title={s.alt}
            className="h-9 w-auto object-contain grayscale-[0.15] transition duration-200 hover:grayscale-0"
            loading="lazy"
          />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Envoltorio: fondo, logo y tarjeta.
// ---------------------------------------------------------------------------

function Envoltorio({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#f5f6f8] via-[#eceef2] to-[#e3e6ea] px-4 py-8 text-zinc-800 sm:py-14">
      <div className="flex w-full max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4 px-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400">
            Portal del cliente
          </span>
          <Image
            src="/logo/logo.svg"
            alt="TRANSPORTES HAGEMSA S.A.C."
            width={140}
            height={56}
            className="h-10 w-auto object-contain"
            priority
          />
        </div>

        <div
          className="overflow-hidden rounded-3xl border-t-4 bg-white shadow-[0_1px_3px_rgba(16,24,40,0.06),0_12px_40px_-12px_rgba(16,24,40,0.18)] ring-1 ring-zinc-200/70"
          style={{ borderTopColor: ROJO }}
        >
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
      <span className={`flex size-16 items-center justify-center rounded-2xl ring-1 ${color}`}>
        <Icono className="size-7" />
      </span>
      <div>
        <p className="text-lg font-bold tracking-tight text-zinc-900">{titulo}</p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-zinc-500">{descripcion}</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Encabezado con los datos de la cotizacion.
// ---------------------------------------------------------------------------

function Encabezado({ cotizacion }: { cotizacion: CotizacionPublica }) {
  return (
    <div className="px-6 pb-6 pt-8 sm:px-8">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: ROJO }}>
        Propuesta comercial
      </p>
      <h1 className="mt-2.5 text-3xl font-extrabold leading-[1.1] tracking-tight text-zinc-900">
        Su cotización
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        Revise el documento y déjenos su respuesta. Toma menos de un minuto.
      </p>

      <div className="mt-6 grid gap-2.5 sm:grid-cols-3">
        <div className="rounded-2xl bg-zinc-50 px-4 py-3.5 ring-1 ring-zinc-100">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Código
          </span>
          <span className="mt-1 block font-mono text-sm font-bold tracking-tight text-zinc-900">
            {cotizacion.codigoCotizacion}
          </span>
        </div>
        <div className="rounded-2xl bg-zinc-50 px-4 py-3.5 ring-1 ring-zinc-100">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Cliente
          </span>
          <span className="mt-1 block truncate text-sm font-semibold text-zinc-900" title={cotizacion.cliente}>
            {cotizacion.cliente}
          </span>
        </div>
        <div className="rounded-2xl bg-zinc-50 px-4 py-3.5 ring-1 ring-zinc-100">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Válida hasta
          </span>
          <span className="mt-1 block text-sm font-semibold text-zinc-900">
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
    <div className="px-6 py-6 sm:px-8">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-bold text-zinc-900">
          <FileText className="size-4 text-zinc-400" />
          Cotización completa
        </span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-200"
        >
          Abrir en pestaña
          <ExternalLink className="size-3.5" />
        </a>
      </div>
      <iframe
        src={url}
        title="Cotización en PDF"
        className="h-[420px] w-full rounded-2xl bg-zinc-50 ring-1 ring-zinc-200 sm:h-[560px]"
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Formulario de respuesta.
// ---------------------------------------------------------------------------

function Formulario({
  token,
  motivos,
  alEnviar,
}: {
  token: string
  motivos: MotivosPorTipo
  alEnviar: (decision: DecisionCliente) => void
}) {
  const [decision, setDecision] = useState<DecisionCliente | null>(null)
  const [idsMotivos, setIdsMotivos] = useState<string[]>([])
  const [nombre, setNombre] = useState("")
  const [comentario, setComentario] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const motivosDisponibles = motivosDe(decision, motivos)
  // Los motivos elegidos que siguen disponibles para la decision actual (al
  // cambiar de decision se limpia, pero se deriva de la lista por robustez).
  const motivosElegidos = motivosDisponibles.filter((m) =>
    idsMotivos.includes(m.id)
  )
  const necesitaMotivo = requiereMotivo(decision)
  // El detalle es obligatorio si ALGUNO de los motivos elegidos lo pide (ej. "Otro").
  const detalleObligatorio = motivosElegidos.some((m) => m.requiereDetalle)

  const puedeEnviar =
    decision !== null &&
    nombre.trim().length > 0 &&
    (!necesitaMotivo || motivosElegidos.length > 0) &&
    (!detalleObligatorio || comentario.trim().length > 0) &&
    !enviando

  // Al cambiar de decision, los motivos elegidos dejan de tener sentido (cada
  // decision tiene su propia lista): se limpian.
  function cambiarDecision(nueva: DecisionCliente) {
    setDecision(nueva)
    setIdsMotivos([])
    if (error) setError(null)
  }

  // Marca/desmarca un motivo (seleccion multiple).
  function alternarMotivo(id: string) {
    setIdsMotivos((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
    if (error) setError(null)
  }

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    if (!decision || !puedeEnviar) return
    setEnviando(true)
    setError(null)
    try {
      await registrarRespuestaCliente(token, {
        decision,
        nombreRespondedor: nombre.trim(),
        idMotivos: motivosElegidos.length > 0
          ? motivosElegidos.map((m) => m.id)
          : undefined,
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
    <form onSubmit={enviar} className="flex flex-col gap-6 px-6 py-7 sm:px-8">
      <div>
        <p className="text-base font-bold tracking-tight text-zinc-900">¿Cuál es su respuesta?</p>
        <p className="mt-1 text-sm text-zinc-500">
          Puede responder una sola vez. Su respuesta llega directo al equipo comercial.
        </p>
      </div>

      <div className="grid gap-2.5">
        {OPCIONES.map((opcion) => {
          const activa = decision === opcion.decision
          const Icono = opcion.icono
          return (
            <label
              key={opcion.decision}
              className={`group flex cursor-pointer items-center gap-4 rounded-2xl border px-4 py-4 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-zinc-900/40 has-[:focus-visible]:ring-offset-2 ${
                activa
                  ? opcion.tarjetaActiva
                  : "border-zinc-200 bg-white hover:-translate-y-px hover:border-zinc-300 hover:shadow-sm"
              }`}
            >
              <input
                type="radio"
                name="decision"
                value={opcion.decision}
                checked={activa}
                onChange={() => cambiarDecision(opcion.decision)}
                className="sr-only"
              />
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition ${
                  activa ? opcion.chipActivo : opcion.chipInactivo
                }`}
              >
                <Icono className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-zinc-900">{opcion.titulo}</span>
                <span className="block text-xs text-zinc-500">{opcion.descripcion}</span>
              </span>
              <span
                className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                  activa ? opcion.puntoActivo : "border-zinc-300 group-hover:border-zinc-400"
                }`}
              >
                {activa ? <span className="size-1.5 rounded-full bg-white" /> : null}
              </span>
            </label>
          )
        })}
      </div>

      {/* Motivos del catalogo: solo al rechazar o negociar. Seleccion multiple. */}
      {necesitaMotivo ? (
        <div className="grid gap-2.5">
          <p className="text-sm font-bold text-zinc-800">
            {decision === "RECHAZADA"
              ? "¿Por qué no acepta la cotización?"
              : "¿Qué desea negociar?"}{" "}
            <span className="font-medium text-zinc-400">(puede elegir varios)</span>
          </p>
          {motivosDisponibles.length === 0 ? (
            // Sin motivos cargados no se puede completar esta respuesta: se avisa
            // en vez de dejar el formulario en blanco con el boton deshabilitado.
            <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-700 ring-1 ring-amber-200">
              No hay motivos disponibles en este momento. Contacte a su ejecutivo
              comercial para responder esta cotización.
            </p>
          ) : null}
          <div className="grid gap-2 sm:grid-cols-2">
            {motivosDisponibles.map((m) => {
              const activo = idsMotivos.includes(m.id)
              return (
                <label
                  key={m.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 text-sm transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-zinc-900/40 has-[:focus-visible]:ring-offset-2 ${
                    activo
                      ? "border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900"
                      : "border-zinc-200 bg-white hover:border-zinc-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="motivo"
                    value={m.id}
                    checked={activo}
                    onChange={() => alternarMotivo(m.id)}
                    className="sr-only"
                  />
                  <span
                    className={`flex size-4 shrink-0 items-center justify-center rounded border transition ${
                      activo ? "border-zinc-900 bg-zinc-900" : "border-zinc-300"
                    }`}
                  >
                    {activo ? (
                      <Check className="size-3 text-white" strokeWidth={3} />
                    ) : null}
                  </span>
                  <span className="text-zinc-800">{m.etiqueta}</span>
                </label>
              )
            })}
          </div>
        </div>
      ) : null}

      <div className="grid gap-1.5">
        <label htmlFor="nombre" className="text-xs font-bold text-zinc-700">
          Nombre de quien responde
        </label>
        <input
          id="nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          maxLength={150}
          placeholder="Nombre y apellido"
          className="rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="comentario" className="text-xs font-bold text-zinc-700">
          {necesitaMotivo ? "Detalle" : "Comentario"}{" "}
          <span className="font-medium text-zinc-400">
            {detalleObligatorio ? "(obligatorio)" : "(opcional)"}
          </span>
        </label>
        <textarea
          id="comentario"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          maxLength={1000}
          rows={4}
          placeholder={
            detalleObligatorio
              ? "Cuéntenos un poco más."
              : decision === "RECHAZADA"
                ? "Si desea, agregue algún detalle."
                : decision === "NEGOCIAR"
                  ? "Si desea, indíquenos qué puntos ajustar."
                  : "Puede dejarnos un comentario."
          }
          className="resize-y rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
        />
      </div>

      {error ? (
        <p className="flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700 ring-1 ring-red-200">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!puedeEnviar}
        className="group flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-white shadow-sm transition enabled:hover:brightness-95 disabled:cursor-not-allowed disabled:bg-zinc-300"
        style={puedeEnviar ? { backgroundColor: ROJO } : undefined}
      >
        {enviando ? <Loader2 className="size-4 animate-spin" /> : null}
        {enviando ? "Enviando..." : "Enviar respuesta"}
        {!enviando ? (
          <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
        ) : null}
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
      <SellosCertificacion />
      <DocumentoPdf token={token} />
      <Formulario
        token={token}
        motivos={cotizacion.motivos}
        alEnviar={setRespondidaAhora}
      />
    </Envoltorio>
  )
}
