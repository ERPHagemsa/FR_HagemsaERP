"use client";

// Feed de auditoria de prospectos (§5.3.1). Presentacional puro: recibe las
// entradas ya cargadas. Se reutiliza en la pagina global (toda la cartera) y en
// la traza por prospecto (pestaña del detalle). La columna "Prospecto" se oculta
// cuando ya estamos dentro de un prospecto (mostrarProspecto=false).

import Link from "next/link";

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
// Celda de cambios: resume datosAnteriores/datosNuevos segun la accion
// ---------------------------------------------------------------------------

function CambiosCelda({ entrada }: { entrada: EntradaHistorial }) {
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
      <ul className="flex flex-col gap-0.5 text-sm">
        {campos.map(([campo, valor]) => (
          <li key={campo}>
            <span className="text-muted-foreground">{campo}:</span>{" "}
            <span className="font-medium">{formatearValor(valor)}</span>
          </li>
        ))}
      </ul>
    );
  }

  // MODIFICACION: antes -> despues por cada campo que cambio.
  const claves = Object.keys(entrada.datosNuevos ?? {});
  if (claves.length === 0) {
    return <span className="text-sm text-muted-foreground">Sin detalle.</span>;
  }
  return (
    <ul className="flex flex-col gap-0.5 text-sm">
      {claves.map((campo) => (
        <li key={campo}>
          <span className="text-muted-foreground">{campo}:</span>{" "}
          <span className="line-through opacity-70">
            {formatearValor(entrada.datosAnteriores?.[campo])}
          </span>{" "}
          <span aria-hidden>→</span>{" "}
          <span className="font-medium">
            {formatearValor(entrada.datosNuevos?.[campo])}
          </span>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatearValor(valor: unknown): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  if (typeof valor === "object") return JSON.stringify(valor);
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
