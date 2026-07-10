"use client";

import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { CircleCheck, CircleX, Eye, RefreshCw, Search } from "lucide-react";

import { TablaDatos } from "@/compartido/componentes/tabla-datos/tabla-datos";
import type {
  AccionTabla,
  ColumnaTabla,
} from "@/compartido/componentes/tabla-datos/tabla-datos.tipos";
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

import { useAprobadoresQuery } from "../servicios/aprobaciones-queries";
import {
  ESTADO_POR_BUCKET,
  type BucketAprobacion,
  type FiltrosAprobaciones,
  type ItemAprobacion,
} from "../tipos/aprobaciones.tipos";
import { AprobacionesKpis } from "./aprobaciones-kpis";
import { DialogoResolverSolicitud, type AccionResolver } from "./dialogo-resolver-solicitud";
import { SolicitudEstadoBadge } from "./solicitud-estado-badge";

type Props = {
  items: ItemAprobacion[];
  filtros: FiltrosAprobaciones;
  total: number;
};

/** Solicitud elegida en el menu `⋯` y accion a resolver sobre ella. */
type Resolucion = { idSolicitud: string; accion: AccionResolver };

const SIN_DATO = <span className="text-muted-foreground">—</span>;

const COLUMNAS: ColumnaTabla<ItemAprobacion>[] = [
  {
    id: "codigo",
    encabezado: "Código",
    ancho: "w-[15%]",
    // El backend ya lo formatea con la version que se envio a aprobar. No se
    // reconstruye a partir de numeroCotizacion/anioCotizacion.
    celda: (item) =>
      item.codigoCotizacion ? (
        <span className="text-sm tabular-nums">{item.codigoCotizacion}</span>
      ) : (
        <span className="text-muted-foreground">Sin numerar</span>
      ),
  },
  {
    id: "version",
    encabezado: "Versión",
    ancho: "w-[8%]",
    celda: (item) => <span className="tabular-nums">v{item.numeroVersion}</span>,
  },
  {
    id: "estado",
    encabezado: "Estado",
    ancho: "w-[12%]",
    celda: (item) => <SolicitudEstadoBadge estado={item.estado} />,
  },
  {
    id: "ejecutivo",
    encabezado: "Ejecutivo responsable",
    ancho: "w-[15%]",
    principal: true,
    className: "truncate",
    celda: (item) => item.nombreEjecutivoResponsable,
  },
  {
    id: "enviadoPor",
    encabezado: "Enviado por",
    ancho: "w-[14%]",
    className: "truncate",
    celda: (item) => item.nombreUsuarioCreacion,
  },
  {
    id: "fechaCreacion",
    encabezado: "Fecha solicitud",
    ancho: "w-[15%]",
    celda: (item) => formatearFechaHora(item.fechaCreacion),
  },
  {
    id: "aprobadoPor",
    encabezado: "Resuelto por",
    ancho: "w-[13%]",
    className: "truncate",
    // `nombreUsuarioResolucion` es null mientras la solicitud sigue EN_APROBACION.
    celda: (item) =>
      item.nombreUsuarioResolucion ? (
        <div className="flex flex-col">
          <span>{item.nombreUsuarioResolucion}</span>
          {item.fechaResolucion ? (
            <span className="text-xs text-muted-foreground">
              {formatearFechaHora(item.fechaResolucion)}
            </span>
          ) : null}
        </div>
      ) : (
        SIN_DATO
      ),
  },
];

export function AprobacionesTabla({ items, filtros, total }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const pagina = filtros.pagina ?? 1;
  const porPagina = filtros.porPagina ?? 10;

  const [resolucion, setResolucion] = React.useState<Resolucion | null>(null);
  const [aprobadorLocal, setAprobadorLocal] = React.useState(
    filtros.usuarioResolucion ?? "TODOS"
  );
  const [numeroLocal, setNumeroLocal] = React.useState(
    filtros.numeroCotizacion ? String(filtros.numeroCotizacion) : ""
  );

  const { data: aprobadores } = useAprobadoresQuery();

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

  // KPI clicable → fija el estado (o lo limpia) y vuelve a la pagina 1.
  // Preserva los filtros de contexto YA aplicados, no los inputs locales sin confirmar.
  function seleccionarBucket(bucket: BucketAprobacion | null) {
    router.push(
      construirUrl({
        estado: bucket ? ESTADO_POR_BUCKET[bucket] : undefined,
        usuarioResolucion: filtros.usuarioResolucion,
        numeroCotizacion: filtros.numeroCotizacion,
        pagina: 1,
        porPagina: filtros.porPagina,
      })
    );
  }

  function aplicarFiltros() {
    router.push(
      construirUrl({
        estado: filtros.estado,
        usuarioResolucion: aprobadorLocal,
        numeroCotizacion: numeroLocal,
        pagina: 1,
        porPagina: filtros.porPagina,
      })
    );
  }

  function limpiarFiltros() {
    setAprobadorLocal("TODOS");
    setNumeroLocal("");
    router.push(pathname);
  }

  function irAPagina(nuevaPagina: number) {
    router.push(
      construirUrl({
        estado: filtros.estado,
        usuarioResolucion: filtros.usuarioResolucion,
        numeroCotizacion: filtros.numeroCotizacion,
        pagina: nuevaPagina,
        porPagina: filtros.porPagina,
      })
    );
  }

  function accionesAprobacion(item: ItemAprobacion): AccionTabla<ItemAprobacion>[] {
    // Solo una solicitud EN_APROBACION se puede resolver: las terminales son
    // registro historico. `oculta` las saca del menu en vez de dejarlas fallar
    // con un 422 del backend.
    const pendiente = (fila: ItemAprobacion) => fila.estado !== "EN_APROBACION";

    return [
      {
        etiqueta: "Ver detalle",
        icono: Eye,
        href: () => `/comercial/cotizaciones/${item.idCotizacion}`,
      },
      {
        etiqueta: "Aprobar",
        icono: CircleCheck,
        oculta: pendiente,
        alSeleccionar: () => setResolucion({ idSolicitud: item.id, accion: "aprobar" }),
      },
      {
        etiqueta: "Rechazar",
        icono: CircleX,
        destructiva: true,
        oculta: pendiente,
        alSeleccionar: () => setResolucion({ idSolicitud: item.id, accion: "rechazar" }),
      },
    ];
  }

  const hayFiltros =
    !!filtros.estado || !!filtros.usuarioResolucion || !!filtros.numeroCotizacion;

  const barraHerramientas = (
    <div className="flex flex-wrap items-end gap-3">
      <div className="grid min-w-48 gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">N° de cotización</span>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            inputMode="numeric"
            placeholder="Ej. 42"
            value={numeroLocal}
            onChange={(e) => setNumeroLocal(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && aplicarFiltros()}
          />
        </div>
      </div>
      <FiltroSelect
        className="min-w-48"
        label="Resuelto por"
        value={aprobadorLocal}
        valores={["TODOS", ...(aprobadores ?? []).map((a) => a.id)]}
        etiquetas={["Todos", ...(aprobadores ?? []).map((a) => a.nombre)]}
        onChange={setAprobadorLocal}
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
      <AprobacionesKpis filtros={filtros} onSeleccionar={seleccionarBucket} />

      <TablaDatos
        columnas={COLUMNAS}
        datos={items}
        obtenerId={(item) => item.id}
        acciones={accionesAprobacion}
        barraHerramientas={barraHerramientas}
        paginacion={{ pagina, porPagina, total, alCambiarPagina: irAPagina }}
        vacioTitulo={hayFiltros ? "Sin coincidencias" : "Sin solicitudes"}
        vacioDescripcion={
          hayFiltros
            ? "No se encontraron solicitudes con los filtros aplicados."
            : "Todavía no hay solicitudes de aprobación."
        }
      />

      {/* Un unico dialogo para toda la tabla, montado solo cuando hay una accion
          elegida. El `key` lo remonta al cambiar de solicitud o de accion, asi el
          formulario nace limpio y no arrastra texto ni errores del intento previo. */}
      {resolucion ? (
        <DialogoResolverSolicitud
          key={`${resolucion.idSolicitud}-${resolucion.accion}`}
          idSolicitud={resolucion.idSolicitud}
          accion={resolucion.accion}
          abierto
          onAbiertoChange={(abierto) => {
            if (!abierto) setResolucion(null);
          }}
        />
      ) : null}
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

function formatearFechaHora(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
