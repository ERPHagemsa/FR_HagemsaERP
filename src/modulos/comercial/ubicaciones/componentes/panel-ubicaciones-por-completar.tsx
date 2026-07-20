"use client";

import * as React from "react";
import { ArrowRight, Loader2, MapPin, MapPinOff } from "lucide-react";

import { Button } from "@/compartido/componentes/ui/button";
import { Badge } from "@/compartido/componentes/ui/badge";
import { cn } from "@/compartido/utilidades";
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

/** Ruta de una sección: de dónde sale y a dónde llega el servicio cotizado. */
export type RutaSeccion = {
  idSeccion: string;
  nombreSeccion: string | null;
  origen: string | null;
  destino: string | null;
};

// El estado se comunica con un punto de color + su texto, no con un chip
// relleno: en una vista que ya tiene dos columnas y un conector, los chips
// competían por atención con los nombres de las ubicaciones, que es lo que se
// viene a leer.
const ESTADO_META: Record<
  EstadoUbicacionTemporal,
  { etiqueta: string; punto: string }
> = {
  PENDIENTE: { etiqueta: "Por completar", punto: "bg-amber-500" },
  COMPLETA: { etiqueta: "Sincronizando", punto: "bg-sky-500" },
  SINCRONIZADA: { etiqueta: "En el maestro", punto: "bg-emerald-500" },
};

// Una ubicación que resolvió directo al maestro (sin temporal) está, a efectos
// de BC-14, en el mismo lugar que una SINCRONIZADA.
const ESTADO_MAESTRA = ESTADO_META.SINCRONIZADA;

type Props = {
  idCotizacion: string;
  /** Una ruta por sección, en el orden en que aparecen en la cotización. */
  rutas: RutaSeccion[];
};

/**
 * Panel "Ubicaciones" del detalle de una cotización GANADA. Muestra la ruta de
 * cada sección como lo que es —un origen y un destino— con el estado de cada
 * punto de cara a BC-14:
 *  - con temporal PENDIENTE/COMPLETA → hay datos por completar (botón Completar),
 *  - con temporal SINCRONIZADA → ya se replicó al maestro (se puede corregir),
 *  - sin temporal → la ubicación ya estaba en el maestro al cotizar.
 *
 * Una misma ubicación puede aparecer en varias secciones (comparten origen, por
 * ejemplo): se muestra en cada ruta, y completarla desde cualquiera vale para
 * todas, porque la temporal es una sola.
 */
export function PanelUbicacionesPorCompletar({ idCotizacion, rutas }: Props) {
  const { data, isLoading, isError } =
    useUbicacionesTemporalesQuery(idCotizacion);
  const [enEdicion, setEnEdicion] = React.useState<UbicacionTemporal | null>(
    null
  );
  const [modoModal, setModoModal] = React.useState<ModoModal>("completar");

  const temporales = data ?? [];
  const pendientes = temporales.filter((u) => u.estado === "PENDIENTE").length;

  // Cruce por nombre (insensible a mayúsculas): el punto que no tenga temporal
  // resolvió directo al maestro.
  const temporalPorNombre = React.useMemo(
    () =>
      new Map((data ?? []).map((t) => [t.nombre.trim().toLowerCase(), t])),
    [data]
  );

  function abrir(temporal: UbicacionTemporal, modo: ModoModal) {
    setModoModal(modo);
    setEnEdicion(temporal);
  }

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
              <Badge
                variant="outline"
                className="border-amber-300 bg-amber-50 font-normal text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
              >
                {pendientes} por completar
              </Badge>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            Origen y destino de cada sección. Configuración General (BC-14) los
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
      ) : rutas.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed py-8 text-center">
          <MapPinOff className="size-5 text-muted-foreground" />
          <p className="text-sm font-medium">Sin origen ni destino</p>
          <p className="text-xs text-muted-foreground">
            Esta cotización no registró ubicaciones de ruta.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {rutas.map((ruta, i) => (
            <RutaDeSeccion
              key={`${ruta.idSeccion}-${i}`}
              ruta={ruta}
              // Sin nombre de sección, se numera por posición: el usuario ve las
              // secciones en ese mismo orden en la tabla de la cotización.
              indice={i + 1}
              unica={rutas.length === 1}
              temporalPorNombre={temporalPorNombre}
              onAbrir={abrir}
            />
          ))}
        </div>
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

/** Ruta de una sección: su nombre arriba, y debajo origen → destino. */
function RutaDeSeccion({
  ruta,
  indice,
  unica,
  temporalPorNombre,
  onAbrir,
}: {
  ruta: RutaSeccion;
  indice: number;
  unica: boolean;
  temporalPorNombre: Map<string, UbicacionTemporal>;
  onAbrir: (t: UbicacionTemporal, modo: ModoModal) => void;
}) {
  const titulo =
    ruta.nombreSeccion?.trim() || (unica ? "Ruta" : `Sección ${indice}`);

  return (
    <div className="min-w-0">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {titulo}
      </p>
      <div className="grid min-w-0 gap-3 rounded-lg border bg-background/40 p-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-4">
        <Punto
          rol="Origen"
          nombre={ruta.origen}
          temporalPorNombre={temporalPorNombre}
          onAbrir={onAbrir}
        />
        {/*
          El conector dibuja el sentido del viaje. En pantallas angostas las dos
          columnas se apilan, así que la flecha rota para seguir apuntando de
          origen a destino.
        */}
        <div
          aria-hidden
          className="flex items-center justify-center text-muted-foreground/50 md:pt-6"
        >
          <ArrowRight className="size-4 rotate-90 md:rotate-0" />
        </div>
        <Punto
          rol="Destino"
          nombre={ruta.destino}
          temporalPorNombre={temporalPorNombre}
          onAbrir={onAbrir}
        />
      </div>
    </div>
  );
}

/** Un extremo de la ruta. Decide solo si es temporal, maestra o no existe. */
function Punto({
  rol,
  nombre,
  temporalPorNombre,
  onAbrir,
}: {
  rol: "Origen" | "Destino";
  nombre: string | null;
  temporalPorNombre: Map<string, UbicacionTemporal>;
  onAbrir: (t: UbicacionTemporal, modo: ModoModal) => void;
}) {
  if (!nombre) {
    return (
      <div className="min-w-0">
        <Rol>{rol}</Rol>
        <p className="text-sm text-muted-foreground">No registrado</p>
      </div>
    );
  }

  const temporal = temporalPorNombre.get(nombre.trim().toLowerCase());
  return temporal ? (
    <PuntoTemporal rol={rol} u={temporal} onAbrir={onAbrir} />
  ) : (
    <PuntoMaestro rol={rol} nombre={nombre} />
  );
}

function Rol({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
      {children}
    </p>
  );
}

/** Nombre + geografía + estado. El chrome compartido de los dos tipos de punto. */
function CuerpoPunto({
  rol,
  nombre,
  tipo,
  direccion,
  distrito,
  provincia,
  departamento,
  pais,
  estado,
  cargandoGeo = false,
  ayuda,
  accion,
}: {
  rol: string;
  nombre: string;
  tipo?: React.ReactNode;
  direccion?: string | null;
  distrito?: string | null;
  provincia?: string | null;
  departamento?: string | null;
  pais?: string | null;
  estado: { etiqueta: string; punto: string };
  cargandoGeo?: boolean;
  ayuda?: React.ReactNode;
  accion?: React.ReactNode;
}) {
  const geo = [distrito, provincia, departamento, pais]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="min-w-0">
      <Rol>{rol}</Rol>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <p className="truncate text-sm font-medium">{nombre}</p>
        {tipo}
      </div>

      {cargandoGeo ? (
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" /> Cargando datos…
        </p>
      ) : direccion || geo ? (
        <div className="mt-0.5 space-y-0.5">
          {direccion ? (
            <p
              className="truncate text-xs text-muted-foreground"
              title={direccion}
            >
              {direccion}
            </p>
          ) : null}
          {geo ? (
            <p className="truncate text-xs text-muted-foreground">{geo}</p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={cn("size-1.5 rounded-full", estado.punto)} />
          {estado.etiqueta}
        </span>
        {accion}
      </div>
      {ayuda ? (
        <p className="mt-1 text-xs text-muted-foreground/80">{ayuda}</p>
      ) : null}
    </div>
  );
}

/** Punto con ubicación temporal: por completar, sincronizando o ya en el maestro. */
function PuntoTemporal({
  rol,
  u,
  onAbrir,
}: {
  rol: string;
  u: UbicacionTemporal;
  onAbrir: (t: UbicacionTemporal, modo: ModoModal) => void;
}) {
  const meta = ESTADO_META[u.estado];
  const restantes = MAX_CORRECCIONES_UBICACION - u.intentosActualizacion;

  let ayuda: React.ReactNode = null;
  let accion: React.ReactNode = null;

  if (u.estado === "PENDIENTE") {
    accion = (
      <Button size="sm" className="h-6 px-2 text-xs" onClick={() => onAbrir(u, "completar")}>
        Completar datos
      </Button>
    );
  } else if (u.estado === "COMPLETA") {
    accion = (
      <Button
        size="sm"
        variant="ghost"
        className="h-6 px-2 text-xs"
        onClick={() => onAbrir(u, "completar")}
      >
        Editar
      </Button>
    );
  } else if (restantes > 0) {
    accion = (
      <Button
        size="sm"
        variant="ghost"
        className="h-6 px-2 text-xs"
        onClick={() => onAbrir(u, "corregir")}
      >
        Corregir
      </Button>
    );
    ayuda = `Quedan ${restantes} de ${MAX_CORRECCIONES_UBICACION} correcciones.`;
  } else {
    ayuda = `Sin correcciones disponibles (máximo ${MAX_CORRECCIONES_UBICACION}).`;
  }

  return (
    <CuerpoPunto
      rol={rol}
      nombre={u.nombre}
      // Una PENDIENTE todavía no tiene geografía que mostrar.
      direccion={u.estado === "PENDIENTE" ? null : u.direccion}
      distrito={u.estado === "PENDIENTE" ? null : u.distrito}
      provincia={u.estado === "PENDIENTE" ? null : u.provincia}
      departamento={u.estado === "PENDIENTE" ? null : u.departamento}
      pais={u.estado === "PENDIENTE" ? null : u.pais}
      estado={meta}
      ayuda={ayuda}
      accion={accion}
    />
  );
}

/**
 * Punto que ya estaba en el maestro al cotizar. La ruta solo guarda el nombre,
 * así que se recupera el registro completo para mostrar tipo y geografía.
 */
function PuntoMaestro({ rol, nombre }: { rol: string; nombre: string }) {
  const { ubicacion, isLoading } = useUbicacionMaestraPorNombre(nombre);
  return (
    <CuerpoPunto
      rol={rol}
      nombre={ubicacion?.nombre ?? nombre}
      tipo={
        ubicacion ? (
          <span className="text-xs text-muted-foreground">
            · {etiquetaTipoUbicacion(ubicacion.tipoUbicacion)}
          </span>
        ) : null
      }
      direccion={ubicacion?.direccion}
      distrito={ubicacion?.distrito}
      provincia={ubicacion?.provincia}
      departamento={ubicacion?.departamento}
      pais={ubicacion?.pais}
      cargandoGeo={isLoading}
      estado={ESTADO_MAESTRA}
    />
  );
}
