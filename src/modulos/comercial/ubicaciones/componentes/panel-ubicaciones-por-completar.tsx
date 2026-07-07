"use client";

import * as React from "react";
import { Check, Loader2, MapPin, MapPinOff } from "lucide-react";

import { Button } from "@/compartido/componentes/ui/button";
import { Badge } from "@/compartido/componentes/ui/badge";
import { useUbicacionesTemporalesQuery } from "../servicios/ubicaciones-queries";
import type {
  EstadoUbicacionTemporal,
  UbicacionTemporal,
} from "../tipos/ubicaciones.tipos";
import { CompletarUbicacionModal } from "./completar-ubicacion-modal";

const ESTADO_META: Record<
  EstadoUbicacionTemporal,
  { etiqueta: string; clase: string }
> = {
  PENDIENTE: {
    etiqueta: "Por completar",
    clase:
      "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  },
  COMPLETA: {
    etiqueta: "Completa · pendiente de sincronizar",
    clase:
      "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300",
  },
  SINCRONIZADA: {
    etiqueta: "Sincronizada",
    clase:
      "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
};

type Props = {
  idCotizacion: string;
};

/**
 * Panel "Ubicaciones por completar" — se muestra en el detalle de una cotización
 * GANADA. Lista las ubicaciones temporales (origen/destino capturados al cotizar)
 * y permite completar los datos que exige BC-14. Al completar, se deduplica
 * contra el maestro y la ubicación queda a la espera de la sincronización.
 */
export function PanelUbicacionesPorCompletar({ idCotizacion }: Props) {
  const { data, isLoading, isError } =
    useUbicacionesTemporalesQuery(idCotizacion);
  const [enEdicion, setEnEdicion] = React.useState<UbicacionTemporal | null>(
    null
  );

  const ubicaciones = data ?? [];

  return (
    <section className="rounded-xl border bg-card p-4 shadow-sm">
      <header className="mb-3 flex items-center gap-2">
        <MapPin className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Ubicaciones</h3>
        {ubicaciones.some((u) => u.estado === "PENDIENTE") ? (
          <Badge
            variant="outline"
            className={ESTADO_META.PENDIENTE.clase + " ml-1"}
          >
            {ubicaciones.filter((u) => u.estado === "PENDIENTE").length} por
            completar
          </Badge>
        ) : null}
      </header>

      {isLoading ? (
        <p className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Cargando ubicaciones…
        </p>
      ) : isError ? (
        <p className="py-4 text-sm text-destructive">
          No se pudieron cargar las ubicaciones.
        </p>
      ) : ubicaciones.length === 0 ? (
        <p className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <MapPinOff className="size-4" /> Esta cotización no registró origen ni
          destino.
        </p>
      ) : (
        <ul className="divide-y">
          {ubicaciones.map((u) => {
            const meta = ESTADO_META[u.estado];
            return (
              <li
                key={u.id}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{u.nombre}</p>
                  {u.estado !== "PENDIENTE" &&
                  (u.distrito || u.provincia || u.departamento) ? (
                    <p className="truncate text-xs text-muted-foreground">
                      {[u.distrito, u.provincia, u.departamento]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={meta.clase}>
                    {u.estado === "SINCRONIZADA" ? (
                      <Check className="mr-1 size-3" />
                    ) : null}
                    {meta.etiqueta}
                  </Badge>
                  {u.estado !== "SINCRONIZADA" ? (
                    <Button
                      size="sm"
                      variant={u.estado === "PENDIENTE" ? "default" : "outline"}
                      onClick={() => setEnEdicion(u)}
                    >
                      {u.estado === "PENDIENTE" ? "Completar" : "Editar"}
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <CompletarUbicacionModal
        key={enEdicion?.id ?? "cerrado"}
        abierto={enEdicion !== null}
        temporal={enEdicion}
        onCerrar={() => setEnEdicion(null)}
      />
    </section>
  );
}
