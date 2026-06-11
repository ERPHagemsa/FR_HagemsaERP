import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, GitBranch, CalendarClock, CalendarX } from "lucide-react";

import { Button } from "@/compartido/componentes/ui/button";

import { CotizacionAcciones } from "../componentes/cotizacion-acciones";
import { EstadoCotizacionBadge } from "../componentes/estado-cotizacion-badge";
import { CotizacionVersionesNotebook } from "../componentes/cotizacion-versiones-notebook";
import { consultarCotizacion } from "../servicios/cotizaciones-api";
import type { Cotizacion, EstadoCotizacion } from "../tipos/cotizaciones.tipos";

type Props = {
  id: string;
};

// Layout denso estilo Odoo: statusbar + pipeline + smart buttons + grupos
// inline + notebook de versiones (una sola version visible a la vez).
export async function CotizacionDetalleVista({ id }: Props) {
  const cotizacion = await consultarCotizacion(id).catch(() => null);

  if (!cotizacion) {
    notFound();
  }

  const vigente =
    cotizacion.versiones.find((v) => v.numeroVersion === cotizacion.versionVigente) ??
    null;

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* === Statusbar sticky: volver + identidad + pipeline + acciones === */}
      <div className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 px-5 py-3 lg:px-8 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon" className="shrink-0">
              <Link href="/comercial/cotizaciones" aria-label="Volver al listado">
                <ArrowLeft />
              </Link>
            </Button>
            {cotizacion.solicitudClienteId ? (
              <Button asChild variant="outline" size="sm" className="shrink-0 text-xs">
                <Link href={`/comercial/solicitudes-cliente/${cotizacion.solicitudClienteId}`}>
                  <ArrowLeft />
                  Volver a la solicitud
                </Link>
              </Button>
            ) : null}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold">
                  Cotizacion {cotizacion.origenTipo === "PROSPECTO" ? "· Prospecto" : "· Cliente"}
                </h1>
                <EstadoCotizacionBadge estado={cotizacion.estado} />
              </div>
              <p className="truncate font-mono text-xs text-muted-foreground">{cotizacion.id}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-5">
            <Pipeline estado={cotizacion.estado} />
            <CotizacionAcciones cotizacion={cotizacion} />
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5 px-5 py-5 lg:px-8">
        {/* === Smart buttons: cifras clave de la version vigente === */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SmartButton
            icono={<FileText className="size-4" />}
            label="Monto total"
            valor={
              vigente?.montoTotal != null
                ? `${formatearMonto(vigente.montoTotal)} ${vigente.moneda}`
                : "—"
            }
          />
          <SmartButton
            icono={<GitBranch className="size-4" />}
            label="Versiones"
            valor={String(cotizacion.versiones.length)}
          />
          <SmartButton
            icono={<CalendarClock className="size-4" />}
            label="Validez (dias)"
            valor={vigente?.validezDias != null ? String(vigente.validezDias) : "—"}
          />
          <SmartButton
            icono={<CalendarX className="size-4" />}
            label="Vence"
            valor={vigente?.fechaVencimiento ? formatearFecha(vigente.fechaVencimiento) : "—"}
          />
        </div>

        {/* === Grupos: datos en label:valor inline, dos columnas densas === */}
        <div className="grid gap-x-10 gap-y-6 rounded-xl border border-border bg-card p-5 md:grid-cols-2">
          <Grupo titulo="Origen">
            <Campo label="Tipo de origen" value={formatearOrigenTipo(cotizacion.origenTipo)} />
            <Campo label="ID origen" value={cotizacion.origenId} mono />
            <CampoSC cotizacion={cotizacion} />
          </Grupo>

          <Grupo titulo="Trazabilidad">
            <Campo label="Ejecutivo responsable" value={cotizacion.idEjecutivoResponsable} />
            <Campo label="Fecha de creacion" value={formatearFechaHora(cotizacion.fechaCreacion)} />
            <Campo
              label="Ultima modificacion"
              value={
                cotizacion.fechaModificacion
                  ? formatearFechaHora(cotizacion.fechaModificacion)
                  : "—"
              }
            />
          </Grupo>

          {cotizacion.estado === "PERDIDA" && cotizacion.motivoPerdida ? (
            <div className="md:col-span-2">
              <Campo label="Motivo de perdida" value={cotizacion.motivoPerdida} />
            </div>
          ) : null}
        </div>

        {/* === Notebook de versiones === */}
        <CotizacionVersionesNotebook
          versiones={cotizacion.versiones}
          versionVigente={cotizacion.versionVigente}
        />
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Pipeline de estados (happy path, estado actual resaltado)
// ---------------------------------------------------------------------------

function Pipeline({ estado }: { estado: EstadoCotizacion }) {
  // Estados fuera del happy path: se muestran como chip unico.
  if (estado === "CANCELADA" || estado === "VENCIDA" || estado === "EN_REVISION") {
    return (
      <div className="flex items-center">
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          {etiqueta(estado)}
        </span>
      </div>
    );
  }

  const pasos: { clave: EstadoCotizacion; texto: string }[] = [
    { clave: "BORRADOR", texto: "Borrador" },
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
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {icono}
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase text-muted-foreground">{label}</p>
        <p className="truncate text-base font-semibold tabular-nums">{valor}</p>
      </div>
    </div>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold">{titulo}</p>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function Campo({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/40 py-1.5 last:border-0">
      <span className="shrink-0 text-xs uppercase text-muted-foreground">{label}</span>
      <span className={mono ? "truncate font-mono text-sm" : "text-sm font-medium"}>
        {value ?? "—"}
      </span>
    </div>
  );
}

function CampoSC({ cotizacion }: { cotizacion: Cotizacion }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/40 py-1.5 last:border-0">
      <span className="shrink-0 text-xs uppercase text-muted-foreground">Solicitud de cliente</span>
      {cotizacion.solicitudClienteId ? (
        <Button asChild variant="link" size="sm" className="h-auto p-0">
          <Link href={`/comercial/solicitudes-cliente/${cotizacion.solicitudClienteId}`}>
            Ver SC de origen
          </Link>
        </Button>
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Formato
// ---------------------------------------------------------------------------

function etiqueta(estado: EstadoCotizacion): string {
  const mapa: Record<EstadoCotizacion, string> = {
    BORRADOR: "Borrador",
    ENVIADA: "Enviada",
    EN_REVISION: "En revision",
    GANADA: "Ganada",
    PERDIDA: "Perdida",
    CANCELADA: "Cancelada",
    VENCIDA: "Vencida",
  };
  return mapa[estado];
}

function formatearOrigenTipo(tipo: string) {
  return tipo === "PROSPECTO" ? "Prospecto" : tipo === "CLIENTE" ? "Cliente" : tipo;
}

function formatearFecha(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatearFechaHora(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatearMonto(valor: number) {
  return new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}
