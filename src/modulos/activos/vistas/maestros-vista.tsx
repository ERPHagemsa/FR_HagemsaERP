"use client";

import { Badge } from "@/compartido/componentes/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/compartido/componentes/ui/tabs";
import { CatalogoValoresListado } from "../componentes/catalogo-valores-listado";
import { CATALOGOS_MAESTROS } from "../componentes/catalogos-maestros.config";

export function MaestrosVista() {
  return (
    <main className="min-h-screen bg-muted/20 px-4 py-5 text-foreground lg:px-7">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5">
        <section className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge variant="outline" className="mb-2 font-medium">
              Activos · Datos de control
            </Badge>
            <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
              Administrador de maestros
            </h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              Mantiene los catálogos que se usan al registrar, actualizar y validar activos.
            </p>
          </div>
          <div className="border-l border-border pl-4 text-sm text-muted-foreground md:text-right">
            <span className="block text-xl font-semibold text-foreground">
              {CATALOGOS_MAESTROS.length}
            </span>
            catálogos disponibles
          </div>
        </section>

        <Tabs defaultValue={CATALOGOS_MAESTROS[0].tipoCatalogo} className="gap-4">
          <div className="border border-border bg-card p-2">
            <p className="px-2 pb-2 text-xs font-medium uppercase text-muted-foreground">
              Catálogos del módulo
            </p>
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 overflow-visible bg-transparent p-0">
            {CATALOGOS_MAESTROS.map((catalogo) => (
              <TabsTrigger
                key={catalogo.tipoCatalogo}
                value={catalogo.tipoCatalogo}
                className="flex-none rounded-md border border-transparent px-3 py-2 text-sm data-[state=active]:border-primary/30 data-[state=active]:bg-primary/10 data-[state=active]:text-foreground"
              >
                <catalogo.icono className="size-4 text-primary" />
                {catalogo.titulo}
              </TabsTrigger>
            ))}
            </TabsList>
          </div>

          {CATALOGOS_MAESTROS.map((catalogo) => (
            <TabsContent key={catalogo.tipoCatalogo} value={catalogo.tipoCatalogo} className="mt-0">
              <CatalogoValoresListado
                tipoCatalogo={catalogo.tipoCatalogo}
                titulo={catalogo.titulo}
                permiteCrear={catalogo.permiteCrear}
                notaSoloLectura={catalogo.notaSoloLectura}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </main>
  );
}
