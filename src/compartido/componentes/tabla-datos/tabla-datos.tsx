"use client";

import Link from "next/link";
import * as React from "react";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/compartido/componentes/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/compartido/componentes/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/compartido/componentes/ui/pagination";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table";
import { cn } from "@/compartido/utilidades";

import type {
  AccionTabla,
  AlineacionColumna,
  ColumnaTabla,
  PaginacionTabla,
} from "./tabla-datos.tipos";

const CLASES_ALINEACION: Record<AlineacionColumna, string> = {
  izquierda: "text-left",
  centro: "text-center",
  derecha: "text-right",
};

type Props<T> = {
  /** Definición de columnas (encabezado + render de celda). */
  columnas: ColumnaTabla<T>[];
  /** Filas a mostrar (ya paginadas por el backend). */
  datos: readonly T[];
  /** Devuelve un id estable por fila (key de React). */
  obtenerId: (fila: T) => string;
  /** Si se define, agrega la columna de acciones con el menú `⋯`. */
  acciones?: (fila: T) => AccionTabla<T>[];
  /** Muestra filas esqueleto mientras carga. */
  cargando?: boolean;
  /** Controles de paginación; omitir si la tabla no pagina. */
  paginacion?: PaginacionTabla;
  /** Slot para filtros/búsqueda propios de cada pantalla. */
  barraHerramientas?: React.ReactNode;
  /** Título del estado vacío. */
  vacioTitulo?: string;
  /** Descripción del estado vacío. */
  vacioDescripcion?: string;
};

/**
 * Tabla de datos estándar del ERP. Presentacional: el backend pagina y
 * filtra; este componente solo unifica la presentación (encabezado, filas,
 * carga, vacío, paginación y menú de acciones) para todas las pantallas.
 */
export function TablaDatos<T>({
  columnas,
  datos,
  obtenerId,
  acciones,
  cargando = false,
  paginacion,
  barraHerramientas,
  vacioTitulo = "Sin resultados",
  vacioDescripcion = "No se encontraron registros.",
}: Props<T>) {
  const tieneAcciones = Boolean(acciones);
  const totalColumnas = columnas.length + (tieneAcciones ? 1 : 0);

  return (
    <div className="flex flex-col gap-4">
      {barraHerramientas ? <div>{barraHerramientas}</div> : null}

      <div className="overflow-hidden rounded-xl border border-border">
        <Table className="w-full table-fixed [&_td]:px-2 [&_th]:px-2 ">
          <TableHeader>
            <TableRow>
              {columnas.map((columna) => (
                <TableHead
                  key={columna.id}
                  className={cn(
                    columna.ancho,
                    CLASES_ALINEACION[columna.alineacion ?? "izquierda"],
                    columna.className
                  )}
                >
                  {columna.encabezado}
                </TableHead>
              ))}
              {tieneAcciones ? (
                <TableHead className="w-[7%] text-right">Acción</TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {cargando ? (
              <FilasEsqueleto
                filas={paginacion?.porPagina ?? 8}
                columnas={totalColumnas}
              />
            ) : datos.length ? (
              datos.map((fila) => (
                <TableRow key={obtenerId(fila)}>
                  {columnas.map((columna) => (
                    <TableCell
                      key={columna.id}
                      className={cn(
                        CLASES_ALINEACION[columna.alineacion ?? "izquierda"],
                        columna.className
                      )}
                    >
                      {columna.celda(fila)}
                    </TableCell>
                  ))}
                  {tieneAcciones ? (
                    <TableCell className="text-right">
                      <CeldaAcciones acciones={acciones!(fila)} fila={fila} />
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={totalColumnas} className="h-28 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-sm font-medium">{vacioTitulo}</span>
                    <span className="text-xs text-muted-foreground">
                      {vacioDescripcion}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {paginacion ? <ControlesPaginacion paginacion={paginacion} /> : null}
    </div>
  );
}

function CeldaAcciones<T>({
  acciones,
  fila,
}: {
  acciones: AccionTabla<T>[];
  fila: T;
}) {
  const visibles = acciones.filter((accion) => !accion.oculta?.(fila));
  if (!visibles.length) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm">
          <MoreHorizontal />
          <span className="sr-only">Abrir acciones</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {visibles.map((accion) => {
          const Icono = accion.icono;
          const contenido = (
            <>
              {Icono ? <Icono className="size-4" /> : null}
              {accion.etiqueta}
            </>
          );
          return (
            <DropdownMenuItem
              key={accion.etiqueta}
              variant={accion.destructiva ? "destructive" : "default"}
              asChild={Boolean(accion.href)}
              onSelect={
                accion.href ? undefined : () => accion.alSeleccionar?.(fila)
              }
            >
              {accion.href ? (
                <Link href={accion.href(fila)}>{contenido}</Link>
              ) : (
                contenido
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FilasEsqueleto({
  filas,
  columnas,
}: {
  filas: number;
  columnas: number;
}) {
  return (
    <>
      {Array.from({ length: filas }).map((_, indiceFila) => (
        <TableRow key={indiceFila}>
          {Array.from({ length: columnas }).map((_, indiceColumna) => (
            <TableCell key={indiceColumna}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function ControlesPaginacion({ paginacion }: { paginacion: PaginacionTabla }) {
  const { pagina, porPagina, total, alCambiarPagina } = paginacion;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const desde = total ? (pagina - 1) * porPagina + 1 : 0;
  const hasta = Math.min(pagina * porPagina, total);
  const paginas = construirRangoPaginas(pagina, totalPaginas);

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
      <div>
        {total > 0 ? `Mostrando ${desde}-${hasta} de ${total}` : "Sin resultados"}
      </div>
      <Pagination className="mx-0 w-auto justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              text="Anterior"
              className={cn(
                "cursor-pointer",
                pagina <= 1 && "pointer-events-none opacity-50"
              )}
              onClick={() => pagina > 1 && alCambiarPagina(pagina - 1)}
            />
          </PaginationItem>
          {paginas.map((p, i) =>
            p === "ellipsis" ? (
              <PaginationItem key={`ellipsis-${i}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={p}>
                <PaginationLink
                  className="cursor-pointer"
                  isActive={p === pagina}
                  onClick={() => alCambiarPagina(p)}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            )
          )}
          <PaginationItem>
            <PaginationNext
              text="Siguiente"
              className={cn(
                "cursor-pointer",
                pagina >= totalPaginas && "pointer-events-none opacity-50"
              )}
              onClick={() => pagina < totalPaginas && alCambiarPagina(pagina + 1)}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

function construirRangoPaginas(
  actual: number,
  total: number
): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const paginas: (number | "ellipsis")[] = [1];
  const inicio = Math.max(2, actual - 1);
  const fin = Math.min(total - 1, actual + 1);
  if (inicio > 2) paginas.push("ellipsis");
  for (let p = inicio; p <= fin; p++) paginas.push(p);
  if (fin < total - 1) paginas.push("ellipsis");
  paginas.push(total);
  return paginas;
}
