"use client"

import Image from "next/image"
import { useParams } from "next/navigation"
import { AlertTriangle, QrCode, ScanLine } from "lucide-react"

import { extraerMensajeError } from "@/compartido/api/formato-error"
import { useConsulta } from "@/compartido/api/use-consulta"
import { Badge } from "@/compartido/componentes/ui/badge"
import { Card, CardContent } from "@/compartido/componentes/ui/card"
import { Skeleton } from "@/compartido/componentes/ui/skeleton"
import { consultarEtiquetaPublica } from "@/modulos/activos/servicios/etiquetas-api"
import type { EtiquetaPublicaActivo } from "@/modulos/activos/tipos/etiquetas.tipos"

const MENSAJE_MOTIVO: Record<string, string> = {
  SIN_ASIGNAR: "Este codigo QR todavia no esta vinculado a ningun activo.",
  REEMPLAZADA: "Este codigo QR ya no esta vigente: fue reemplazado por uno mas reciente.",
}

type CampoActivo = {
  etiqueta: string
  obtener: (a: EtiquetaPublicaActivo) => string | null
  ancho?: boolean
}

const CAMPOS: CampoActivo[] = [
  { etiqueta: "Placa", obtener: (a) => a.placa },
  { etiqueta: "Año", obtener: (a) => (a.anioFabricacion ? String(a.anioFabricacion) : null) },
  { etiqueta: "Marca", obtener: (a) => a.marca },
  { etiqueta: "Modelo", obtener: (a) => a.modelo },
  { etiqueta: "Color", obtener: (a) => a.color },
  { etiqueta: "Categoria", obtener: (a) => a.categoria },
  { etiqueta: "Carroceria", obtener: (a) => a.carroceria },
  { etiqueta: "Ejes", obtener: (a) => (a.ejes != null ? String(a.ejes) : null) },
  { etiqueta: "Ruedas", obtener: (a) => (a.cantidadRuedas != null ? String(a.cantidadRuedas) : null) },
  { etiqueta: "Estado operativo", obtener: (a) => a.estadoOperativo },
  { etiqueta: "Serie de chasis", obtener: (a) => a.serieChasis, ancho: true },
  { etiqueta: "Serie de motor", obtener: (a) => a.serieMotor, ancho: true },
  { etiqueta: "Zona registral", obtener: (a) => a.zonaRegistral, ancho: true },
  { etiqueta: "Ubicacion", obtener: (a) => a.ubicacion, ancho: true },
]

function Encabezado() {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <span className="flex size-12 items-center justify-center">
        <Image
          src="/logo/logo.svg"
          alt="Hagemsa"
          width={48}
          height={48}
          className="size-full object-contain"
        />
      </span>
      <div>
        <p className="text-sm font-semibold tracking-wide text-foreground">HAGEMSA</p>
        <p className="text-xs text-muted-foreground">Consulta publica de activo</p>
      </div>
    </div>
  )
}

function Envoltorio({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10 text-foreground">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Encabezado />
        <Card className="overflow-hidden py-0 gap-0">{children}</Card>
      </div>
    </main>
  )
}

function EstadoMensaje({
  icono: Icono,
  titulo,
  descripcion,
  tono = "muted",
}: {
  icono: typeof AlertTriangle
  titulo: string
  descripcion: string
  tono?: "muted" | "destructive"
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <span
        className={
          tono === "destructive"
            ? "flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive"
            : "flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground"
        }
      >
        <Icono className="size-5" />
      </span>
      <div>
        <p className="text-sm font-semibold">{titulo}</p>
        <p className="mt-1 text-sm text-muted-foreground">{descripcion}</p>
      </div>
    </div>
  )
}

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
      <Envoltorio>
        <div className="flex flex-col gap-4 p-6">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-px w-full" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        </div>
      </Envoltorio>
    )
  }

  if (consulta.isError) {
    return (
      <Envoltorio>
        <EstadoMensaje
          icono={AlertTriangle}
          tono="destructive"
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
      <Envoltorio>
        <EstadoMensaje
          icono={ScanLine}
          titulo="Sin vinculacion"
          descripcion={
            MENSAJE_MOTIVO[datos.motivo ?? ""] ??
            "Este codigo QR no tiene una vinculacion valida."
          }
        />
      </Envoltorio>
    )
  }

  if (!activo) return <Envoltorio>{null}</Envoltorio>

  return (
    <Envoltorio>
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/30 px-5 py-3">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <QrCode className="size-3.5" />
          {activo.codigo}
        </div>
        <Badge variant={activo.estadoActivo === "ACTIVO" ? "default" : "secondary"}>
          {activo.estadoActivo}
        </Badge>
      </div>

      <CardContent className="flex flex-col gap-4 px-5 py-5">
        <div>
          <p className="text-base leading-snug font-semibold">{activo.descripcion}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {activo.tipoActivo}
            {activo.clase ? ` · ${activo.clase}` : ""}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-4">
          {CAMPOS.map(({ etiqueta, obtener, ancho }) => {
            const valor = obtener(activo)
            if (!valor) return null
            return (
              <div
                key={etiqueta}
                className={`flex flex-col gap-0.5 ${ancho ? "col-span-2" : ""}`}
              >
                <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
                <dd className="text-sm font-medium break-words">{valor}</dd>
              </div>
            )
          })}
        </dl>
      </CardContent>
    </Envoltorio>
  )
}
