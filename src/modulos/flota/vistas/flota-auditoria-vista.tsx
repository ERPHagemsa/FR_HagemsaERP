"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, RotateCcw } from "lucide-react";

import { SiteHeader } from "@/compartido/componentes/site-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/compartido/componentes/ui/accordion";
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
  id: number;
  accion?: string | null;
  fechaAccion?: string | null;
  usuarioAccion?: string | null;
  datosAnteriores?: Record<string, unknown> | null;
  datosNuevos?: Record<string, unknown> | null;
};

type Props = {
  id: string;
  placa: string | null;
  historial: HistorialFlotaItem[];
};

function obtenerEstiloAccion(accion?: string | null) {
  if (accion === "REGISTRO") {
    return "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300";
  }
  if (accion === "ELIMINACION") {
    return "border-destructive/30 bg-destructive/10 text-destructive";
  }
  return "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-950/50 dark:text-sky-300";
}

function obtenerEstiloCabecera(accion?: string | null) {
  if (accion === "REGISTRO") {
    return "border-l-emerald-500 bg-emerald-50/70 hover:bg-emerald-50 dark:border-l-emerald-400 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50";
  }
  if (accion === "ELIMINACION") {
    return "border-l-destructive bg-destructive/10 hover:bg-destructive/15 dark:bg-destructive/20 dark:hover:bg-destructive/30";
  }
  return "border-l-sky-500 bg-sky-50/70 hover:bg-sky-50 dark:border-l-sky-400 dark:bg-sky-950/30 dark:hover:bg-sky-950/50";
}

function etiquetaAccion(accion?: string | null) {
  if (accion === "REGISTRO") return "Registro";
  if (accion === "MODIFICACION") return "Modificacion";
  if (accion === "ELIMINACION") return "Eliminacion";
  return accion ?? "Movimiento";
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

function formatearValor(valor: unknown) {
  if (valor === undefined || valor === null) return "Sin asignar";
  if (typeof valor === "string") return valor;
  if (typeof valor === "number" || typeof valor === "boolean") return String(valor);
  if (typeof valor === "object") {
    const record = valor as Record<string, unknown>;
    return String(record.codigo ?? record.nombre ?? record.id ?? JSON.stringify(record));
  }
  return String(valor);
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

export function FlotaAuditoriaVista({ id, placa, historial }: Props) {
  const [pagina, setPagina] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);

  const totalRegistros = historial.length;
  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / registrosPorPagina));
  const inicio = (pagina - 1) * registrosPorPagina;
  const fin = inicio + registrosPorPagina;
  const registrosPaginados = historial.slice(inicio, fin);

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
                  Auditoria de {placa ?? id}
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
                <Link href={`/flota/unidades/${encodeURIComponent(id)}`}>
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
              <Accordion type="multiple" className="mx-4 my-4 w-auto space-y-3 border-0">
                {registrosPaginados.map((item, index) => {
                  const reverseIndex = totalRegistros - (inicio + index);

                  return (
                    <AccordionItem
                      key={item.id}
                      value={String(item.id)}
                      className="min-w-0 max-w-full overflow-hidden rounded-lg border border-border bg-background shadow-xs"
                    >
                      <AccordionTrigger
                        className={cn(
                          "min-w-0 max-w-full overflow-hidden border-l-4 px-4 py-3 text-left no-underline hover:no-underline",
                          obtenerEstiloCabecera(item.accion),
                        )}
                      >
                        <div className="flex min-w-0 max-w-full flex-1 flex-col gap-3 pr-3 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline">#{reverseIndex}</Badge>
                              <Badge
                                variant="outline"
                                className={cn("rounded-full", obtenerEstiloAccion(item.accion))}
                              >
                                {etiquetaAccion(item.accion)}
                              </Badge>
                              <span className="rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                                Click para abrir detalle
                              </span>
                            </div>
                            <p className="mt-2 text-sm font-medium">
                              {formatearFecha(item.fechaAccion)}
                            </p>
                          </div>
                          <div className="min-w-0 rounded-md border border-border bg-background px-3 py-2 text-sm md:max-w-xs">
                            <span className="text-muted-foreground">Usuario</span>
                            <p className="truncate font-medium">{item.usuarioAccion || "-"}</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="min-w-0 max-w-full overflow-hidden">
                        <div className="grid min-w-0 max-w-full gap-3 overflow-hidden px-4 pb-4 pt-3">
                          <div className="grid min-w-0 gap-3 overflow-hidden rounded-md bg-muted/30 px-3 py-2 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground md:grid-cols-[minmax(120px,200px)_minmax(0,1fr)_minmax(0,1fr)]">
                            <span>Campo</span>
                            <span>Anterior</span>
                            <span>Nuevo</span>
                          </div>
                          <DiffRow
                            campo="Contrato"
                            anterior={item.datosAnteriores?.contrato}
                            nuevo={item.datosNuevos?.contrato}
                          />
                          <DiffRow
                            campo="Cuenta"
                            anterior={item.datosAnteriores?.cuenta}
                            nuevo={item.datosNuevos?.cuenta}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
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
                            className={Number(pageNum) === pagina ? "" : "cursor-pointer"}
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

function DiffRow({
  campo,
  anterior,
  nuevo,
}: {
  campo: string;
  anterior: unknown;
  nuevo: unknown;
}) {
  const valorAnterior = formatearValor(anterior);
  const valorNuevo = formatearValor(nuevo);
  const cambio = valorAnterior !== valorNuevo;

  return (
    <div
      className={cn(
        "grid min-w-0 max-w-full gap-3 overflow-hidden rounded-md border border-border p-3 md:grid-cols-[minmax(120px,200px)_minmax(0,1fr)_minmax(0,1fr)] md:items-start",
        cambio && "border-primary/30 bg-primary/5 dark:bg-primary/10",
      )}
    >
      <div className="flex min-h-10 min-w-0 items-center">
        <span className="break-words text-sm font-medium">{campo}</span>
      </div>
      <ValorDiff tipo="anterior" valor={anterior} cambio={cambio} />
      <ValorDiff tipo="nuevo" valor={nuevo} cambio={cambio} />
    </div>
  );
}

function ValorDiff({
  tipo,
  valor,
  cambio,
}: {
  tipo: "anterior" | "nuevo";
  valor: unknown;
  cambio: boolean;
}) {
  const contenido = formatearValor(valor);

  return (
    <div
      className={cn(
        "min-h-10 min-w-0 overflow-hidden rounded-md border px-3 py-2 text-sm",
        tipo === "anterior" &&
          (cambio
            ? "border-destructive/25 bg-destructive/10 text-destructive"
            : "border-border bg-muted/30 text-muted-foreground"),
        tipo === "nuevo" &&
          (cambio
            ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
            : "border-border bg-background text-foreground"),
      )}
    >
      <span className={cn("block whitespace-pre-wrap break-all", cambio && "font-medium")}>
        {cambio ? (tipo === "anterior" ? "- " : "+ ") : ""}
        {contenido}
      </span>
    </div>
  );
}
