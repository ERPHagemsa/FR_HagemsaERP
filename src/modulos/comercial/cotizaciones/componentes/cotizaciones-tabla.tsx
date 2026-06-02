"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { Eye, Plus, RefreshCw, Search } from "lucide-react";

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
  Cotizacion,
  EstadoCotizacion,
  OrigenTipo,
  RespuestaPaginadaCotizaciones,
} from "../tipos/cotizaciones.tipos";
import { EstadoCotizacionBadge } from "./estado-cotizacion-badge";

type Props = {
  respuesta: RespuestaPaginadaCotizaciones;
  filtrosActivos: {
    estado?: string;
    origenTipo?: string;
    busqueda?: string;
    pagina?: number;
    porPagina?: number;
  };
};

const ESTADOS_COTIZACION: Array<{ valor: EstadoCotizacion | "TODOS"; etiqueta: string }> = [
  { valor: "TODOS", etiqueta: "Todos" },
  { valor: "BORRADOR", etiqueta: "Borrador" },
  { valor: "ENVIADA", etiqueta: "Enviada" },
  { valor: "EN_REVISION", etiqueta: "En revision" },
  { valor: "GANADA", etiqueta: "Ganada" },
  { valor: "PERDIDA", etiqueta: "Perdida" },
  { valor: "CANCELADA", etiqueta: "Cancelada" },
  { valor: "VENCIDA", etiqueta: "Vencida" },
];

const ORIGENES: Array<{ valor: OrigenTipo | "TODOS"; etiqueta: string }> = [
  { valor: "TODOS", etiqueta: "Todos" },
  { valor: "PROSPECTO", etiqueta: "Prospecto" },
  { valor: "CLIENTE", etiqueta: "Cliente" },
];

export function CotizacionesTabla({ respuesta, filtrosActivos }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const { data: cotizaciones, total, pagina, porPagina } = respuesta;

  const [busquedaLocal, setBusquedaLocal] = React.useState(
    filtrosActivos.busqueda ?? ""
  );
  const [estadoLocal, setEstadoLocal] = React.useState(
    filtrosActivos.estado ?? "TODOS"
  );
  const [origenLocal, setOrigenLocal] = React.useState(
    filtrosActivos.origenTipo ?? "TODOS"
  );

  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const desdeVisible = total ? (pagina - 1) * porPagina + 1 : 0;
  const hastaVisible = Math.min(pagina * porPagina, total);

  function construirUrl(params: Record<string, string | number | undefined>) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "" && v !== "TODOS") {
        sp.set(k, String(v));
      }
    }
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  function aplicarFiltros() {
    router.push(
      construirUrl({
        estado: estadoLocal,
        origenTipo: origenLocal,
        busqueda: busquedaLocal,
        pagina: 1,
        porPagina: filtrosActivos.porPagina,
      })
    );
  }

  function limpiarFiltros() {
    setBusquedaLocal("");
    setEstadoLocal("TODOS");
    setOrigenLocal("TODOS");
    router.push(pathname);
  }

  function irAPagina(nuevaPagina: number) {
    router.push(
      construirUrl({
        estado: filtrosActivos.estado,
        origenTipo: filtrosActivos.origenTipo,
        busqueda: filtrosActivos.busqueda,
        pagina: nuevaPagina,
        porPagina: filtrosActivos.porPagina,
      })
    );
  }

  const hayFiltros =
    !!filtrosActivos.estado ||
    !!filtrosActivos.origenTipo ||
    !!filtrosActivos.busqueda;

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Cotizaciones</CardTitle>
            <CardDescription>
              {total} {total === 1 ? "cotizacion" : "cotizaciones"} encontradas
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/comercial/solicitudes-cliente/nueva">
              <Plus data-icon="inline-start" />
              Nueva solicitud
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-5">
        {/* Filtros */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="grid min-w-64 flex-1 gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Busqueda
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar cotizaciones..."
                value={busquedaLocal}
                onChange={(e) => setBusquedaLocal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && aplicarFiltros()}
              />
            </div>
          </div>
          <FiltroSelect
            className="min-w-36 flex-1"
            label="Estado"
            value={estadoLocal}
            valores={ESTADOS_COTIZACION.map((e) => e.valor)}
            etiquetas={ESTADOS_COTIZACION.map((e) => e.etiqueta)}
            onChange={setEstadoLocal}
          />
          <FiltroSelect
            className="min-w-36 flex-1"
            label="Origen"
            value={origenLocal}
            valores={ORIGENES.map((o) => o.valor)}
            etiquetas={ORIGENES.map((o) => o.etiqueta)}
            onChange={setOrigenLocal}
          />
          <Button type="button" onClick={aplicarFiltros}>
            Buscar
          </Button>
        </div>

        {hayFiltros ? (
          <div className="flex justify-end">
            <Button
              type="button"
              className="h-8"
              variant="outline"
              onClick={limpiarFiltros}
            >
              <RefreshCw />
              Limpiar filtros
            </Button>
          </div>
        ) : null}

        {/* Tabla */}
        <div className="overflow-hidden rounded-xl border border-border">
          <Table className="w-full table-fixed [&_td]:px-2 [&_th]:px-2">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[14%]">Origen</TableHead>
                <TableHead className="w-[12%]">Canal</TableHead>
                <TableHead className="w-[10%]">Estado</TableHead>
                <TableHead className="w-[8%] text-right">Version</TableHead>
                <TableHead className="w-[14%]">Ejecutivo</TableHead>
                <TableHead className="w-[14%]">Creado</TableHead>
                <TableHead className="w-[14%]">Actualizado</TableHead>
                <TableHead className="w-[7%] text-center">Accion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cotizaciones.map((cotizacion) => (
                <FilaCotizacion key={cotizacion.id} cotizacion={cotizacion} />
              ))}
              {!cotizaciones.length ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-28 text-center text-muted-foreground"
                  >
                    No se encontraron cotizaciones con los filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>

        {/* Paginacion */}
        <div className="flex flex-col gap-3 border-t border-border pt-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>
            {total > 0
              ? `Mostrando ${desdeVisible}-${hastaVisible} de ${total} cotizaciones`
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

function FilaCotizacion({ cotizacion }: { cotizacion: Cotizacion }) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-xs font-medium text-muted-foreground">
            {cotizacion.origenTipo}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {cotizacion.origenId.slice(0, 8)}…
          </span>
        </div>
      </TableCell>
      <TableCell className="truncate text-sm">
        {formatearCanal(cotizacion.canalEntrada)}
      </TableCell>
      <TableCell>
        <EstadoCotizacionBadge estado={cotizacion.estado} />
      </TableCell>
      <TableCell className="text-right text-sm">
        {cotizacion.versionVigente ?? "—"}
      </TableCell>
      <TableCell className="truncate text-sm text-muted-foreground">
        {cotizacion.idEjecutivoResponsable}
      </TableCell>
      <TableCell className="truncate text-sm text-muted-foreground">
        {formatearFecha(cotizacion.fechaCreacion)}
      </TableCell>
      <TableCell className="truncate text-sm text-muted-foreground">
        {cotizacion.fechaModificacion
          ? formatearFecha(cotizacion.fechaModificacion)
          : "—"}
      </TableCell>
      <TableCell className="text-center">
        <Button asChild size="icon-sm" variant="outline">
          <Link href={`/comercial/cotizaciones/${cotizacion.id}`}>
            <Eye />
            <span className="sr-only">Ver</span>
          </Link>
        </Button>
      </TableCell>
    </TableRow>
  );
}

function FiltroSelect({
  className,
  label,
  value,
  valores,
  etiquetas,
  onChange,
}: {
  className?: string;
  label: string;
  value: string;
  valores: string[];
  etiquetas: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {valores.map((valor, i) => (
            <SelectItem key={valor} value={valor}>
              {etiquetas[i]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function formatearFecha(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatearCanal(canal: string) {
  const mapa: Record<string, string> = {
    CORREO: "Correo",
    LLAMADA: "Llamada",
    PRESENCIAL: "Presencial",
    TELEFONO: "Telefono",
    EMAIL: "Email",
    OTRO: "Otro",
  };
  return mapa[canal] ?? canal;
}
