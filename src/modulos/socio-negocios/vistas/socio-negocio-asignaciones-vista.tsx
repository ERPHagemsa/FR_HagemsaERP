"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { SiteHeader } from "@/compartido/componentes/site-header"
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert"
import { Button } from "@/compartido/componentes/ui/button"
import { Skeleton } from "@/compartido/componentes/ui/skeleton"

import { AsignacionesPersonalSeccion } from "../componentes/asignaciones-personal-seccion"
import { SocioNegocioPageHeader } from "../componentes/socio-negocio-page-header"
import { useSocioDeNegocioQuery } from "../servicios/socio-negocios-queries"
import { puedeGestionarAsignacionesPersonal } from "../tipos/socio-negocio"

function obtenerMensajeError(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo cargar el socio."
}

export function SocioNegocioAsignacionesVista({ id }: { id: string }) {
  const socioQuery = useSocioDeNegocioQuery(id)
  const socio = socioQuery.data
  const esPersonal = socio?.tipo === "PERSONAL"
  const puedeGestionarAsignaciones =
    socio ? puedeGestionarAsignacionesPersonal(socio) : false

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

              {puedeGestionarAsignaciones ? (
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
