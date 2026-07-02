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
import { useEjecutivosCotizacionesQuery } from "../servicios/cotizaciones-queries";
import type {
  BucketCotizacion,
  CotizacionResumen,
  FiltrosCotizaciones,
  OrigenTipo,
} from "../tipos/cotizaciones.tipos";
import { CotizacionesKpis } from "./cotizaciones-kpis";
import { EstadoCotizacionBadge } from "./estado-cotizacion-badge";

type Props = {
  items: CotizacionResumen[];
  filtros: FiltrosCotizaciones;
  total: number;
};

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

export function CotizacionesTabla({ items, filtros, total }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const pagina = filtros.pagina ?? 1;
  const porPagina = filtros.porPagina ?? 10;

  const [busquedaLocal, setBusquedaLocal] = React.useState(filtros.busqueda ?? "");
  const [origenLocal, setOrigenLocal] = React.useState(filtros.origenTipo ?? "TODOS");
  const [ejecutivoLocal, setEjecutivoLocal] = React.useState(
    filtros.idEjecutivoResponsable ?? "TODOS"
  );

  const { data: ejecutivos } = useEjecutivosCotizacionesQuery();

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
  // Preserva los filtros de contexto YA aplicados (origen/busqueda/ejecutivo),
  // no los inputs locales sin confirmar.
  function seleccionarBucket(bucket: BucketCotizacion | null) {
    router.push(
      construirUrl({
        bucket: bucket ?? undefined,
        origenTipo: filtros.origenTipo,
        busqueda: filtros.busqueda,
        idEjecutivoResponsable: filtros.idEjecutivoResponsable,
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
        idEjecutivoResponsable: ejecutivoLocal,
        pagina: 1,
        porPagina: filtros.porPagina,
      })
    );
  }

  function limpiarFiltros() {
    setBusquedaLocal("");
    setOrigenLocal("TODOS");
    setEjecutivoLocal("TODOS");
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
    !!filtros.bucket ||
    !!filtros.origenTipo ||
    !!filtros.busqueda ||
    !!filtros.idEjecutivoResponsable;

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
        label="Origen"
        value={origenLocal}
        valores={ORIGENES.map((o) => o.valor)}
        etiquetas={ORIGENES.map((o) => o.etiqueta)}
        onChange={setOrigenLocal}
      />
      <FiltroSelect
        className="min-w-48"
        label="Ejecutivo responsable"
        value={ejecutivoLocal}
        valores={["TODOS", ...(ejecutivos ?? []).map((e) => e.id)]}
        etiquetas={["Todos", ...(ejecutivos ?? []).map((e) => e.nombre)]}
        onChange={setEjecutivoLocal}
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
    <div className="flex flex-col gap-4">
      <CotizacionesKpis filtros={filtros} onSeleccionar={seleccionarBucket} />

      <TablaDatos
        columnas={COLUMNAS}
        datos={items}
        obtenerId={(cotizacion) => cotizacion.id}
        acciones={accionesCotizacion}
        barraHerramientas={barraHerramientas}
        paginacion={{ pagina, porPagina, total, alCambiarPagina: irAPagina }}
        vacioTitulo={hayFiltros ? "Sin coincidencias" : "Sin cotizaciones"}
        vacioDescripcion={
          hayFiltros
            ? "No se encontraron cotizaciones con los filtros aplicados. Intenta ampliar la busqueda."
            : "No hay cotizaciones registradas."
        }
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

function formatearFecha(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}
