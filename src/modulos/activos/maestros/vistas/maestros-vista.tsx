"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/compartido/componentes/ui/tabs";
import { CatalogoValoresListado } from "../componentes/catalogo-valores-listado";
import { HistorialCatalogoListado } from "../componentes/historial-catalogo-listado";
import { CATALOGOS_MAESTROS } from "../componentes/catalogos-maestros.config";

export function MaestrosVista() {
  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <Tabs defaultValue={CATALOGOS_MAESTROS[0].tipoCatalogo} className="gap-4">
        <TabsList className="flex-wrap">
          {CATALOGOS_MAESTROS.map((catalogo) => (
            <TabsTrigger key={catalogo.tipoCatalogo} value={catalogo.tipoCatalogo}>
              {catalogo.titulo}
            </TabsTrigger>
          ))}
          <TabsTrigger value="historial">Historial</TabsTrigger>
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

        <TabsContent value="historial" className="mt-0">
          <HistorialCatalogoListado />
        </TabsContent>
      </Tabs>
    </main>
  );
}
