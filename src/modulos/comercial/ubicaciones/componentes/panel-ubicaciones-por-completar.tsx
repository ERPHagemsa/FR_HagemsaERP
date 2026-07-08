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
    etiqueta: "Sincronizando…",
    clase:
      "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300",
  },
  SINCRONIZADA: {
    etiqueta: "En el maestro",
    clase:
      "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
};

// Clase/estado de una ubicación que resolvió directo al maestro (sin temporal):
// conceptualmente es lo mismo que una temporal SINCRONIZADA → mismo verde y rótulo.
const ESTADO_MAESTRA = ESTADO_META.SINCRONIZADA;

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
 *  - con temporal SINCRONIZADA → ya se replicó al maestro (se puede corregir),
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
      <header className="mb-4 flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <MapPin className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Ubicaciones</h3>
            {pendientes > 0 ? (
              <Badge variant="outline" className={ESTADO_META.PENDIENTE.clase}>
                {pendientes} por completar
              </Badge>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            Origen y destino de la cotización. Configuración General (BC-14) los
            registra en el maestro de ubicaciones.
          </p>
        </div>
      </header>

      {isLoading ? (
        <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Cargando ubicaciones…
        </p>
      ) : isError ? (
        <p className="py-4 text-sm text-destructive">
          No se pudieron cargar las ubicaciones.
        </p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed py-8 text-center">
          <MapPinOff className="size-5 text-muted-foreground" />
          <p className="text-sm font-medium">Sin origen ni destino</p>
          <p className="text-xs text-muted-foreground">
            Esta cotización no registró ubicaciones de ruta.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
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
  if (!direccion && !geo) return null;
  return (
    <div className="mt-0.5 space-y-0.5">
      {direccion ? (
        <p className="truncate text-xs text-muted-foreground" title={direccion}>
          {direccion}
        </p>
      ) : null}
      {geo ? (
        <p className="truncate text-xs text-muted-foreground">{geo}</p>
      ) : null}
    </div>
  );
}

/**
 * Chrome común de una fila de ubicación: ícono + nombre (+ tipo) + geografía, el
 * badge de estado a la derecha, y un pie con el texto de ayuda + la acción. El
 * texto de ayuda hace que cada fila explique por sí sola qué significa y qué hacer.
 */
function TarjetaUbicacion({
  nombre,
  tipo,
  geo,
  estado,
  ayuda,
  accion,
}: {
  nombre: string;
  tipo?: React.ReactNode;
  geo?: React.ReactNode;
  estado: { etiqueta: string; clase: string; check?: boolean };
  ayuda: React.ReactNode;
  accion?: React.ReactNode;
}) {
  return (
    <li className="rounded-lg border bg-background/40 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-2.5">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <MapPin className="size-4" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="truncate text-sm font-medium">{nombre}</p>
              {tipo}
            </div>
            {geo}
          </div>
        </div>
        <Badge variant="outline" className={estado.clase + " shrink-0"}>
          {estado.check ? <Check className="mr-1 size-3" /> : null}
          {estado.etiqueta}
        </Badge>
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-3 border-t pt-2.5">
        <p className="text-xs text-muted-foreground">{ayuda}</p>
        {accion ? <div className="shrink-0">{accion}</div> : null}
      </div>
    </li>
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

  let ayuda: React.ReactNode;
  let accion: React.ReactNode = null;

  if (u.estado === "PENDIENTE") {
    ayuda = "Faltan los datos que exige Configuración General (BC-14).";
    accion = (
      <Button size="sm" onClick={() => onAbrir("completar")}>
        Completar datos
      </Button>
    );
  } else if (u.estado === "COMPLETA") {
    ayuda = "Datos completos. Esperando la confirmación de BC-14.";
    accion = (
      <Button size="sm" variant="outline" onClick={() => onAbrir("completar")}>
        Editar
      </Button>
    );
  } else if (restantes > 0) {
    // SINCRONIZADA con correcciones disponibles: el texto explica el botón.
    ayuda = (
      <>
        ¿Algún dato quedó mal? Podés corregirla y reenviarla a BC-14 ·{" "}
        <span className="font-medium text-foreground">
          {restantes} de {MAX_CORRECCIONES_UBICACION}
        </span>{" "}
        correcciones.
      </>
    );
    accion = (
      <Button size="sm" variant="outline" onClick={() => onAbrir("corregir")}>
        Corregir datos
      </Button>
    );
  } else {
    ayuda = `Alcanzaste el máximo de ${MAX_CORRECCIONES_UBICACION} correcciones; ya no se puede modificar desde aquí.`;
  }

  return (
    <TarjetaUbicacion
      nombre={u.nombre}
      geo={
        u.estado !== "PENDIENTE" ? (
          <LineasGeo
            direccion={u.direccion}
            distrito={u.distrito}
            provincia={u.provincia}
            departamento={u.departamento}
            pais={u.pais}
          />
        ) : null
      }
      estado={{
        etiqueta: meta.etiqueta,
        clase: meta.clase,
        check: u.estado === "SINCRONIZADA",
      }}
      ayuda={ayuda}
      accion={accion}
    />
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
    <TarjetaUbicacion
      nombre={ubicacion?.nombre ?? nombre}
      tipo={
        ubicacion ? (
          <Badge variant="secondary" className="shrink-0 font-normal">
            {etiquetaTipoUbicacion(ubicacion.tipoUbicacion)}
          </Badge>
        ) : null
      }
      geo={
        isLoading ? (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
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
        ) : null
      }
      estado={{ etiqueta: ESTADO_MAESTRA.etiqueta, clase: ESTADO_MAESTRA.clase, check: true }}
      ayuda="Ya estaba registrada en el maestro al cotizar."
    />
  );
}
