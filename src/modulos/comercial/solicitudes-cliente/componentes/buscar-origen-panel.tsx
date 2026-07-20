"use client";

import * as React from "react";
import Link from "next/link";
import { Building2, Loader2, Search, UserRound } from "lucide-react";

import { extraerMensajeError, useConsulta } from "@/compartido/api";
import { Alert, AlertDescription } from "@/compartido/componentes/ui/alert";
import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import { FieldLegend, FieldSet } from "@/compartido/componentes/ui/field";
import { Input } from "@/compartido/componentes/ui/input";
import { cn } from "@/compartido/utilidades";

import { listarProspectos } from "../../prospectos/servicios/prospectos-api";
import type { Prospecto } from "../../prospectos/tipos/prospecto.tipos";
import { buscarClientesBc01 } from "../servicios/solicitudes-cliente-api";
import type { ClienteBc01, TipoOrigen } from "../tipos/solicitud-cliente.tipos";
import { esDocumento, etiquetaEstadoCliente } from "../utilidades/cliente-bc01";

// El cliente de BC-01 no trae tipoDocumento; se infiere del número.
function inferirTipoDocumento(doc: string): "RUC" | "DNI" | "CE" {
  const n = doc.trim();
  if (/^\d{11}$/.test(n)) return "RUC";
  if (/^\d{8}$/.test(n)) return "DNI";
  return "CE";
}

type DatosIdentidadResuelta = {
  origenTipo: TipoOrigen;
  origenId: string;
  nombre?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  correo?: string | null;
};

type Props = {
  onIdentidadResuelta: (datos: DatosIdentidadResuelta) => void;
};

/**
 * Buscador ÚNICO del origen de la solicitud: por nombre o documento, busca a la
 * vez PROSPECTOS (Comercial, solo activos) y CLIENTES (BC-01, vía el backend), y
 * permite elegir cualquiera como origen. Los prospectos y clientes se muestran
 * separados; un mismo negocio puede aparecer en ambos (el cliente pasa a BC-01 al
 * ganar la cotización) — la deduplicación se hará más adelante.
 */
export function BuscarOrigenPanel({ onIdentidadResuelta }: Props) {
  const [termino, setTermino] = React.useState("");
  const [aplicado, setAplicado] = React.useState<string | null>(null);

  const term = aplicado ?? "";
  const porDocumento = esDocumento(term);

  // Se mantiene el filtro estado="ACTIVO" (los seleccionables no cambian) y se
  // añade incluirEliminados=true SOLO para poder mostrar en sitio, tachados y no
  // seleccionables, los prospectos que existen pero fueron eliminados (soft-delete).
  // No se relaja el filtro de estado: así no aparecen DESCARTADO/CONVERTIDO activos
  // que hoy están ocultos. Ver nota de partición más abajo.
  const prospectos = useConsulta(
    () => listarProspectos({ busqueda: term, estado: "ACTIVO", incluirEliminados: true }),
    [term],
    { enabled: Boolean(aplicado) }
  );
  const clientes = useConsulta(
    () =>
      buscarClientesBc01(
        porDocumento ? { numeroDocumento: term } : { razonSocial: term }
      ),
    [term],
    { enabled: Boolean(aplicado) }
  );

  const listaProspectos = prospectos.data?.data ?? [];
  // estadoRegistro es el eje de existencia (soft-delete): true = activo (seleccionable),
  // false = eliminado (se muestra tachado y NO seleccionable). Los activos son
  // exactamente el mismo conjunto que antes (estado=ACTIVO, estadoRegistro=true).
  const prospectosActivos = listaProspectos.filter((p) => p.estadoRegistro);
  const prospectosEliminados = listaProspectos.filter((p) => !p.estadoRegistro);
  const listaClientes = clientes.data ?? [];
  const cargando = prospectos.isLoading || clientes.isLoading;
  const hayResultadosUtiles =
    prospectosActivos.length > 0 || listaClientes.length > 0;
  // "Sin resultados" (con opción de crear) SOLO cuando no hay nada, ni activos ni
  // eliminados. Si hay un eliminado que explica la ausencia de activos, se suprime
  // el "Registrar nuevo prospecto": el registro existe (aunque eliminado) y crear
  // uno nuevo con el mismo documento chocaría con el 409 del backend.
  const sinResultados =
    Boolean(aplicado) &&
    !cargando &&
    !hayResultadosUtiles &&
    prospectosEliminados.length === 0;

  function buscar() {
    const valor = termino.trim();
    if (valor.length < 2) return;
    setAplicado(valor);
  }

  function usarProspecto(p: Prospecto) {
    onIdentidadResuelta({
      origenTipo: "PROSPECTO",
      origenId: p.id,
      nombre: p.razonSocial,
      tipoDocumento: p.tipoDocumento,
      numeroDocumento: p.numeroDocumento,
    });
  }

  function usarCliente(c: ClienteBc01) {
    onIdentidadResuelta({
      origenTipo: "CLIENTE",
      // El origen_id de la SC es uuid → usamos el publicId de BC-01, no el id entero.
      origenId: c.publicId,
      nombre: c.razonSocial ?? c.nombreComercial ?? undefined,
      tipoDocumento: inferirTipoDocumento(c.numeroDocumento),
      numeroDocumento: c.numeroDocumento,
      correo: c.correo,
    });
  }

  return (
    <FieldSet className="min-w-0 gap-3 rounded-lg border border-border px-4 pb-4 pt-1">
      <FieldLegend
        variant="label"
        className="px-1.5 font-semibold uppercase tracking-wide text-muted-foreground data-[variant=label]:text-xs"
      >
        Buscar origen
      </FieldLegend>
      <p className="text-xs text-muted-foreground">
        Busca por nombre o documento el prospecto o cliente que origina la
        solicitud, y úsalo como origen.
      </p>

      <div className="flex items-end gap-3">
        <div className="grid flex-1 gap-1.5">
          <Input
            placeholder="Nombre, razón social o documento…"
            value={termino}
            onChange={(e) => setTermino(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && buscar()}
            disabled={cargando}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={buscar}
          disabled={cargando || termino.trim().length < 2}
        >
          <Search data-icon="inline-start" />
          {cargando ? "Buscando…" : "Buscar"}
        </Button>
      </div>

      {prospectos.error ? (
        <Alert variant="destructive">
          <AlertDescription>
            {extraerMensajeError(prospectos.error, "No se pudieron buscar prospectos.")}
          </AlertDescription>
        </Alert>
      ) : null}
      {clientes.error ? (
        <Alert variant="destructive">
          <AlertDescription>
            {extraerMensajeError(clientes.error, "No se pudieron buscar clientes en BC-01.")}
          </AlertDescription>
        </Alert>
      ) : null}

      {cargando ? (
        <p className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Buscando…
        </p>
      ) : null}

      {!cargando && listaProspectos.length > 0 ? (
        <Grupo titulo="Prospectos (Comercial)">
          {prospectosActivos.map((p) => (
            <FilaOrigen
              key={`p-${p.id}`}
              icono={<UserRound className="size-4" />}
              nombre={p.razonSocial}
              secundario={p.nombreComercial}
              documento={p.numeroDocumento}
              onUsar={() => usarProspecto(p)}
            />
          ))}
          {prospectosEliminados.map((p) => (
            <FilaOrigen
              key={`pe-${p.id}`}
              icono={<UserRound className="size-4" />}
              nombre={p.razonSocial}
              secundario={p.nombreComercial}
              documento={p.numeroDocumento}
              eliminado
            />
          ))}
        </Grupo>
      ) : null}

      {!cargando && listaClientes.length > 0 ? (
        <Grupo titulo="Clientes (BC-01)">
          {listaClientes.map((c) => (
            <FilaOrigen
              key={`c-${c.id}`}
              icono={<Building2 className="size-4" />}
              nombre={c.razonSocial ?? c.nombreComercial ?? "Sin nombre registrado"}
              secundario={c.razonSocial ? c.nombreComercial : null}
              documento={c.numeroDocumento}
              badge={etiquetaEstadoCliente(c)}
              onUsar={() => usarCliente(c)}
            />
          ))}
        </Grupo>
      ) : null}

      {sinResultados ? (
        <Alert>
          <AlertDescription className="flex flex-col gap-2">
            <span>
              No se encontró ningún prospecto ni cliente con ese criterio.
            </span>
            <Button asChild variant="outline" size="sm" className="w-fit">
              <Link href="/comercial/prospectos/nuevo">
                Registrar nuevo prospecto
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
    </FieldSet>
  );
}

function Grupo({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-w-0 gap-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {titulo}
      </p>
      <ul className="flex min-w-0 flex-col gap-2">{children}</ul>
    </div>
  );
}

function FilaOrigen({
  icono,
  nombre,
  secundario,
  documento,
  badge,
  onUsar,
  eliminado = false,
}: {
  icono: React.ReactNode;
  nombre: string;
  secundario?: string | null;
  documento: string;
  badge?: string;
  // onUsar solo aplica a filas seleccionables; una fila eliminada no lo recibe.
  onUsar?: () => void;
  // Fila de un prospecto eliminado (soft-delete): se tacha y NO es seleccionable.
  // Solo informativo — la restauración se hace desde el módulo de Prospectos.
  eliminado?: boolean;
}) {
  return (
    <li className="flex min-w-0 items-start justify-between gap-3 rounded-md border border-border bg-background p-3">
      <div className="flex min-w-0 flex-1 gap-2.5">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          {icono}
        </span>
        <div className="min-w-0">
          {/* Mismo idioma de tachado que el piloto (prospectos-tabla.tsx). */}
          <div className={cn(eliminado && "line-through text-muted-foreground opacity-60")}>
            <p className="truncate text-sm font-medium text-foreground">{nombre}</p>
            {secundario ? (
              <p className="truncate text-xs text-muted-foreground">{secundario}</p>
            ) : null}
            <p className="truncate text-xs text-muted-foreground tabular-nums">{documento}</p>
          </div>
          {eliminado ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Eliminado — restáuralo desde Prospectos
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        {badge ? (
          <Badge variant="outline" className="font-normal">
            {badge}
          </Badge>
        ) : null}
        {eliminado ? null : (
          <Button type="button" size="sm" onClick={onUsar}>
            Usar este origen
          </Button>
        )}
      </div>
    </li>
  );
}
