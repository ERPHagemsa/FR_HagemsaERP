"use client";

import Link from "next/link";
import * as React from "react";
import {
  CheckCircle2,
  CircleDashed,
  CircleX,
  Clock,
  Eye,
  Loader2,
  MoreVertical,
  Search,
  TrendingUp,
  Truck,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/compartido/componentes/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/compartido/componentes/ui/empty";
import { Field } from "@/compartido/componentes/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/compartido/componentes/ui/input-group";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/compartido/componentes/ui/pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table";
import { cn } from "@/compartido/utilidades/utils";
import type { VehiculoFlota } from "../tipos/flota.tipos";
import {
  asignacionesVehiculo,
  carroceriaVehiculo,
  estadoActivoVehiculo,
  estadoOperativoVehiculo,
  estadoRegistroVehiculo,
  formatear,
  marcaVehiculo,
  modeloVehiculo,
  placaVehiculo,
  textoBusquedaVehiculo,
} from "./flota-normalizadores";

type Props = {
  loading: boolean;
  vehiculos: VehiculoFlota[];
};

type FiltrosFlota = {
  busqueda: string;
  estadoActivo: string;
  estadoRegistro: string;
  estadoOperativo: string;
};

const filtrosIniciales: FiltrosFlota = {
  busqueda: "",
  estadoActivo: "TODOS",
  estadoRegistro: "ACTIVO",
  estadoOperativo: "TODOS",
};

export function FlotaTabla({ loading, vehiculos }: Props) {
  const [filtrosFormulario, setFiltrosFormulario] =
    React.useState<FiltrosFlota>(filtrosIniciales);
  const [filtrosAplicados, setFiltrosAplicados] =
    React.useState<FiltrosFlota>(filtrosIniciales);
  const [pagina, setPagina] = React.useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = React.useState(20);

  const resumenConteo = React.useMemo(() => ({
    total: vehiculos.length,
    conContrato: vehiculos.filter((v) => asignacionesVehiculo(v).length > 0).length,
    sinContrato: vehiculos.filter((v) => asignacionesVehiculo(v).length === 0).length,
    enMantenimiento: vehiculos.filter(
      (v) => estadoOperativoVehiculo(v) === "MANTENIMIENTO",
    ).length,
  }), [vehiculos]);

  function coincideEstadoActivo(estado: string | null, filtro: string) {
    if (filtro === "TODOS") return true;
    if (filtro === "BAJA") return estado !== "ACTIVO";
    return estado === filtro;
  }

  const filtrados = React.useMemo(() => {
    const normalizedQuery = filtrosAplicados.busqueda.trim().toUpperCase();

    return vehiculos.filter((vehiculo) => {
      const coincideTexto = textoBusquedaVehiculo(vehiculo).includes(normalizedQuery);

      return (
        coincideTexto &&
        coincideEstadoActivo(estadoActivoVehiculo(vehiculo), filtrosAplicados.estadoActivo) &&
        (filtrosAplicados.estadoRegistro === "TODOS" ||
          estadoRegistroVehiculo(vehiculo) === filtrosAplicados.estadoRegistro) &&
        (filtrosAplicados.estadoOperativo === "TODOS" ||
          estadoOperativoVehiculo(vehiculo) === filtrosAplicados.estadoOperativo)
      );
    });
  }, [filtrosAplicados, vehiculos]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / registrosPorPagina));
  const inicioPagina = (pagina - 1) * registrosPorPagina;
  const finPagina = inicioPagina + registrosPorPagina;
  const visibles = filtrados.slice(inicioPagina, finPagina);
  const desdeVisible = filtrados.length ? inicioPagina + 1 : 0;
  const hastaVisible = Math.min(finPagina, filtrados.length);

  function actualizarFiltro<K extends keyof FiltrosFlota>(
    key: K,
    value: FiltrosFlota[K],
  ) {
    setFiltrosFormulario((actual) => ({
      ...actual,
      [key]: value,
    }));
  }

  function aplicarFiltros() {
    setPagina(1);
    setFiltrosAplicados(filtrosFormulario);
  }

  function limpiarBusqueda() {
    setPagina(1);
    setFiltrosFormulario(filtrosIniciales);
    setFiltrosAplicados(filtrosIniciales);
  }

  function actualizarRegistrosPorPagina(value: number) {
    setRegistrosPorPagina(value);
    setPagina(1);
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card text-card-foreground">
        <div className="flex flex-col gap-1 border-b border-border px-5 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-base font-semibold">Consulta de unidades</h2>
              <p className="text-sm leading-5 text-muted-foreground">
                Filtra y revisa las unidades disponibles en la flota.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-b border-border bg-muted/20 px-4 py-4">
          <form
            className="flex flex-col gap-2 lg:flex-row lg:items-center"
            onSubmit={(event) => {
              event.preventDefault();
              aplicarFiltros();
            }}
          >
            <Field className="lg:w-80">
              <InputGroup>
                <InputGroupAddon>
                  <Search />
                </InputGroupAddon>
                <InputGroupInput
                  value={filtrosFormulario.busqueda}
                  placeholder="Buscar por placa, modelo, contrato..."
                  onChange={(event) => actualizarFiltro("busqueda", event.target.value)}
                />
              </InputGroup>
            </Field>
            <Field className="lg:w-40">
              <Select
                value={filtrosFormulario.estadoActivo}
                onValueChange={(value) => actualizarFiltro("estadoActivo", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="TODOS">Estado: todos</SelectItem>
                    <SelectItem value="ACTIVO">Activo</SelectItem>
                    <SelectItem value="BAJA">Baja</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field className="lg:w-44">
              <Select
                value={filtrosFormulario.estadoRegistro}
                onValueChange={(value) => actualizarFiltro("estadoRegistro", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Registro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="TODOS">Registro: todos</SelectItem>
                    <SelectItem value="ACTIVO">Registro: activos</SelectItem>
                    <SelectItem value="ANULADO">Registro: anulados</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field className="lg:w-48">
              <Select
                value={filtrosFormulario.estadoOperativo}
                onValueChange={(value) => actualizarFiltro("estadoOperativo", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Condicion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="TODOS">Condicion: todos</SelectItem>
                    <SelectItem value="OPERATIVO">Operativo</SelectItem>
                    <SelectItem value="MANTENIMIENTO">Mantenimiento</SelectItem>
                    <SelectItem value="NO_OPERATIVO">No operativo</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={loading}>
                {loading ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <Search data-icon="inline-start" />
                )}
                {loading ? "Consultando..." : "Aplicar"}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={limpiarBusqueda}>
                Limpiar
              </Button>
            </div>
          </form>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : visibles.length === 0 ? (
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyTitle>Sin unidades de flota</EmptyTitle>
              <EmptyDescription>
                No existen registros para el filtro aplicado.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-background hover:bg-transparent">
                  <TableHead className="w-10">Acciones</TableHead>
                  <TableHead className="text-right">#</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Cuenta</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead>Condicion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibles.map((vehiculo, index) => (
                  <TableRow key={vehiculo.id} className={obtenerClaseFila(vehiculo)}>
                    <TableCell>
                      <AccionesFlota vehiculo={vehiculo} />
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {inicioPagina + index + 1}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {placaVehiculo(vehiculo)}
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-48 flex-col">
                        <span className="font-medium">
                          {[marcaVehiculo(vehiculo), modeloVehiculo(vehiculo)]
                            .filter((item) => item && item !== "-")
                            .join(" ") || "Unidad sin detalle"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {carroceriaVehiculo(vehiculo)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <AsignacionesCelda vehiculo={vehiculo} campo="contrato" />
                    </TableCell>
                    <TableCell>
                      <AsignacionesCelda vehiculo={vehiculo} campo="cuenta" />
                    </TableCell>
                    <TableCell>
                      <EstadoActivoBadge value={estadoActivoVehiculo(vehiculo)} />
                    </TableCell>
                    <TableCell>
                      <EstadoActivoBadge value={estadoRegistroVehiculo(vehiculo)} />
                    </TableCell>
                    <TableCell>
                      <EstadoOperativoBadge value={estadoOperativoVehiculo(vehiculo)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {filtrados.length > 0 ? (
          <div className="flex flex-col gap-4 border-t border-border px-4 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-3 text-sm md:justify-start">
              <span className="text-muted-foreground">Registros por pagina:</span>
              <Select
                value={String(registrosPorPagina)}
                onValueChange={(value) => actualizarRegistrosPorPagina(Number(value))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-muted-foreground">
                Mostrando {desdeVisible} a {hastaVisible} de {filtrados.length} registros
              </span>
            </div>
            <Pagination className="md:mx-0 md:ml-auto md:w-auto md:justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => pagina > 1 && setPagina((actual) => actual - 1)}
                    className={pagina === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {generarNumerosPaginas(pagina, totalPaginas).map((pageNum, index) => (
                  <PaginationItem key={`${pageNum}-${index}`}>
                    {pageNum === "..." ? (
                      <span className="flex h-9 w-9 items-center justify-center text-muted-foreground">
                        ...
                      </span>
                    ) : (
                      <PaginationLink
                        onClick={() => setPagina(Number(pageNum))}
                        isActive={pageNum === pagina}
                        className={Number(pageNum) === pagina ? "" : "cursor-pointer"}
                        size="icon"
                      >
                        {pageNum}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      pagina < totalPaginas && setPagina((actual) => actual + 1)
                    }
                    className={
                      pagina === totalPaginas
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function AccionesFlota({ vehiculo }: { vehiculo: VehiculoFlota }) {
  const id = encodeURIComponent(vehiculo.id ?? "");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Acciones">
          <MoreVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={`/flota/unidades/${id}`}>
              <Eye data-icon="inline-start" />
              Ver
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/flota/unidades/${id}/auditoria`}>
              <TrendingUp data-icon="inline-start" />
              Auditar
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AsignacionesCelda({
  vehiculo,
  campo,
}: {
  vehiculo: VehiculoFlota;
  campo: "contrato" | "cuenta";
}) {
  const asignaciones = asignacionesVehiculo(vehiculo);

  if (asignaciones.length === 0) {
    return (
      <div className="flex min-w-44 flex-col">
        <span className="font-medium">-</span>
        <span className="text-xs text-muted-foreground">Sin detalle</span>
      </div>
    );
  }

  const primera = asignaciones[0][campo];
  const restantes = asignaciones.length - 1;

  return (
    <div className="flex min-w-44 flex-col">
      <div className="flex items-center gap-1.5">
        <span className="font-medium">{primera?.codigo || "-"}</span>
        {restantes > 0 ? (
          <Badge variant="outline" className="h-5 rounded-full px-1.5 text-[10px]">
            +{restantes}
          </Badge>
        ) : null}
      </div>
      <span className="text-xs text-muted-foreground">{primera?.nombre || "Sin detalle"}</span>
    </div>
  );
}

function EstadoActivoBadge({ value }: { value: string | null }) {
  const activo = value === "ACTIVO";

  return (
    <Badge
      variant="outline"
      className="h-6 gap-1.5 rounded-full border-border/70 bg-card px-2.5 text-[12px] font-medium text-foreground shadow-xs"
    >
      {activo ? (
        <CheckCircle2 data-icon="inline-start" className="text-emerald-600 dark:text-emerald-400" />
      ) : (
        <CircleDashed data-icon="inline-start" className="text-muted-foreground" />
      )}
      {activo ? "Activo" : formatearEstadoActivo(value)}
    </Badge>
  );
}

function formatearEstadoActivo(value?: string | null) {
  if (value === "INACTIVO" || value === "SINIESTRADO") return "Baja / De baja";
  return formatear(value);
}

function EstadoOperativoBadge({ value }: { value: string | null }) {
  if (value === "OPERATIVO") {
    return (
      <Badge
        variant="outline"
        className="h-6 gap-1.5 rounded-full border-border/70 bg-card px-2.5 text-[12px] font-medium text-foreground shadow-xs"
      >
        <CheckCircle2 data-icon="inline-start" className="text-emerald-600 dark:text-emerald-400" />
        Operativo
      </Badge>
    );
  }

  if (value === "MANTENIMIENTO") {
    return (
      <Badge
        variant="outline"
        className="h-6 gap-1.5 rounded-full border-amber-300/70 bg-amber-50 px-2.5 text-[12px] font-medium text-amber-700 shadow-xs dark:border-amber-800/70 dark:bg-amber-950/40 dark:text-amber-400"
      >
        <Clock data-icon="inline-start" className="text-amber-500 dark:text-amber-400" />
        Mantenimiento
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="h-6 gap-1.5 rounded-full border-destructive/30 bg-destructive/10 px-2.5 text-[12px] font-medium text-destructive shadow-xs"
    >
      <CircleX data-icon="inline-start" />
      {formatear(value)}
    </Badge>
  );
}


function obtenerClaseFila(vehiculo: VehiculoFlota) {
  const estadoActivo = estadoActivoVehiculo(vehiculo);
  const estadoOperativo = estadoOperativoVehiculo(vehiculo);
  const registro = estadoRegistroVehiculo(vehiculo);

  return cn(
    "border-border/80 hover:bg-transparent",
    estadoActivo === "BAJA" && "bg-muted/45 hover:bg-muted/45",
    registro === "ANULADO" &&
      "border-l-4 border-l-destructive bg-destructive/5 text-muted-foreground hover:bg-destructive/5",
    estadoOperativo === "MANTENIMIENTO" && "bg-amber-500/5 hover:bg-amber-500/5",
  );
}

function generarNumerosPaginas(paginaActual: number, totalPaginas: number) {
  const paginas: (number | string)[] = [];
  const maxPaginasVisibles = 5;

  if (totalPaginas <= maxPaginasVisibles) {
    for (let i = 1; i <= totalPaginas; i++) {
      paginas.push(i);
    }
    return paginas;
  }

  paginas.push(1);

  let inicio = Math.max(2, paginaActual - 1);
  let fin = Math.min(totalPaginas - 1, paginaActual + 1);

  if (paginaActual <= 2) {
    fin = Math.min(totalPaginas - 1, 4);
  } else if (paginaActual >= totalPaginas - 1) {
    inicio = Math.max(2, totalPaginas - 3);
  }

  if (inicio > 2) {
    paginas.push("...");
  }

  for (let i = inicio; i <= fin; i++) {
    paginas.push(i);
  }

  if (fin < totalPaginas - 1) {
    paginas.push("...");
  }

  paginas.push(totalPaginas);
  return paginas;
}
