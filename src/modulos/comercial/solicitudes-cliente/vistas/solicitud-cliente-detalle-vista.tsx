"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, Phone, User } from "lucide-react";

import { esError404, extraerMensajeError } from "@/compartido/api";
import { useConsulta } from "@/compartido/api/use-consulta";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table";
import {
  formatearFecha,
  formatearFechaDeTimestamp,
} from "@/modulos/comercial/utilidades/formato-fecha";

import { EstadoSolicitudBadge } from "../componentes/estado-solicitud-badge";
import { SolicitudClienteAgregarCotizacion } from "../componentes/solicitud-cliente-agregar-cotizacion";
import { SolicitudClienteDescartarDialog } from "../componentes/solicitud-cliente-descartar-dialog";
import { consultarSolicitudCliente } from "../servicios/solicitudes-cliente-api";
import { accionesPermitidasSC } from "../tipos/solicitud-cliente.tipos";
import type { RefCotizacion } from "../tipos/solicitud-cliente.tipos";

type Props = {
  id: string;
};

export function SolicitudClienteDetalleVista({ id }: Props) {
  const { data: sc, isLoading, isError, error } = useConsulta(
    () => consultarSolicitudCliente(id),
    [id],
  );

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (isError || !sc) {
    if (esError404(error)) {
      notFound();
    }
    const mensaje = extraerMensajeError(error, "No se pudo cargar la solicitud de cliente");
    return (
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
          <Alert variant="destructive">
            <AlertTitle>Error al cargar solicitud</AlertTitle>
            <AlertDescription>{mensaje}</AlertDescription>
          </Alert>
        </div>
      </main>
    );
  }

  const acciones = accionesPermitidasSC(sc.estado);
  const contacto = sc.contactoSolicitante;

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        {/* Hero: identidad + acciones de registro */}
        <section className="flex flex-col gap-4 rounded-xl border border-border bg-card px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            {sc.codigoSolicitud ? (
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground tabular-nums">
                {sc.codigoSolicitud}
              </span>
            ) : null}
            <h1 className="text-2xl font-semibold leading-tight">
              {sc.nombreSolicitante}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <EstadoSolicitudBadge estado={sc.estado} />
              <Badge variant="outline">
                {sc.origenTipo === "PROSPECTO" ? "Prospecto" : "Cliente"}
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/comercial/solicitudes-cliente">Volver al listado</Link>
            </Button>
            {acciones.descartar ? (
              <SolicitudClienteDescartarDialog id={sc.id} />
            ) : null}
          </div>
        </section>

        {/* Motivo de descarte — solo cuando aplica (REQ-SC-15) */}
        {sc.estado === "DESCARTADA" ? (
          <Alert variant="destructive">
            <AlertTitle>Solicitud descartada</AlertTitle>
            <AlertDescription>
              {sc.motivoDescarte ?? "Sin motivo registrado"}
            </AlertDescription>
          </Alert>
        ) : null}

        {/* Cuerpo en 2 columnas: principal (ancho) + sidebar (detalles/contacto) */}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
          {/* Columna principal */}
          <div className="flex flex-col gap-5">
            <Card>
              <CardHeader>
                <CardTitle>Solicitud de servicio</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Bloque label="Descripcion del servicio">
                  <p className="text-sm leading-relaxed">{sc.descripcionServicio}</p>
                </Bloque>
                {sc.observaciones ? (
                  <Bloque label="Observaciones">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {sc.observaciones}
                    </p>
                  </Bloque>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <CardTitle>Cotizaciones asociadas ({sc.cotizaciones.length})</CardTitle>
                <SolicitudClienteAgregarCotizacion id={sc.id} estado={sc.estado} />
              </CardHeader>
              <CardContent>
                {sc.cotizaciones.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No hay cotizaciones asociadas a esta solicitud.
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-border">
                    <Table className="w-full [&_td]:px-3 [&_th]:px-3">
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Version vigente</TableHead>
                          <TableHead className="text-right">Monto total</TableHead>
                          <TableHead className="text-center">Accion</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sc.cotizaciones.map((refCot) => (
                          <FilaCotizacion key={refCot.id} cotizacion={refCot} />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar: detalles + contacto */}
          <div className="flex flex-col gap-5">
            <Card>
              <CardHeader>
                <CardTitle>Detalles</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="flex flex-col gap-3.5">
                  <Meta label="Canal de entrada" value={formatearCanal(sc.canalEntrada)} />
                  <Meta
                    label="Registrada por"
                    value={sc.registradoPor?.nombre ?? "—"}
                  />
                  <Meta
                    label="Fecha de creacion"
                    value={formatearFechaDeTimestamp(sc.fechaCreacion)}
                  />
                  {sc.fechaRequerida ? (
                    <Meta
                      label="Fecha requerida"
                      value={formatearFecha(sc.fechaRequerida)}
                    />
                  ) : null}
                  {sc.fechaModificacion ? (
                    <Meta
                      label="Ultima modificacion"
                      value={formatearFechaDeTimestamp(sc.fechaModificacion)}
                    />
                  ) : null}
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contacto del solicitante</CardTitle>
              </CardHeader>
              <CardContent>
                {contacto ? (
                  <div className="flex flex-col gap-3 text-sm">
                    <span className="inline-flex items-center gap-2 font-medium">
                      <User className="size-4 shrink-0 text-muted-foreground" />
                      {contacto.nombre}
                    </span>
                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                      <Mail className="size-4 shrink-0" />
                      <span className="truncate">{contacto.correo ?? "—"}</span>
                    </span>
                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                      <Phone className="size-4 shrink-0" />
                      {contacto.telefono ?? "—"}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Sin contacto registrado
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}

function FilaCotizacion({ cotizacion }: { cotizacion: RefCotizacion }) {
  return (
    <TableRow>
      <TableCell
        className="font-mono text-xs text-muted-foreground"
        title={cotizacion.id}
      >
        {cotizacion.id.slice(0, 8)}…
      </TableCell>
      <TableCell>
        <Badge variant="outline">{cotizacion.estado}</Badge>
      </TableCell>
      <TableCell className="text-right text-sm tabular-nums">
        {cotizacion.versionVigente ?? "—"}
      </TableCell>
      <TableCell className="text-right text-sm tabular-nums">
        {cotizacion.montoTotal != null
          ? new Intl.NumberFormat("es-PE", {
              style: "currency",
              currency: "PEN",
            }).format(cotizacion.montoTotal)
          : "—"}
      </TableCell>
      <TableCell className="text-center">
        <Button asChild size="sm" variant="outline">
          <Link href={`/comercial/cotizaciones/${cotizacion.id}`}>Ver</Link>
        </Button>
      </TableCell>
    </TableRow>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

function Bloque({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

function formatearCanal(canal: string): string {
  const mapa: Record<string, string> = {
    CORREO: "Correo",
    EMAIL: "Email",
    LLAMADA: "Llamada",
    TELEFONO: "Telefono",
    PRESENCIAL: "Presencial",
    OTRO: "Otro",
  };
  return mapa[canal] ?? canal;
}
