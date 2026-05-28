import Link from "next/link";
import { notFound } from "next/navigation";
import type React from "react";

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

import { AvisoResultado } from "../componentes/aviso-resultado";
import { ContactosProspecto } from "../componentes/contactos-prospecto";
import { EstadoProspectoBadge } from "../componentes/estado-prospecto-badge";
import { ProspectoAcciones } from "../componentes/prospecto-acciones";
import { consultarProspecto } from "../servicios/prospectos-api";

type Props = {
  id: number;
  accion?: string;
};

export async function ProspectoDetalleVista({ id, accion }: Props) {
  const prospecto = await consultarProspecto(id).catch(() => null);

  if (!prospecto) {
    notFound();
  }

  const esTerminal = prospecto.estado !== "ACTIVO";

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        {/* Encabezado */}
        <section className="flex flex-col gap-4 rounded-xl border border-border bg-card px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Prospecto #{prospecto.id}
            </p>
            <h1 className="text-2xl font-semibold">{prospecto.nombreComercial}</h1>
            {prospecto.razonSocial ? (
              <p className="text-sm text-muted-foreground">{prospecto.razonSocial}</p>
            ) : null}
            <div className="mt-2">
              <EstadoProspectoBadge estado={prospecto.estado} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/comercial/prospectos">Volver al listado</Link>
            </Button>
            <ProspectoAcciones
              idProspecto={prospecto.id}
              estado={prospecto.estado}
            />
          </div>
        </section>

        {/* Aviso de accion reciente */}
        <AvisoResultado accion={accion} />

        {/* Motivo descarte si aplica */}
        {prospecto.estado === "DESCARTADO" && prospecto.motivoDescarte ? (
          <Card>
            <CardHeader>
              <CardTitle>Motivo de descarte</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {prospecto.motivoDescarte}
              </p>
            </CardContent>
          </Card>
        ) : null}

        {/* Ficha */}
        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader>
              <CardTitle>Ficha del prospecto</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="datos">
                <TabsList>
                  <TabsTrigger value="datos">Datos generales</TabsTrigger>
                  <TabsTrigger value="contactos">
                    Contactos ({prospecto.contactos.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="datos" className="pt-5">
                  <FichaGrid>
                    <Dato label="Nombre comercial" value={prospecto.nombreComercial} />
                    <Dato label="Razon social" value={prospecto.razonSocial} />
                    <Dato label="Tipo documento" value={prospecto.tipoDocumento} />
                    <Dato label="Numero documento" value={prospecto.numeroDocumento} />
                    <Dato
                      label="Medio de contacto"
                      value={formatearMedioContacto(prospecto.medioContactoInicial)}
                    />
                    <Dato label="Estado" value={prospecto.estado} />
                    {esTerminal && prospecto.motivoDescarte ? (
                      <Dato label="Motivo descarte" value={prospecto.motivoDescarte} />
                    ) : null}
                  </FichaGrid>
                </TabsContent>

                <TabsContent value="contactos" className="pt-5">
                  <ContactosProspecto
                    idProspecto={prospecto.id}
                    contactos={prospecto.contactos}
                    esTerminal={esTerminal}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Sidebar con registro */}
          <Card>
            <CardHeader>
              <CardTitle>Registro</CardTitle>
            </CardHeader>
            <CardContent>
              <FichaGrid>
                <Dato label="ID" value={prospecto.id} />
                <Dato
                  label="Fecha creacion"
                  value={formatearFechaHora(prospecto.fechaCreacion)}
                />
                <Dato
                  label="Ultima modificacion"
                  value={
                    prospecto.fechaModificacion
                      ? formatearFechaHora(prospecto.fechaModificacion)
                      : "—"
                  }
                />
              </FichaGrid>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function FichaGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
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

function formatearFechaHora(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatearMedioContacto(medio: string) {
  const mapa: Record<string, string> = {
    CORREO: "Correo",
    LLAMADA: "Llamada",
    PRESENCIAL: "Presencial",
    OTRO: "Otro",
  };
  return mapa[medio] ?? medio;
}
