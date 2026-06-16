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

function obtenerMensajeError(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo cargar el socio."
}

export function SocioNegocioAsignacionesVista({ id }: { id: string }) {
  const socioQuery = useSocioDeNegocioQuery(id)
  const socio = socioQuery.data
  const esPersonal = socio?.tipo === "PERSONAL"

  return (
    <>
      <SiteHeader
        title="Asignaciones de personal"
        breadcrumbs={[
          { title: "Socio de Negocio", href: "/socio-negocios" },
          { title: "Listar", href: "/socio-negocios/listar" },
          { title: "Ver", href: `/socio-negocios/${id}` },
          { title: "Asignaciones" },
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
                title={`Asignaciones de ${socio.razonSocial}`}
                description={`${socio.numeroDocumento} · Gestiona en un solo lugar la aprobacion, cargo, ubicacion, cuentas, contrato e historial.`}
                actions={
                  <>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/socio-negocios/${id}`}>
                        <ArrowLeft data-icon="inline-start" />
                        Volver al socio
                      </Link>
                    </Button>
                  </>
                }
              />

              {esPersonal ? (
                <AsignacionesPersonalSeccion
                  personalId={socio.id}
                  titulo="Asignaciones del registro actual"
                  descripcion={`Se consultan con el id actual del personal #${socio.id}.`}
                  vacioTitulo="Sin asignacion vigente"
                  vacioDescripcion="Este registro actual todavia no tiene asignaciones."
                />
              ) : (
                <Alert>
                  <AlertTitle>Asignaciones no disponibles</AlertTitle>
                  <AlertDescription>
                    Solo el personal mantiene asignaciones operativas. Este socio es de tipo{" "}
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
