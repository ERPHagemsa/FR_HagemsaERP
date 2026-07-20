"use client";

import { SiteHeader } from "@/compartido/componentes/site-header";
import { Badge } from "@/compartido/componentes/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/compartido/componentes/ui/tabs";
import { ColoresRotulacionListado } from "../componentes/colores-rotulacion-listado";
import { PlantillasListado } from "../componentes/plantillas-listado";
import { TiposChecklistListado } from "../componentes/tipos-checklist-listado";
import { TiposKitListado } from "../componentes/tipos-kit-listado";

export function ChecklistMantenedoresVista() {
  return (
    <>
      <SiteHeader
        title="Mantenedores de checklist"
        breadcrumbs={[
          { title: "Flota y Disponibilidad", href: "/flota" },
          { title: "Mantenedores de checklist" },
        ]}
      />
      <main className="min-h-screen bg-muted/20 px-4 py-5 text-foreground lg:px-7">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5">
          <section className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <Badge variant="outline" className="mb-2 font-medium">
                Flota · Checklist
              </Badge>
              <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
                Mantenedores de checklist
              </h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                Catálogos y plantillas que se usan al armar tipos de checklist e inspecciones.
              </p>
            </div>
          </section>

          <Tabs defaultValue="tipos-checklist" className="gap-4">
            <div className="border border-border bg-card p-2">
              <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 overflow-visible bg-transparent p-0">
                <TabsTrigger
                  value="tipos-checklist"
                  className="flex-none rounded-md border border-transparent px-3 py-2 text-sm data-[state=active]:border-primary/30 data-[state=active]:bg-primary/10 data-[state=active]:text-foreground"
                >
                  Tipos de checklist
                </TabsTrigger>
                <TabsTrigger
                  value="tipos-kit"
                  className="flex-none rounded-md border border-transparent px-3 py-2 text-sm data-[state=active]:border-primary/30 data-[state=active]:bg-primary/10 data-[state=active]:text-foreground"
                >
                  Tipos de kit
                </TabsTrigger>
                <TabsTrigger
                  value="colores-rotulacion"
                  className="flex-none rounded-md border border-transparent px-3 py-2 text-sm data-[state=active]:border-primary/30 data-[state=active]:bg-primary/10 data-[state=active]:text-foreground"
                >
                  Colores de rotulación
                </TabsTrigger>
                <TabsTrigger
                  value="plantillas"
                  className="flex-none rounded-md border border-transparent px-3 py-2 text-sm data-[state=active]:border-primary/30 data-[state=active]:bg-primary/10 data-[state=active]:text-foreground"
                >
                  Plantillas
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="tipos-checklist" className="mt-0">
              <TiposChecklistListado />
            </TabsContent>
            <TabsContent value="tipos-kit" className="mt-0">
              <TiposKitListado />
            </TabsContent>
            <TabsContent value="colores-rotulacion" className="mt-0">
              <ColoresRotulacionListado />
            </TabsContent>
            <TabsContent value="plantillas" className="mt-0">
              <PlantillasListado />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}

export default ChecklistMantenedoresVista;
