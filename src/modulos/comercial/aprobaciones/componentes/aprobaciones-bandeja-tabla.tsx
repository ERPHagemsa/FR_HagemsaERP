"use client";

import { usePathname, useRouter } from "next/navigation";
import { Eye } from "lucide-react";

import { TablaDatos } from "@/compartido/componentes/tabla-datos/tabla-datos";
import type { AccionTabla, ColumnaTabla } from "@/compartido/componentes/tabla-datos/tabla-datos.tipos";

import type { ItemBandejaAprobacion } from "../tipos/aprobaciones.tipos";
import { DialogoResolverSolicitud } from "./dialogo-resolver-solicitud";

type Props = {
  items: ItemBandejaAprobacion[];
  pagina: number;
  porPagina: number;
  total: number;
};

const COLUMNAS: ColumnaTabla<ItemBandejaAprobacion>[] = [
  {
    id: "numero",
    encabezado: "N°/Año",
    ancho: "w-[12%]",
    celda: (item) => formatearNumero(item),
  },
  {
    id: "version",
    encabezado: "Versión",
    ancho: "w-[10%]",
    celda: (item) => `v${item.numeroVersion}`,
  },
  {
    id: "ejecutivo",
    encabezado: "Ejecutivo responsable",
    ancho: "w-[26%]",
    principal: true,
    className: "truncate",
    celda: (item) => item.nombreEjecutivoResponsable,
  },
  {
    id: "fechaCreacion",
    encabezado: "Fecha solicitud",
    ancho: "w-[18%]",
    celda: (item) => formatearFechaHora(item.fechaCreacion),
  },
  {
    id: "validezDias",
    encabezado: "Validez",
    ancho: "w-[12%]",
    celda: (item) => `${item.validezDias} días`,
  },
  {
    id: "usuarioCreacion",
    encabezado: "Solicitado por",
    ancho: "w-[15%]",
    className: "truncate",
    celda: (item) => item.usuarioCreacion,
  },
  {
    id: "resolver",
    encabezado: "Resolver",
    ancho: "w-[17%]",
    celda: (item) => <AccionesSolicitudPendiente idSolicitud={item.id} />,
  },
];

export function AprobacionesBandejaTabla({ items, pagina, porPagina, total }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function irAPagina(nuevaPagina: number) {
    const params = new URLSearchParams();
    params.set("pagina", String(nuevaPagina));
    params.set("porPagina", String(porPagina));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <TablaDatos
      columnas={COLUMNAS}
      datos={items}
      obtenerId={(item) => item.id}
      acciones={accionesSolicitud}
      paginacion={{ pagina, porPagina, total, alCambiarPagina: irAPagina }}
      vacioTitulo="Sin solicitudes pendientes"
      vacioDescripcion="No hay cotizaciones esperando aprobación."
    />
  );
}

function accionesSolicitud(item: ItemBandejaAprobacion): AccionTabla<ItemBandejaAprobacion>[] {
  return [
    { etiqueta: "Ver detalle", icono: Eye, href: () => `/comercial/cotizaciones/${item.idCotizacion}` },
  ];
}

export function AccionesSolicitudPendiente({ idSolicitud }: { idSolicitud: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <DialogoResolverSolicitud idSolicitud={idSolicitud} accion="aprobar" />
      <DialogoResolverSolicitud idSolicitud={idSolicitud} accion="rechazar" />
      <DialogoResolverSolicitud idSolicitud={idSolicitud} accion="observar" />
    </div>
  );
}

function formatearNumero(item: ItemBandejaAprobacion) {
  if (item.numeroCotizacion === null || item.anioCotizacion === null) return "Sin numerar";
  return `${item.numeroCotizacion}/${item.anioCotizacion}`;
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
