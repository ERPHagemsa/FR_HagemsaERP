"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  History,
  RotateCcw,
  Trash2,
} from "lucide-react";

import { SiteHeader } from "@/compartido/componentes/site-header";
import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/compartido/componentes/ui/empty";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/compartido/componentes/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select";
import { cn } from "@/compartido/utilidades/utils";

type HistorialFlotaItem = {
  id: string;
  accion?: string | null;
  fechaAccion?: string | null;
  usuarioAccion?: string | null;
  datosAnteriores?: Record<string, unknown> | null;
  datosNuevos?: Record<string, unknown> | null;
};

type Props = {
  placa: string;
  historial: HistorialFlotaItem[];
};

export function FlotaAuditoriaVista({ placa, historial }: Props) {
  const [pagina, setPagina] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const totalRegistros = historial.length;
  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / registrosPorPagina));
  const inicio = (pagina - 1) * registrosPorPagina;
  const fin = inicio + registrosPorPagina;
  const registrosPaginados = historial.slice(inicio, fin);

  function toggleExpand(id: string) {
    setExpandedIds((actual) => ({ ...actual, [id]: !actual[id] }));
  }

  function actualizarRegistrosPorPagina(value: number) {
    setRegistrosPorPagina(value);
    setPagina(1);
  }

  return (
    <>
      <SiteHeader
        title="Auditoria de unidad"
        breadcrumbs={[
          { title: "Flota y Disponibilidad", href: "/flota" },
          { title: "Listar unidades", href: "/flota/unidades" },
          { title: "Auditoria" },
        ]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h1 className="text-2xl font-semibold tracking-normal">
                  Auditoria de unidad {placa}
                </h1>
                <Badge
                  variant="outline"
                  className="h-6 rounded-full border-border bg-background px-2.5 text-[12px] font-medium text-foreground shadow-xs"
                >
                  VEHICULO
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Revisa los movimientos y cambios registrados para esta unidad.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/flota/unidades">
                  <RotateCcw />
                  Volver
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href={`/flota/${encodeURIComponent(placa)}`}>
                  <Eye />
                  Ver unidad
                </Link>
              </Button>
            </div>
          </div>

          <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-lg font-semibold">Historial de movimientos</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Cambios anteriores y nuevos asociados al contrato y cuenta.
              </p>
            </div>

            {historial.length === 0 ? (
              <Empty className="py-12">
                <EmptyHeader>
                  <EmptyTitle>Sin auditoria registrada</EmptyTitle>
                  <EmptyDescription>
                    No se encontraron movimientos para este vehiculo.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="divide-y divide-border">
                {registrosPaginados.map((item, index) => {
                  const isExpanded = Boolean(expandedIds[item.id]);
                  const reverseIndex = totalRegistros - (inicio + index);

                  return (
                    <article key={item.id} className={obtenerClaseMovimiento(item)}>
                      <button
                        type="button"
                        className="flex w-full flex-col gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                        onClick={() => toggleExpand(item.id)}
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-sm font-medium">
                            {reverseIndex}
                          </span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <MovimientoBadge accion={item.accion} />
                              <span className="text-sm font-medium">
                                {formatearFecha(item.fechaAccion)}
                              </span>
                            </div>
                            <p className="mt-1 truncate text-xs text-muted-foreground">
                              Movimiento {item.id}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{item.usuarioAccion || "Sin usuario"}</span>
                          {isExpanded ? (
                            <ChevronUp className="size-4" />
                          ) : (
                            <ChevronDown className="size-4" />
                          )}
                        </div>
                      </button>

                      {isExpanded ? (
                        <div className="border-t border-border bg-background/60 p-5">
                          <div className="grid gap-3">
                            <DiffRow
                              label="Contrato"
                              oldVal={item.datosAnteriores?.contrato}
                              newVal={item.datosNuevos?.contrato}
                            />
                            <DiffRow
                              label="Cuenta"
                              oldVal={item.datosAnteriores?.cuenta}
                              newVal={item.datosNuevos?.cuenta}
                            />
                          </div>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}

            {historial.length > 0 ? (
              <div className="flex flex-col gap-4 border-t border-border px-4 py-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-3 text-sm md:justify-start">
                  <span className="text-muted-foreground">Registros por pagina:</span>
                  <Select
                    value={String(registrosPorPagina)}
                    onValueChange={(value) => actualizarRegistrosPorPagina(Number(value))}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-muted-foreground">
                    Mostrando {inicio + 1} a {Math.min(fin, totalRegistros)} de{" "}
                    {totalRegistros} registros
                  </span>
                </div>
                <Pagination className="md:mx-0 md:ml-auto md:w-auto md:justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => pagina > 1 && setPagina((actual) => actual - 1)}
                        className={
                          pagina === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                    {generarNumerosPaginas(pagina, totalPaginas).map((pageNum, index) => (
                      <PaginationItem key={`${pageNum}-${index}`}>
                        {pageNum === "..." ? (
                          <span className="flex h-9 w-9 items-center justify-center text-muted-foreground">
                            ...
                          </span>
                        ) : (
                          <PaginationLink
                            onClick={() => setPagina(Number(pageNum))}
                            isActive={pageNum === pagina}
                            className={
                              Number(pageNum) === pagina ? "" : "cursor-pointer"
                            }
                            size="icon"
                          >
                            {pageNum}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          pagina < totalPaginas && setPagina((actual) => actual + 1)
                        }
                        className={
                          pagina === totalPaginas
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            ) : null}
          </section>
        </div>
      </main>
    </>
  );
}

function MovimientoBadge({ accion }: { accion?: string | null }) {
  const isEliminacion = accion === "ELIMINACION";
  const isRegistro = accion === "REGISTRO";

  return (
    <Badge
      variant={isEliminacion ? "destructive" : "outline"}
      className="h-6 gap-1.5 rounded-full border-border bg-background px-2.5 text-[12px] font-medium text-foreground shadow-xs"
    >
      {isEliminacion ? (
        <Trash2 className="text-destructive" />
      ) : (
        <History className={isRegistro ? "text-emerald-500" : "text-amber-500"} />
      )}
      {accion || "MOVIMIENTO"}
    </Badge>
  );
}

function DiffRow({
  label,
  oldVal,
  newVal,
}: {
  label: string;
  oldVal: unknown;
  newVal: unknown;
}) {
  const anterior = formatVal(oldVal);
  const nuevo = formatVal(newVal);
  const changed = anterior !== nuevo;

  return (
    <div className="grid overflow-hidden rounded-lg border border-border md:grid-cols-12">
      <div className="flex items-center border-b border-border bg-muted/30 p-4 md:col-span-3 md:border-b-0 md:border-r">
        <span className="text-sm font-semibold">{label}</span>
      </div>
      <div className="grid md:col-span-9 sm:grid-cols-2">
        <div
          className={cn(
            "border-b border-border p-4 text-sm font-medium sm:border-b-0 sm:border-r",
            changed
              ? "bg-destructive/10 text-destructive"
              : "bg-background text-muted-foreground",
          )}
        >
          {changed ? `- ${anterior}` : anterior}
        </div>
        <div
          className={cn(
            "p-4 text-sm font-medium",
            changed
              ? "bg-emerald-500/10 text-emerald-600"
              : "bg-background text-muted-foreground",
          )}
        >
          {changed ? `+ ${nuevo}` : nuevo}
        </div>
      </div>
    </div>
  );
}

function formatVal(value: unknown) {
  if (value === null || value === undefined) return "Sin asignar";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return String(record.codigo ?? record.nombre ?? record.id ?? JSON.stringify(record));
  }

  return String(value);
}

function formatearFecha(fecha?: string | null) {
  if (!fecha) return "-";

  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return fecha;

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(valor);
}

function obtenerClaseMovimiento(item: HistorialFlotaItem) {
  return cn(
    item.accion === "ELIMINACION" && "border-l-4 border-l-destructive",
    item.accion === "REGISTRO" && "border-l-4 border-l-emerald-500",
  );
}

function generarNumerosPaginas(paginaActual: number, totalPaginas: number) {
  const paginas: (number | string)[] = [];
  const maxPaginasVisibles = 5;

  if (totalPaginas <= maxPaginasVisibles) {
    for (let i = 1; i <= totalPaginas; i++) {
      paginas.push(i);
    }
    return paginas;
  }

  paginas.push(1);

  let inicio = Math.max(2, paginaActual - 1);
  let fin = Math.min(totalPaginas - 1, paginaActual + 1);

  if (paginaActual <= 2) {
    fin = Math.min(totalPaginas - 1, 4);
  } else if (paginaActual >= totalPaginas - 1) {
    inicio = Math.max(2, totalPaginas - 3);
  }

  if (inicio > 2) paginas.push("...");

  for (let i = inicio; i <= fin; i++) {
    paginas.push(i);
  }

  if (fin < totalPaginas - 1) paginas.push("...");

  paginas.push(totalPaginas);
  return paginas;
}
