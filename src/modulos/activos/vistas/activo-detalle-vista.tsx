import Link from "next/link";
import { notFound } from "next/navigation";
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
import { DocumentosActivo } from "../componentes/documentos-activo";
import { ImagenesActivo } from "../componentes/imagenes-activo";
import { TanquesActivo } from "../componentes/tanques-activo";
import {
  obtenerActivoPorCodigo,
  obtenerDocumentosPorCodigo,
  obtenerImagenesPorCodigo,
  obtenerTanquesPorCodigo,
} from "../servicios/activos-api";

type Props = {
  codigo: string;
  accion?: string;
};

export async function ActivoDetalleVista({ codigo, accion }: Props) {
  const activo = await obtenerActivoPorCodigo(codigo).catch(() => null);

  if (!activo) {
    notFound();
  }

  const imagenes = await obtenerImagenesPorCodigo(codigo).catch(() => []);
  const documentos = await obtenerDocumentosPorCodigo(codigo).catch(() => []);
  const tanques = await obtenerTanquesPorCodigo(codigo).catch(() => []);
  const vehiculo = activo.vehiculo;

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <section className="flex flex-col gap-4 rounded-xl border border-border bg-card px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{activo.codigo}</p>
            <h1 className="text-2xl font-semibold">{activo.descripcion}</h1>
            <p className="text-sm text-muted-foreground">{activo.ubicacion}</p>
            <p className="mt-2 max-w-full truncate font-mono text-xs text-muted-foreground" title={String(activo.id)}>
              ID inventario: {activo.id}
            </p>
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
                  <TabsTrigger value="equipamiento">Equipamiento</TabsTrigger>
                  <TabsTrigger value="dimensiones">Dimensiones</TabsTrigger>
                  <TabsTrigger value="control">Control operativo</TabsTrigger>
                  <TabsTrigger value="combustible">Combustible</TabsTrigger>
                  <TabsTrigger value="documentos">Documentos</TabsTrigger>
                </TabsList>

                <TabsContent value="base" className="pt-5">
                  <FichaGrid>
                    <Dato label="ID inventario" value={activo.id} />
                    <Dato label="Codigo" value={activo.codigo} />
                    <Dato label="Tipo activo" value={activo.tipoActivo} />
                    <Dato label="Descripcion" value={activo.descripcion} />
                    <Dato label="Ubicacion" value={activo.ubicacion} />
                    <Dato label="Estado activo" value={activo.estadoActivo} />
                    <Dato label="Observacion" value={activo.observacion} />
                  </FichaGrid>
                </TabsContent>

                <TabsContent value="vehiculo" className="pt-5">
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

                <TabsContent value="equipamiento" className="pt-5">
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

                <TabsContent value="dimensiones" className="pt-5">
                  <FichaGrid>
                    <Dato label="Ancho" value={vehiculo?.ancho} />
                    <Dato label="Longitud" value={vehiculo?.longitud} />
                    <Dato label="Alto" value={vehiculo?.alto} />
                    <Dato label="Tipo suspension" value={vehiculo?.tipoSuspension} />
                    <Dato label="Tipo tornamesa" value={vehiculo?.tipoTornamesa} />
                    <Dato label="Clase Euro / NEC" value={vehiculo?.claseEuro} />
                    <Dato label="Ratio corona" value={vehiculo?.ratioCorona} />
                    <Dato label="Tipo transmision" value={vehiculo?.tipoTransmision} />
                  </FichaGrid>
                </TabsContent>

                <TabsContent value="control" className="pt-5">
                  <FichaGrid>
                    <Dato label="Estado operativo" value={vehiculo?.estadoOperativo} />
                    <Dato label="Estado calibracion" value={vehiculo?.estadoCalibracion} />
                    <Dato label="Factor correccion" value={vehiculo?.factorCorreccion} />
                    <Dato label="Capacidad tanque galones" value={vehiculo?.capacidadTanqueGalones} />
                  </FichaGrid>
                </TabsContent>

                <TabsContent value="combustible" className="pt-5">
                  <TanquesActivo
                    codigo={activo.codigo}
                    editable={false}
                    tanques={tanques}
                  />
                </TabsContent>

                <TabsContent value="documentos" className="pt-5">
                  <DocumentosActivo
                    codigo={activo.codigo}
                    documentos={documentos}
                    editable={false}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="grid gap-5">
            <Card>
              <CardHeader>
                <CardTitle>Registro del activo</CardTitle>
              </CardHeader>
              <CardContent>
                <FichaGrid>
                  <Dato label="ID inventario" value={activo.id} />
                  <Dato label="Fecha de creacion" value={formatearFechaHora(activo.createdAt)} />
                  <Dato label="Ultima modificacion" value={formatearFechaHora(activo.updatedAt)} />
                </FichaGrid>
              </CardContent>
            </Card>

            <ActivoAccionesCicloVida activo={activo} />
          </div>
        </div>

        <ImagenesActivo
          codigo={activo.codigo}
          editable={false}
          imagenes={imagenes}
        />
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

function formatearFechaHora(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
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
