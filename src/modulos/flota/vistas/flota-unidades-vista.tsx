"use client";

import Link from "next/link";
import { Download } from "lucide-react";

import { useConsulta } from "@/compartido/api/use-consulta";
import { SiteHeader } from "@/compartido/componentes/site-header";
import { Button } from "@/compartido/componentes/ui/button";
import { FlotaTabla } from "../componentes/flota-tabla";
import { FlotaPageHeader } from "../componentes/flota-page-header";
import { obtenerUnidades } from "../servicios/flota-api";

export function FlotaUnidadesVista() {
  const { data, isLoading } = useConsulta(() => obtenerUnidades(), []);

  return (
    <>
      <SiteHeader
        title="Listar unidades de flota"
        breadcrumbs={[
          { title: "Flota y Disponibilidad", href: "/flota" },
          { title: "Listar unidades de flota" },
        ]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          <FlotaPageHeader
            title="Unidades de flota"
            description="Consulta, filtra y gestiona la asignacion contractual de las unidades."
            actions={
              <Button asChild className="w-full sm:w-auto">
                <Link href="/flota/unidades/importar">
                  <Download data-icon="inline-start" />
                  Nuevo
                </Link>
              </Button>
            }
          />

          <FlotaTabla loading={isLoading} vehiculos={data ?? []} />
        </div>
      </main>
    </>
  );
}

export default FlotaUnidadesVista;
