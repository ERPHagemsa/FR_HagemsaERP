"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  IconDropletFilled,
  IconFileDescription,
  IconGasStation,
  IconHeartbeat,
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
import { Separator } from "@/compartido/componentes/ui/separator";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";

import { formatearError, formatearFecha } from "../componentes/formato";
import { obtenerHealthCombustible } from "../servicios/combustible-api";
import type { HealthResponse } from "../tipos/combustible";

export function CombustibleInicioVista() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerHealthCombustible()
      .then((data) => {
        setHealth(data);
        setError(null);
      })
      .catch((err: unknown) => {
        setHealth(null);
        setError(formatearError(err));
      })
      .finally(() => setCargando(false));
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <IconDropletFilled />
            </span>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Modulo</p>
              <h1 className="text-3xl font-semibold">Control de combustible</h1>
            </div>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Gestiona solicitudes generadas desde manifiestos y registra
            abastecimientos contra solicitudes aprobadas por el backend.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 py-6 md:grid-cols-[1fr_1fr_320px]">
        <Card>
          <CardHeader>
            <IconFileDescription className="text-primary" />
            <CardTitle>Solicitudes</CardTitle>
            <CardDescription>
              Crea solicitudes desde manifiestos PROGRAMADO o EN_RUTA y revisa
              el historial registrado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/combustible/solicitudes">Abrir solicitudes</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <IconGasStation className="text-primary" />
            <CardTitle>Abastecimiento</CardTitle>
            <CardDescription>
              Registra litros despachados y numero de ticket para una solicitud
              existente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/combustible/abastecimiento">Abrir abastecimiento</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <IconHeartbeat className="text-primary" />
              <CardTitle>API combustible</CardTitle>
            </div>
            <CardDescription>Estado del backend local.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {cargando ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-40" />
              </div>
            ) : health ? (
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Estado</span>
                  <Badge>{health.status}</Badge>
                </div>
                <Separator />
                <p className="text-muted-foreground">{health.service}</p>
                <p>{formatearFecha(health.timestamp)}</p>
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertTitle>No se pudo consultar health</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
