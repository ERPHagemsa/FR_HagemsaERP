"use client";

import * as React from "react";
import { Building2, Loader2, Search, X } from "lucide-react";

import { extraerMensajeError, useConsulta } from "@/compartido/api";
import { Alert, AlertDescription } from "@/compartido/componentes/ui/alert";
import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import { Input } from "@/compartido/componentes/ui/input";

import { buscarClientesBc01 } from "../servicios/solicitudes-cliente-api";
import type { ClienteBc01 } from "../tipos/solicitud-cliente.tipos";
import {
  esDocumento,
  etiquetaEstadoCliente,
  nombreCliente,
} from "../utilidades/cliente-bc01";

export type ClienteElegido = {
  /** UUID público de BC-01: es lo que se persiste como id del cliente externo. */
  publicId: string;
  nombre: string;
  numeroDocumento: string;
};

type Props = {
  /** Cliente ya elegido; `null` muestra el buscador. */
  valor: ClienteElegido | null;
  onElegir: (cliente: ClienteElegido) => void;
  onQuitar: () => void;
  /** Texto de ayuda bajo el buscador. */
  ayuda?: string;
  /** Id del input, para que el <Label> de quien lo usa pueda apuntarle. */
  idInput?: string;
};

/**
 * Buscador de CLIENTES de BC-01 por nombre o documento. Es el hermano acotado de
 * `BuscarOrigenPanel`: aquel busca a la vez prospectos y clientes porque una
 * solicitud puede nacer de cualquiera de los dos; acá solo hay clientes, porque
 * un tarifario se pacta con quien ya es cliente.
 *
 * Una vez elegido muestra la ficha con opción de quitarlo: el cliente es
 * opcional en el tarifario, así que se puede volver a dejar vacío.
 */
export function BuscarClienteBc01Panel({
  valor,
  onElegir,
  onQuitar,
  ayuda,
  idInput,
}: Props) {
  const [termino, setTermino] = React.useState("");
  const [aplicado, setAplicado] = React.useState<string | null>(null);

  const term = aplicado ?? "";
  const porDocumento = esDocumento(term);

  const clientes = useConsulta(
    () =>
      buscarClientesBc01(
        porDocumento ? { numeroDocumento: term } : { razonSocial: term }
      ),
    [term],
    { enabled: Boolean(aplicado) }
  );

  const lista = clientes.data ?? [];
  // isFetching y NO isLoading: `useConsulta` deja isLoading en false cuando ya
  // hay datos cargados (para que una lista no parpadee al refrescar). Acá eso
  // significaría que la SEGUNDA búsqueda no muestra nada en curso — sin spinner,
  // con el botón habilitado y con los resultados del término anterior en
  // pantalla como si fueran del nuevo.
  const cargando = clientes.isFetching;
  const sinResultados = Boolean(aplicado) && !cargando && lista.length === 0;

  function buscar() {
    const v = termino.trim();
    if (v.length < 2) return;
    setAplicado(v);
  }

  function elegir(c: ClienteBc01) {
    onElegir({
      publicId: c.publicId,
      nombre: nombreCliente(c),
      numeroDocumento: c.numeroDocumento,
    });
    // Se limpia la búsqueda: si luego lo quita, arranca de cero y no ve la
    // lista vieja como si siguiera vigente.
    setTermino("");
    setAplicado(null);
  }

  if (valor) {
    return (
      <div className="flex min-w-0 items-start justify-between gap-3 rounded-md border border-border bg-background p-3">
        <div className="flex min-w-0 flex-1 gap-2.5">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Building2 className="size-4" />
          </span>
          <div className="min-w-0">
            {/*
              Un valor puede venir de afuera con solo el id (por ejemplo, un
              filtro llegado por querystring): se muestra el id hasta que se
              elija un cliente de la lista, en vez de una ficha en blanco.
            */}
            <p className="truncate text-sm font-medium text-foreground">
              {valor.nombre || valor.publicId}
            </p>
            {valor.numeroDocumento ? (
              <p className="truncate text-xs text-muted-foreground tabular-nums">
                {valor.numeroDocumento}
              </p>
            ) : null}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onQuitar}
          aria-label="Quitar cliente"
        >
          <X data-icon="inline-start" />
          Quitar
        </Button>
      </div>
    );
  }

  return (
    <div className="grid min-w-0 gap-2">
      {ayuda ? <p className="text-xs text-muted-foreground">{ayuda}</p> : null}

      <div className="flex items-end gap-2">
        <Input
          id={idInput}
          placeholder="Razón social o documento…"
          value={termino}
          onChange={(e) => setTermino(e.target.value)}
          onKeyDown={(e) => {
            // Enter dispara la búsqueda, no el submit del formulario contenedor.
            if (e.key === "Enter") {
              e.preventDefault();
              buscar();
            }
          }}
          disabled={cargando}
        />
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

      {clientes.error ? (
        <Alert variant="destructive">
          <AlertDescription>
            {extraerMensajeError(
              clientes.error,
              "No se pudieron buscar clientes en BC-01."
            )}
          </AlertDescription>
        </Alert>
      ) : null}

      {cargando ? (
        <p className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Buscando…
        </p>
      ) : null}

      {/*
        Se exige `aplicado`: `useConsulta` conserva `data` aunque la consulta se
        deshabilite, así que al elegir un cliente (que limpia la búsqueda) y
        luego quitarlo, la lista del término anterior volvería a aparecer bajo
        un buscador vacío.
      */}
      {!cargando && aplicado && lista.length > 0 ? (
        <ul className="flex max-h-64 min-w-0 flex-col gap-2 overflow-y-auto">
          {lista.map((c) => (
            <li
              key={c.id}
              className="flex min-w-0 items-start justify-between gap-3 rounded-md border border-border bg-background p-3"
            >
              <div className="flex min-w-0 flex-1 gap-2.5">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Building2 className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {nombreCliente(c)}
                  </p>
                  {c.razonSocial && c.nombreComercial ? (
                    <p className="truncate text-xs text-muted-foreground">
                      {c.nombreComercial}
                    </p>
                  ) : null}
                  <p className="truncate text-xs text-muted-foreground tabular-nums">
                    {c.numeroDocumento}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <Badge variant="outline" className="font-normal">
                  {etiquetaEstadoCliente(c)}
                </Badge>
                <Button type="button" size="sm" onClick={() => elegir(c)}>
                  Usar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {sinResultados ? (
        <Alert>
          <AlertDescription>
            No se encontró ningún cliente con ese criterio en Socio de Negocio.
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
