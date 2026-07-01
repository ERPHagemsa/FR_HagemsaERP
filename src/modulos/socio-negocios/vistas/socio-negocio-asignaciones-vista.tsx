"use client"

import Link from "next/link"
import { ArrowLeft, ShieldAlert } from "lucide-react"

import { SiteHeader } from "@/compartido/componentes/site-header"
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert"
import { Button } from "@/compartido/componentes/ui/button"
import { Skeleton } from "@/compartido/componentes/ui/skeleton"

import { AsignacionesPersonalSeccion } from "../componentes/asignaciones-personal-seccion"
import { SocioNegocioPageHeader } from "../componentes/socio-negocio-page-header"
import { useSocioDeNegocioQuery } from "../servicios/socio-negocios-queries"
import {
  puedeGestionarAsignacionesPersonal,
  puedeResolverAprobacionSocio,
} from "../tipos/socio-negocio"

function obtenerMensajeError(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo cargar el socio."
}

export function SocioNegocioAsignacionesVista({ id }: { id: string }) {
  const socioQuery = useSocioDeNegocioQuery(id)
  const socio = socioQuery.data
  const esPersonal = socio?.tipo === "PERSONAL"
  // El personal nace PENDIENTE_APROBACION. La aprobacion se hace en el detalle
  // del socio (no aqui), por eso desde el detalle el acceso a esta pantalla solo
  // aparece cuando ya esta APROBADO. Si alguien entra por URL directa estando
  // pendiente o rechazado, se bloquea y se lo guia de vuelta al detalle.
  const pendienteAprobacion = socio ? puedeResolverAprobacionSocio(socio) : false
  const rechazado = socio?.estadoAprobacion === "RECHAZADO"
  const puedeGestionarAsignaciones =
    socio
      ? puedeGestionarAsignacionesPersonal(socio) &&
        socio.estadoAprobacion === "APROBADO"
      : false

  const nombreSocio = socio
    ? socio.tipo === "PERSONAL"
      ? socio.nombreCompleto ||
        [socio.primerNombre, socio.apellidoPaterno, socio.apellidoMaterno]
          .filter(Boolean)
          .join(" ") ||
        socio.numeroDocumento
      : socio.razonSocial || socio.nombreComercial || socio.numeroDocumento
    : ""

  return (
    <>
      <SiteHeader
        title="Gestion del personal"
        breadcrumbs={[
          { title: "Socio de Negocio", href: "/socio-negocios" },
          { title: "Personal", href: "/socio-negocios/personal" },
          { title: "Ver", href: `/socio-negocios/${id}?tipo=PERSONAL` },
          { title: "Gestion del personal" },
        ]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          {socioQuery.isLoading ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-9 w-64" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : null}

          {socioQuery.error ? (
            <Alert variant="destructive">
              <AlertTitle>Error de API</AlertTitle>
              <AlertDescription>{obtenerMensajeError(socioQuery.error)}</AlertDescription>
            </Alert>
          ) : null}

          {socio ? (
            <>
              <SocioNegocioPageHeader
                title={`Gestion del personal de ${nombreSocio}`}
                description={`${socio.numeroDocumento} · Administra la asignacion y configuracion laboral del personal.`}
                actions={
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/socio-negocios/${id}`}>
                      <ArrowLeft data-icon="inline-start" />
                      Volver al socio
                    </Link>
                  </Button>
                }
              />

              {esPersonal && pendienteAprobacion ? (
                <section className="overflow-hidden rounded-xl border border-amber-300/70 bg-amber-50 text-foreground dark:border-amber-500/30 dark:bg-amber-500/10">
                  <div className="flex flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <ShieldAlert className="mt-0.5 size-5 text-amber-600 dark:text-amber-400" />
                      <div>
                        <h2 className="text-base font-semibold">
                          Aprueba al personal antes de gestionar su asignacion
                        </h2>
                        <p className="mt-1 max-w-prose text-sm text-muted-foreground">
                          Este personal esta <strong>pendiente de aprobacion</strong>. La aprobacion
                          se realiza desde el registro del socio. Una vez aprobado, podras registrar
                          aqui su asignacion y configuracion laboral.
                        </p>
                      </div>
                    </div>
                    <Button asChild className="shrink-0">
                      <Link href={`/socio-negocios/${id}`}>
                        <ArrowLeft data-icon="inline-start" />
                        Ir al socio para aprobar
                      </Link>
                    </Button>
                  </div>
                </section>
              ) : esPersonal && rechazado ? (
                <Alert variant="destructive">
                  <AlertTitle>Personal rechazado</AlertTitle>
                  <AlertDescription>
                    Este personal fue rechazado, por lo que no se puede gestionar su asignacion.
                    Revisa el registro del socio para corregir y volver a evaluarlo.
                  </AlertDescription>
                </Alert>
              ) : puedeGestionarAsignaciones ? (
                <AsignacionesPersonalSeccion
                  personalId={socio.id}
                  titulo="Asignacion del personal"
                  descripcion="Base organizacional y contractual del personal."
                  vacioTitulo="Sin asignacion vigente"
                  vacioDescripcion="Este registro actual todavia no tiene asignaciones."
                />
              ) : esPersonal ? (
                <Alert>
                  <AlertTitle>Gestion del personal no disponible</AlertTitle>
                  <AlertDescription>
                    El personal debe estar activo y con registro vigente para gestionar su
                    asignacion.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <AlertTitle>Gestion del personal no disponible</AlertTitle>
                  <AlertDescription>
                    Solo el personal mantiene asignacion y configuracion laboral. Este socio es de tipo{" "}
                    {socio.tipo}.
                  </AlertDescription>
                </Alert>
              )}
            </>
          ) : null}
        </div>
      </main>
    </>
  )
}
