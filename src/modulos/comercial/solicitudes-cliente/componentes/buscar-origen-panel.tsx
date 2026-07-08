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

import { listarProspectos } from "../../prospectos/servicios/prospectos-api";
import type { Prospecto } from "../../prospectos/tipos/prospecto.tipos";
import { buscarClientesBc01 } from "../servicios/solicitudes-cliente-api";
import type { ClienteBc01, TipoOrigen } from "../tipos/solicitud-cliente.tipos";

// Un término solo de dígitos se busca como documento; si no, como nombre.
const esDocumento = (t: string) => /^\d+$/.test(t.trim());

// El cliente de BC-01 no trae tipoDocumento; se infiere del número.
function inferirTipoDocumento(doc: string): "RUC" | "DNI" | "CE" {
  const n = doc.trim();
  if (/^\d{11}$/.test(n)) return "RUC";
  if (/^\d{8}$/.test(n)) return "DNI";
  return "CE";
}

function etiquetaEstadoCliente(c: ClienteBc01): string {
  if (c.estado !== "ACTIVO" || c.estadoRegistro !== "ACTIVO") return "Inactivo";
  if (c.estadoAprobacion === "APROBADO") return "Activo";
  if (c.estadoAprobacion === "PENDIENTE_APROBACION") return "Pendiente aprob.";
  return "Rechazado";
}

type DatosIdentidadResuelta = {
  origenTipo: TipoOrigen;
  origenId: string;
  nombre?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
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

  const prospectos = useConsulta(
    () => listarProspectos({ busqueda: term, estado: "ACTIVO" }),
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
  const listaClientes = clientes.data ?? [];
  const cargando = prospectos.isLoading || clientes.isLoading;
  const sinResultados =
    Boolean(aplicado) &&
    !cargando &&
    listaProspectos.length === 0 &&
    listaClientes.length === 0;

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
      origenId: String(c.id),
      nombre: c.razonSocial ?? c.nombreComercial ?? undefined,
      tipoDocumento: inferirTipoDocumento(c.numeroDocumento),
      numeroDocumento: c.numeroDocumento,
    });
  }

  return (
    <FieldSet className="gap-3 rounded-lg border border-border px-4 pb-4 pt-1">
      <FieldLegend
        variant="label"
        className="px-1.5 font-semibold uppercase tracking-wide text-muted-foreground data-[variant=label]:text-xs"
      >
        Buscar origen
      </FieldLegend>
      <p className="text-xs text-muted-foreground">
        Buscá por nombre o documento el prospecto o cliente que origina la
        solicitud, y usalo como origen.
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
          {listaProspectos.map((p) => (
            <FilaOrigen
              key={`p-${p.id}`}
              icono={<UserRound className="size-4" />}
              nombre={p.razonSocial}
              secundario={p.nombreComercial}
              documento={p.numeroDocumento}
              onUsar={() => usarProspecto(p)}
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
    <div className="grid gap-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {titulo}
      </p>
      <ul className="flex flex-col gap-2">{children}</ul>
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
}: {
  icono: React.ReactNode;
  nombre: string;
  secundario?: string | null;
  documento: string;
  badge?: string;
  onUsar: () => void;
}) {
  return (
    <li className="flex items-start justify-between gap-3 rounded-md border border-border bg-background p-3">
      <div className="flex min-w-0 gap-2.5">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          {icono}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{nombre}</p>
          {secundario ? (
            <p className="truncate text-xs text-muted-foreground">{secundario}</p>
          ) : null}
          <p className="text-xs text-muted-foreground tabular-nums">{documento}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        {badge ? (
          <Badge variant="outline" className="font-normal">
            {badge}
          </Badge>
        ) : null}
        <Button type="button" size="sm" onClick={onUsar}>
          Usar este origen
        </Button>
      </div>
    </li>
  );
}
