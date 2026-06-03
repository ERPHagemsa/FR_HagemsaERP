import Link from "next/link";
import { notFound } from "next/navigation";

import { esError404, extraerMensajeError } from "@/compartido/api";
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
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

import { EstadoSolicitudBadge } from "../componentes/estado-solicitud-badge";
import { SolicitudClienteAcciones } from "../componentes/solicitud-cliente-acciones";
import { consultarSolicitudCliente } from "../servicios/solicitudes-cliente-api";
import type { RefCotizacion } from "../tipos/solicitud-cliente.tipos";

type Props = {
  id: string;
};

export async function SolicitudClienteDetalleVista({ id }: Props) {
  let sc;
  try {
    sc = await consultarSolicitudCliente(id);
  } catch (err) {
    if (esError404(err)) {
      notFound();
    }
    const mensaje = extraerMensajeError(err, "No se pudo cargar la solicitud de cliente");
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

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        {/* Encabezado */}
        <section className="flex flex-col gap-4 rounded-xl border border-border bg-card px-5 py-4 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-muted-foreground">
              Solicitudes de cliente
            </p>
            <p className="font-mono text-xs text-muted-foreground">{sc.id}</p>
            <div className="mt-1">
              <EstadoSolicitudBadge estado={sc.estado} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/comercial/solicitudes-cliente">
                Volver al listado
              </Link>
            </Button>
            <SolicitudClienteAcciones id={sc.id} estado={sc.estado} />
          </div>
        </section>

        {/* Datos del detalle */}
        <Card>
          <CardHeader>
            <CardTitle>Datos de la solicitud</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Dato label="Tipo de origen" value={sc.origenTipo === "PROSPECTO" ? "Prospecto" : "Cliente"} />
              <Dato label="ID de origen" value={sc.origenId} mono />
              <Dato label="Canal de entrada" value={formatearCanal(sc.canalEntrada)} />
              <Dato label="Fecha de creacion" value={formatearFecha(sc.fechaCreacion)} />
              {sc.fechaModificacion ? (
                <Dato label="Ultima modificacion" value={formatearFecha(sc.fechaModificacion)} />
              ) : null}
              {sc.fechaRequerida ? (
                <Dato label="Fecha requerida" value={sc.fechaRequerida} />
              ) : null}
            </div>
            <div className="mt-4">
              <Dato label="Descripcion del servicio" value={sc.descripcionServicio} />
            </div>
            {sc.observaciones ? (
              <div className="mt-4">
                <Dato label="Observaciones" value={sc.observaciones} />
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Motivo de descarte (visible siempre que estado sea DESCARTADA — REQ-SC-15) */}
        {sc.estado === "DESCARTADA" ? (
          <Card>
            <CardHeader>
              <CardTitle>Motivo de descarte</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {sc.motivoDescarte ?? "Sin motivo registrado"}
              </p>
            </CardContent>
          </Card>
        ) : null}

        {/* Cotizaciones asociadas */}
        <Card>
          <CardHeader>
            <CardTitle>
              Cotizaciones asociadas ({sc.cotizaciones.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sc.cotizaciones.length === 0 ? (
              <p className="text-sm text-muted-foreground">
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
    </main>
  );
}

function FilaCotizacion({ cotizacion }: { cotizacion: RefCotizacion }) {
  return (
    <TableRow>
      <TableCell className="font-mono text-xs text-muted-foreground">
        {cotizacion.id.slice(0, 8)}…
      </TableCell>
      <TableCell className="text-sm">{cotizacion.estado}</TableCell>
      <TableCell className="text-right text-sm">
        {cotizacion.versionVigente ?? "—"}
      </TableCell>
      <TableCell className="text-right text-sm">
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

function Dato({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div className="grid gap-1">
      <span className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </span>
      <span className={mono ? "truncate font-mono text-sm font-medium" : "font-medium"}>
        {value ?? "—"}
      </span>
    </div>
  );
}

function formatearCanal(canal: string): string {
  const mapa: Record<string, string> = {
    CORREO: "Correo",
    LLAMADA: "Llamada",
    PRESENCIAL: "Presencial",
    OTRO: "Otro",
  };
  return mapa[canal] ?? canal;
}

function formatearFecha(value: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
