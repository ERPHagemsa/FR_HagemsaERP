"use client";

// Feed de auditoria de prospectos (§5.3.1). Presentacional puro: recibe las
// entradas ya cargadas. Se reutiliza en la pagina global (toda la cartera) y en
// la traza por prospecto (pestaña del detalle). La columna "Prospecto" se oculta
// cuando ya estamos dentro de un prospecto (mostrarProspecto=false).

import Link from "next/link";
import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { Badge } from "@/compartido/componentes/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table";

import type {
  AccionHistorial,
  EntradaHistorial,
} from "../tipos/prospecto.tipos";

type Props = {
  entradas: EntradaHistorial[];
  mostrarProspecto?: boolean;
};

export function HistorialFeed({ entradas, mostrarProspecto = true }: Props) {
  if (entradas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay actividad registrada con los filtros aplicados.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <Table className="w-full [&_td]:px-3 [&_th]:px-3">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">Fecha</TableHead>
            {mostrarProspecto ? <TableHead>Prospecto</TableHead> : null}
            <TableHead className="w-[130px]">Accion</TableHead>
            <TableHead>Cambios</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entradas.map((entrada, i) => (
            <TableRow key={`${entrada.prospectoId}-${entrada.fechaAccion}-${i}`}>
              <TableCell className="align-top text-sm text-muted-foreground">
                {formatearFechaHora(entrada.fechaAccion)}
              </TableCell>
              {mostrarProspecto ? (
                <TableCell className="align-top font-medium">
                  <Link
                    href={`/comercial/prospectos/${entrada.prospectoId}`}
                    className="hover:underline"
                  >
                    {entrada.prospectoNombre}
                  </Link>
                </TableCell>
              ) : null}
              <TableCell className="align-top">
                <Badge variant={varianteAccion(entrada.accion)}>
                  {etiquetaAccion(entrada.accion)}
                </Badge>
              </TableCell>
              <TableCell className="align-top">
                <CambiosCelda entrada={entrada} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Celda de cambios: resume datosAnteriores/datosNuevos segun la accion.
// Por defecto muestra solo un resumen compacto; el detalle completo se despliega
// inline con "Ver detalle" para que la fila no ocupe alto ni ancho de mas.
// ---------------------------------------------------------------------------

function CambiosCelda({ entrada }: { entrada: EntradaHistorial }) {
  const [expandido, setExpandido] = React.useState(false);

  if (entrada.accion === "ELIMINACION") {
    return (
      <span className="text-sm text-muted-foreground">
        Registro dado de baja.
      </span>
    );
  }

  if (entrada.accion === "REGISTRO") {
    const campos = Object.entries(entrada.datosNuevos ?? {});
    if (campos.length === 0) {
      return <span className="text-sm text-muted-foreground">Alta del prospecto.</span>;
    }
    return (
      <div className="flex max-w-[34rem] flex-col gap-1 text-sm">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-muted-foreground">
            Alta · {campos.length} {campos.length === 1 ? "campo" : "campos"}
          </span>
          <BotonVerDetalle expandido={expandido} onToggle={() => setExpandido((v) => !v)} />
        </div>
        {expandido ? (
          <ul className="flex flex-col gap-0.5">
            {campos.map(([campo, valor]) => (
              <li key={campo} className="break-words">
                <span className="text-muted-foreground">{campo}:</span>{" "}
                <span className="font-medium">{formatearValor(campo, valor)}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  // MODIFICACION: antes -> despues por cada campo que cambio.
  const claves = Object.keys(entrada.datosNuevos ?? {});
  if (claves.length === 0) {
    return <span className="text-sm text-muted-foreground">Sin detalle.</span>;
  }
  return (
    <div className="flex max-w-[34rem] flex-col gap-1 text-sm">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-muted-foreground">
          {claves.length} {claves.length === 1 ? "cambio" : "cambios"}
          {!expandido ? <span className="opacity-70">: {claves.join(", ")}</span> : null}
        </span>
        <BotonVerDetalle expandido={expandido} onToggle={() => setExpandido((v) => !v)} />
      </div>
      {expandido ? (
        <ul className="flex flex-col gap-0.5">
          {claves.map((campo) => (
            <li key={campo} className="break-words">
              <span className="text-muted-foreground">{campo}:</span>{" "}
              <span className="line-through opacity-70">
                {formatearValor(campo, entrada.datosAnteriores?.[campo])}
              </span>{" "}
              <span aria-hidden>→</span>{" "}
              <span className="font-medium">
                {formatearValor(campo, entrada.datosNuevos?.[campo])}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function BotonVerDetalle({
  expandido,
  onToggle,
}: {
  expandido: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-primary hover:underline"
    >
      {expandido ? (
        <ChevronDown className="size-3" />
      ) : (
        <ChevronRight className="size-3" />
      )}
      {expandido ? "Ver menos" : "Ver detalle"}
    </button>
  );
}

// Formatea un valor de auditoria para mostrarlo legible (nunca JSON crudo).
// Arrays -> conteo con el nombre del campo ("2 contactos"); objetos -> resumen
// de claves; escalares -> su string. El `campo` da contexto al conteo.
function formatearValor(campo: string, valor: unknown): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  if (Array.isArray(valor)) {
    if (valor.length === 0) return "—";
    const noun =
      valor.length === 1 && campo.endsWith("s") ? campo.slice(0, -1) : campo;
    return `${valor.length} ${noun}`;
  }
  if (typeof valor === "object") {
    const claves = Object.keys(valor as Record<string, unknown>);
    return claves.length ? `{ ${claves.join(", ")} }` : "—";
  }
  return String(valor);
}

function etiquetaAccion(accion: AccionHistorial): string {
  const mapa: Record<AccionHistorial, string> = {
    REGISTRO: "Registro",
    MODIFICACION: "Modificacion",
    ELIMINACION: "Eliminacion",
  };
  return mapa[accion];
}

function varianteAccion(
  accion: AccionHistorial
): "default" | "secondary" | "destructive" | "outline" {
  if (accion === "REGISTRO") return "default";
  if (accion === "ELIMINACION") return "destructive";
  return "secondary";
}

function formatearFechaHora(value: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
