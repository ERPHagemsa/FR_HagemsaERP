"use client";

import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { Eye, FilePlusCorner, FileText, Plus, RefreshCw, Search } from "lucide-react";

import { TablaDatos } from "@/compartido/componentes/tabla-datos/tabla-datos";
import type {
  AccionTabla,
  ColumnaTabla,
} from "@/compartido/componentes/tabla-datos/tabla-datos.tipos";
import { Button } from "@/compartido/componentes/ui/button";
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
  BucketSolicitudCliente,
  FiltrosSolicitudesCliente,
  SolicitudClienteResumen,
  TipoOrigen,
} from "../tipos/solicitud-cliente.tipos";
import { EstadoSolicitudBadge } from "./estado-solicitud-badge";
import { SolicitudesClienteKpis } from "./solicitudes-cliente-kpis";
import { SolicitudClienteNuevaSheet } from "./solicitud-cliente-nueva-sheet";

type Props = {
  items: SolicitudClienteResumen[];
  filtros: FiltrosSolicitudesCliente;
  total: number;
};

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
      <span className="text-sm tabular-nums">
        {item.codigoSolicitud ?? "—"}
      </span>
    ),
  },
  {
    id: "solicitante",
    encabezado: "Empresa solicitante",
    ancho: "w-[16%]",
    principal: true,
    celda: (item) => (
      <span className="block truncate">
        {item.nombreSolicitante}
      </span>
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
    className: "truncate",
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
    encabezado: "N° cotiz.",
    ancho: "w-[8%]",
    alineacion: "derecha",
    className: "whitespace-nowrap",
    celda: (item) => (
      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums">
        {item.totalCotizaciones}
      </span>
    ),
  },
  {
    // "Cotizada por": ejecutivo de la cotizacion viva. Sin cotizacion viva la SC
    // vuelve al pool; el matiz se alinea con los buckets de KPI:
    //   PENDIENTE      → "Disponible"   (ingreso fresco, ambar)
    //   EN_COTIZACION  → "Sin respuesta" (se cotizó y cayó, rosa — necesita rescate)
    id: "cotizadaPor",
    encabezado: "Cotizada por",
    ancho: "w-[13%]",
    celda: (item) => {
      if (item.cotizacionVigente != null) {
        return (
          <span className="block truncate text-sm">
            {item.cotizacionVigente.ejecutivo.nombre}
          </span>
        );
      }
      const sinRespuesta = item.estado === "EN_COTIZACION";
      return (
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <span
            className={cn(
              "size-2 rounded-full",
              sinRespuesta ? "bg-rose-500" : "bg-amber-500"
            )}
            aria-hidden
          />
          {sinRespuesta ? "Sin respuesta" : "Disponible"}
        </span>
      );
    },
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

  // KPI clicable → fija el bucket (o lo limpia) y vuelve a la pagina 1.
  // Preserva los filtros de contexto YA aplicados (origen/busqueda), no el
  // input local sin confirmar.
  function seleccionarBucket(bucket: BucketSolicitudCliente | null) {
    router.push(
      construirUrl({
        bucket: bucket ?? undefined,
        origenTipo: filtros.origenTipo,
        busqueda: filtros.busqueda,
        pagina: 1,
        porPagina: filtros.porPagina,
      })
    );
  }

  function aplicarFiltros() {
    router.push(
      construirUrl({
        bucket: filtros.bucket,
        origenTipo: origenLocal,
        busqueda: busquedaLocal,
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
        bucket: filtros.bucket,
        origenTipo: filtros.origenTipo,
        busqueda: filtros.busqueda,
        pagina: nuevaPagina,
        porPagina: filtros.porPagina,
      })
    );
  }

  const hayFiltros =
    !!filtros.bucket || !!filtros.origenTipo || !!filtros.busqueda;

  const barraHerramientas = (
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
        className="min-w-36"
        label="Origen"
        value={origenLocal}
        valores={ORIGENES.map((o) => o.valor)}
        etiquetas={ORIGENES.map((o) => o.etiqueta)}
        onChange={setOrigenLocal}
      />
      <Button type="button" onClick={aplicarFiltros}>
        Buscar
      </Button>
      {hayFiltros ? (
        <Button type="button" variant="outline" onClick={limpiarFiltros}>
          <RefreshCw data-icon="inline-start" />
          Limpiar
        </Button>
      ) : null}
      <Button className="ml-auto" onClick={() => setCrearAbierto(true)}>
        <Plus data-icon="inline-start" />
        Nueva solicitud
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <SolicitudesClienteKpis filtros={filtros} onSeleccionar={seleccionarBucket} />

      <TablaDatos
        columnas={COLUMNAS}
        datos={items}
        obtenerId={(item) => item.id}
        acciones={accionesSolicitud}
        barraHerramientas={barraHerramientas}
        paginacion={{ pagina, porPagina, total, alCambiarPagina: irAPagina }}
        vacioTitulo={hayFiltros ? "Sin coincidencias" : "Sin solicitudes"}
        vacioDescripcion={
          hayFiltros
            ? "No se encontraron solicitudes con los filtros aplicados. Intenta ampliar la busqueda."
            : "No hay solicitudes de cliente registradas."
        }
      />

      <SolicitudClienteNuevaSheet
        abierto={crearAbierto}
        onCerrar={() => setCrearAbierto(false)}
        onCreado={() => {
          // La invalidacion del listado la hace useRegistrarSCMutation en su onSuccess.
          toast.success("Solicitud registrada");
        }}
      />
    </div>
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
