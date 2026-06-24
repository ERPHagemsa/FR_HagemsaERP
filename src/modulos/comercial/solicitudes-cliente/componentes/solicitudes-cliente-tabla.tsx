"use client";

import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { Eye, FilePlusCorner, FileText, Plus, RefreshCw, Search } from "lucide-react";

import { TablaDatos } from "@/compartido/componentes/tabla-datos/tabla-datos";
import type {
  AccionTabla,
  ColumnaTabla,
} from "@/compartido/componentes/tabla-datos/tabla-datos.tipos";
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

// Columnas propias de esta pantalla. La tabla genérica solo las renderiza;
// el QUÉ mostrar y CÓMO se decide acá.
const COLUMNAS: ColumnaTabla<SolicitudClienteResumen>[] = [
  {
    id: "codigo",
    encabezado: "Codigo",
    ancho: "w-[8%]",
    celda: (item) => (
      <span className="text-sm font-medium tabular-nums">
        {item.codigoSolicitud ?? "—"}
      </span>
    ),
  },
  {
    id: "solicitante",
    encabezado: "Solicitante",
    ancho: "w-[16%]",
    celda: (item) => (
      <>
        <span className="block truncate text-sm font-medium">
          {item.nombreSolicitante}
        </span>
        {item.contactoSolicitante ? (
          <span className="block truncate text-xs text-muted-foreground">
            {item.contactoSolicitante.nombre}
          </span>
        ) : null}
      </>
    ),
  },
  {
    id: "origen",
    encabezado: "Origen",
    ancho: "w-[7%]",
    celda: (item) => (
      <span className="text-sm">
        {item.origenTipo === "PROSPECTO" ? "Prospecto" : "Cliente"}
      </span>
    ),
  },
  {
    id: "descripcion",
    encabezado: "Descripcion del servicio",
    ancho: "w-[15%]",
    className: "truncate text-sm text-muted-foreground",
    celda: (item) => item.descripcionServicio,
  },
  {
    id: "registradoPor",
    encabezado: "Registrada por",
    ancho: "w-[13%]",
    celda: (item) => (
      <span className="block truncate text-sm">
        {item.registradoPor?.nombre ?? "—"}
      </span>
    ),
  },
  {
    id: "cotizaciones",
    encabezado: "Cotiz.",
    ancho: "w-[8%]",
    alineacion: "centro",
    className: "whitespace-nowrap",
    celda: (item) => (
      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums">
        {item.totalCotizaciones}
      </span>
    ),
  },
  {
    // "Cotizada por": ejecutivo de la cotizacion viva. Sin cotizacion viva la
    // SC vuelve al pool → "Disponible".
    id: "cotizadaPor",
    encabezado: "Cotizada por",
    ancho: "w-[13%]",
    celda: (item) =>
      item.cotizacionVigente == null ? (
        <Badge variant="outline">Disponible</Badge>
      ) : (
        <span className="block truncate text-sm">
          {item.cotizacionVigente.ejecutivo.nombre}
        </span>
      ),
  },
  {
    id: "estado",
    encabezado: "Estado",
    ancho: "w-[10%]",
    celda: (item) => <EstadoSolicitudBadge estado={item.estado} />,
  },
];

// Acciones del menú `⋯`. Adaptativas según el estado de la solicitud:
//  - hay cotizacion viva  → "Ver cotizacion" (deep-link directo)
//  - no hay viva y se puede cotizar → "Cotizar"
//  - "Ver detalle" (el expediente) queda SIEMPRE disponible.
function accionesSolicitud(
  item: SolicitudClienteResumen
): AccionTabla<SolicitudClienteResumen>[] {
  const vigente = item.cotizacionVigente;
  const puedeCotizar = accionesPermitidasSC(item.estado).agregarCotizacion;

  return [
    {
      etiqueta: "Ver cotizacion",
      icono: FileText,
      href: () => `/comercial/cotizaciones/${vigente?.id}`,
      oculta: () => vigente == null,
    },
    {
      etiqueta: "Cotizar",
      icono: FilePlusCorner,
      href: () => `/comercial/solicitudes-cliente/${item.id}/cotizar`,
      oculta: () => !(vigente == null && puedeCotizar),
    },
    {
      etiqueta: "Ver detalle",
      icono: Eye,
      href: () => `/comercial/solicitudes-cliente/${item.id}`,
    },
  ];
}

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

        <TablaDatos
          columnas={COLUMNAS}
          datos={items}
          obtenerId={(item) => item.id}
          acciones={accionesSolicitud}
          paginacion={{ pagina, porPagina, total, alCambiarPagina: irAPagina }}
          vacioTitulo={hayFiltros ? "Sin coincidencias" : "Sin solicitudes"}
          vacioDescripcion={
            hayFiltros
              ? "No se encontraron solicitudes con los filtros aplicados. Intenta ampliar la busqueda."
              : "No hay solicitudes de cliente registradas."
          }
        />
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
