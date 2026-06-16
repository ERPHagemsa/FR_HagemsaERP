"use client";

// Feed global de historial de prospectos (toda la cartera) con filtros por
// accion y rango de fechas + paginacion. Server fetch en la vista; este
// componente maneja los controles y empuja los filtros a la URL.

import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/compartido/componentes/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
import { Input } from "@/compartido/componentes/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select";

import type {
  AccionHistorial,
  RespuestaPaginadaHistorial,
} from "../tipos/prospecto.tipos";
import { HistorialFeed } from "./historial-feed";

type Props = {
  respuesta: RespuestaPaginadaHistorial;
  filtrosActivos: {
    accion?: string;
    desde?: string;
    hasta?: string;
    pagina?: number;
    porPagina?: number;
  };
};

const ACCIONES: Array<{ valor: AccionHistorial | "TODAS"; etiqueta: string }> = [
  { valor: "TODAS", etiqueta: "Todas" },
  { valor: "REGISTRO", etiqueta: "Registro" },
  { valor: "MODIFICACION", etiqueta: "Modificacion" },
  { valor: "ELIMINACION", etiqueta: "Eliminacion" },
];

export function HistorialProspectosTabla({ respuesta, filtrosActivos }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const { data: entradas, total, pagina, porPagina } = respuesta;

  const [accionLocal, setAccionLocal] = React.useState(
    filtrosActivos.accion ?? "TODAS"
  );
  const [desdeLocal, setDesdeLocal] = React.useState(filtrosActivos.desde ?? "");
  const [hastaLocal, setHastaLocal] = React.useState(filtrosActivos.hasta ?? "");

  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const desdeVisible = total ? (pagina - 1) * porPagina + 1 : 0;
  const hastaVisible = Math.min(pagina * porPagina, total);

  function construirUrl(params: Record<string, string | number | undefined>) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "" && v !== "TODAS") {
        sp.set(k, String(v));
      }
    }
    return `${pathname}?${sp.toString()}`;
  }

  function aplicarFiltros() {
    router.push(
      construirUrl({
        accion: accionLocal,
        desde: desdeLocal,
        hasta: hastaLocal,
        pagina: 1,
        porPagina: filtrosActivos.porPagina,
      })
    );
  }

  function limpiarFiltros() {
    setAccionLocal("TODAS");
    setDesdeLocal("");
    setHastaLocal("");
    router.push(pathname);
  }

  function irAPagina(nuevaPagina: number) {
    router.push(
      construirUrl({
        accion: filtrosActivos.accion,
        desde: filtrosActivos.desde,
        hasta: filtrosActivos.hasta,
        pagina: nuevaPagina,
        porPagina: filtrosActivos.porPagina,
      })
    );
  }

  const hayFiltros =
    !!filtrosActivos.accion || !!filtrosActivos.desde || !!filtrosActivos.hasta;

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <CardTitle>Historial de prospectos</CardTitle>
        <CardDescription>
          Actividad sobre toda la cartera ({total}{" "}
          {total === 1 ? "registro" : "registros"})
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-5">
        {/* Filtros */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="grid min-w-40 gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Accion
            </span>
            <Select value={accionLocal} onValueChange={setAccionLocal}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCIONES.map((a) => (
                  <SelectItem key={a.valor} value={a.valor}>
                    {a.etiqueta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid min-w-36 gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Desde
            </span>
            <Input
              type="date"
              value={desdeLocal}
              max={hastaLocal || undefined}
              onChange={(e) => setDesdeLocal(e.target.value)}
            />
          </div>
          <div className="grid min-w-36 gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Hasta
            </span>
            <Input
              type="date"
              value={hastaLocal}
              min={desdeLocal || undefined}
              onChange={(e) => setHastaLocal(e.target.value)}
            />
          </div>
          <Button type="button" onClick={aplicarFiltros}>
            Buscar
          </Button>
          {hayFiltros ? (
            <Button type="button" variant="outline" onClick={limpiarFiltros}>
              Limpiar
            </Button>
          ) : null}
        </div>

        {/* Feed */}
        <HistorialFeed entradas={entradas} mostrarProspecto />

        {/* Paginacion */}
        <div className="flex flex-col gap-3 border-t border-border pt-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>
            {total > 0
              ? `Mostrando ${desdeVisible}-${hastaVisible} de ${total} registros`
              : "Sin resultados"}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pagina <= 1}
              onClick={() => irAPagina(pagina - 1)}
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
              disabled={pagina >= totalPaginas}
              onClick={() => irAPagina(pagina + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
