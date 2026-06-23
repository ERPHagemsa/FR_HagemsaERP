"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { Eye, FilePlusCorner, FileText, Plus, RefreshCw, Search } from "lucide-react";

import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
import { toast } from "sonner";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/compartido/componentes/ui/tooltip";
import { cn } from "@/compartido/utilidades";

import { accionesPermitidasSC } from "../tipos/solicitud-cliente.tipos";
import type {
  FiltrosSolicitudesCliente,
  SolicitudClienteResumen,
  TipoOrigen,
} from "../tipos/solicitud-cliente.tipos";
import { EstadoSolicitudBadge } from "./estado-solicitud-badge";
import { SolicitudClienteNuevaSheet } from "./solicitud-cliente-nueva-sheet";

type Props = {
  items: SolicitudClienteResumen[];
  filtros: FiltrosSolicitudesCliente;
  total: number;
};

// Opciones del control segmentado de estado (pool de trabajo).
// "TODOS" es el valor interno para "sin filtro de estado".
type OpcionSegmento = { valor: string; etiqueta: string };

const SEGMENTOS_ESTADO: OpcionSegmento[] = [
  { valor: "PENDIENTE", etiqueta: "Por cotizar" },
  { valor: "EN_COTIZACION", etiqueta: "En cotizacion" },
  { valor: "TODOS", etiqueta: "Todas" },
];

const ORIGENES: Array<{ valor: TipoOrigen | "TODOS"; etiqueta: string }> = [
  { valor: "TODOS", etiqueta: "Todos" },
  { valor: "PROSPECTO", etiqueta: "Prospecto" },
  { valor: "CLIENTE", etiqueta: "Cliente" },
];

export function SolicitudesClienteTabla({ items, filtros, total }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const [crearAbierto, setCrearAbierto] = React.useState(false);

  const pagina = filtros.pagina ?? 1;
  const porPagina = filtros.porPagina ?? 10;

  const [busquedaLocal, setBusquedaLocal] = React.useState(filtros.busqueda ?? "");
  const [origenLocal, setOrigenLocal] = React.useState(filtros.origenTipo ?? "TODOS");

  // El estado activo del segmento se deriva directamente del filtro recibido por props.
  const estadoSegmento = filtros.estado ?? "TODOS";

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
        estado: estadoSegmento,
        origenTipo: origenLocal,
        busqueda: busquedaLocal,
        pagina: 1,
        porPagina: filtros.porPagina,
      })
    );
  }

  function cambiarSegmento(valor: string) {
    router.push(
      construirUrl({
        estado: valor,
        origenTipo: filtros.origenTipo,
        busqueda: filtros.busqueda,
        pagina: 1,
        porPagina: filtros.porPagina,
      })
    );
  }

  function limpiarFiltros() {
    setBusquedaLocal("");
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
          <Button onClick={() => setCrearAbierto(true)}>
            <Plus data-icon="inline-start" />
            Nueva solicitud
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-5">
        {/* Control segmentado de estado — pool de trabajo */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-1 self-start">
          {SEGMENTOS_ESTADO.map((seg) => {
            const activo = estadoSegmento === seg.valor;
            return (
              <button
                key={seg.valor}
                type="button"
                onClick={() => cambiarSegmento(seg.valor)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  activo
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {seg.etiqueta}
              </button>
            );
          })}
        </div>

        {/* Filtros secundarios */}
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
                <TableHead className="w-[8%]">Codigo</TableHead>
                <TableHead className="w-[16%]">Solicitante</TableHead>
                <TableHead className="w-[7%]">Origen</TableHead>
                <TableHead className="w-[15%]">Descripcion del servicio</TableHead>
                <TableHead className="w-[13%]">Registrada por</TableHead>
                <TableHead className="w-[8%] text-center whitespace-nowrap">Cotiz.</TableHead>
                <TableHead className="w-[13%]">Cotizada por</TableHead>
                <TableHead className="w-[10%]">Estado</TableHead>
                <TableHead className="w-[10%] text-right">Accion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <FilaSolicitud key={item.id} item={item} />
              ))}
              {!items.length ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
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

      <SolicitudClienteNuevaSheet
        abierto={crearAbierto}
        onCerrar={() => setCrearAbierto(false)}
        onCreado={() => {
          // La invalidacion del listado la hace useRegistrarSCMutation en su onSuccess.
          toast.success("Solicitud registrada");
        }}
      />
    </Card>
  );
}

function FilaSolicitud({ item }: { item: SolicitudClienteResumen }) {
  // La cotizacion viva mas reciente (o null). Es la fuente para el deep-link y
  // para "Tomado por" — NO usar totalCotizaciones (cuenta tambien las terminales).
  const vigente = item.cotizacionVigente;
  const puedeCotizar = accionesPermitidasSC(item.estado).agregarCotizacion;

  return (
    <TableRow>
      <TableCell className="text-sm">
        <span className="font-medium tabular-nums">
          {item.codigoSolicitud ?? "—"}
        </span>
      </TableCell>
      <TableCell className="text-sm">
        <span className="block truncate font-medium">{item.nombreSolicitante}</span>
        {item.contactoSolicitante ? (
          <span className="block truncate text-xs text-muted-foreground">
            {item.contactoSolicitante.nombre}
          </span>
        ) : null}
      </TableCell>
      <TableCell className="text-sm">
        {item.origenTipo === "PROSPECTO" ? "Prospecto" : "Cliente"}
      </TableCell>
      <TableCell className="truncate text-sm text-muted-foreground">
        {item.descripcionServicio}
      </TableCell>
      <TableCell className="text-sm">
        <span className="block truncate">
          {item.registradoPor?.nombre ?? "—"}
        </span>
      </TableCell>
      <TableCell className="text-center">
        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums">
          {item.totalCotizaciones}
        </span>
      </TableCell>
      {/* "Cotizada por": ejecutivo de la cotizacion viva. Sin cotizacion viva la
          SC vuelve al pool → "Disponible". */}
      <TableCell className="text-sm">
        {vigente == null ? (
          <Badge variant="outline">Disponible</Badge>
        ) : (
          <span className="block truncate">{vigente.ejecutivo.nombre}</span>
        )}
      </TableCell>
      <TableCell>
        <EstadoSolicitudBadge estado={item.estado} />
      </TableCell>
      {/* Accion primaria adaptativa (solo-icono con tooltip):
          - hay cotizacion viva  -> "Ver cotizacion" (deep-link directo, evita el detalle)
          - no hay viva y se puede cotizar -> "Cotizar"
          - no hay viva y la SC es terminal -> sin accion primaria
          "Ver detalle" (el expediente) queda SIEMPRE como accion secundaria. */}
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1.5">
          {vigente != null ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild size="icon-sm" variant="default">
                  <Link href={`/comercial/cotizaciones/${vigente.id}`}>
                    <FileText />
                    <span className="sr-only">Ver cotización</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ver cotización</TooltipContent>
            </Tooltip>
          ) : puedeCotizar ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild size="icon-sm" variant="default">
                  <Link href={`/comercial/solicitudes-cliente/${item.id}/cotizar`}>
                    <FilePlusCorner />
                    <span className="sr-only">Cotizar</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Cotizar</TooltipContent>
            </Tooltip>
          ) : null}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild size="icon-sm" variant="outline">
                <Link href={`/comercial/solicitudes-cliente/${item.id}`}>
                  <Eye />
                  <span className="sr-only">Ver detalle</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ver detalle</TooltipContent>
          </Tooltip>
        </div>
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
