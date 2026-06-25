"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { SiteHeader } from "@/compartido/componentes/site-header"
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert"
import { Badge } from "@/compartido/componentes/ui/badge"
import { Button } from "@/compartido/componentes/ui/button"
import { Skeleton } from "@/compartido/componentes/ui/skeleton"
import { cn } from "@/compartido/utilidades/utils"

import { SocioNegocioPageHeader } from "../componentes/socio-negocio-page-header"
import { AsignacionPersonalCard } from "../componentes/socio-negocio-detalle-personal-asignaciones"
import {
  useLineaHistoricaPersonalQuery,
  useSocioDeNegocioQuery,
} from "../servicios/socio-negocios-queries"
import type { LineaHistoricaRegistro } from "../tipos/socio-negocio"

function obtenerMensajeError(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo cargar la linea historica."
}

function ResumenDato({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0 bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 break-words text-lg font-semibold">{value}</p>
    </div>
  )
}

function RegistroVersion({
  registro,
}: {
  registro: LineaHistoricaRegistro
}) {
  const inactivo = registro.estado === "INACTIVO"

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-card",
        registro.esActual ? "border-primary/40" : "border-border/70",
      )}
    >
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Versión {registro.numeroVersion}</Badge>
          <Badge variant="outline">#{registro.id}</Badge>
          {registro.esRaiz ? <Badge variant="secondary">Raíz</Badge> : null}
          {registro.esActual ? <Badge>Actual</Badge> : null}
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-sm",
              inactivo ? "font-medium text-destructive" : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400",
                inactivo && "bg-destructive",
              )}
            />
            {registro.estado}
          </span>
        </div>
        {registro.motivoNuevoRegistro ? (
          <Badge variant="outline" className="font-medium">
            {registro.motivoNuevoRegistro}
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 p-4">
        {registro.registroAnteriorId ? (
          <p className="text-sm text-muted-foreground">
            Proviene del registro #{registro.registroAnteriorId}.
          </p>
        ) : null}

        {registro.asignaciones.length > 0 ? (
          registro.asignaciones.map((asignacion) => (
            <AsignacionPersonalCard key={asignacion.id} asignacion={asignacion} />
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            Esta versión no tenía asignaciones registradas.
          </div>
        )}
      </div>
    </div>
  )
}

export function SocioNegocioLineaHistoricaVista({ id }: { id: string }) {
  const socioQuery = useSocioDeNegocioQuery(id, "PERSONAL")
  const lineaQuery = useLineaHistoricaPersonalQuery(id)
  const socio = socioQuery.data
  const linea = lineaQuery.data
  const cargando = socioQuery.isLoading || lineaQuery.isLoading
  const error = lineaQuery.error ?? socioQuery.error

  const titulo = socio?.nombreCompleto
    ? `Línea histórica de ${socio.nombreCompleto}`
    : "Línea histórica del personal"

  return (
    <>
      <SiteHeader
        title="Línea histórica"
        breadcrumbs={[
          { title: "Socio de Negocio", href: "/socio-negocios" },
          { title: "Personal", href: "/socio-negocios/personal" },
          { title: "Ver", href: `/socio-negocios/${id}?tipo=PERSONAL` },
          { title: "Línea histórica" },
        ]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          {cargando ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-9 w-64" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : null}

          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Error de API</AlertTitle>
              <AlertDescription>{obtenerMensajeError(error)}</AlertDescription>
            </Alert>
          ) : null}

          {linea ? (
            <>
              <SocioNegocioPageHeader
                title={titulo}
                description={`Documento ${linea.numeroDocumento} · Cadena de reingresos y asignaciones de cada versión.`}
                actions={
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/socio-negocios/${id}?tipo=PERSONAL`}>
                      <ArrowLeft data-icon="inline-start" />
                      Volver al socio
                    </Link>
                  </Button>
                }
              />

              <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
                <ResumenDato label="Total registros" value={linea.totalRegistros} />
                <ResumenDato label="Reingresos" value={linea.totalReingresos} />
                <ResumenDato label="Registro raíz" value={`#${linea.registroRaizId}`} />
                <ResumenDato label="Registro actual" value={`#${linea.registroActualId}`} />
              </dl>

              {linea.registroAnteriorInmediato?.motivoBaja ? (
                <Alert>
                  <AlertTitle>Último motivo de baja</AlertTitle>
                  <AlertDescription>
                    Registro #{linea.registroAnteriorInmediato.id}:{" "}
                    {linea.registroAnteriorInmediato.motivoBaja}
                  </AlertDescription>
                </Alert>
              ) : null}

              <div className="flex flex-col gap-4">
                {linea.registros.map((registro) => (
                  <RegistroVersion key={registro.id} registro={registro} />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </main>
    </>
  )
}
