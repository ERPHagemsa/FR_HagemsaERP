"use client";

import Link from "next/link";
import { ListChecks } from "lucide-react";

import { useConsulta } from "@/compartido/api/use-consulta";
import { extraerMensajeError } from "@/compartido/api/formato-error";
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
import { SiteHeader } from "@/compartido/componentes/site-header";
import { Button } from "@/compartido/componentes/ui/button";
import { FlotaResumen } from "../componentes/flota-resumen";
import { FlotaPageHeader } from "../../compartido/componentes/flota-page-header";
import { obtenerUnidades } from "../servicios/asignaciones-api";

export function FlotaVista() {
  const { data, isLoading, error } = useConsulta(() => obtenerUnidades(), []);

  return (
    <>
      <SiteHeader
        title="Flota y Disponibilidad"
        breadcrumbs={[{ title: "Flota y Disponibilidad" }]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          <FlotaPageHeader
            title="Flota y disponibilidad"
            description="Dashboard general de unidades, contratos y disponibilidad."
            actions={
              <Button asChild className="w-full sm:w-auto">
                <Link href="/flota/unidades">
                  <ListChecks data-icon="inline-start" />
                  Ver unidades
                </Link>
              </Button>
            }
          />

          {error ? (
            <Alert variant="destructive">
              <AlertTitle>No se pudieron cargar las unidades</AlertTitle>
              <AlertDescription>{extraerMensajeError(error)}</AlertDescription>
            </Alert>
          ) : null}

          <FlotaResumen
            resumen={null}
            vehiculos={isLoading ? [] : (data ?? [])}
          />
        </div>
      </main>
    </>
  );
}

export default FlotaVista;
