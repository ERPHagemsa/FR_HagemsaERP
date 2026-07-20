"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { extraerMensajeError } from "@/compartido/api/formato-error";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/compartido/componentes/ui/alert";
import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import { Input } from "@/compartido/componentes/ui/input";
import { TablaDatos } from "@/compartido/componentes/tabla-datos/tabla-datos";
import type { ColumnaTabla } from "@/compartido/componentes/tabla-datos/tabla-datos.tipos";

import { PaginaListado } from "../../componentes/pagina-listado";
import {
  etiquetaTipoUbicacion,
  jerarquiaUbicacion,
} from "../componentes/autocomplete-ubicacion";
import { useUbicacionesQuery } from "../servicios/ubicaciones-queries";
import type { Ubicacion } from "../tipos/ubicaciones.tipos";

// Maestra local de ubicaciones (réplica confirmada de BC-14): solo lectura. El
// alta/edición es responsabilidad de BC-14; acá se consultan y buscan.
const COLUMNAS: ColumnaTabla<Ubicacion>[] = [
  {
    id: "nombre",
    encabezado: "Nombre",
    ancho: "w-[22%]",
    principal: true,
    celda: (u) => <span className="truncate">{u.nombre}</span>,
  },
  {
    id: "tipo",
    encabezado: "Tipo",
    ancho: "w-[12%]",
    celda: (u) => (
      <Badge variant="secondary" className="font-normal">
        {etiquetaTipoUbicacion(u.tipoUbicacion)}
      </Badge>
    ),
  },
  {
    id: "direccion",
    encabezado: "Dirección",
    ancho: "w-[26%]",
    className: "truncate",
    celda: (u) => u.direccion || "—",
  },
  {
    id: "geo",
    encabezado: "Distrito · Provincia · Departamento",
    ancho: "w-[24%]",
    className: "truncate",
    celda: (u) => jerarquiaUbicacion(u) || "—",
  },
  {
    id: "pais",
    encabezado: "País",
    ancho: "w-[8%]",
    className: "truncate",
    celda: (u) => u.pais || "—",
  },
  {
    id: "bc14",
    encabezado: "Cód. BC-14",
    ancho: "w-[8%]",
    alineacion: "derecha",
    className: "tabular-nums text-foreground",
    celda: (u) => String(u.idUbicacionBc14),
  },
];

export function UbicacionesVista({
  busquedaInicial,
}: {
  busquedaInicial?: string;
}) {
  const [busqueda, setBusqueda] = React.useState(busquedaInicial ?? "");
  const [aplicada, setAplicada] = React.useState(busquedaInicial ?? "");
  const consulta = useUbicacionesQuery(aplicada);
  const filas = consulta.data ?? [];

  function aplicar() {
    setAplicada(busqueda.trim());
  }

  return (
    <PaginaListado>
      <div className="flex flex-col gap-4">
        {consulta.error ? (
          <Alert variant="destructive">
            <AlertTitle>No se pudieron cargar las ubicaciones</AlertTitle>
            <AlertDescription>
              {extraerMensajeError(consulta.error)}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap items-end gap-3">
          <div className="grid min-w-64 flex-1 gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Búsqueda
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar por nombre, dirección, distrito, provincia o departamento…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && aplicar()}
              />
            </div>
          </div>
          <Button type="button" onClick={aplicar}>
            Buscar
          </Button>
        </div>

        <TablaDatos
          columnas={COLUMNAS}
          datos={filas}
          obtenerId={(u) => u.id}
          cargando={consulta.isLoading}
          vacioTitulo="Sin ubicaciones"
          vacioDescripcion="El maestro local aún no tiene ubicaciones confirmadas por BC-14."
        />
      </div>
    </PaginaListado>
  );
}
