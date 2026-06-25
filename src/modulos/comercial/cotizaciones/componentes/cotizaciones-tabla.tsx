"use client";

import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { Eye, RefreshCw, Search } from "lucide-react";

import { TablaDatos } from "@/compartido/componentes/tabla-datos/tabla-datos";
import type {
  AccionTabla,
  ColumnaTabla,
} from "@/compartido/componentes/tabla-datos/tabla-datos.tipos";
import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import { Input } from "@/compartido/componentes/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select";
import { cn } from "@/compartido/utilidades";

import { formatearMonto } from "../servicios/cotizaciones-formato";
import type {
  CotizacionResumen,
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

const ETIQUETA_ORIGEN: Record<OrigenTipo, string> = {
  PROSPECTO: "Prospecto",
  CLIENTE: "Cliente",
};

const COLUMNAS: ColumnaTabla<CotizacionResumen>[] = [
  {
    id: "codigo",
    encabezado: "Codigo",
    ancho: "w-[12%]",
    celda: (cotizacion) =>
      cotizacion.codigoCotizacion ? (
        <span className="text-sm tabular-nums">
          {cotizacion.codigoCotizacion}
        </span>
      ) : null,
  },
  {
    id: "empresa",
    encabezado: "Empresa solicitante",
    ancho: "w-[17%]",
    principal: true,
    className: "truncate",
    celda: (cotizacion) => cotizacion.origenNombre,
  },
  {
    id: "tipo",
    encabezado: "Tipo",
    ancho: "w-[8%]",
    celda: (cotizacion) => ETIQUETA_ORIGEN[cotizacion.origenTipo],
  },
  {
    id: "ejecutivo",
    encabezado: "Cotizado por",
    ancho: "w-[14%]",
    className: "truncate",
    celda: (cotizacion) => cotizacion.ejecutivoResponsable.nombre,
  },
  {
    id: "vencimiento",
    encabezado: "Vencimiento",
    ancho: "w-[12%]",
    className: "truncate",
    celda: (cotizacion) =>
      cotizacion.fechaVencimiento ? (
        formatearFecha(cotizacion.fechaVencimiento)
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    id: "version",
    encabezado: "Version",
    ancho: "w-[8%]",
    celda: (cotizacion) => (
      <Badge variant="outline" className="tabular-nums">
        v{cotizacion.versionVigente ?? "—"}
        {cotizacion.totalVersiones > 1 ? `/${cotizacion.totalVersiones}` : ""}
      </Badge>
    ),
  },
  {
    id: "monto",
    encabezado: "Monto",
    ancho: "w-[13%]",
    alineacion: "derecha",
    className: "tabular-nums text-foreground",
    celda: (cotizacion) =>
      formatearMonto(cotizacion.montoTotal, cotizacion.moneda),
  },
  {
    id: "estado",
    encabezado: "Estado",
    ancho: "w-[11%]",
    celda: (cotizacion) => <EstadoCotizacionBadge estado={cotizacion.estado} />,
  },
];

function accionesCotizacion(
  cotizacion: CotizacionResumen
): AccionTabla<CotizacionResumen>[] {
  return [
    {
      etiqueta: "Ver detalle",
      icono: Eye,
      href: () => `/comercial/cotizaciones/${cotizacion.id}`,
    },
  ];
}

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
            placeholder="Buscar cotizaciones..."
            value={busquedaLocal}
            onChange={(e) => setBusquedaLocal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && aplicarFiltros()}
          />
        </div>
      </div>
      <FiltroSelect
        className="min-w-36"
        label="Estado"
        value={estadoLocal}
        valores={ESTADOS_COTIZACION.map((e) => e.valor)}
        etiquetas={ESTADOS_COTIZACION.map((e) => e.etiqueta)}
        onChange={setEstadoLocal}
      />
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
    </div>
  );

  return (
    <TablaDatos
      columnas={COLUMNAS}
      datos={cotizaciones}
      obtenerId={(cotizacion) => cotizacion.id}
      acciones={accionesCotizacion}
      barraHerramientas={barraHerramientas}
      paginacion={{ pagina, porPagina, total, alCambiarPagina: irAPagina }}
      vacioTitulo="Sin cotizaciones"
      vacioDescripcion="No se encontraron cotizaciones con los filtros aplicados."
    />
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
