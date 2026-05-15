"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  IconAlertCircle,
  IconArrowLeft,
  IconFileDescription,
  IconRefresh,
  IconSend,
} from "@tabler/icons-react";

import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/compartido/componentes/ui/empty";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/compartido/componentes/ui/field";
import { Input } from "@/compartido/componentes/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table";

import { formatearError, formatearFecha } from "../componentes/formato";
import {
  crearSolicitudDesdeManifiesto,
  listarManifiestos,
  listarSolicitudes,
} from "../servicios/combustible-api";
import type { ManifiestoResponse, SolicitudResponse } from "../tipos/combustible";

export function SolicitudesCombustibleVista() {
  const [manifiestos, setManifiestos] = useState<ManifiestoResponse[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudResponse[]>([]);
  const [manifiestoId, setManifiestoId] = useState("");
  const [placa, setPlaca] = useState("");
  const [litrosSolicitados, setLitrosSolicitados] = useState("120");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function cargarDatos() {
    setCargando(true);
    setError(null);

    try {
      const [manifiestosData, solicitudesData] = await Promise.all([
        listarManifiestos(),
        listarSolicitudes(),
      ]);

      setManifiestos(manifiestosData);
      setSolicitudes(solicitudesData);
      setManifiestoId((actual) => actual || manifiestosData[0]?.id || "");
    } catch (err: unknown) {
      setError(formatearError(err));
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void cargarDatos();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  async function crearSolicitud(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGuardando(true);
    setMensaje(null);
    setError(null);

    try {
      const solicitud = await crearSolicitudDesdeManifiesto({
        manifiestoId,
        placa: placa.trim().toUpperCase(),
        litrosSolicitados: Number(litrosSolicitados),
      });

      setSolicitudes((actuales) => [solicitud, ...actuales]);
      setPlaca("");
      setLitrosSolicitados("120");
      setMensaje(`Solicitud ${solicitud.id} creada correctamente.`);
    } catch (err: unknown) {
      setError(formatearError(err));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6">
          <Button asChild variant="ghost" className="w-fit">
            <Link href="/combustible">
              <IconArrowLeft data-icon="inline-start" />
              Combustible
            </Link>
          </Button>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">Solicitudes</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Registra solicitudes desde manifiestos disponibles y consulta
                lo generado por la API.
              </p>
            </div>
            <Button type="button" variant="outline" onClick={() => void cargarDatos()}>
              <IconRefresh data-icon="inline-start" />
              Actualizar
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-5 px-6 py-6 lg:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Nueva solicitud</CardTitle>
            <CardDescription>Usa un manifiesto utilizable del backend.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(event) => void crearSolicitud(event)}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="manifiesto">Manifiesto</FieldLabel>
                  <Select
                    value={manifiestoId}
                    onValueChange={setManifiestoId}
                    required
                  >
                    <SelectTrigger id="manifiesto" className="w-full">
                      <SelectValue placeholder="Selecciona un manifiesto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {manifiestos.map((manifiesto) => (
                          <SelectItem key={manifiesto.id} value={manifiesto.id}>
                            {manifiesto.id} - {manifiesto.estado}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel htmlFor="placa">Placa</FieldLabel>
                  <Input
                    id="placa"
                    value={placa}
                    onChange={(event) => setPlaca(event.target.value)}
                    placeholder="BTZ-750"
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="litrosSolicitados">
                    Litros solicitados
                  </FieldLabel>
                  <Input
                    id="litrosSolicitados"
                    value={litrosSolicitados}
                    onChange={(event) => setLitrosSolicitados(event.target.value)}
                    min="1"
                    step="0.01"
                    type="number"
                    required
                  />
                </Field>

                <Button type="submit" disabled={guardando || !manifiestoId}>
                  <IconSend data-icon="inline-start" />
                  {guardando ? "Creando..." : "Crear solicitud"}
                </Button>

                {mensaje ? (
                  <Alert>
                    <AlertTitle>Operacion completada</AlertTitle>
                    <AlertDescription>{mensaje}</AlertDescription>
                  </Alert>
                ) : null}

                {error ? (
                  <Field data-invalid>
                    <FieldError>{error}</FieldError>
                  </Field>
                ) : null}
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Solicitudes registradas</CardTitle>
            <CardDescription>Listado actual de `/solicitudes`.</CardDescription>
          </CardHeader>
          <CardContent>
            {cargando ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : solicitudes.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <IconFileDescription />
                  </EmptyMedia>
                  <EmptyTitle>Sin solicitudes</EmptyTitle>
                  <EmptyDescription>
                    Aun no hay solicitudes registradas para combustible.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Solicitud</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Ruta</TableHead>
                    <TableHead>Litros</TableHead>
                    <TableHead>Flota</TableHead>
                    <TableHead>Creado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {solicitudes.map((solicitud) => (
                    <TableRow key={solicitud.id}>
                      <TableCell className="font-medium">{solicitud.id}</TableCell>
                      <TableCell>{solicitud.placa}</TableCell>
                      <TableCell>{solicitud.ruta}</TableCell>
                      <TableCell>{solicitud.litrosSolicitados}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{solicitud.estadoFlota}</Badge>
                      </TableCell>
                      <TableCell>{formatearFecha(solicitud.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {error && !cargando ? (
              <Alert variant="destructive" className="mt-4">
                <IconAlertCircle />
                <AlertTitle>Error de API</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
