"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";

import { AyudaMetrica } from "./ayuda-metrica";
import type { DashboardListaAccionableProps } from "../tipos/dashboard.tipos";

/**
 * Lista accionable genérica del dashboard (design D5): base presentacional
 * compartida por las 3 listas específicas (por-aprobar, sin-cotizar,
 * por-vencer, tareas 3.4-3.6). No sabe de dónde vienen los items ni ejecuta
 * consultas — solo renderiza título, items, estados carga/error/vacío y el
 * enlace "ver todas".
 */
export function DashboardListaAccionable({
  titulo,
  items,
  isLoading,
  isError,
  mensajeError,
  enlaceVerTodas,
  ayuda,
}: DashboardListaAccionableProps) {
  return (
    <Card size="sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{titulo}</CardTitle>
        {ayuda ? <AyudaMetrica descripcion={ayuda} /> : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isError ? (
          <Alert variant="destructive">
            <AlertTitle>Error al cargar</AlertTitle>
            <AlertDescription>
              {mensajeError ?? "No se pudo cargar la lista"}
            </AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin elementos.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.enlace}
                  className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 ring-1 ring-foreground/10 transition-colors hover:ring-foreground/25"
                >
                  <span className="flex flex-col overflow-hidden">
                    <span className="truncate text-sm font-medium">
                      {item.titulo}
                    </span>
                    {item.subtitulo ? (
                      <span className="truncate text-xs text-muted-foreground">
                        {item.subtitulo}
                      </span>
                    ) : null}
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}

        {enlaceVerTodas ? (
          <Link
            href={enlaceVerTodas}
            className="self-start text-xs font-medium text-primary hover:underline"
          >
            Ver todas
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
