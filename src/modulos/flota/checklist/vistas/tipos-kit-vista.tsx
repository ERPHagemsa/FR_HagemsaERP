"use client";

import { SiteHeader } from "@/compartido/componentes/site-header";
import { TiposKitListado } from "../componentes/tipos-kit-listado";

export function TiposKitVista() {
  return (
    <>
      <SiteHeader
        title="Tipos de kit"
        breadcrumbs={[
          { title: "Flota y Disponibilidad", href: "/flota" },
          { title: "Tipos de kit" },
        ]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          <TiposKitListado />
        </div>
      </main>
    </>
  );
}

export default TiposKitVista;
