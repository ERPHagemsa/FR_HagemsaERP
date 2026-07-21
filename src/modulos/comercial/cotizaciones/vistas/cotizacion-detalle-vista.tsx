"use client";

import { useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  GitBranch,
  CalendarClock,
  CalendarDays,
  CalendarX,
  ChevronRight,
  CircleCheck,
  CircleX,
  Stamp,
  type LucideIcon,
} from "lucide-react";

import { useConsulta } from "@/compartido/api/use-consulta";
import { Badge } from "@/compartido/componentes/ui/badge";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";
import { Button } from "@/compartido/componentes/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/compartido/componentes/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/compartido/componentes/ui/tooltip";

import { CotizacionAcciones } from "../componentes/cotizacion-acciones";
import { EstadoCotizacionBadge } from "../componentes/estado-cotizacion-badge";
import { CotizacionVersionesNotebook } from "../componentes/cotizacion-versiones-notebook";
import { HistorialAprobaciones } from "../../aprobaciones/componentes/historial-aprobaciones";
import {
  DialogoResolverSolicitud,
  type AccionResolver,
} from "../../aprobaciones/componentes/dialogo-resolver-solicitud";
import { useHistorialAprobacionesQuery } from "../../aprobaciones/servicios/aprobaciones-queries";
import type { SolicitudAprobacion } from "../../aprobaciones/tipos/aprobaciones.tipos";
import { PanelUbicacionesPorCompletar } from "@/modulos/comercial/ubicaciones/componentes/panel-ubicaciones-por-completar";
import type { RutaSeccion } from "@/modulos/comercial/ubicaciones/componentes/panel-ubicaciones-por-completar";
import { consultarCotizacion } from "../servicios/cotizaciones-api";
import { CLAVE_COTIZACION_DETALLE } from "@/modulos/comercial/claves-consulta";
import {
  accionesPermitidas,
  etiquetaCodigoCotizacion,
} from "../tipos/cotizaciones.tipos";
import type {
  Cotizacion,
  EstadoCotizacion,
  Version,
} from "../tipos/cotizaciones.tipos";
import {
  formatearFecha,
  formatearFechaDeTimestamp,
  formatearOrigenTipo,
} from "../utilidades/formato";

type Props = {
  id: string;
};

// Layout denso estilo Odoo: statusbar + pipeline + smart buttons + grupos
// inline + notebook de versiones (una sola version visible a la vez).
export function CotizacionDetalleVista({ id }: Props) {
  // `clave` suscribe esta consulta al registro de invalidacion: tras enviar /
  // ganar / perder / cancelar (que llaman invalidarConsulta(CLAVE_COTIZACION_DETALLE))
  // la pagina refetchea sola, sin necesidad de refrescar a mano. `refetch` se usa
  // ademas para refrescar tras actualizar las condiciones de la version.
  const {
    data: cotizacion,
    isLoading,
    refetch,
  } = useConsulta(() => consultarCotizacion(id).catch(() => null), [id], {
    clave: CLAVE_COTIZACION_DETALLE,
  });

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!cotizacion) {
    notFound();
  }

  return (
    <CotizacionDetalleContenido cotizacion={cotizacion} refetch={refetch} />
  );
}

function CotizacionDetalleContenido({
  cotizacion,
  refetch,
}: {
  cotizacion: Cotizacion;
  refetch: () => Promise<{ data: Cotizacion | null; error: unknown }>;
}) {
  const vigente =
    cotizacion.versiones.find(
      (v) => v.numeroVersion === cotizacion.versionVigente,
    ) ?? null;

  // La cotizacion es editable inline si el estado lo permite y la version vigente
  // no esta congelada (misma regla que el antiguo editor de pagina completa).
  const editable =
    accionesPermitidas(cotizacion.estado).editar &&
    vigente !== null &&
    !vigente.congelada;
  const historialQuery = useHistorialAprobacionesQuery(cotizacion.id);
  const solicitudVigente =
    historialQuery.data?.find(
      (solicitud) => solicitud.estado === "EN_APROBACION",
    ) ?? null;

  // Ruta de cada sección (para el panel de Ubicaciones tras ganar): los puntos
  // que tengan temporal están por completar; el resto ya vive en el maestro.
  const rutasUbicacion = rutasDeVersion(vigente);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5 px-5 py-5 lg:px-8">
        {/* === Cabecera: volver + identidad + pipeline + acciones === */}
        <div className="flex flex-col gap-3 xl:grid xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] xl:items-center">
          <div className="flex min-w-0 items-center gap-3">
            {cotizacion.solicitudClienteId ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                  >
                    <Link
                      href={`/comercial/solicitudes-cliente/${cotizacion.solicitudClienteId}`}
                      aria-label="Regresar a la solicitud"
                    >
                      <ArrowLeft />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Regresar a la solicitud</TooltipContent>
              </Tooltip>
            ) : null}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-base font-semibold">
                  {cotizacion.origenNombre}
                </h1>
                <Badge variant="outline">
                  {formatearOrigenTipo(cotizacion.origenTipo)}
                </Badge>
              </div>
              <p
                className="truncate font-mono text-xs text-muted-foreground"
                title={cotizacion.id}
              >
                {etiquetaCodigoCotizacion(cotizacion)}
              </p>
            </div>
          </div>

          <div className="xl:justify-self-center">
            <Pipeline estado={cotizacion.estado} />
          </div>

          <div className="flex flex-wrap items-center gap-2 xl:justify-self-end">
            <CotizacionAcciones
              cotizacion={cotizacion}
              accionesExtra={
                cotizacion.estado === "PENDIENTE_APROBACION" &&
                solicitudVigente ? (
                  <AccionesResolverSolicitud
                    idSolicitud={solicitudVigente.id}
                    idCotizacion={cotizacion.id}
                  />
                ) : null
              }
            />
          </div>
        </div>

        {/* === Smart buttons: cifras clave de la version vigente === */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <SmartButton
            icono={<GitBranch className="size-4" />}
            label="Versiones"
            valor={String(cotizacion.versiones.length)}
          />
          <SmartButton
            icono={<CalendarClock className="size-4" />}
            label="Validez (dias)"
            valor={
              vigente?.validezDias != null ? String(vigente.validezDias) : "—"
            }
          />
          <SmartButton
            icono={<CalendarDays className="size-4" />}
            label="Fecha envio"
            valor={
              vigente?.fechaEnvio
                ? formatearFechaDeTimestamp(vigente.fechaEnvio)
                : "—"
            }
          />
          <SmartButton
            icono={<CalendarX className="size-4" />}
            label="Fecha vencimiento"
            valor={
              vigente?.fechaVencimiento
                ? formatearFecha(vigente.fechaVencimiento)
                : "—"
            }
          />
          <DialogHistorialAprobaciones
            historial={historialQuery.data ?? []}
            isLoading={historialQuery.isLoading}
            isError={historialQuery.isError}
            error={historialQuery.error}
          />
        </div>

        {/* === Notebook de versiones === */}
        <CotizacionVersionesNotebook
          idCotizacion={cotizacion.id}
          versiones={cotizacion.versiones}
          versionVigente={cotizacion.versionVigente}
          editable={editable}
          clienteTipo={cotizacion.origenTipo}
          clienteId={cotizacion.origenId}
          onCondicionesActualizadas={refetch}
        />

        {/* === Ubicaciones por completar (solo tras ganar) === */}
        {cotizacion.estado === "GANADA" ? (
          <PanelUbicacionesPorCompletar
            idCotizacion={cotizacion.id}
            rutas={rutasUbicacion}
          />
        ) : null}
      </div>
    </main>
  );
}

// Clave del grupo de líneas sin sección (cotización "plana", de una sola sección
// sin nombre). No choca con un id real: los ids son uuid.
const SIN_SECCION = "sin-seccion";

/**
 * Ruta de cada sección de una versión, conservando a qué sección pertenece y
 * cuál punto es el origen y cuál el destino.
 *
 * La ruta es de la SECCIÓN, no de cada línea: se captura en las líneas de
 * transporte (`carga.origen/destino`) pero todas las de una misma sección la
 * comparten, así que se toma la primera que la traiga (mismo criterio que la
 * tabla de la cotización y el PDF).
 *
 * Las secciones sin ruta —servicios que no son de transporte— quedan fuera: no
 * aportan ubicaciones que registrar en el maestro.
 */
function rutasDeVersion(version: Version | null): RutaSeccion[] {
  if (!version) return [];

  const lineasPorSeccion = new Map<string, typeof version.lineas>();
  for (const linea of version.lineas) {
    // Las líneas sin sección son el caso "plano" (una cotización de una sola
    // sección sin nombre); se agrupan bajo una clave propia.
    const clave = linea.idSeccion ?? SIN_SECCION;
    const acumuladas = lineasPorSeccion.get(clave) ?? [];
    acumuladas.push(linea);
    lineasPorSeccion.set(clave, acumuladas);
  }

  const secciones = version.secciones
    .slice()
    .sort((a, b) => a.orden - b.orden)
    .map((seccion) => ({
      id: seccion.id,
      nombre: seccion.nombre,
      lineas: lineasPorSeccion.get(seccion.id) ?? [],
    }));

  // Cualquier grupo que no corresponda a una sección declarada va igual al
  // final, sin nombre: el caso "plano" (líneas sin sección) y, defensivamente,
  // líneas que apunten a una sección que la versión no trajo. Preferimos
  // mostrar la ubicación sin agrupar antes que perderla de vista.
  const declaradas = new Set(version.secciones.map((s) => s.id));
  for (const [clave, lineas] of lineasPorSeccion) {
    if (!declaradas.has(clave) && lineas.length > 0) {
      secciones.push({ id: clave, nombre: null, lineas });
    }
  }

  return secciones.flatMap(({ id, nombre, lineas }) => {
    const conRuta = lineas
      .slice()
      .sort((a, b) => a.orden - b.orden)
      .find((l) => l.carga?.origen?.trim() || l.carga?.destino?.trim());
    if (!conRuta) return [];
    return [
      {
        idSeccion: id,
        nombreSeccion: nombre,
        origen: conRuta.carga?.origen?.trim() || null,
        destino: conRuta.carga?.destino?.trim() || null,
      },
    ];
  });
}

// ---------------------------------------------------------------------------
// Smart button "Aprobaciones": contador clickeable que abre el historial
// ---------------------------------------------------------------------------

function DialogHistorialAprobaciones({
  historial,
  isLoading,
  isError,
  error,
}: {
  historial: SolicitudAprobacion[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
}) {
  // Mientras carga el conteo no es fiable; se muestra "—" hasta tener datos.
  const valor = isLoading ? "—" : String(historial.length);

  return (
    <Dialog>
      <DialogTrigger className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary/50 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Stamp className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase text-muted-foreground">
            Aprobaciones
          </p>
          <p className="truncate text-base font-semibold tabular-nums">
            {valor}
          </p>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Historial de aprobaciones</DialogTitle>
          <DialogDescription>
            Solicitudes de aprobación de esta cotización.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto pr-1">
          <HistorialAprobaciones
            historial={historial}
            isLoading={isLoading}
            isError={isError}
            error={error}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

const ACCIONES_RESOLVER: {
  accion: AccionResolver;
  etiqueta: string;
  icono: LucideIcon;
  destructiva?: boolean;
}[] = [
  { accion: "aprobar", etiqueta: "Aprobar", icono: CircleCheck },
  { accion: "rechazar", etiqueta: "Rechazar", icono: CircleX, destructiva: true },
];

function AccionesResolverSolicitud({
  idSolicitud,
  idCotizacion,
}: {
  idSolicitud: string;
  idCotizacion: string;
}) {
  // El dialogo es controlado y no trae trigger propio: la vista decide desde
  // donde se abre y lo monta solo cuando hay una accion elegida.
  const [accionAbierta, setAccionAbierta] = useState<AccionResolver | null>(
    null,
  );

  return (
    <div className="flex flex-wrap gap-2">
      {ACCIONES_RESOLVER.map(({ accion, etiqueta, icono: Icono, destructiva }) => (
        <Button
          key={accion}
          type="button"
          variant={destructiva ? "destructive" : "outline"}
          onClick={() => setAccionAbierta(accion)}
        >
          <Icono data-icon="inline-start" />
          {etiqueta}
        </Button>
      ))}

      {accionAbierta ? (
        <DialogoResolverSolicitud
          key={accionAbierta}
          idSolicitud={idSolicitud}
          idCotizacion={idCotizacion}
          accion={accionAbierta}
          abierto
          onAbiertoChange={(abierto) => {
            if (!abierto) setAccionAbierta(null);
          }}
        />
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pipeline de estados (happy path, estado actual resaltado)
// ---------------------------------------------------------------------------

function Pipeline({ estado }: { estado: EstadoCotizacion }) {
  // Fuera del happy path no hay progresion que mostrar: cae al badge de estado.
  if (
    estado === "CANCELADA" ||
    estado === "VENCIDA" ||
    estado === "EN_REVISION"
  ) {
    return <EstadoCotizacionBadge estado={estado} />;
  }

  const pasos: { clave: EstadoCotizacion; texto: string }[] = [
    { clave: "BORRADOR", texto: "Borrador" },
    { clave: "PENDIENTE_APROBACION", texto: "Pendiente de aprobación" },
    { clave: "ENVIADA", texto: "Enviada" },
    {
      clave: estado === "PERDIDA" ? "PERDIDA" : "GANADA",
      texto: estado === "PERDIDA" ? "Perdida" : "Ganada",
    },
  ];

  const indiceActual = pasos.findIndex((p) => p.clave === estado);

  return (
    <ol className="flex items-center gap-1 text-xs">
      {pasos.map((paso, i) => {
        const activo = i === indiceActual;
        const completado = i < indiceActual;
        const esPerdida = paso.clave === "PERDIDA" && activo;
        return (
          <li key={paso.clave} className="flex items-center gap-1">
            <span
              className={[
                "rounded-full px-2.5 py-1 font-medium transition-colors",
                activo
                  ? esPerdida
                    ? "bg-destructive text-white"
                    : "bg-primary text-primary-foreground"
                  : completado
                    ? "bg-primary/15 text-foreground"
                    : "bg-muted text-muted-foreground",
              ].join(" ")}
            >
              {paso.texto}
            </span>
            {i < pasos.length - 1 ? (
              <span className="text-muted-foreground/50">›</span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// Atomos de layout
// ---------------------------------------------------------------------------

// Shell comun de las tarjetas: contenedor + caja de icono. El cuerpo lo pone
// cada tarjeta (un solo valor en SmartButton, dos fechas en TarjetaFechas).
function TarjetaShell({
  icono,
  children,
}: {
  icono: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {icono}
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function SmartButton({
  icono,
  label,
  valor,
}: {
  icono: React.ReactNode;
  label: string;
  valor: string;
}) {
  return (
    <TarjetaShell icono={icono}>
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="truncate text-base font-semibold tabular-nums">{valor}</p>
    </TarjetaShell>
  );
}
