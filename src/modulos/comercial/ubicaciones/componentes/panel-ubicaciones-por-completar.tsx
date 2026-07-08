"use client";

import * as React from "react";
import { Check, Loader2, MapPin, MapPinOff } from "lucide-react";

import { Button } from "@/compartido/componentes/ui/button";
import { Badge } from "@/compartido/componentes/ui/badge";
import {
  useUbicacionMaestraPorNombre,
  useUbicacionesTemporalesQuery,
} from "../servicios/ubicaciones-queries";
import type {
  EstadoUbicacionTemporal,
  UbicacionTemporal,
} from "../tipos/ubicaciones.tipos";
import { MAX_CORRECCIONES_UBICACION } from "../tipos/ubicaciones.tipos";
import { etiquetaTipoUbicacion } from "./autocomplete-ubicacion";
import { CompletarUbicacionModal } from "./completar-ubicacion-modal";

type ModoModal = "completar" | "corregir";

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

// Ubicación que ya vive en el maestro (resolvió directo, sin temporal): reusa el
// verde de "sincronizada" porque conceptualmente es lo mismo (nada por completar).
const CLASE_MAESTRA = ESTADO_META.SINCRONIZADA.clase;

// Un punto de la ruta: o tiene temporal (con datos por completar / sincronizando)
// o resolvió directo al maestro (solo tenemos su nombre).
type ItemUbicacion =
  | { tipo: "temporal"; temporal: UbicacionTemporal }
  | { tipo: "maestra"; nombre: string };

type Props = {
  idCotizacion: string;
  // Nombres de origen/destino de la ruta (de las líneas de la versión vigente).
  // Los que no tengan temporal es porque resolvieron directo al maestro.
  rutas: string[];
};

/**
 * Panel "Ubicaciones" del detalle de una cotización GANADA. Muestra el origen y
 * el destino de la ruta con su estado de cara a BC-14:
 *  - con temporal PENDIENTE/COMPLETA → hay datos por completar (botón Completar),
 *  - con temporal SINCRONIZADA → ya se replicó al maestro,
 *  - sin temporal → la ubicación ya estaba en el maestro al cotizar (nada que hacer).
 *
 * El mensaje "no registró origen ni destino" solo aplica cuando la ruta está
 * realmente vacía (`rutas` sin elementos).
 */
export function PanelUbicacionesPorCompletar({ idCotizacion, rutas }: Props) {
  const { data, isLoading, isError } =
    useUbicacionesTemporalesQuery(idCotizacion);
  const [enEdicion, setEnEdicion] = React.useState<UbicacionTemporal | null>(
    null
  );
  const [modoModal, setModoModal] = React.useState<ModoModal>("completar");

  function abrir(temporal: UbicacionTemporal, modo: ModoModal) {
    setModoModal(modo);
    setEnEdicion(temporal);
  }

  const temporales = data ?? [];
  const pendientes = temporales.filter((u) => u.estado === "PENDIENTE").length;

  // Cada nombre de ruta se cruza con las temporales (match por nombre, insensible
  // a mayúsculas). El que no matchea resolvió directo al maestro.
  const items = React.useMemo<ItemUbicacion[]>(() => {
    const porNombre = new Map(
      (data ?? []).map((t) => [t.nombre.trim().toLowerCase(), t])
    );
    return rutas.map((nombre) => {
      const temporal = porNombre.get(nombre.trim().toLowerCase());
      return temporal
        ? { tipo: "temporal", temporal }
        : { tipo: "maestra", nombre };
    });
  }, [data, rutas]);

  return (
    <section className="rounded-xl border bg-card p-4 shadow-sm">
      <header className="mb-3 flex items-center gap-2">
        <MapPin className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Ubicaciones</h3>
        {pendientes > 0 ? (
          <Badge
            variant="outline"
            className={ESTADO_META.PENDIENTE.clase + " ml-1"}
          >
            {pendientes} por completar
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
      ) : items.length === 0 ? (
        <p className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <MapPinOff className="size-4" /> Esta cotización no registró origen ni
          destino.
        </p>
      ) : (
        <ul className="divide-y">
          {items.map((item) =>
            item.tipo === "temporal" ? (
              <FilaTemporal
                key={`t-${item.temporal.id}`}
                u={item.temporal}
                onAbrir={(modo) => abrir(item.temporal, modo)}
              />
            ) : (
              <FilaMaestra key={`m-${item.nombre}`} nombre={item.nombre} />
            )
          )}
        </ul>
      )}

      <CompletarUbicacionModal
        key={enEdicion?.id ?? "cerrado"}
        abierto={enEdicion !== null}
        temporal={enEdicion}
        modo={modoModal}
        onCerrar={() => setEnEdicion(null)}
      />
    </section>
  );
}

/** Líneas de detalle geográfico (dirección + distrito/provincia/departamento/país). */
function LineasGeo({
  direccion,
  distrito,
  provincia,
  departamento,
  pais,
}: {
  direccion?: string | null;
  distrito?: string | null;
  provincia?: string | null;
  departamento?: string | null;
  pais?: string | null;
}) {
  const geo = [distrito, provincia, departamento, pais]
    .filter(Boolean)
    .join(", ");
  return (
    <>
      {direccion ? (
        <p className="truncate text-xs text-muted-foreground" title={direccion}>
          {direccion}
        </p>
      ) : null}
      {geo ? (
        <p className="truncate text-xs text-muted-foreground">{geo}</p>
      ) : null}
    </>
  );
}

/** Fila de una ubicación temporal (por completar / sincronizando / sincronizada). */
function FilaTemporal({
  u,
  onAbrir,
}: {
  u: UbicacionTemporal;
  onAbrir: (modo: ModoModal) => void;
}) {
  const meta = ESTADO_META[u.estado];
  const restantes = MAX_CORRECCIONES_UBICACION - u.intentosActualizacion;
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{u.nombre}</p>
        {u.estado !== "PENDIENTE" ? (
          <LineasGeo
            direccion={u.direccion}
            distrito={u.distrito}
            provincia={u.provincia}
            departamento={u.departamento}
            pais={u.pais}
          />
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge variant="outline" className={meta.clase}>
          {u.estado === "SINCRONIZADA" ? (
            <Check className="mr-1 size-3" />
          ) : null}
          {meta.etiqueta}
        </Badge>
        {u.estado === "SINCRONIZADA" ? (
          // Ya está en el maestro; se puede corregir hasta agotar los intentos.
          restantes > 0 ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAbrir("corregir")}
              title={`Te quedan ${restantes} correcciones`}
            >
              Corregir ({restantes})
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">
              Sin correcciones
            </span>
          )
        ) : (
          <Button
            size="sm"
            variant={u.estado === "PENDIENTE" ? "default" : "outline"}
            onClick={() => onAbrir("completar")}
          >
            {u.estado === "PENDIENTE" ? "Completar" : "Editar"}
          </Button>
        )}
      </div>
    </li>
  );
}

/**
 * Fila de un origen/destino que ya estaba en el maestro (sin temporal). La ruta
 * solo lleva el nombre, así que se recupera el registro completo del maestro
 * para mostrar tipo, dirección y geografía.
 */
function FilaMaestra({ nombre }: { nombre: string }) {
  const { ubicacion, isLoading } = useUbicacionMaestraPorNombre(nombre);
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">
            {ubicacion?.nombre ?? nombre}
          </p>
          {ubicacion ? (
            <Badge variant="secondary" className="shrink-0 font-normal">
              {etiquetaTipoUbicacion(ubicacion.tipoUbicacion)}
            </Badge>
          ) : null}
        </div>
        {isLoading ? (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" /> Cargando datos…
          </p>
        ) : ubicacion ? (
          <LineasGeo
            direccion={ubicacion.direccion}
            distrito={ubicacion.distrito}
            provincia={ubicacion.provincia}
            departamento={ubicacion.departamento}
            pais={ubicacion.pais}
          />
        ) : null}
      </div>
      <Badge variant="outline" className={CLASE_MAESTRA + " shrink-0"}>
        <Check className="mr-1 size-3" /> En el maestro
      </Badge>
    </li>
  );
}
