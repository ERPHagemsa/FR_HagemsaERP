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
import { ConfiguracionHistoricaActivo } from "../componentes/configuracion-historica-activo";
import { DocumentosActivo } from "../componentes/documentos-activo";
import { HistorialActivo } from "../componentes/historial-activo";
import { ImagenesActivo } from "../componentes/imagenes-activo";
import { TanquesActivo } from "../componentes/tanques-activo";
import {
  obtenerActivoPorCodigo,
  obtenerConfiguracionHistoricaPorCodigo,
  obtenerDocumentosPorCodigo,
  obtenerHistorialPorCodigo,
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
  const historial = await obtenerHistorialPorCodigo(codigo).catch(() => []);
  const configuracionHistorica =
    await obtenerConfiguracionHistoricaPorCodigo(codigo).catch(() => []);
  const vehiculo = activo.vehiculo;
  const ultimaConfiguracionHistorica = configuracionHistorica[0];

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="flex w-full flex-col gap-5">
        <section className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{activo.codigo}</p>
            <h1 className="text-2xl font-semibold tracking-normal">{activo.descripcion}</h1>
            <p className="text-sm text-muted-foreground">{activo.ubicacion}</p>
            <p className="mt-2 max-w-full truncate font-mono text-xs text-muted-foreground" title={String(activo.id)}>
              ID inventario: {activo.id}
            </p>
            {ultimaConfiguracionHistorica ? (
              <Badge className="mt-2 w-fit border-primary/30 bg-primary/10 text-primary" variant="outline">
                {formatearTipoConfiguracion(ultimaConfiguracionHistorica.tipoCambio)}:{" "}
                {ultimaConfiguracionHistorica.placaAnterior
                  ? `placa anterior ${ultimaConfiguracionHistorica.placaAnterior}`
                  : ultimaConfiguracionHistorica.codigoAnterior
                    ? `codigo anterior ${ultimaConfiguracionHistorica.codigoAnterior}`
                    : `ID anterior ${activo.activoOrigenId ?? "-"}`}
              </Badge>
            ) : activo.activoOrigenId ? (
              <Badge className="mt-2 w-fit border-primary/30 bg-primary/10 text-primary" variant="outline">
                ID anterior {activo.activoOrigenId}
              </Badge>
            ) : null}
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

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <EstadoCard titulo="Placa" valor={vehiculo?.placa ?? "SIN_PLACA"} variante="neutro" />
          <EstadoCard titulo="Estado activo" valor={formatearEstadoActivo(activo.estadoActivo)} />
          <EstadoCard titulo="Condicion activo" valor={vehiculo?.estadoOperativo ?? "SIN_DETALLE"} />
          <EstadoCard titulo="Calibracion" valor={vehiculo?.estadoCalibracion ?? "SIN_DETALLE"} />
        </div>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Ficha del activo</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="base">
                <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 overflow-visible rounded-2xl">
                  <TabsTrigger value="base" className="flex-none">Base</TabsTrigger>
                  <TabsTrigger value="adquisicion" className="flex-none">Adquisicion</TabsTrigger>
                  <TabsTrigger value="vehiculo" className="flex-none">Vehiculo</TabsTrigger>
                  <TabsTrigger value="equipamiento" className="flex-none">Equipamiento</TabsTrigger>
                  <TabsTrigger value="dimensiones" className="flex-none">Dimensiones</TabsTrigger>
                  <TabsTrigger value="control" className="flex-none">Control operativo</TabsTrigger>
                  <TabsTrigger value="combustible" className="flex-none">Combustible</TabsTrigger>
                  <TabsTrigger value="documentos" className="flex-none">Documentos</TabsTrigger>
                </TabsList>

                <TabsContent value="base" className="pt-5">
                  <FichaGrid>
                    <Dato label="ID inventario" value={activo.id} />
                    <Dato label="Codigo" value={activo.codigo} />
                    <Dato label="Tipo activo" value={activo.tipoActivo} />
                    <Dato label="Descripcion" value={activo.descripcion} />
                    <Dato label="Ubicacion" value={activo.ubicacion} />
                    <Dato label="Estado activo" value={formatearEstadoActivo(activo.estadoActivo)} />
                    <Dato label="Observacion" value={activo.observacion} />
                  </FichaGrid>
                </TabsContent>

                <TabsContent value="adquisicion" className="pt-5">
                  <FichaGrid>
                    <Dato label="Valor de unidad" value={formatearMonto(activo.valorUnidad, activo.moneda)} />
                    <Dato label="Moneda" value={activo.moneda} />
                    <Dato label="Proveedor" value={activo.proveedor} />
                    <Dato label="Numero factura" value={activo.numeroFactura} />
                    <Dato label="Fecha factura" value={formatearFecha(activo.fechaFactura)} />
                  </FichaGrid>
                </TabsContent>

                <TabsContent value="vehiculo" className="pt-5">
                  <FichaGrid>
                    <Dato label="Clase" value={vehiculo?.plantillaInventario} />
                    <Dato label="Placa" value={vehiculo?.placa} />
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
                    <Dato label="Condicion activo" value={vehiculo?.estadoOperativo} />
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

          <aside className="grid gap-5 xl:sticky xl:top-5">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Registro del activo</CardTitle>
              </CardHeader>
              <CardContent>
                  <FichaGrid compact>
                    <Dato label="ID inventario" value={activo.id} />
                    {activo.activoOrigenId ? (
                      <Dato label="ID anterior" value={activo.activoOrigenId} />
                    ) : null}
                    {ultimaConfiguracionHistorica ? (
                      <>
                        <Dato
                          label="Tipo cambio historico"
                          value={formatearTipoConfiguracion(
                            ultimaConfiguracionHistorica.tipoCambio
                          )}
                        />
                        <Dato
                          label="Codigo anterior"
                          value={ultimaConfiguracionHistorica.codigoAnterior}
                        />
                        <Dato
                          label="Placa anterior"
                          value={ultimaConfiguracionHistorica.placaAnterior}
                        />
                        <Dato
                          label="Carroceria anterior"
                          value={ultimaConfiguracionHistorica.carroceriaAnterior}
                        />
                      </>
                    ) : null}
                    <Dato label="Fecha de creacion" value={formatearFechaHora(activo.createdAt)} />
                    <Dato label="Ultima modificacion" value={formatearFechaHora(activo.updatedAt)} />
                  </FichaGrid>
              </CardContent>
            </Card>

            <ActivoAccionesCicloVida activo={activo} />
          </aside>
        </div>

        <ImagenesActivo
          codigo={activo.codigo}
          editable={false}
          imagenes={imagenes}
        />

        <ConfiguracionHistoricaActivo
          configuraciones={configuracionHistorica}
        />

        <HistorialActivo
          configuraciones={configuracionHistorica}
          historial={historial}
        />
      </div>
    </main>
  );
}

function FichaGrid({
  children,
  compact = false,
}: {
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-1"
          : "grid gap-x-8 gap-y-5 sm:grid-cols-2 xl:grid-cols-3"
      }
    >
      {children}
    </div>
  );
}

function EstadoCard({
  titulo,
  valor,
  variante = "estado",
}: {
  titulo: string;
  valor: string;
  variante?: "estado" | "neutro";
}) {
  return (
    <Card className="h-full">
      <CardHeader className="px-5 py-4">
        <div className="flex min-h-12 items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{titulo}</p>
          <Badge
            className={
              variante === "neutro"
                ? "h-6 w-fit border-border bg-muted text-foreground"
                : "h-6 w-fit px-3 text-xs font-semibold"
            }
            variant={variante === "neutro" ? "outline" : "default"}
          >
            {valor}
          </Badge>
        </div>
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

function formatearFecha(value: string | null | undefined) {
  if (!value) return null;
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatearMonto(
  value: number | null | undefined,
  moneda: string | null | undefined
) {
  if (value === null || value === undefined) return null;

  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: moneda || "PEN",
  }).format(value);
}

function formatearTipoConfiguracion(value: string) {
  const labels: Record<string, string> = {
    REPOTENCIACION: "Repotenciacion",
    CAMBIO_CARROCERIA: "Cambio de carroceria",
    CAMBIO_PLACA: "Replaqueo",
    REMOLCAMIENTO: "Remolcamiento",
    MEJORA_ESTRUCTURAL: "Mejora estructural",
    RENOVACION: "Renovacion",
    OTRO: "Configuracion historica",
  };

  return labels[value] ?? value.replaceAll("_", " ").toLowerCase();
}

function formatearEstadoActivo(value?: string | null) {
  if (value === "ACTIVO") return "Activo";
  if (value === "SINIESTRADO") return "Baja / Siniestro";
  if (value === "INACTIVO") return "Baja / De baja";
  return value ?? "-";
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
