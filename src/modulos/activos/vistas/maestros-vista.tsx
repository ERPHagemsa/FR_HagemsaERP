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
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="flex w-full flex-col gap-5">
        <section className="border-b border-border pb-5">
          <Badge variant="secondary" className="mb-3">
            {CATALOGOS_MAESTROS.length} catalogos
          </Badge>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Administrador de maestros
          </h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
            Gestiona los valores de catalogo que alimentan el registro de activos: clases,
            carrocerias, transmision y controles operativos.
          </p>
        </section>

        <Tabs defaultValue={CATALOGOS_MAESTROS[0].tipoCatalogo} className="gap-4">
          <TabsList className="mb-1 flex h-auto w-full flex-wrap justify-start gap-1 overflow-visible rounded-2xl">
            {CATALOGOS_MAESTROS.map((catalogo) => (
              <TabsTrigger
                key={catalogo.tipoCatalogo}
                value={catalogo.tipoCatalogo}
                className="flex-none"
              >
                <catalogo.icono className="size-4 text-primary" />
                {catalogo.titulo}
              </TabsTrigger>
            ))}
          </TabsList>

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
