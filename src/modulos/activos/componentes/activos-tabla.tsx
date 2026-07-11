"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import {
  IconArrowDown,
  IconArrowUp,
  IconDownload,
  IconDotsVertical,
  IconEye,
  IconHistory,
  IconPencil,
  IconRefresh,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  CircleAlert,
  CircleDashed,
  QrCode,
  Wrench,
  type LucideIcon,
} from "lucide-react";

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
  useCatalogosActivos,
  type CatalogosActivos,
} from "../ganchos/use-catalogos-activos";
import {
  useCambiarEstadoRegistroMutation,
  useCrearActivoMutation,
} from "../servicios/activos-queries";
import { obtenerActivos } from "../servicios/activos-api";
import { resolverEtiquetaPorToken } from "../servicios/etiquetas-api";
import { exportarMaestroActivosExcel } from "../servicios/activos-maestro-excel";
import { LectorQrEtiqueta } from "./lector-qr-etiqueta";
import type {
  Activo,
  CrearActivoPayload,
  EstadoActivo,
  EstadoOperativo,
} from "../tipos/activo.tipos";

type PaginacionExterna = {
  pagina: number;
  totalPaginas: number;
  total: number;
  tieneSiguiente: boolean;
  tieneAnterior: boolean;
  onCambiarPagina: (pagina: number) => void;
  onCambiarLimite: (limite: number) => void;
};

type Props = {
  activos: Activo[];
  /** Cuando se pasa, la tabla usa paginación del servidor en lugar de la interna */
  paginacionExterna?: PaginacionExterna;
  /**
   * Avisa al padre cuando cambia el filtro de registro APLICADO, para que
   * refetchee del servidor (los anulados no vienen en la data por defecto;
   * filtrarlos solo localmente siempre daria 0 filas).
   */
  onCambiarFiltroRegistro?: (filtro: FiltroRegistro) => void;
  /**
   * Valor inicial del filtro de registro. Necesario porque el padre desmonta
   * la tabla mientras refetchea (skeleton) y sin esto el filtro elegido se
   * perderia en cada remontaje.
   */
  filtroRegistroInicial?: FiltroRegistro;
};

export type FiltroRegistro = "ACTIVO" | "ANULADO" | "TODOS";

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

export function ActivosTabla({
  activos,
  paginacionExterna,
  onCambiarFiltroRegistro,
  filtroRegistroInicial,
}: Props) {
  const router = useRouter();
  const catalogos = useCatalogosActivos();
  const filtrosBase: FiltrosActivos = {
    ...FILTROS_INICIALES,
    estadoRegistro: filtroRegistroInicial ?? FILTROS_INICIALES.estadoRegistro,
  };
  const [filtrosFormulario, setFiltrosFormulario] =
    React.useState<FiltrosActivos>(filtrosBase);
  const [filtrosAplicados, setFiltrosAplicados] =
    React.useState<FiltrosActivos>(filtrosBase);
  const [pagina, setPagina] = React.useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = React.useState(10);
  const [ordenModificacion, setOrdenModificacion] = React.useState<
    "reciente" | "antigua"
  >("reciente");
  const debounceQueryRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activoParaBorrar, setActivoParaBorrar] = React.useState<Activo | null>(
    null
  );
  const [activoParaReintegrar, setActivoParaReintegrar] =
    React.useState<Activo | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isReintegrating, setIsReintegrating] = React.useState(false);
  const [lectorQrAbierto, setLectorQrAbierto] = React.useState(false);
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
    const placa = activo.vehiculo?.placa ?? "";
    const marca = activo.vehiculo?.marca ?? "";
    const modelo = activo.vehiculo?.modelo ?? "";
    const fechaModificacion = normalizarFecha(activo.fechaModificacion);
    const coincideTexto = [activo.codigo, activo.descripcion, placa, marca, modelo]
      .join(" ")
      .toUpperCase()
      .includes(normalizedQuery);

    return (
      coincideTexto &&
      (filtrosAplicados.tipoActivo === "TODOS" ||
        activo.tipoActivoReferenciaId === Number(filtrosAplicados.tipoActivo)) &&
      coincideEstadoActivo(activo.estadoActivo, filtrosAplicados.estadoActivo) &&
      (filtrosAplicados.estadoOperativo === "TODOS" ||
        activo.vehiculo?.estadoOperativo === filtrosAplicados.estadoOperativo) &&
      (filtrosAplicados.estadoCalibracion === "TODOS" ||
        activo.vehiculo?.estadoCalibracionReferenciaId ===
          Number(filtrosAplicados.estadoCalibracion)) &&
      (!filtrosAplicados.fechaDesde ||
        fechaModificacion >= filtrosAplicados.fechaDesde) &&
      (!filtrosAplicados.fechaHasta ||
        fechaModificacion <= filtrosAplicados.fechaHasta)
    );
  });

  const resumen = {
    total: activosPorRegistro.length,
    operativos: activosPorRegistro.filter(
      (activo) => activo.vehiculo?.estadoOperativo === "OPERATIVO"
    ).length,
    mantenimiento: activosPorRegistro.filter(
      (activo) => activo.vehiculo?.estadoOperativo === "MANTENIMIENTO"
    ).length,
    noCalibrados: activosPorRegistro.filter((activo) => {
      const id = activo.vehiculo?.estadoCalibracionReferenciaId;
      return (
        id != null &&
        (id === catalogos.idPorNombre("ESTADO_CALIBRACION", "No calibrada") ||
          id === catalogos.idPorNombre("ESTADO_CALIBRACION", "Observada"))
      );
    }).length,
  };

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
    const fechaA = new Date(a.fechaModificacion).getTime();
    const fechaB = new Date(b.fechaModificacion).getTime();

    return ordenModificacion === "reciente"
      ? fechaB - fechaA
      : fechaA - fechaB;
  });

  // Paginación: externa (server-side) o interna (client-side)
  const usarPaginacionExterna = paginacionExterna !== undefined;
  const usarPaginacionRemota = usarPaginacionExterna && !hayFiltros;
  const totalPaginas = usarPaginacionRemota
    ? paginacionExterna.totalPaginas
    : Math.max(1, Math.ceil(ordenados.length / registrosPorPagina));
  const inicioPagina = (pagina - 1) * registrosPorPagina;
  const finPagina = inicioPagina + registrosPorPagina;
  // Si es server-side los activos ya vienen paginados; no re-sliceamos
  const visibles = usarPaginacionRemota
    ? ordenados
    : ordenados.slice(inicioPagina, finPagina);
  const totalParaTexto = usarPaginacionRemota
    ? paginacionExterna.total
    : ordenados.length;
  const paginaActual = usarPaginacionRemota ? paginacionExterna.pagina : pagina;
  const desdeVisible = totalParaTexto
    ? usarPaginacionRemota
      ? (paginaActual - 1) * registrosPorPagina + 1
      : inicioPagina + 1
    : 0;
  const hastaVisible = usarPaginacionRemota
    ? Math.min(paginaActual * registrosPorPagina, paginacionExterna.total)
    : Math.min(finPagina, ordenados.length);

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

  function actualizarQuery(valor: string) {
    setFiltrosFormulario((actual) => ({ ...actual, query: valor }));
    if (debounceQueryRef.current) clearTimeout(debounceQueryRef.current);
    debounceQueryRef.current = setTimeout(() => {
      setPagina(1);
      setFiltrosAplicados((actual) => ({ ...actual, query: valor }));
    }, 300);
  }

  function aplicarFiltros() {
    setPagina(1);
    setFiltrosAplicados(filtrosFormulario);
    if (filtrosFormulario.estadoRegistro !== filtrosAplicados.estadoRegistro) {
      onCambiarFiltroRegistro?.(filtrosFormulario.estadoRegistro);
    }
  }

  function limpiarFiltros() {
    setPagina(1);
    setFiltrosFormulario(FILTROS_INICIALES);
    setFiltrosAplicados(FILTROS_INICIALES);
    if (filtrosAplicados.estadoRegistro !== FILTROS_INICIALES.estadoRegistro) {
      onCambiarFiltroRegistro?.(FILTROS_INICIALES.estadoRegistro);
    }
  }

  /**
   * Reporte "Base de Activos Vehiculares" formato FT-AS-006: .xlsx real con
   * estilos. Exporta TODO el listado segun el filtro Vigentes/Anulados/Todos
   * (trae los datos del servidor), no solo la pagina visible.
   */
  async function exportarExcel() {
    try {
      const estadoRegistro =
        filtrosAplicados.estadoRegistro === "TODOS"
          ? ("TODOS" as const)
          : filtrosAplicados.estadoRegistro !== "ANULADO";
      const todos = await obtenerActivos({ estadoRegistro });
      await exportarMaestroActivosExcel(todos, {
        tipoActivo: (id) => catalogos.nombrePorId("TIPO_ACTIVO", id),
        calibracion: (id) => catalogos.nombrePorId("ESTADO_CALIBRACION", id),
      });
      toast.success(`Excel generado con ${todos.length} activos.`);
    } catch (err) {
      toast.error(extraerMensajeError(err, "No se pudo generar el Excel."));
    }
  }

  function exportarPdf() {
    const filas = ordenados
      .map(
        (activo) => `
          <tr>
            <td>${escaparHtml(activo.codigo)}</td>
            <td>${escaparHtml(
              [activo.vehiculo?.marca, activo.vehiculo?.modelo]
                .filter(Boolean)
                .join(" ") || activo.descripcion
            )}</td>
            <td>${escaparHtml(activo.vehiculo?.placa ?? "")}</td>
            <td>${escaparHtml(
              catalogos.nombrePorId("TIPO_ACTIVO", activo.tipoActivoReferenciaId)
            )}</td>
            <td>${escaparHtml(activo.ubicacion)}</td>
            <td>${escaparHtml(formatearEstadoActivo(activo.estadoActivo))}</td>
            <td>${escaparHtml(formatear(activo.vehiculo?.estadoOperativo))}</td>
            <td>${escaparHtml(formatearFecha(activo.fechaModificacion))}</td>
          </tr>`
      )
      .join("");
    const ventana = window.open("", "_blank");
    if (!ventana) {
      toast.error("No se pudo abrir la vista PDF. Revisa el bloqueador de ventanas.");
      return;
    }

    ventana.document.write(`<!doctype html>
      <html>
        <head>
          <title>Listado de activos</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
            h1 { font-size: 20px; margin: 0 0 12px; }
            p { margin: 0 0 16px; color: #4b5563; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th, td { border: 1px solid #d1d5db; padding: 6px; text-align: left; }
            th { background: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>Listado de activos</h1>
          <p>${ordenados.length} activos exportados - ${new Date().toLocaleString("es-PE")}</p>
          <table>
            <thead>
              <tr>
                <th>Codigo</th>
                <th>Unidad</th>
                <th>Placa</th>
                <th>Tipo</th>
                <th>Ubicacion</th>
                <th>Estado</th>
                <th>Condicion</th>
                <th>Modificado</th>
              </tr>
            </thead>
            <tbody>${filas}</tbody>
          </table>
        </body>
      </html>`);
    ventana.document.close();
    ventana.focus();
    ventana.print();
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
      onCambiarFiltroRegistro?.("ACTIVO");
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

  async function buscarActivoPorQr(token: string) {
    setLectorQrAbierto(false);
    try {
      const etiqueta = await resolverEtiquetaPorToken(token);
      if (!etiqueta.activo) {
        toast.error("La etiqueta fue encontrada, pero aun no esta vinculada a un activo.");
        return;
      }
      toast.success(`Activo encontrado: ${etiqueta.activo.codigo}`);
      router.push(`/activos/${etiqueta.activo.codigo}`);
    } catch (error) {
      toast.error(extraerMensajeError(error, "No se pudo buscar el activo por QR."));
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{resumen.total} registros</Badge>
            <h2 className="text-lg font-semibold">Consulta de activos</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Busca y filtra el maestro de unidades. Mostrando {filtrados.length} de{" "}
            {activosPorRegistro.length}.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <ResumenMini
            icon={Boxes}
            label="Total"
            value={resumen.total}
            tono="text-foreground"
          />
          <ResumenMini
            icon={CheckCircle2}
            label="Operativos"
            value={resumen.operativos}
            tono="text-emerald-600 dark:text-emerald-400"
          />
          <ResumenMini
            icon={Wrench}
            label="Mantenimiento"
            value={resumen.mantenimiento}
            tono="text-amber-500 dark:text-amber-400"
          />
          <ResumenMini
            icon={AlertTriangle}
            label="No calibrados"
            value={resumen.noCalibrados}
            tono="text-destructive"
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="flex flex-col gap-4 p-0">
        <form
          className="flex flex-col border-b border-border"
          onSubmit={(event) => {
            event.preventDefault();
            aplicarFiltros();
          }}
        >
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <div className="relative w-56">
                <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-9 w-full rounded-4xl pl-9"
                  placeholder="Codigo, placa, marca o modelo"
                  value={filtrosFormulario.query}
                  onChange={(event) => actualizarQuery(event.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-9"
                onClick={() => setLectorQrAbierto(true)}
              >
                <QrCode className="size-4" />
                Buscar QR
              </Button>
              <FiltroSelect
                ariaLabel="Tipo de activo"
                value={filtrosFormulario.tipoActivo}
                onChange={(value) => actualizarFiltro("tipoActivo", value)}
                values={[
                  { value: "TODOS", label: "Tipo: todos" },
                  ...catalogos.tiposActivo.map((opcion) => ({
                    value: String(opcion.id),
                    label: opcion.nombre,
                  })),
                ]}
              />
              <FiltroSelect
                ariaLabel="Estado del activo"
                value={filtrosFormulario.estadoActivo}
                onChange={(value) => actualizarFiltro("estadoActivo", value)}
                values={[
                  { value: "TODOS", label: "Estado: todos" },
                  { value: "ACTIVO", label: "Activo" },
                  { value: "BAJA", label: "Baja" },
                ]}
              />
              <FiltroSelect
                ariaLabel="Condicion activo"
                value={filtrosFormulario.estadoOperativo}
                onChange={(value) => actualizarFiltro("estadoOperativo", value)}
                values={[
                  { value: "TODOS", label: "Condicion: todos" },
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
                  ...catalogos.estadosCalibracion.map((opcion) => ({
                    value: String(opcion.id),
                    label: opcion.nombre,
                  })),
                ]}
              />
              <FiltroSelect
                ariaLabel="Estado de registro"
                value={filtrosFormulario.estadoRegistro}
                onChange={(value) =>
                  actualizarFiltro("estadoRegistro", value as FiltroRegistro)
                }
                values={[
                  { value: "ACTIVO", label: "Vigentes" },
                  { value: "ANULADO", label: "Anulados" },
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
            <div className="flex items-center gap-1.5">
              <Button type="submit" size="sm">
                <IconSearch />
                Aplicar
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={limpiarFiltros}>
                <IconRefresh />
                Limpiar
              </Button>
              <div className="mx-1 h-5 w-px bg-border" />
              <Button type="button" variant="outline" size="sm" onClick={exportarExcel}>
                <IconDownload />
                Excel
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={exportarPdf}>
                <IconDownload />
                PDF
              </Button>
            </div>
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
                <TableHead className="w-[9%]">Condicion</TableHead>
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
                                  Auditar
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
                                  Auditar
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
                      <Badge
                        className={cn(
                          "w-fit gap-1 text-[11px]",
                          activo.etiquetaActual
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "text-muted-foreground"
                        )}
                        variant="outline"
                      >
                        <QrCode className="size-3" />
                        {activo.etiquetaActual?.codigo ?? "Sin etiqueta"}
                      </Badge>
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
                    {activo.vehiculo?.placa ?? "Sin placa"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {catalogos.nombrePorId("TIPO_ACTIVO", activo.tipoActivoReferenciaId)}
                    </Badge>
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
                      value={
                        catalogos.nombrePorId(
                          "ESTADO_CALIBRACION",
                          activo.vehiculo?.estadoCalibracionReferenciaId
                        ) || "SIN_DETALLE"
                      }
                      variant={estadoCalibracionVariant(
                        activo.vehiculo?.estadoCalibracionReferenciaId,
                        catalogos
                      )}
                    />
                  </TableCell>
                  <TableCell className="truncate text-sm text-muted-foreground">
                    {formatearFecha(activo.fechaModificacion)}
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
            Mostrando {desdeVisible}-{hastaVisible} de {totalParaTexto} activos
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2">
              <span>Filas</span>
              <select
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                value={registrosPorPagina}
                onChange={(event) => {
                  const nuevo = Number(event.target.value);
                  setRegistrosPorPagina(nuevo);
                  if (usarPaginacionRemota) {
                    paginacionExterna.onCambiarLimite(nuevo);
                  }
                }}
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
              disabled={usarPaginacionRemota ? !paginacionExterna.tieneAnterior : pagina === 1}
              onClick={() => {
                if (usarPaginacionRemota) {
                  paginacionExterna.onCambiarPagina(paginaActual - 1);
                } else {
                  setPagina((actual) => Math.max(1, actual - 1));
                }
              }}
            >
              Anterior
            </Button>
            <span className="min-w-20 text-center">
              {paginaActual} / {totalPaginas}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={usarPaginacionRemota ? !paginacionExterna.tieneSiguiente : pagina === totalPaginas}
              onClick={() => {
                if (usarPaginacionRemota) {
                  paginacionExterna.onCambiarPagina(paginaActual + 1);
                } else {
                  setPagina((actual) => Math.min(totalPaginas, actual + 1));
                }
              }}
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
                Esta seguro que desea eliminar el activo {activoParaBorrar.codigo},
                tenga en cuenta que esta informacion ya no se podra recuperar.
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
                  {isDeleting ? "Procesando..." : "Borrar"}
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

      <LectorQrEtiqueta
        abierto={lectorQrAbierto}
        onCerrar={() => setLectorQrAbierto(false)}
        onTokenLeido={(token) => void buscarActivoPorQr(token)}
        titulo="Buscar activo por QR"
        descripcion="Toma una foto del QR de la unidad para abrir su ficha de consulta."
      />
    </section>
  );
}

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"];

function crearPayloadReintegro(activo: Activo): CrearActivoPayload {
  return {
    codigo: activo.codigo,
    tipoActivoReferenciaId: activo.tipoActivoReferenciaId,
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
          estadoCalibracionReferenciaId:
            activo.vehiculo.estadoCalibracionReferenciaId ?? 0,
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

function coincideEstadoActivo(estadoActivo: EstadoActivo, filtro: string) {
  if (filtro === "TODOS") return true;
  if (filtro === "BAJA") return estadoActivo !== "ACTIVO";
  return estadoActivo === filtro;
}

function ResumenMini({
  icon: Icon,
  label,
  value,
  tono,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tono: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className={cn("size-4", tono)} />
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-[11px] text-muted-foreground">
          {label}
        </span>
        <span className="text-lg font-semibold leading-none">{value}</span>
      </div>
    </div>
  );
}

function EstadoBadge({
  value,
  variant,
}: {
  value: string;
  variant: BadgeVariant;
}) {
  const { Icono, iconClassName } = estiloEstado(variant);
  return (
    <Badge
      variant="outline"
      className="h-6 max-w-44 gap-1.5 rounded-full border-border/70 bg-card px-2.5 text-[12px] font-medium text-foreground"
    >
      <Icono className={cn("size-3.5 shrink-0", iconClassName)} />
      <span className="truncate">{formatearEstadoActivo(value)}</span>
    </Badge>
  );
}

/**
 * Color e icono semanticos del estado: el variant ya clasifica el estado
 * (default = bueno, destructive = alerta, secondary = neutral); aqui solo se
 * pinta. Verde para lo bueno, rojo solo para lo malo, gris para lo neutral,
 * para que se distingan de un vistazo (antes todo salia rojo).
 */
function estiloEstado(variant: BadgeVariant): {
  Icono: LucideIcon;
  iconClassName: string;
} {
  if (variant === "default") {
    return {
      Icono: CheckCircle2,
      iconClassName: "text-emerald-600 dark:text-emerald-400",
    };
  }
  if (variant === "destructive") {
    return { Icono: CircleAlert, iconClassName: "text-destructive" };
  }
  return { Icono: CircleDashed, iconClassName: "text-muted-foreground" };
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
  value: number | null | undefined,
  catalogos: CatalogosActivos
): BadgeVariant {
  if (value == null) return "secondary";
  if (value === catalogos.idPorNombre("ESTADO_CALIBRACION", "Calibrada")) return "default";
  if (
    value === catalogos.idPorNombre("ESTADO_CALIBRACION", "Observada") ||
    value === catalogos.idPorNombre("ESTADO_CALIBRACION", "No calibrada")
  )
    return "destructive";
  return "secondary";
}

function formatear(value?: string | null) {
  if (!value) return "-";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatearEstadoActivo(value?: string | null) {
  if (value === "ACTIVO") return "Activo";
  if (value === "SINIESTRADO") return "Baja / Siniestro";
  if (value === "INACTIVO") return "Baja / De baja";
  return formatear(value);
}

function escaparHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
      <SelectTrigger aria-label={ariaLabel} className="h-9 w-40">
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
