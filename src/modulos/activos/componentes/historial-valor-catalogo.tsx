"use client";

import { History } from "lucide-react";
import * as React from "react";

import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/compartido/componentes/ui/card";
import type { ValorCatalogoHistorial } from "../tipos/maestros.tipos";

type Props = {
  historial: ValorCatalogoHistorial[];
  clasesVehiculoPorId?: Map<number, string>;
};

type DetalleAuditoria = {
  campo: string;
  antes: string;
  despues: string;
  tipo?: "normal" | "positivo" | "negativo";
};

type GrupoAuditoria = {
  id: string;
  fecha: string;
  accion: string;
  variante: "default" | "secondary" | "destructive";
  resumen: string;
  usuario: string;
  motivo: string | null;
  detalles: DetalleAuditoria[];
};

export function HistorialValorCatalogo({ historial, clasesVehiculoPorId }: Props) {
  const [pagina, setPagina] = React.useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = React.useState(10);
  const grupos = React.useMemo(
    () => construirGruposAuditoria(historial, clasesVehiculoPorId),
    [historial, clasesVehiculoPorId]
  );

  const totalPaginas = Math.max(1, Math.ceil(grupos.length / registrosPorPagina));
  const inicioPagina = (pagina - 1) * registrosPorPagina;
  const finPagina = inicioPagina + registrosPorPagina;
  const visibles = grupos.slice(inicioPagina, finPagina);
  const desdeVisible = grupos.length ? inicioPagina + 1 : 0;
  const hastaVisible = Math.min(finPagina, grupos.length);

  React.useEffect(() => {
    setPagina(1);
  }, [grupos.length, registrosPorPagina]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
          <History className="size-5" aria-hidden="true" />
        </span>
        <div>
          <CardTitle>Historial y auditoria</CardTitle>
          <p className="text-sm text-muted-foreground">
            Cambios registrados para trazabilidad de este valor de catalogo.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {grupos.length ? (
          <div className="grid gap-3">
            {visibles.map((grupo) => (
              <details
                key={grupo.id}
                className="group overflow-hidden rounded-xl border border-border bg-background"
              >
                <summary className="grid cursor-pointer list-none gap-3 px-4 py-3 transition-colors hover:bg-muted/40 md:grid-cols-[180px_1fr_160px_160px] md:items-center">
                  <div className="text-sm text-muted-foreground">
                    {formatearFechaHora(grupo.fecha)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{grupo.accion}</span>
                      <Badge variant={grupo.variante}>{grupo.accion}</Badge>
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {grupo.resumen}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Usuario: {grupo.usuario}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {grupo.detalles.length} detalle
                    {grupo.detalles.length === 1 ? "" : "s"}
                  </div>
                </summary>

                <div className="border-t border-border px-4 py-3">
                  <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Motivo:</span>
                    <span className="font-medium text-foreground">
                      {grupo.motivo || "Sin motivo registrado"}
                    </span>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead className="border-b border-border bg-muted/30 text-left">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Campo</th>
                          <th className="px-4 py-3 font-semibold">Antes</th>
                          <th className="px-4 py-3 font-semibold">Despues</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grupo.detalles.map((detalle, index) => (
                          <tr
                            key={`${grupo.id}-${detalle.campo}-${index}`}
                            className="border-b border-border last:border-b-0"
                          >
                            <td className="px-4 py-3 font-medium">{detalle.campo}</td>
                            <td className="max-w-[260px] px-4 py-3">
                              <ValorAuditoria tipo="antes" valor={detalle.antes} />
                            </td>
                            <td className="max-w-[260px] px-4 py-3">
                              <ValorAuditoria tipo="despues" tono={detalle.tipo} valor={detalle.despues} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </details>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border px-4 py-10 text-center text-sm text-muted-foreground">
            Este valor aun no tiene historial registrado.
          </div>
        )}
        {grupos.length ? (
          <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <div>
              Mostrando {desdeVisible}-{hastaVisible} de {grupos.length} acciones
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2">
                <span>Filas</span>
                <select
                  className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                  value={registrosPorPagina}
                  onChange={(event) => setRegistrosPorPagina(Number(event.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pagina === 1}
                onClick={() => setPagina((actual) => Math.max(1, actual - 1))}
              >
                Anterior
              </Button>
              <span className="min-w-20 text-center">
                {pagina} / {totalPaginas}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pagina === totalPaginas}
                onClick={() => setPagina((actual) => Math.min(totalPaginas, actual + 1))}
              >
                Siguiente
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function construirGruposAuditoria(
  historial: ValorCatalogoHistorial[],
  clasesVehiculoPorId?: Map<number, string>
): GrupoAuditoria[] {
  const gruposPorLlave = new Map<string, ValorCatalogoHistorial[]>();

  for (const item of historial) {
    const llave = [item.accion, item.createdAt, item.usuario ?? "", item.motivo ?? ""].join("|");
    gruposPorLlave.set(llave, [...(gruposPorLlave.get(llave) ?? []), item]);
  }

  const grupos = Array.from(gruposPorLlave.entries()).map(([llave, items]) => {
    const primero = items[0];

    return {
      id: llave,
      fecha: primero.createdAt,
      accion: formatearAccion(primero.accion),
      variante: varianteAccion(primero.accion),
      resumen: construirResumen(items, primero.accion, clasesVehiculoPorId),
      usuario: primero.usuario ?? "-",
      motivo: primero.motivo,
      detalles: items.map((item) => construirDetalle(item, clasesVehiculoPorId)),
    };
  });

  return grupos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}

function construirResumen(
  items: ValorCatalogoHistorial[],
  accion: ValorCatalogoHistorial["accion"],
  clasesVehiculoPorId?: Map<number, string>
) {
  if (accion === "REGISTRO") {
    return `Valor creado: "${formatearValor(items[0].valorNuevo)}"`;
  }

  if (items.length === 1) {
    const detalle = construirDetalle(items[0], clasesVehiculoPorId);
    return `${detalle.campo}: ${detalle.antes} -> ${detalle.despues}`;
  }

  return `${items.length} campos modificados`;
}

function construirDetalle(
  item: ValorCatalogoHistorial,
  clasesVehiculoPorId?: Map<number, string>
): DetalleAuditoria {
  if (item.campo === "estadoRegistro") {
    const despues = item.valorNuevo === "true" ? "Activo" : "Inactivo";
    const antes =
      item.valorAnterior === "true" ? "Activo" : item.valorAnterior === "false" ? "Inactivo" : "-";
    return {
      campo: "Estado de registro",
      antes,
      despues,
      tipo: despues === "Inactivo" ? "negativo" : "positivo",
    };
  }

  if (item.campo === "claseVehiculoReferenciaId") {
    return {
      campo: formatearCampo(item.campo),
      antes: formatearClaseVehiculo(item.valorAnterior, clasesVehiculoPorId),
      despues: formatearClaseVehiculo(item.valorNuevo, clasesVehiculoPorId),
      tipo: "normal",
    };
  }

  return {
    campo: formatearCampo(item.campo),
    antes: formatearValor(item.valorAnterior),
    despues: formatearValor(item.valorNuevo),
    tipo: "normal",
  };
}

function formatearClaseVehiculo(value: string | null, clasesVehiculoPorId?: Map<number, string>) {
  if (!value) return "-";
  return clasesVehiculoPorId?.get(Number(value)) ?? value;
}

function formatearAccion(accion: ValorCatalogoHistorial["accion"]) {
  if (accion === "REGISTRO") return "Alta";
  if (accion === "ELIMINACION") return "Eliminacion";
  return "Actualizacion";
}

function varianteAccion(
  accion: ValorCatalogoHistorial["accion"]
): "default" | "secondary" | "destructive" {
  if (accion === "ELIMINACION") return "destructive";
  if (accion === "REGISTRO") return "default";
  return "secondary";
}

const CAMPOS_HISTORIAL: Record<string, string> = {
  nombre: "Nombre",
  descripcion: "Descripcion",
  claseVehiculoReferenciaId: "Clase de vehiculo",
};

function formatearCampo(value: string | null) {
  if (!value) return "Valor";
  return CAMPOS_HISTORIAL[value] ?? separarCamelCase(value);
}

function separarCamelCase(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/^./, (char) => char.toUpperCase());
}

function formatearValor(value: string | null) {
  if (!value) return "-";

  const fecha = Date.parse(value);
  if (/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(value) && !Number.isNaN(fecha)) {
    return new Intl.DateTimeFormat("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(value));
  }

  return value;
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

function ValorAuditoria({
  tipo,
  tono = "normal",
  valor,
}: {
  tipo: "antes" | "despues";
  tono?: DetalleAuditoria["tipo"];
  valor: string;
}) {
  if (valor === "-") {
    return <span className="text-muted-foreground">-</span>;
  }

  if (tipo === "antes") {
    return (
      <span className="inline-flex rounded-md bg-destructive/10 px-2 py-1 text-destructive line-through decoration-destructive/70">
        {valor}
      </span>
    );
  }

  const className =
    tono === "negativo"
      ? "bg-destructive/10 text-destructive"
      : tono === "positivo"
        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        : "bg-muted text-foreground";

  return <span className={`inline-flex rounded-md px-2 py-1 ${className}`}>{valor}</span>;
}
