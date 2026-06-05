"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import {
  IconArrowDown,
  IconArrowUp,
  IconDotsVertical,
  IconEye,
  IconHistory,
  IconPencil,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";

import { extraerMensajeError } from "@/compartido/api";
import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import {
  Card,
  CardContent,
} from "@/compartido/componentes/ui/card";
import { Input } from "@/compartido/componentes/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/compartido/componentes/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectGroup,
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
import {
  useCambiarEstadoRegistroMutation,
  useCrearActivoMutation,
} from "../servicios/activos-queries";
import type {
  Activo,
  CrearActivoPayload,
  EstadoActivo,
  EstadoCalibracion,
  EstadoOperativo,
} from "../tipos/activo.tipos";

type Props = {
  activos: Activo[];
};

type FiltroRegistro = "ACTIVO" | "ANULADO" | "TODOS";

type FiltrosActivos = {
  query: string;
  tipoActivo: string;
  estadoActivo: string;
  estadoOperativo: string;
  estadoCalibracion: string;
  estadoRegistro: FiltroRegistro;
  fechaDesde: string;
  fechaHasta: string;
};

const FILTROS_INICIALES: FiltrosActivos = {
  query: "",
  tipoActivo: "TODOS",
  estadoActivo: "TODOS",
  estadoOperativo: "TODOS",
  estadoCalibracion: "TODOS",
  estadoRegistro: "ACTIVO",
  fechaDesde: "",
  fechaHasta: "",
};

export function ActivosTabla({ activos }: Props) {
  const router = useRouter();
  const [filtrosFormulario, setFiltrosFormulario] =
    React.useState<FiltrosActivos>(FILTROS_INICIALES);
  const [filtrosAplicados, setFiltrosAplicados] =
    React.useState<FiltrosActivos>(FILTROS_INICIALES);
  const [pagina, setPagina] = React.useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = React.useState(10);
  const [ordenModificacion, setOrdenModificacion] = React.useState<
    "reciente" | "antigua"
  >("reciente");
  const [activoParaBorrar, setActivoParaBorrar] = React.useState<Activo | null>(
    null
  );
  const [activoParaReintegrar, setActivoParaReintegrar] =
    React.useState<Activo | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isReintegrating, setIsReintegrating] = React.useState(false);
  const cambiarEstadoRegistroMutation = useCambiarEstadoRegistroMutation();
  const crearActivoMutation = useCrearActivoMutation();

  const activosPorRegistro = activos.filter((activo) => {
    if (filtrosAplicados.estadoRegistro === "TODOS") return true;
    if (filtrosAplicados.estadoRegistro === "ANULADO") {
      return activo.estadoRegistro === false;
    }

    return activo.estadoRegistro !== false;
  });

  const normalizedQuery = filtrosAplicados.query.trim().toUpperCase();
  const filtrados = activosPorRegistro.filter((activo) => {
    const placa = activo.vehiculo?.placaRodaje ?? "";
    const marca = activo.vehiculo?.marca ?? "";
    const modelo = activo.vehiculo?.modelo ?? "";
    const fechaModificacion = normalizarFecha(activo.updatedAt);
    const coincideTexto = [activo.codigo, activo.descripcion, placa, marca, modelo]
      .join(" ")
      .toUpperCase()
      .includes(normalizedQuery);

    return (
      coincideTexto &&
      (filtrosAplicados.tipoActivo === "TODOS" ||
        activo.tipoActivo === filtrosAplicados.tipoActivo) &&
      (filtrosAplicados.estadoActivo === "TODOS" ||
        activo.estadoActivo === filtrosAplicados.estadoActivo) &&
      (filtrosAplicados.estadoOperativo === "TODOS" ||
        activo.vehiculo?.estadoOperativo === filtrosAplicados.estadoOperativo) &&
      (filtrosAplicados.estadoCalibracion === "TODOS" ||
        activo.vehiculo?.estadoCalibracion ===
          filtrosAplicados.estadoCalibracion) &&
      (!filtrosAplicados.fechaDesde ||
        fechaModificacion >= filtrosAplicados.fechaDesde) &&
      (!filtrosAplicados.fechaHasta ||
        fechaModificacion <= filtrosAplicados.fechaHasta)
    );
  });

  const hayFiltros =
    filtrosAplicados.query ||
    filtrosAplicados.tipoActivo !== "TODOS" ||
    filtrosAplicados.estadoActivo !== "TODOS" ||
    filtrosAplicados.estadoOperativo !== "TODOS" ||
    filtrosAplicados.estadoCalibracion !== "TODOS" ||
    filtrosAplicados.estadoRegistro !== "ACTIVO" ||
    filtrosAplicados.fechaDesde ||
    filtrosAplicados.fechaHasta;

  const ordenados = [...filtrados].sort((a, b) => {
    const fechaA = new Date(a.updatedAt).getTime();
    const fechaB = new Date(b.updatedAt).getTime();

    return ordenModificacion === "reciente"
      ? fechaB - fechaA
      : fechaA - fechaB;
  });

  const totalPaginas = Math.max(1, Math.ceil(ordenados.length / registrosPorPagina));
  const inicioPagina = (pagina - 1) * registrosPorPagina;
  const finPagina = inicioPagina + registrosPorPagina;
  const visibles = ordenados.slice(inicioPagina, finPagina);
  const desdeVisible = ordenados.length ? inicioPagina + 1 : 0;
  const hastaVisible = Math.min(finPagina, ordenados.length);

  React.useEffect(() => {
    setPagina(1);
  }, [
    filtrosAplicados,
    registrosPorPagina,
  ]);

  function actualizarFiltro<K extends keyof FiltrosActivos>(
    key: K,
    value: FiltrosActivos[K]
  ) {
    setFiltrosFormulario((actual) => ({ ...actual, [key]: value }));
  }

  function aplicarFiltros() {
    setPagina(1);
    setFiltrosAplicados(filtrosFormulario);
  }

  function limpiarFiltros() {
    setPagina(1);
    setFiltrosFormulario(FILTROS_INICIALES);
    setFiltrosAplicados(FILTROS_INICIALES);
  }

  async function confirmarBorrado() {
    if (!activoParaBorrar) return;

    setIsDeleting(true);

    try {
      await cambiarEstadoRegistroMutation.mutateAsync({
        id: activoParaBorrar.id,
        payload: {
          estadoRegistro: false,
          motivo: "Borrado desde maestro de activos",
          usuario: "activos.web",
        },
      });
      setActivoParaBorrar(null);
      toast.success("Activo borrado", {
        description: `${activoParaBorrar.codigo} fue retirado del maestro visible.`,
      });
      router.refresh();
    } catch (error) {
      toast.error(extraerMensajeError(error, "No se pudo borrar el activo"));
    } finally {
      setIsDeleting(false);
    }
  }

  async function confirmarReintegro() {
    if (!activoParaReintegrar) return;

    setIsReintegrating(true);

    try {
      await crearActivoMutation.mutateAsync(
        crearPayloadReintegro(activoParaReintegrar)
      );
      setActivoParaReintegrar(null);
      setFiltrosFormulario((actual) => ({
        ...actual,
        estadoRegistro: "ACTIVO",
      }));
      setFiltrosAplicados((actual) => ({
        ...actual,
        estadoRegistro: "ACTIVO",
      }));
      toast.success("Activo reintegrado", {
        description: `${activoParaReintegrar.codigo} vuelve a estar disponible en el listado de activos.`,
      });
      router.refresh();
    } catch (error) {
      toast.error(extraerMensajeError(error, "No se pudo reintegrar el activo"));
    } finally {
      setIsReintegrating(false);
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Listado de activos</h2>
        <p className="text-sm text-muted-foreground">
          {filtrados.length} de {activosPorRegistro.length} activos consultados
        </p>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="flex flex-col gap-4 p-0">
        <form
          className="flex flex-col gap-3 border-b border-border px-4 py-3 xl:flex-row xl:items-center xl:justify-between"
          onSubmit={(event) => {
            event.preventDefault();
            aplicarFiltros();
          }}
        >
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative">
              <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 w-full min-w-60 rounded-4xl pl-9 md:w-72"
                placeholder="Codigo, placa, marca o modelo"
                value={filtrosFormulario.query}
                onChange={(event) => actualizarFiltro("query", event.target.value)}
              />
            </div>
            <FiltroSelect
              ariaLabel="Tipo de activo"
              value={filtrosFormulario.tipoActivo}
              onChange={(value) => actualizarFiltro("tipoActivo", value)}
              values={[
                { value: "TODOS", label: "Tipo: todos" },
                { value: "VEHICULO", label: "Vehiculo" },
                { value: "EQUIPO", label: "Equipo" },
                { value: "HERRAMIENTA", label: "Herramienta" },
                { value: "DISPOSITIVO", label: "Dispositivo" },
                { value: "OTRO", label: "Otro" },
              ]}
            />
            <FiltroSelect
              ariaLabel="Estado del activo"
              value={filtrosFormulario.estadoActivo}
              onChange={(value) => actualizarFiltro("estadoActivo", value)}
              values={[
                { value: "TODOS", label: "Estado: todos" },
                { value: "ACTIVO", label: "Activo" },
                { value: "INACTIVO", label: "Inactivo" },
                { value: "SINIESTRADO", label: "Siniestrado" },
              ]}
            />
            <FiltroSelect
              ariaLabel="Estado operativo"
              value={filtrosFormulario.estadoOperativo}
              onChange={(value) => actualizarFiltro("estadoOperativo", value)}
              values={[
                { value: "TODOS", label: "Operativo: todos" },
                { value: "OPERATIVO", label: "Operativo" },
                { value: "MANTENIMIENTO", label: "Mantenimiento" },
                { value: "NO_OPERATIVO", label: "No operativo" },
              ]}
            />
            <FiltroSelect
              ariaLabel="Estado de calibracion"
              value={filtrosFormulario.estadoCalibracion}
              onChange={(value) => actualizarFiltro("estadoCalibracion", value)}
              values={[
                { value: "TODOS", label: "Calibracion: todos" },
                { value: "CALIBRADA", label: "Calibrada" },
                { value: "NO_CALIBRADA", label: "No calibrada" },
                { value: "PENDIENTE", label: "Pendiente" },
                { value: "OBSERVADA", label: "Observada" },
              ]}
            />
            <FiltroSelect
              ariaLabel="Estado de registro"
              value={filtrosFormulario.estadoRegistro}
              onChange={(value) =>
                actualizarFiltro("estadoRegistro", value as FiltroRegistro)
              }
              values={[
                { value: "ACTIVO", label: "Registro: activos" },
                { value: "ANULADO", label: "Registro: anulados" },
                { value: "TODOS", label: "Registro: todos" },
              ]}
            />
            <FiltroFecha
              value={filtrosFormulario.fechaDesde}
              max={filtrosFormulario.fechaHasta || undefined}
              onChange={(value) => actualizarFiltro("fechaDesde", value)}
              ariaLabel="Fecha desde"
            />
            <FiltroFecha
              value={filtrosFormulario.fechaHasta}
              min={filtrosFormulario.fechaDesde || undefined}
              onChange={(value) => actualizarFiltro("fechaHasta", value)}
              ariaLabel="Fecha hasta"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" size="sm">
              <IconSearch />
              Aplicar
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={limpiarFiltros}>
              <IconRefresh />
              Limpiar
            </Button>
            <Button asChild size="sm">
              <Link href="/activos/nuevo">
                <IconPlus />
                Nuevo activo
              </Link>
            </Button>
          </div>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-2 px-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Fase 1: maestro base</Badge>
            {!hayFiltros ? (
              <span className="text-sm text-muted-foreground">Sin filtros activos</span>
            ) : null}
          </div>
        </div>

        <div className="mx-4 overflow-hidden rounded-xl border border-border">
          <Table className="w-full table-fixed [&_td]:px-2 [&_th]:px-2">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[7%] text-center">
                  Accion
                </TableHead>
                <TableHead className="w-[9%]">Código</TableHead>
                <TableHead className="w-[14%]">Unidad</TableHead>
                <TableHead className="w-[9%]">Placa</TableHead>
                <TableHead className="w-[7%]">Tipo</TableHead>
                <TableHead className="w-[13%]">Ubicacion</TableHead>
                <TableHead className="w-[8%]">Estado</TableHead>
                <TableHead className="w-[9%]">Operativo</TableHead>
                <TableHead className="w-[9%]">Calibracion</TableHead>
                <TableHead className="w-[9%]">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-left transition-colors hover:text-primary"
                    title={
                      ordenModificacion === "reciente"
                        ? "Ordenado por modificacion mas reciente"
                        : "Ordenado por modificacion mas antigua"
                    }
                    onClick={() =>
                      setOrdenModificacion((actual) =>
                        actual === "reciente" ? "antigua" : "reciente"
                      )
                    }
                  >
                    Modificado
                    {ordenModificacion === "reciente" ? (
                      <IconArrowDown className="size-3.5 text-primary" />
                    ) : (
                      <IconArrowUp className="size-3.5 text-primary" />
                    )}
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibles.map((activo) => {
                const esAnulado = activo.estadoRegistro === false;

                return (
                <TableRow
                  key={activo.id}
                  className={cn(
                    esAnulado &&
                      "bg-destructive/5 text-muted-foreground hover:bg-destructive/10"
                  )}
                >
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="outline"
                          aria-label={`Acciones de ${activo.codigo}`}
                        >
                          <IconDotsVertical />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="min-w-56">
                        <DropdownMenuGroup>
                          {esAnulado ? (
                            <>
                              <DropdownMenuItem asChild>
                                <Link href={`/activos/${activo.codigo}/historial`}>
                                  <IconHistory />
                                  Historial y auditoria
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onSelect={() => {
                                  setActivoParaReintegrar(activo);
                                }}
                              >
                                <IconRefresh />
                                Reintegrar
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <>
                              <DropdownMenuItem asChild>
                                <Link href={`/activos/${activo.codigo}`}>
                                  <IconEye />
                                  Ver
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/activos/${activo.codigo}/editar`}>
                                  <IconPencil />
                                  Editar
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/activos/${activo.codigo}/historial`}>
                                  <IconHistory />
                                  Historial y auditoria
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => {
                                  setActivoParaBorrar(activo);
                                }}
                              >
                                <IconTrash />
                                Borrar
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell className="truncate font-medium">
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className={cn("truncate", esAnulado && "line-through")}>
                        {activo.codigo}
                      </span>
                      {!esAnulado && activo.activoOrigenId ? (
                        <Badge
                          className="w-fit border-primary/30 bg-primary/10 text-[11px] text-primary"
                          variant="outline"
                        >
                          Origen historico
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className={cn("truncate font-medium", esAnulado && "line-through")}>
                        {[activo.vehiculo?.marca, activo.vehiculo?.modelo]
                          .filter(Boolean)
                          .join(" ") || activo.descripcion}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {esAnulado
                          ? "Registro anulado"
                          : activo.vehiculo?.carroceria ?? activo.descripcion}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="truncate">
                    {activo.vehiculo?.placaRodaje ?? "Sin placa"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{formatear(activo.tipoActivo)}</Badge>
                  </TableCell>
                  <TableCell className="truncate">
                    {activo.ubicacion}
                  </TableCell>
                  <TableCell>
                    {esAnulado ? (
                      <EstadoBadge value="ANULADO" variant="destructive" />
                    ) : (
                      <EstadoBadge
                        value={activo.estadoActivo}
                        variant={estadoActivoVariant(activo.estadoActivo)}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <EstadoBadge
                      value={activo.vehiculo?.estadoOperativo ?? "SIN_DETALLE"}
                      variant={estadoOperativoVariant(
                        activo.vehiculo?.estadoOperativo
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <EstadoBadge
                      value={activo.vehiculo?.estadoCalibracion ?? "SIN_DETALLE"}
                      variant={estadoCalibracionVariant(
                        activo.vehiculo?.estadoCalibracion
                      )}
                    />
                  </TableCell>
                  <TableCell className="truncate text-sm text-muted-foreground">
                    {formatearFecha(activo.updatedAt)}
                  </TableCell>
                </TableRow>
                );
              })}
              {!ordenados.length ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="h-28 text-center text-muted-foreground"
                  >
                    No se encontraron activos con los filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>

        <div className="mx-4 flex flex-col gap-3 border-t border-border pb-4 pt-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>
            Mostrando {desdeVisible}-{hastaVisible} de {ordenados.length} activos
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2">
              <span>Filas</span>
              <select
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                value={registrosPorPagina}
                onChange={(event) =>
                  setRegistrosPorPagina(Number(event.target.value))
                }
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pagina === 1}
              onClick={() => setPagina((actual) => Math.max(1, actual - 1))}
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
              disabled={pagina === totalPaginas}
              onClick={() =>
                setPagina((actual) => Math.min(totalPaginas, actual + 1))
              }
            >
              Siguiente
            </Button>
          </div>
        </div>
        {activoParaBorrar ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
            <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl">
              <h3 className="text-lg font-semibold">Confirmar borrado</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                El activo {activoParaBorrar.codigo} se retirara del maestro
                visible y no podra usarse en procesos operativos. Deseas
                continuar?
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActivoParaBorrar(null)}
                  disabled={isDeleting}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={confirmarBorrado}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Procesando..." : "Borrar activo"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
        {activoParaReintegrar ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
            <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl">
              <h3 className="text-lg font-semibold">Confirmar reintegro</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Se creara un nuevo registro activo para{" "}
                {activoParaReintegrar.codigo} con los datos del registro anulado.
                Deseas continuar?
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActivoParaReintegrar(null)}
                  disabled={isReintegrating}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={confirmarReintegro}
                  disabled={isReintegrating}
                >
                  {isReintegrating ? "Procesando..." : "Reintegrar activo"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
        </CardContent>
      </Card>
    </section>
  );
}

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"];

function crearPayloadReintegro(activo: Activo): CrearActivoPayload {
  return {
    codigo: activo.codigo,
    tipoActivo: activo.tipoActivo,
    descripcion: activo.descripcion,
    ubicacion: activo.ubicacion,
    estadoActivo: "ACTIVO",
    observacion: activo.observacion ?? undefined,
    valorUnidad: activo.valorUnidad,
    moneda: activo.moneda,
    proveedor: activo.proveedor,
    numeroFactura: activo.numeroFactura,
    fechaFactura: activo.fechaFactura,
    vehiculo: activo.vehiculo
      ? {
          ...activo.vehiculo,
          plantillaInventario: activo.vehiculo.plantillaInventario,
        }
      : undefined,
  };
}

function formatearFecha(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function normalizarFecha(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function EstadoBadge({
  value,
  variant,
}: {
  value: string;
  variant: BadgeVariant;
}) {
  return (
    <Badge className="max-w-44" variant={variant}>
      <span className="truncate">{formatear(value)}</span>
    </Badge>
  );
}

function estadoActivoVariant(value: EstadoActivo): BadgeVariant {
  if (value === "ACTIVO") return "default";
  if (value === "SINIESTRADO") return "destructive";
  return "secondary";
}

function estadoOperativoVariant(
  value: EstadoOperativo | null | undefined
): BadgeVariant {
  if (value === "OPERATIVO") return "default";
  if (value === "NO_OPERATIVO") return "destructive";
  return "secondary";
}

function estadoCalibracionVariant(
  value: EstadoCalibracion | null | undefined
): BadgeVariant {
  if (value === "CALIBRADA") return "default";
  if (value === "OBSERVADA" || value === "NO_CALIBRADA") return "destructive";
  return "secondary";
}

function formatear(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function FiltroSelect({
  ariaLabel,
  value,
  values,
  onChange,
}: {
  ariaLabel: string;
  value: string;
  values: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={ariaLabel} className="h-9 min-w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {values.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function FiltroFecha({
  value,
  min,
  max,
  onChange,
  ariaLabel,
}: {
  value: string;
  min?: string;
  max?: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  return (
    <Input
      aria-label={ariaLabel}
      className="h-9 w-40 rounded-4xl"
      type="date"
      value={value}
      min={min}
      max={max}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
