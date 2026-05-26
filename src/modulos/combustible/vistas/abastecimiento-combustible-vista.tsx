"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  IconAlertCircle,
  IconArrowLeft,
  IconRefresh,
  IconTicket,
} from "@tabler/icons-react";

import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
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

import { extraerMensajeError } from "@/compartido/api";

import { formatearFecha } from "../componentes/formato";
import {
  useAbastecimientosCombustibleQuery,
  useCrearAbastecimientoCombustibleMutation,
  useSolicitudesCombustibleQuery,
} from "../servicios/combustible-queries";

export function AbastecimientoCombustibleVista() {
  const [solicitudId, setSolicitudId] = useState("");
  const [litrosDespachados, setLitrosDespachados] = useState("115");
  const [nroTicket, setNroTicket] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const solicitudesQuery = useSolicitudesCombustibleQuery();
  const abastecimientosQuery = useAbastecimientosCombustibleQuery();
  const crearAbastecimientoMutation =
    useCrearAbastecimientoCombustibleMutation();
  const solicitudes = solicitudesQuery.data ?? [];
  const abastecimientos = abastecimientosQuery.data ?? [];
  const cargando = solicitudesQuery.isLoading || abastecimientosQuery.isLoading;
  const actualizando =
    solicitudesQuery.isFetching || abastecimientosQuery.isFetching;
  const guardando = crearAbastecimientoMutation.isPending;

  function cargarDatos() {
    setError(null);
    void solicitudesQuery.refetch();
    void abastecimientosQuery.refetch();
  }

  useEffect(() => {
    setSolicitudId((actual) => actual || solicitudes[0]?.id || "");
  }, [solicitudes]);

  useEffect(() => {
    const queryError = solicitudesQuery.error ?? abastecimientosQuery.error;

    if (queryError) {
      setError(extraerMensajeError(queryError));
    }
  }, [solicitudesQuery.error, abastecimientosQuery.error]);

  async function registrarAbastecimiento(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMensaje(null);
    setError(null);

    try {
      const abastecimiento = await crearAbastecimientoMutation.mutateAsync({
        solicitudId,
        litrosDespachados: Number(litrosDespachados),
        nroTicket: nroTicket.trim().toUpperCase(),
      });

      setNroTicket("");
      setLitrosDespachados("115");
      setMensaje(`Ticket ${abastecimiento.nroTicket} registrado correctamente.`);
    } catch (err) {
      setError(extraerMensajeError(err, "No se pudo registrar el abastecimiento."));
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
              <h1 className="text-3xl font-semibold">Abastecimiento</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Registra tickets de abastecimiento sobre solicitudes existentes.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={actualizando}
              onClick={cargarDatos}
            >
              <IconRefresh data-icon="inline-start" />
              {actualizando ? "Actualizando..." : "Actualizar"}
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-5 px-6 py-6 lg:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Nuevo abastecimiento</CardTitle>
            <CardDescription>Registra litros y numero de ticket.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(event) => void registrarAbastecimiento(event)}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="solicitud">Solicitud</FieldLabel>
                  <Select
                    value={solicitudId}
                    onValueChange={setSolicitudId}
                    required
                  >
                    <SelectTrigger id="solicitud" className="w-full">
                      <SelectValue placeholder="Selecciona una solicitud" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {solicitudes.map((solicitud) => (
                          <SelectItem key={solicitud.id} value={solicitud.id}>
                            {solicitud.placa} - {solicitud.litrosSolicitados} L
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel htmlFor="litrosDespachados">
                    Litros despachados
                  </FieldLabel>
                  <Input
                    id="litrosDespachados"
                    value={litrosDespachados}
                    onChange={(event) => setLitrosDespachados(event.target.value)}
                    min="1"
                    step="0.01"
                    type="number"
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="nroTicket">Nro ticket</FieldLabel>
                  <Input
                    id="nroTicket"
                    value={nroTicket}
                    onChange={(event) => setNroTicket(event.target.value)}
                    placeholder="TK-0001"
                    required
                  />
                </Field>

                <Button type="submit" disabled={guardando || !solicitudId}>
                  <IconTicket data-icon="inline-start" />
                  {guardando ? "Registrando..." : "Registrar ticket"}
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
            <CardTitle>Tickets registrados</CardTitle>
            <CardDescription>Listado actual de `/abastecimientos`.</CardDescription>
          </CardHeader>
          <CardContent>
            {cargando ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : abastecimientos.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <IconTicket />
                  </EmptyMedia>
                  <EmptyTitle>Sin tickets</EmptyTitle>
                  <EmptyDescription>
                    Aun no hay abastecimientos registrados.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Solicitud</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Litros</TableHead>
                    <TableHead>Creado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {abastecimientos.map((abastecimiento) => (
                    <TableRow key={abastecimiento.id}>
                      <TableCell className="font-medium">
                        {abastecimiento.nroTicket}
                      </TableCell>
                      <TableCell>{abastecimiento.solicitudId}</TableCell>
                      <TableCell>{abastecimiento.placa}</TableCell>
                      <TableCell>{abastecimiento.litrosDespachados}</TableCell>
                      <TableCell>
                        {formatearFecha(abastecimiento.createdAt)}
                      </TableCell>
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
