import Link from "next/link";
import type React from "react";

import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/compartido/componentes/ui/tabs";
import { ActivoAccionesCicloVida } from "../componentes/activo-acciones-ciclo-vida";
import { AvisoResultado } from "../componentes/aviso-resultado";
import { obtenerActivoPorCodigo } from "../servicios/activos-api";

type Props = {
  codigo: string;
  accion?: string;
};

export async function ActivoDetalleVista({ codigo, accion }: Props) {
  const activo = await obtenerActivoPorCodigo(codigo);
  const vehiculo = activo.vehiculo;

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <section className="flex flex-col gap-4 rounded-xl border border-border bg-card px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{activo.codigo}</p>
            <h1 className="text-2xl font-semibold">{activo.descripcion}</h1>
            <p className="text-sm text-muted-foreground">{activo.ubicacion}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/activos">Volver</Link>
            </Button>
            <Button asChild>
              <Link href={`/activos/${activo.codigo}/editar`}>Editar</Link>
            </Button>
          </div>
        </section>

        <AvisoResultado accion={accion} />

        <div className="grid gap-4 md:grid-cols-3">
          <EstadoCard titulo="Estado activo" valor={activo.estadoActivo} />
          <EstadoCard titulo="Operativo" valor={vehiculo?.estadoOperativo ?? "SIN_DETALLE"} />
          <EstadoCard titulo="Calibracion" valor={vehiculo?.estadoCalibracion ?? "SIN_DETALLE"} />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
          <Card>
            <CardHeader>
              <CardTitle>Ficha del activo</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="base">
                <TabsList>
                  <TabsTrigger value="base">Base</TabsTrigger>
                  <TabsTrigger value="vehiculo">Vehiculo</TabsTrigger>
                  <TabsTrigger value="documentos">Documentos</TabsTrigger>
                  <TabsTrigger value="equipamiento">Equipamiento</TabsTrigger>
                  <TabsTrigger value="dimensiones">Dimensiones</TabsTrigger>
                  <TabsTrigger value="combustible">Combustible</TabsTrigger>
                </TabsList>

                <TabsContent value="base" className="pt-5">
                  <FichaGrid>
                    <Dato label="Codigo" value={activo.codigo} />
                    <Dato label="Tipo activo" value={activo.tipoActivo} />
                    <Dato label="Descripcion" value={activo.descripcion} />
                    <Dato label="Ubicacion" value={activo.ubicacion} />
                    <Dato label="Estado activo" value={activo.estadoActivo} />
                    <Dato label="Observacion" value={activo.observacion} />
                  </FichaGrid>
                </TabsContent>

                <TabsContent value="vehiculo" className="pt-5" forceMount>
                  <FichaGrid>
                    <Dato label="Plantilla" value={vehiculo?.plantillaInventario} />
                    <Dato label="Placa" value={vehiculo?.placaRodaje} />
                    <Dato label="Marca" value={vehiculo?.marca} />
                    <Dato label="Modelo" value={vehiculo?.modelo} />
                    <Dato label="Ano fabricacion" value={vehiculo?.anioFabricacion} />
                    <Dato label="Color" value={vehiculo?.color} />
                    <Dato label="Carroceria" value={vehiculo?.carroceria} />
                    <Dato label="Ejes" value={vehiculo?.ejes} />
                    <Dato label="Categoria" value={vehiculo?.categoria} />
                    <Dato label="Serie chasis" value={vehiculo?.serieChasis} />
                    <Dato label="Serie motor" value={vehiculo?.serieMotor} />
                  </FichaGrid>
                </TabsContent>

                <TabsContent value="documentos" className="pt-5" forceMount>
                  <FichaGrid>
                    <Dato label="Tarjeta propiedad" value={vehiculo?.tarjetaPropiedad} />
                    <Dato label="Tarjeta mercancias" value={vehiculo?.tarjetaMercancias} />
                    <Dato label="SOAT" value={vehiculo?.soat} />
                    <Dato label="Revision tecnica 12 meses" value={vehiculo?.revisionTecnica12Meses} />
                    <Dato label="Revision tecnica 6 meses" value={vehiculo?.revisionTecnica6Meses} />
                    <Dato label="Resolucion Directoral" value={vehiculo?.resolucionDirectoral} />
                    <Dato label="Resolucion Gerencial" value={vehiculo?.resolucionGerencial} />
                    <Dato label="IQBF" value={vehiculo?.iqbf} />
                    <Dato label="Certificado Matpel" value={vehiculo?.certificadoMatpel} />
                    <Dato label="Certificado bonificacion" value={vehiculo?.certificadoBonificacion} />
                    <Dato label="Certificado operatividad" value={vehiculo?.certificadoOperatividad} />
                  </FichaGrid>
                </TabsContent>

                <TabsContent value="equipamiento" className="pt-5" forceMount>
                  <FichaGrid>
                    <Dato label="Radio comunicacion" value={vehiculo?.radioComunicacion} />
                    <Dato label="Autorradio" value={vehiculo?.autorradio} />
                    <Dato label="Llantas repuesto" value={vehiculo?.llantasRepuesto} />
                    <Dato label="Camara" value={vehiculo?.camara} />
                    <Dato label="Tablet" value={vehiculo?.tablet} />
                    <Dato label="Dispositivos seguridad" value={vehiculo?.dispositivosSeguridad} />
                    <Dato label="Caja herramientas" value={vehiculo?.cajaHerramientas} />
                    <Dato label="Jaula antivuelco" value={vehiculo?.jaulaAntivuelco} />
                    <Dato label="Carriboy" value={vehiculo?.carriboy} />
                    <Dato label="Baranda" value={vehiculo?.baranda} />
                    <Dato label="Mamparon" value={vehiculo?.mamparon} />
                  </FichaGrid>
                </TabsContent>

                <TabsContent value="dimensiones" className="pt-5" forceMount>
                  <FichaGrid>
                    <Dato label="Ancho" value={vehiculo?.ancho} />
                    <Dato label="Longitud" value={vehiculo?.longitud} />
                    <Dato label="Alto" value={vehiculo?.alto} />
                    <Dato label="Tipo suspension" value={vehiculo?.tipoSuspension} />
                    <Dato label="Tipo tornamesa" value={vehiculo?.tipoTornamesa} />
                  </FichaGrid>
                </TabsContent>

                <TabsContent value="combustible" className="pt-5" forceMount>
                  <FichaGrid>
                    <Dato label="Capacidad tanque galones" value={vehiculo?.capacidadTanqueGalones} />
                    <Dato label="Estado calibracion" value={vehiculo?.estadoCalibracion} />
                    <Dato label="Factor correccion" value={vehiculo?.factorCorreccion} />
                    <Dato label="Estado operativo" value={vehiculo?.estadoOperativo} />
                  </FichaGrid>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <ActivoAccionesCicloVida activo={activo} />
        </div>
      </div>
    </main>
  );
}

function FichaGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

function EstadoCard({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <Card>
      <CardHeader>
        <p className="text-sm text-muted-foreground">{titulo}</p>
        <Badge>{valor}</Badge>
      </CardHeader>
    </Card>
  );
}

function Dato({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="grid gap-1">
      <span className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </span>
      <span className="font-medium">{value ?? "-"}</span>
    </div>
  );
}
