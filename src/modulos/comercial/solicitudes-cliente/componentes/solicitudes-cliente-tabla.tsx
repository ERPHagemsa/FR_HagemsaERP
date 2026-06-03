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
  EstadoSolicitudCliente,
  FiltrosSolicitudesCliente,
  SolicitudClienteResumen,
  TipoOrigen,
} from "../tipos/solicitud-cliente.tipos";
import { EstadoSolicitudBadge } from "./estado-solicitud-badge";

type Props = {
  items: SolicitudClienteResumen[];
  filtros: FiltrosSolicitudesCliente;
  total: number;
};

const ESTADOS_SC: Array<{ valor: EstadoSolicitudCliente | "TODOS"; etiqueta: string }> = [
  { valor: "TODOS", etiqueta: "Todos" },
  { valor: "PENDIENTE", etiqueta: "Pendiente" },
  { valor: "EN_COTIZACION", etiqueta: "En cotizacion" },
  { valor: "COTIZADA", etiqueta: "Cotizada" },
  { valor: "CERRADA", etiqueta: "Cerrada" },
  { valor: "DESCARTADA", etiqueta: "Descartada" },
];

const ORIGENES: Array<{ valor: TipoOrigen | "TODOS"; etiqueta: string }> = [
  { valor: "TODOS", etiqueta: "Todos" },
  { valor: "PROSPECTO", etiqueta: "Prospecto" },
  { valor: "CLIENTE", etiqueta: "Cliente" },
];

export function SolicitudesClienteTabla({ items, filtros, total }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const pagina = filtros.pagina ?? 1;
  const porPagina = filtros.porPagina ?? 10;

  const [busquedaLocal, setBusquedaLocal] = React.useState(filtros.busqueda ?? "");
  const [estadoLocal, setEstadoLocal] = React.useState(filtros.estado ?? "TODOS");
  const [origenLocal, setOrigenLocal] = React.useState(filtros.origenTipo ?? "TODOS");

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
        porPagina: filtros.porPagina,
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
        estado: filtros.estado,
        origenTipo: filtros.origenTipo,
        busqueda: filtros.busqueda,
        pagina: nuevaPagina,
        porPagina: filtros.porPagina,
      })
    );
  }

  const hayFiltros =
    !!filtros.estado || !!filtros.origenTipo || !!filtros.busqueda;

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Solicitudes de cliente</CardTitle>
            <CardDescription>
              {total} {total === 1 ? "solicitud" : "solicitudes"} encontradas
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
                placeholder="Buscar por solicitante o descripcion..."
                value={busquedaLocal}
                onChange={(e) => setBusquedaLocal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && aplicarFiltros()}
              />
            </div>
          </div>
          <FiltroSelect
            className="min-w-40 flex-1"
            label="Estado"
            value={estadoLocal}
            valores={ESTADOS_SC.map((e) => e.valor)}
            etiquetas={ESTADOS_SC.map((e) => e.etiqueta)}
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
                <TableHead className="w-[26%]">Solicitante</TableHead>
                <TableHead className="w-[26%]">Descripcion del servicio</TableHead>
                <TableHead className="w-[12%]">Origen</TableHead>
                <TableHead className="w-[14%]">Estado</TableHead>
                <TableHead className="w-[10%] text-center">Cotizaciones</TableHead>
                <TableHead className="w-[12%] text-right">Accion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <FilaSolicitud key={item.id} item={item} />
              ))}
              {!items.length ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-28 text-center text-muted-foreground"
                  >
                    {hayFiltros
                      ? "No se encontraron solicitudes con los filtros aplicados. Intenta ampliar la busqueda."
                      : "No hay solicitudes de cliente registradas."}
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
              ? `Mostrando ${desdeVisible}-${hastaVisible} de ${total} solicitudes`
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

function FilaSolicitud({ item }: { item: SolicitudClienteResumen }) {
  return (
    <TableRow>
      <TableCell className="text-sm">
        <span className="block truncate font-medium">{item.nombreSolicitante}</span>
        {item.contactoSolicitante ? (
          <span className="block truncate text-xs text-muted-foreground">
            {item.contactoSolicitante.nombre}
          </span>
        ) : null}
      </TableCell>
      <TableCell className="truncate text-sm text-muted-foreground">
        {item.descripcionServicio}
      </TableCell>
      <TableCell className="text-sm">
        {item.origenTipo === "PROSPECTO" ? "Prospecto" : "Cliente"}
      </TableCell>
      <TableCell>
        <EstadoSolicitudBadge estado={item.estado} />
      </TableCell>
      <TableCell className="text-center">
        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums">
          {item.totalCotizaciones}
        </span>
      </TableCell>
      <TableCell className="text-right">
        <Button asChild size="icon-sm" variant="outline">
          <Link href={`/comercial/solicitudes-cliente/${item.id}`}>
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

