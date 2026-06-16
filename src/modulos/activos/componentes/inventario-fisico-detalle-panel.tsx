"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ClipboardCheck,
  Eye,
  History,
  Pencil,
  Save,
} from "lucide-react";

import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/compartido/componentes/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table";

import {
  actualizarDetalleInventarioFisico,
  cerrarInventarioFisico,
  obtenerSnapshotsHistoricosActivoInventario,
  registrarRevisionInventarioFisico,
} from "../servicios/activos-api";
import {
  useDocumentosActivoQuery,
  useImagenesActivoQuery,
  useTanquesActivoQuery,
} from "../servicios/activos-queries";
import { DocumentosActivo } from "./documentos-activo";
import { ImagenesActivo } from "./imagenes-activo";
import { TanquesActivo } from "./tanques-activo";
import type {
  Activo,
  EstadoRevisionInventario,
  InventarioFisico,
  InventarioFisicoDetalle,
  InventarioFisicoHistorial,
  SnapshotHistoricoActivoInventario,
} from "../tipos/activo.tipos";

const RESULTADOS_REVISION: EstadoRevisionInventario[] = [
  "ENCONTRADO",
  "FALTANTE",
  "OBSERVADO",
  "NO_APLICA",
];

type FiltroRevision = "TODOS" | "PENDIENTE" | "REGISTRADO" | "FALTANTE";

export function InventarioFisicoDetallePanel({
  inventarioInicial,
  activosMaestro,
  activoInicial,
}: {
  inventarioInicial: InventarioFisico;
  activosMaestro: Activo[];
  activoInicial?: string;
}) {
  const [inventario, setInventario] = React.useState(inventarioInicial);
  const [busqueda, setBusqueda] = React.useState("");
  const [estadoFiltro, setEstadoFiltro] = React.useState<FiltroRevision>("TODOS");
  const [pagina, setPagina] = React.useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = React.useState(10);
  const [error, setError] = React.useState<string | null>(null);
  const [cerrando, setCerrando] = React.useState(false);
  const [detalleSeleccionadoKey, setDetalleSeleccionadoKey] = React.useState<
    string | null
  >(null);

  const detallesBase = React.useMemo(
    () => construirDetallesInventario(inventario, activosMaestro),
    [inventario, activosMaestro]
  );

  const detallesFiltrados = detallesBase.filter((detalle) => {
    const query = busqueda.trim().toUpperCase();
    const valoresBusqueda = [
      detalle.codigoActivo,
      detalle.placa,
      detalle.ubicacionEsperada,
      detalle.descripcionActivo,
      detalle.marca,
      detalle.modelo,
      detalle.carroceria,
      detalle.estadoActivo,
      detalle.estadoOperativo,
      detalle.estadoCalibracion,
    ];
    const coincideBusqueda =
      !query ||
      valoresBusqueda.some((valor) =>
        (valor ?? "").toUpperCase().includes(query)
      );

    const coincideEstado =
      estadoFiltro === "TODOS" ||
      (estadoFiltro === "REGISTRADO"
        ? detalle.estadoRevision !== "PENDIENTE"
        : detalle.estadoRevision === estadoFiltro);

    return coincideBusqueda && coincideEstado;
  });

  const totalPaginas = Math.max(
    1,
    Math.ceil(detallesFiltrados.length / registrosPorPagina)
  );
  const inicioPagina = (pagina - 1) * registrosPorPagina;
  const finPagina = inicioPagina + registrosPorPagina;
  const detallesVisibles = detallesFiltrados.slice(inicioPagina, finPagina);
  const desdeVisible = detallesFiltrados.length ? inicioPagina + 1 : 0;
  const hastaVisible = Math.min(finPagina, detallesFiltrados.length);
  const detalleSeleccionado =
    detallesBase.find(
      (detalle) => obtenerDetalleKey(detalle) === detalleSeleccionadoKey
    ) ?? null;
  const activoSeleccionado =
    detalleSeleccionado
      ? activosMaestro.find((activo) => activo.id === detalleSeleccionado.activoId)
      : undefined;
  const inventarioBloqueado =
    inventario.estado === "CERRADO" || inventario.estado === "ANULADO";

  React.useEffect(() => {
    setPagina(1);
  }, [busqueda, estadoFiltro, detallesBase.length, registrosPorPagina]);

  React.useEffect(() => {
    if (detalleSeleccionadoKey || !activoInicial) {
      return;
    }

    const detalleInicial = detallesBase.find(
      (detalle) => detalle.codigoActivo === activoInicial
    );

    if (detalleInicial) {
      setDetalleSeleccionadoKey(obtenerDetalleKey(detalleInicial));
    }
  }, [activoInicial, detalleSeleccionadoKey, detallesBase]);

  React.useEffect(() => {
    if (
      detalleSeleccionadoKey &&
      detallesBase.some(
        (detalle) => obtenerDetalleKey(detalle) === detalleSeleccionadoKey
      )
    ) {
      return;
    }

    setDetalleSeleccionadoKey(null);
  }, [detalleSeleccionadoKey, detallesBase]);

  const resumen = {
    candidatos: detallesBase.length,
    inventariados: detallesBase.filter(
      (detalle) => detalle.estadoRevision !== "PENDIENTE"
    ).length,
    pendientes: detallesBase.filter(
      (detalle) => detalle.estadoRevision === "PENDIENTE"
    ).length,
    registrados: inventario.detalles.filter(
      (detalle) => detalle.estadoRevision !== "PENDIENTE"
    ).length,
    faltantes: inventario.detalles.filter(
      (detalle) => detalle.estadoRevision === "FALTANTE"
    ).length,
    observados: inventario.detalles.filter(
      (detalle) => detalle.estadoRevision === "OBSERVADO"
    ).length,
  };

  async function guardarDetalle(
    detalle: InventarioFisicoDetalle,
    payload: {
      estadoRevision: EstadoRevisionInventario;
      ubicacionEncontrada?: string;
      observacion?: string;
    }
  ) {
    setError(null);

    try {
      const payloadRevision = {
        ...payload,
        usuarioRevision: "activos.web",
      };
      const actualizado =
        detalle.id === null
          ? await registrarRevisionInventarioFisico(inventario.id, {
              ...payloadRevision,
              activoId: detalle.activoId,
            })
          : await actualizarDetalleInventarioFisico(
              inventario.id,
              detalle.id,
              payloadRevision
            );
      setInventario(actualizado);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar el detalle del inventario"
      );
    }
  }

  async function cerrarInventario() {
    setError(null);
    setCerrando(true);

    try {
      const actualizado = await cerrarInventarioFisico(inventario.id, {
        usuarioCierre: "activos.web",
      });
      setInventario(actualizado);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo cerrar el inventario"
      );
    } finally {
      setCerrando(false);
    }
  }

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{inventario.codigo}</p>
          <h1 className="text-2xl font-semibold">{inventario.nombre}</h1>
          <p className="text-sm text-muted-foreground">
            {inventario.descripcion || "Revision fisica de activos vigentes."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline">{formatear(inventario.estado)}</Badge>
            <Badge variant="outline">{resumen.inventariados} inventariados</Badge>
            <Badge variant="outline">{resumen.candidatos} candidatos</Badge>
            <Badge variant="outline">{resumen.pendientes} pendientes</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/activos/inventario-fisico">
              <ArrowLeft className="size-4" />
              Volver
            </Link>
          </Button>
          {inventario.estado !== "CERRADO" && inventario.estado !== "ANULADO" ? (
            <Button onClick={cerrarInventario} disabled={cerrando}>
              <ClipboardCheck className="size-4" />
              {cerrando ? "Cerrando..." : "Cerrar inventario"}
            </Button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {detalleSeleccionado ? (
        <FichaRevisionInventario
          key={obtenerDetalleKey(detalleSeleccionado)}
          inventarioId={inventario.id}
          detalle={detalleSeleccionado}
          activo={activoSeleccionado}
          disabled={inventarioBloqueado}
          onGuardar={guardarDetalle}
          onVolver={() => setDetalleSeleccionadoKey(null)}
        />
      ) : (
        <Tabs defaultValue="revision">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <TabsList className="w-fit">
              <TabsTrigger value="revision">Revision de unidades</TabsTrigger>
              <TabsTrigger value="historial">Historial</TabsTrigger>
            </TabsList>
            <p className="text-sm text-muted-foreground">
              Foto de apertura: {resumen.candidatos} activos vehiculares.
            </p>
          </div>

          <TabsContent value="revision" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Revision de unidades</CardTitle>
                <CardDescription>
                  Marca cada activo segun la constatacion fisica y conserva la
                  observacion de campo.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <input
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Buscar codigo, placa, unidad, marca o ubicacion"
                className="h-10 min-w-0 flex-1 rounded-full border border-input bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <select
                value={estadoFiltro}
                onChange={(event) =>
                  setEstadoFiltro(event.target.value as FiltroRevision)
                }
                className="h-10 rounded-full border border-input bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="TODOS">Todos</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="REGISTRADO">Registrado</option>
                <option value="FALTANTE">Faltante</option>
              </select>
            </div>

          <div className="overflow-hidden rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activo</TableHead>
                  <TableHead>Datos del maestro</TableHead>
                  <TableHead>Conciliacion</TableHead>
                  <TableHead>Ultima revision</TableHead>
                  <TableHead className="text-right">Accion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detallesVisibles.map((detalle) => (
                  <DetalleRow
                    key={obtenerDetalleKey(detalle)}
                    detalle={detalle}
                    selected={
                      detalleSeleccionado
                        ? obtenerDetalleKey(detalleSeleccionado) ===
                          obtenerDetalleKey(detalle)
                        : false
                    }
                    disabled={inventarioBloqueado}
                    onSeleccionar={() =>
                      setDetalleSeleccionadoKey(obtenerDetalleKey(detalle))
                    }
                  />
                ))}
                {!detallesFiltrados.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No hay activos para el filtro aplicado.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>

          {detallesFiltrados.length ? (
            <div className="flex flex-col gap-3 border-t border-border pt-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
              <div>
                Mostrando {desdeVisible}-{hastaVisible} de{" "}
                {detallesFiltrados.length} candidatos
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
                  onClick={() =>
                    setPagina((actual) => Math.max(1, actual - 1))
                  }
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
          ) : null}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historial" className="mt-4">
            <HistorialInventario eventos={inventario.historial ?? []} />
          </TabsContent>
        </Tabs>
      )}
    </section>
  );
}

function DetalleRow({
  detalle,
  selected,
  disabled,
  onSeleccionar,
}: {
  detalle: InventarioFisicoDetalle;
  selected: boolean;
  disabled: boolean;
  onSeleccionar: () => void;
}) {
  return (
    <TableRow className={selected ? "bg-primary/5" : undefined}>
      <TableCell className="min-w-52 align-top">
        <div className="grid gap-1">
          <span className="font-semibold">{detalle.codigoActivo}</span>
          <span className="text-xs text-muted-foreground">
            {detalle.descripcionActivo || "Sin descripcion"}
          </span>
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline">{formatear(detalle.tipoActivo)}</Badge>
            <Badge variant="outline">{formatear(detalle.estadoActivo)}</Badge>
          </div>
        </div>
      </TableCell>
      <TableCell className="min-w-64 align-top">
        <div className="grid gap-1 text-xs">
          <TextoDato label="Placa" value={detalle.placa || "Sin placa"} />
          <TextoDato label="Ubicacion" value={detalle.ubicacionEsperada} />
          <TextoDato
            label="Marca/modelo"
            value={
              [detalle.marca, detalle.modelo].filter(Boolean).join(" ") || null
            }
          />
          <TextoDato label="Carroceria" value={detalle.carroceria} />
          <div className="mt-1 flex flex-wrap gap-1">
            <Badge variant="outline">
              {formatear(detalle.estadoOperativo)}
            </Badge>
            <Badge variant="outline">
              {formatear(detalle.estadoCalibracion)}
            </Badge>
          </div>
        </div>
      </TableCell>
      <TableCell className="align-top">
        <DiferenciaInventario
          detalle={detalle}
          estado={detalle.estadoRevision}
          ubicacionEncontrada={detalle.ubicacionEncontrada ?? ""}
        />
      </TableCell>
      <TableCell className="align-top">
        <div className="grid gap-1 text-xs">
          <span className="font-medium">
            {formatear(detalle.estadoRevision)}
          </span>
          <span className="text-muted-foreground">
            {detalle.fechaRevision
              ? formatearFecha(detalle.fechaRevision)
              : "Sin registrar"}
          </span>
          {detalle.observacion ? (
            <span className="line-clamp-2 text-muted-foreground">
              {detalle.observacion}
            </span>
          ) : null}
        </div>
      </TableCell>
      <TableCell className="align-top text-right">
        <Button
          variant="outline"
          size="sm"
          onClick={onSeleccionar}
        >
          <Eye className="size-4" />
          {disabled
            ? "Ver"
            : detalle.estadoRevision === "PENDIENTE"
              ? "Revisar"
              : "Revisar"}
        </Button>
      </TableCell>
    </TableRow>
  );
}

function FichaRevisionInventario({
  inventarioId,
  detalle,
  activo,
  disabled,
  onGuardar,
  onVolver,
}: {
  inventarioId: number;
  detalle: InventarioFisicoDetalle;
  activo?: Activo;
  disabled: boolean;
  onGuardar: (
    detalle: InventarioFisicoDetalle,
    payload: {
      estadoRevision: EstadoRevisionInventario;
      ubicacionEncontrada?: string;
      observacion?: string;
    }
  ) => Promise<void>;
  onVolver: () => void;
}) {
  const [estado, setEstado] = React.useState(detalle.estadoRevision);
  const [ubicacion, setUbicacion] = React.useState(
    detalle.ubicacionEncontrada ?? ""
  );
  const [observacion, setObservacion] = React.useState(
    detalle.observacion ?? ""
  );
  const [guardando, setGuardando] = React.useState(false);
  const [snapshotsHistoricos, setSnapshotsHistoricos] = React.useState<
    SnapshotHistoricoActivoInventario[]
  >([]);
  const [cargandoSnapshots, setCargandoSnapshots] = React.useState(false);
  const [errorSnapshots, setErrorSnapshots] = React.useState<string | null>(
    null
  );
  const imagenesQuery = useImagenesActivoQuery(detalle.codigoActivo);
  const documentosQuery = useDocumentosActivoQuery(detalle.codigoActivo);
  const tanquesQuery = useTanquesActivoQuery(detalle.codigoActivo);
  const imagenes = imagenesQuery.data ?? [];
  const documentos = documentosQuery.data ?? [];
  const tanques = tanquesQuery.data ?? [];
  const vehiculo = activo?.vehiculo ?? null;
  const returnToInventario = `/activos/inventario-fisico/${inventarioId}?activo=${encodeURIComponent(
    detalle.codigoActivo
  )}`;

  React.useEffect(() => {
    setEstado(detalle.estadoRevision);
    setUbicacion(detalle.ubicacionEncontrada ?? "");
    setObservacion(detalle.observacion ?? "");
  }, [detalle]);

  React.useEffect(() => {
    let cancelado = false;

    async function cargarSnapshots() {
      setCargandoSnapshots(true);
      setErrorSnapshots(null);

      try {
        const data = await obtenerSnapshotsHistoricosActivoInventario(
          detalle.activoId,
          inventarioId
        );

        if (!cancelado) {
          setSnapshotsHistoricos(data);
        }
      } catch (error) {
        if (!cancelado) {
          setSnapshotsHistoricos([]);
          setErrorSnapshots(
            error instanceof Error
              ? error.message
              : "No se pudo cargar el comparativo historico"
          );
        }
      } finally {
        if (!cancelado) {
          setCargandoSnapshots(false);
        }
      }
    }

    cargarSnapshots();

    return () => {
      cancelado = true;
    };
  }, [detalle.activoId, inventarioId]);

  async function guardar() {
    setGuardando(true);
    try {
      await onGuardar(detalle, {
        estadoRevision: estado,
        ubicacionEncontrada: ubicacion.trim() || undefined,
        observacion: observacion.trim() || undefined,
      });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="grid gap-5">
      <section className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">
            {detalle.codigoActivo}
          </p>
          <h2 className="text-2xl font-semibold tracking-normal">
            {detalle.descripcionActivo || "Sin descripcion"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {detalle.ubicacionEsperada || "Ubicacion pendiente"}
          </p>
          <p className="mt-2 max-w-full truncate font-mono text-xs text-muted-foreground">
            ID inventario: {detalle.activoId}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={onVolver}>
            <ArrowLeft className="size-4" />
            Volver
          </Button>
          <Button asChild>
            <Link
              href={`/activos/${detalle.codigoActivo}/editar?context=inventario&returnTo=${encodeURIComponent(
                returnToInventario
              )}`}
              onClick={() => {
                window.sessionStorage.setItem(
                  "activos:returnToAfterEdit",
                  returnToInventario
                );
              }}
            >
              <Pencil className="size-4" />
              Editar
            </Link>
          </Button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <EstadoCard
          titulo="Resultado fisico"
          valor={formatear(estado)}
          className={
            estado === "FALTANTE"
              ? "border-destructive/30 bg-destructive/5"
              : estado === "OBSERVADO"
                ? "border-amber-500/30 bg-amber-500/5"
                : undefined
          }
        />
        <EstadoCard
          titulo="Condicion activo"
          valor={formatear(detalle.estadoOperativo)}
        />
        <EstadoCard
          titulo="Calibracion"
          valor={formatear(detalle.estadoCalibracion)}
        />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Ficha del activo</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="base">
              <TabsList className="flex-wrap">
                <TabsTrigger value="base">Base</TabsTrigger>
                <TabsTrigger value="adquisicion">Adquisicion</TabsTrigger>
                <TabsTrigger value="vehiculo">Vehiculo</TabsTrigger>
                <TabsTrigger value="equipamiento">Equipamiento</TabsTrigger>
                <TabsTrigger value="dimensiones">Dimensiones</TabsTrigger>
                <TabsTrigger value="control">Control operativo</TabsTrigger>
                <TabsTrigger value="combustible">Combustible</TabsTrigger>
                <TabsTrigger value="documentos">Documentos</TabsTrigger>
              </TabsList>

              <TabsContent value="base" className="pt-5">
                <FichaGrid>
                  <DatoInventario label="ID inventario" value={detalle.activoId} />
                  <DatoInventario label="Codigo" value={detalle.codigoActivo} />
                  <DatoInventario
                    label="Tipo activo"
                    value={formatear(activo?.tipoActivo ?? detalle.tipoActivo)}
                  />
                  <DatoInventario
                    label="Descripcion"
                    value={activo?.descripcion ?? detalle.descripcionActivo}
                  />
                  <DatoInventario
                    label="Ubicacion"
                    value={activo?.ubicacion ?? detalle.ubicacionEsperada}
                  />
                  <DatoInventario
                    label="Estado activo"
                    value={formatearEstadoActivo(activo?.estadoActivo ?? detalle.estadoActivo)}
                  />
                  <DatoInventario label="Observacion" value={activo?.observacion} />
                </FichaGrid>
              </TabsContent>

              <TabsContent value="adquisicion" className="pt-5">
                <FichaGrid>
                  <DatoInventario
                    label="Valor de unidad"
                    value={formatearMonto(activo?.valorUnidad, activo?.moneda)}
                  />
                  <DatoInventario label="Moneda" value={activo?.moneda} />
                  <DatoInventario label="Proveedor" value={activo?.proveedor} />
                  <DatoInventario
                    label="Numero factura"
                    value={activo?.numeroFactura}
                  />
                  <DatoInventario
                    label="Fecha factura"
                    value={formatearFechaCorta(activo?.fechaFactura)}
                  />
                </FichaGrid>
              </TabsContent>

              <TabsContent value="vehiculo" className="pt-5">
                <FichaGrid>
                  <DatoInventario label="Clase" value={vehiculo?.plantillaInventario} />
                  <DatoInventario label="Placa" value={vehiculo?.placa ?? detalle.placa} />
                  <DatoInventario label="Marca" value={vehiculo?.marca ?? detalle.marca} />
                  <DatoInventario label="Modelo" value={vehiculo?.modelo ?? detalle.modelo} />
                  <DatoInventario label="Ano fabricacion" value={vehiculo?.anioFabricacion} />
                  <DatoInventario label="Color" value={vehiculo?.color} />
                  <DatoInventario
                    label="Carroceria"
                    value={vehiculo?.carroceria ?? detalle.carroceria}
                  />
                  <DatoInventario label="Ejes" value={vehiculo?.ejes} />
                  <DatoInventario label="Categoria" value={vehiculo?.categoria} />
                  <DatoInventario label="Serie chasis" value={vehiculo?.serieChasis} />
                  <DatoInventario label="Serie motor" value={vehiculo?.serieMotor} />
                </FichaGrid>
              </TabsContent>

              <TabsContent value="equipamiento" className="pt-5">
                <FichaGrid>
                  <DatoInventario label="Radio comunicacion" value={vehiculo?.radioComunicacion} />
                  <DatoInventario label="Autorradio" value={vehiculo?.autorradio} />
                  <DatoInventario label="Llantas repuesto" value={vehiculo?.llantasRepuesto} />
                  <DatoInventario label="Camara" value={vehiculo?.camara} />
                  <DatoInventario label="Tablet" value={vehiculo?.tablet} />
                  <DatoInventario label="Dispositivos seguridad" value={vehiculo?.dispositivosSeguridad} />
                  <DatoInventario label="Caja herramientas" value={vehiculo?.cajaHerramientas} />
                  <DatoInventario label="Jaula antivuelco" value={vehiculo?.jaulaAntivuelco} />
                  <DatoInventario label="Carriboy" value={vehiculo?.carriboy} />
                  <DatoInventario label="Baranda" value={vehiculo?.baranda} />
                  <DatoInventario label="Mamparon" value={vehiculo?.mamparon} />
                </FichaGrid>
              </TabsContent>

              <TabsContent value="dimensiones" className="pt-5">
                <FichaGrid>
                  <DatoInventario label="Ancho" value={vehiculo?.ancho} />
                  <DatoInventario label="Longitud" value={vehiculo?.longitud} />
                  <DatoInventario label="Alto" value={vehiculo?.alto} />
                  <DatoInventario label="Tipo suspension" value={vehiculo?.tipoSuspension} />
                  <DatoInventario label="Tipo tornamesa" value={vehiculo?.tipoTornamesa} />
                  <DatoInventario label="Clase Euro / NEC" value={vehiculo?.claseEuro} />
                  <DatoInventario label="Ratio corona" value={vehiculo?.ratioCorona} />
                  <DatoInventario label="Tipo transmision" value={vehiculo?.tipoTransmision} />
                </FichaGrid>
              </TabsContent>

              <TabsContent value="control" className="pt-5">
                <FichaGrid>
                  <DatoInventario
                    label="Condicion activo"
                    value={formatear(vehiculo?.estadoOperativo ?? detalle.estadoOperativo)}
                  />
                  <DatoInventario
                    label="Estado calibracion"
                    value={formatear(vehiculo?.estadoCalibracion ?? detalle.estadoCalibracion)}
                  />
                  <DatoInventario label="Factor correccion" value={vehiculo?.factorCorreccion} />
                  <DatoInventario label="Capacidad tanque galones" value={vehiculo?.capacidadTanqueGalones} />
                  <DatoInventario label="Ubicacion esperada" value={activo?.ubicacion ?? detalle.ubicacionEsperada} />
                  <DatoInventario label="Ubicacion encontrada" value={ubicacion} />
                </FichaGrid>
              </TabsContent>

              <TabsContent value="combustible" className="pt-5">
                {tanquesQuery.isLoading ? (
                  <div className="rounded-xl border border-border px-4 py-8 text-center text-sm text-muted-foreground">
                    Cargando tanques del activo...
                  </div>
                ) : (
                  <TanquesActivo
                    codigo={detalle.codigoActivo}
                    editable={false}
                    tanques={tanques}
                  />
                )}
              </TabsContent>

              <TabsContent value="documentos" className="pt-5">
                {documentosQuery.isLoading ? (
                  <div className="rounded-xl border border-border px-4 py-8 text-center text-sm text-muted-foreground">
                    Cargando documentos del activo...
                  </div>
                ) : (
                  <DocumentosActivo
                    codigo={detalle.codigoActivo}
                    documentos={documentos}
                    editable={false}
                  />
                )}
              </TabsContent>

            </Tabs>
            {imagenesQuery.isLoading ? (
              <div className="mt-6 rounded-xl border border-border px-4 py-8 text-center text-sm text-muted-foreground">
                Cargando imagenes del activo...
              </div>
            ) : (
              <ImagenesActivo
                codigo={detalle.codigoActivo}
                imagenes={imagenes}
                editable={false}
                embedded
              />
            )}
            <TrazabilidadInventarioActivo
              detalle={detalle}
              snapshots={snapshotsHistoricos}
              cargandoSnapshots={cargandoSnapshots}
              errorSnapshots={errorSnapshots}
            />
          </CardContent>
        </Card>

        <div className="grid content-start gap-5">
          <Card className="order-2 self-start">
            <CardHeader>
              <CardTitle>Registro del inventario</CardTitle>
            </CardHeader>
            <CardContent>
              <FichaGrid>
                <DatoInventario label="Activo ID" value={detalle.activoId} />
                <DatoInventario
                  label="Fecha revision"
                  value={formatearFecha(detalle.fechaRevision)}
                />
                <DatoInventario
                  label="Usuario revision"
                  value={detalle.usuarioRevision}
                />
                <DatoInventario
                  label="Ultima actualizacion"
                  value={formatearFecha(detalle.updatedAt)}
                />
              </FichaGrid>
            </CardContent>
          </Card>

          <Card className="order-1 self-start">
            <CardHeader>
              <CardTitle>Resultado fisico</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-medium">Resultado</span>
                <select
                  value={estado}
                  onChange={(event) =>
                    setEstado(event.target.value as EstadoRevisionInventario)
                  }
                  disabled={disabled}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                >
                  <option value="PENDIENTE">Seleccionar resultado</option>
                  {RESULTADOS_REVISION.map((item) => (
                    <option key={item} value={item}>
                      {formatear(item)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium">
                  Ubicacion encontrada
                </span>
                <input
                  value={ubicacion}
                  onChange={(event) => setUbicacion(event.target.value)}
                  disabled={disabled}
                  placeholder="Ubicacion real"
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium">Observacion</span>
                <textarea
                  value={observacion}
                  onChange={(event) => setObservacion(event.target.value)}
                  disabled={disabled}
                  placeholder="Detalle de la constatacion"
                  className="min-h-20 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                />
              </label>

              <DiferenciaInventario
                detalle={detalle}
                estado={estado}
                ubicacionEncontrada={ubicacion}
              />
              <Button
                type="button"
                onClick={guardar}
                disabled={disabled || guardando || estado === "PENDIENTE"}
              >
                <Save className="size-4" />
                {guardando ? "Guardando..." : "Guardar revision"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FichaGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

function EstadoCard({
  titulo,
  valor,
  className,
}: {
  titulo: string;
  valor: string;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-border p-6 ${className ?? ""}`}>
      <p className="text-sm text-muted-foreground">{titulo}</p>
      <Badge className="mt-3 w-fit" variant="destructive">
        {valor || "-"}
      </Badge>
    </div>
  );
}

function DatoInventario({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) {
  const display =
    value === null || value === undefined || value === "" ? "-" : value;

  return (
    <div className="grid gap-1">
      <span className="text-xs uppercase text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{display}</span>
    </div>
  );
}

function TextoDato({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <span className="grid grid-cols-[86px_1fr] gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value || "-"}</span>
    </span>
  );
}

function HistorialInventario({
  eventos,
}: {
  eventos: InventarioFisicoHistorial[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial del inventario</CardTitle>
        <CardDescription>
          Acciones registradas dentro del proceso de inventario fisico.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {eventos.length ? (
          <div className="grid gap-3">
            {eventos.map((evento) => (
              <div
                key={evento.id}
                className="rounded-xl border border-border p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <History className="size-4 text-muted-foreground" />
                      <span className="font-semibold">
                        {formatearAccionInventario(evento.accion)}
                      </span>
                      {evento.referenciaCodigo ? (
                        <Badge variant="outline">
                          {evento.referenciaCodigo}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {evento.motivo || describirEventoInventario(evento)}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground md:text-right">
                    <p>{formatearFecha(evento.createdAt)}</p>
                    <p>Usuario: {evento.usuario || "-"}</p>
                  </div>
                </div>

                {evento.campo || evento.valorAnterior || evento.valorNuevo ? (
                  <div className="mt-4 grid gap-3 rounded-lg bg-muted/30 p-3 text-sm md:grid-cols-3">
                    <TextoDato label="Campo" value={evento.campo} />
                    <TextoDato label="Antes" value={evento.valorAnterior} />
                    <TextoDato label="Despues" value={evento.valorNuevo} />
                  </div>
                ) : null}

                {evento.metadata ? (
                  <ResumenMetadataInventario metadata={evento.metadata} />
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            Este inventario aun no tiene historial registrado.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TrazabilidadInventarioActivo({
  detalle,
  snapshots,
  cargandoSnapshots,
  errorSnapshots,
}: {
  detalle: InventarioFisicoDetalle;
  snapshots: SnapshotHistoricoActivoInventario[];
  cargandoSnapshots: boolean;
  errorSnapshots: string | null;
}) {
  return (
    <section className="mt-6 border-t border-border pt-6">
      <div className="mb-4">
        <h3 className="font-semibold">Trazabilidad del inventario</h3>
        <p className="text-sm text-muted-foreground">
          Consulta la foto tomada al aperturar este inventario y comparala con
          inventarios anteriores del mismo activo.
        </p>
      </div>
      <Tabs defaultValue="foto">
        <TabsList className="flex-wrap">
          <TabsTrigger value="foto">Foto de apertura</TabsTrigger>
          <TabsTrigger value="comparativo">Comparativo historico</TabsTrigger>
        </TabsList>
        <TabsContent value="foto" className="pt-5">
          <SnapshotInventario detalle={detalle} />
        </TabsContent>
        <TabsContent value="comparativo" className="pt-5">
          <ComparativoHistoricoInventario
            detalle={detalle}
            snapshots={snapshots}
            cargando={cargandoSnapshots}
            error={errorSnapshots}
          />
        </TabsContent>
      </Tabs>
    </section>
  );
}

function SnapshotInventario({ detalle }: { detalle: InventarioFisicoDetalle }) {
  const snapshot = detalle.snapshotActivo ?? null;
  const vehiculo = obtenerObjetoSnapshot(snapshot, "vehiculo");
  const documentos = obtenerListaSnapshot(snapshot, "documentos");
  const imagenes = obtenerListaSnapshot(snapshot, "imagenes");
  const tanques = obtenerListaSnapshot(snapshot, "tanques");
  const equipamiento = obtenerListaSnapshot(snapshot, "equipamiento");

  if (!snapshot) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
        Este detalle no tiene snapshot historico. Probablemente pertenece a un
        inventario creado antes de la migracion.
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="rounded-xl border border-border bg-muted/20 p-4">
        <p className="text-sm font-medium">Foto de apertura</p>
        <p className="text-sm text-muted-foreground">
          Foto del activo guardada al aperturar el inventario. Esta informacion
          no cambia aunque el maestro vivo sea editado despues.
        </p>
        <Badge className="mt-3 w-fit" variant="outline">
          Fecha snapshot: {formatearFecha(detalle.snapshotFecha)}
        </Badge>
      </div>

      <section className="grid gap-3">
        <h3 className="font-semibold">Base</h3>
        <FichaGrid>
          <DatoInventario label="Codigo" value={leerSnapshot(snapshot, "codigo")} />
          <DatoInventario
            label="Descripcion"
            value={leerSnapshot(snapshot, "descripcion")}
          />
          <DatoInventario
            label="Tipo activo"
            value={formatear(leerSnapshot(snapshot, "tipoActivo"))}
          />
          <DatoInventario
            label="Ubicacion"
            value={leerSnapshot(snapshot, "ubicacion")}
          />
          <DatoInventario
            label="Estado activo"
            value={formatearEstadoActivo(leerSnapshot(snapshot, "estadoActivo"))}
          />
          <DatoInventario
            label="Observacion"
            value={leerSnapshot(snapshot, "observacion")}
          />
        </FichaGrid>
      </section>

      <section className="grid gap-3">
        <h3 className="font-semibold">Vehiculo</h3>
        <FichaGrid>
          <DatoInventario
            label="Clase"
            value={leerSnapshot(vehiculo, "plantillaInventario")}
          />
          <DatoInventario label="Placa" value={leerSnapshot(vehiculo, "placa")} />
          <DatoInventario label="Marca" value={leerSnapshot(vehiculo, "marca")} />
          <DatoInventario label="Modelo" value={leerSnapshot(vehiculo, "modelo")} />
          <DatoInventario
            label="Carroceria"
            value={leerSnapshot(vehiculo, "carroceria")}
          />
          <DatoInventario label="Ejes" value={leerSnapshot(vehiculo, "ejes")} />
          <DatoInventario
            label="Categoria"
            value={leerSnapshot(vehiculo, "categoria")}
          />
          <DatoInventario
            label="Serie chasis"
            value={leerSnapshot(vehiculo, "serieChasis")}
          />
          <DatoInventario
            label="Serie motor"
            value={leerSnapshot(vehiculo, "serieMotor")}
          />
          <DatoInventario
            label="Condicion activo"
            value={formatear(leerSnapshot(vehiculo, "estadoOperativo"))}
          />
          <DatoInventario
            label="Calibracion"
            value={formatear(leerSnapshot(vehiculo, "estadoCalibracion"))}
          />
        </FichaGrid>
      </section>

      <SnapshotLista titulo="Documentos" items={documentos} />
      <SnapshotLista titulo="Imagenes" items={imagenes} />
      <SnapshotLista titulo="Tanques" items={tanques} />
      <SnapshotLista titulo="Equipamiento" items={equipamiento} />
    </div>
  );
}

function SnapshotLista({
  titulo,
  items,
}: {
  titulo: string;
  items: Record<string, unknown>[];
}) {
  return (
    <section className="grid gap-3">
      <h3 className="font-semibold">{titulo}</h3>
      {items.length ? (
        <div className="grid gap-2">
          {items.map((item, index) => (
            <div
              key={`${titulo}-${index}`}
              className="rounded-lg border border-border p-3 text-sm"
            >
              <p className="font-medium">
                {obtenerTituloSnapshotItem(item, titulo, index)}
              </p>
              <div className="mt-2 grid gap-2 text-xs md:grid-cols-3">
                {obtenerCamposSnapshotItem(item, titulo).map((campo) => (
                  <TextoDato
                    key={campo.label}
                    label={campo.label}
                    value={campo.value}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          Sin registros en snapshot.
        </div>
      )}
    </section>
  );
}

function ComparativoHistoricoInventario({
  detalle,
  snapshots,
  cargando,
  error,
}: {
  detalle: InventarioFisicoDetalle;
  snapshots: SnapshotHistoricoActivoInventario[];
  cargando: boolean;
  error: string | null;
}) {
  const [snapshotId, setSnapshotId] = React.useState<string>("");

  React.useEffect(() => {
    setSnapshotId((actual) => {
      if (actual && snapshots.some((item) => String(item.detalleId) === actual)) {
        return actual;
      }

      return snapshots[0] ? String(snapshots[0].detalleId) : "";
    });
  }, [snapshots]);

  if (cargando) {
    return (
      <div className="rounded-xl border border-border px-4 py-10 text-center text-sm text-muted-foreground">
        Cargando inventarios anteriores del activo...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!snapshots.length) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
        Este activo aun no tiene snapshots en inventarios anteriores.
      </div>
    );
  }

  const seleccionado =
    snapshots.find((item) => String(item.detalleId) === snapshotId) ??
    snapshots[0];
  const filas = construirFilasComparativo(
    seleccionado.snapshotActivo,
    detalle.snapshotActivo
  );

  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <span className="text-sm font-medium">Inventario anterior</span>
        <select
          value={String(seleccionado.detalleId)}
          onChange={(event) => setSnapshotId(event.target.value)}
          className="h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          {snapshots.map((snapshot) => (
            <option key={snapshot.detalleId} value={snapshot.detalleId}>
              {snapshot.codigoInventario} - {snapshot.nombreInventario} -{" "}
              {formatearFecha(snapshot.fechaApertura)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-muted/20 p-4 md:grid-cols-3">
        <DatoInventario
          label="Inventario anterior"
          value={seleccionado.codigoInventario}
        />
        <DatoInventario
          label="Estado inventario"
          value={formatear(seleccionado.estadoInventario)}
        />
        <DatoInventario
          label="Resultado fisico"
          value={formatear(seleccionado.estadoRevision)}
        />
        <DatoInventario
          label="Fecha apertura"
          value={formatearFecha(seleccionado.fechaApertura)}
        />
        <DatoInventario
          label="Ubicacion encontrada"
          value={seleccionado.ubicacionEncontrada}
        />
        <DatoInventario
          label="Observacion"
          value={seleccionado.observacion}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campo</TableHead>
              <TableHead>Inventario anterior</TableHead>
              <TableHead>Inventario actual</TableHead>
              <TableHead>Diferencia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas.map((fila) => (
              <TableRow key={fila.campo}>
                <TableCell className="font-medium">{fila.campo}</TableCell>
                <TableCell>{fila.anterior || "-"}</TableCell>
                <TableCell>{fila.actual || "-"}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      fila.diferente
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    }
                  >
                    {fila.diferente ? "Cambio" : "Igual"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="rounded-xl border border-border bg-muted/20 p-4">
        <p className="font-medium">Resumen del snapshot anterior</p>
        <FichaGrid>
          <DatoInventario
            label="Codigo"
            value={leerSnapshot(seleccionado.snapshotActivo, "codigo")}
          />
          <DatoInventario
            label="Descripcion"
            value={leerSnapshot(seleccionado.snapshotActivo, "descripcion")}
          />
          <DatoInventario
            label="Ubicacion"
            value={leerSnapshot(seleccionado.snapshotActivo, "ubicacion")}
          />
          <DatoInventario
            label="Estado activo"
            value={formatearEstadoActivo(
              leerSnapshot(seleccionado.snapshotActivo, "estadoActivo")
            )}
          />
        </FichaGrid>
      </div>
    </div>
  );
}

function construirFilasComparativo(actualAnterior: unknown, actual: unknown) {
  const campos = [
    { campo: "Codigo", path: ["codigo"] },
    { campo: "Descripcion", path: ["descripcion"] },
    { campo: "Ubicacion", path: ["ubicacion"] },
    { campo: "Estado activo", path: ["estadoActivo"] },
    { campo: "Placa", path: ["vehiculo", "placa"] },
    { campo: "Clase", path: ["vehiculo", "plantillaInventario"] },
    { campo: "Carroceria", path: ["vehiculo", "carroceria"] },
    { campo: "Marca", path: ["vehiculo", "marca"] },
    { campo: "Modelo", path: ["vehiculo", "modelo"] },
    { campo: "Serie chasis", path: ["vehiculo", "serieChasis"] },
    { campo: "Serie motor", path: ["vehiculo", "serieMotor"] },
    { campo: "Ejes", path: ["vehiculo", "ejes"] },
    { campo: "Categoria", path: ["vehiculo", "categoria"] },
    { campo: "Condicion activo", path: ["vehiculo", "estadoOperativo"] },
    { campo: "Calibracion", path: ["vehiculo", "estadoCalibracion"] },
  ];

  return campos.map((item) => {
    const anterior = formatearValorComparativo(
      leerRutaSnapshot(actualAnterior, item.path)
    );
    const valorActual = formatearValorComparativo(
      leerRutaSnapshot(actual, item.path)
    );

    return {
      campo: item.campo,
      anterior,
      actual: valorActual,
      diferente:
        normalizarComparacion(anterior) !== normalizarComparacion(valorActual),
    };
  });
}

function leerRutaSnapshot(snapshot: unknown, path: string[]) {
  let actual = snapshot;

  for (const key of path) {
    if (!actual || typeof actual !== "object") {
      return null;
    }

    actual = (actual as Record<string, unknown>)[key];
  }

  return actual;
}

function formatearValorComparativo(value: unknown) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "object") return "";
  return String(value);
}

function leerSnapshot(snapshot: unknown, key: string) {
  if (!snapshot || typeof snapshot !== "object") return null;
  const value = (snapshot as Record<string, unknown>)[key];
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "object") return null;
  return String(value);
}

function obtenerObjetoSnapshot(snapshot: unknown, key: string) {
  if (!snapshot || typeof snapshot !== "object") return null;
  const value = (snapshot as Record<string, unknown>)[key];
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function obtenerListaSnapshot(snapshot: unknown, key: string) {
  if (!snapshot || typeof snapshot !== "object") return [];
  const value = (snapshot as Record<string, unknown>)[key];
  return Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> =>
          item !== null && typeof item === "object" && !Array.isArray(item)
      )
    : [];
}

function obtenerTituloSnapshotItem(
  item: Record<string, unknown>,
  titulo: string,
  index: number
) {
  const candidatos = [
    item.nombre,
    item.tipoDocumento,
    item.tipoImagen,
    item.tipoTanque,
    item.numero,
  ];
  const valor = candidatos.find(
    (candidate) => typeof candidate === "string" && candidate.trim()
  );

  return valor ? String(valor) : `${titulo} ${index + 1}`;
}

function obtenerCamposSnapshotItem(
  item: Record<string, unknown>,
  titulo: string
) {
  if (titulo === "Documentos") {
    return [
      { label: "Estado", value: valorItem(item.estadoDocumento) },
      { label: "Numero", value: valorItem(item.numero) },
      { label: "Vencimiento", value: formatearFechaCorta(valorItem(item.fechaVencimiento)) },
    ];
  }

  if (titulo === "Imagenes") {
    return [
      { label: "Descripcion", value: valorItem(item.descripcion) },
      { label: "Orden", value: valorItem(item.orden) },
    ];
  }

  if (titulo === "Tanques") {
    return [
      { label: "Capacidad", value: valorItem(item.capacidad) },
      { label: "Unidad", value: valorItem(item.unidadMedida) },
      { label: "Observacion", value: valorItem(item.observacion) },
    ];
  }

  return [
    { label: "Estado", value: valorItem(item.estado) },
    { label: "Descripcion", value: valorItem(item.descripcion) },
    { label: "Observacion", value: valorItem(item.observacion) },
  ];
}

function valorItem(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "object") return null;
  return String(value);
}

function ResumenMetadataInventario({ metadata }: { metadata: unknown }) {
  if (!metadata || typeof metadata !== "object") return null;

  const data = metadata as Record<string, unknown>;
  const campos = [
    { label: "Activos snapshot", value: valorItem(data.activosSnapshot) },
    { label: "Fecha apertura", value: formatearFecha(valorItem(data.fechaApertura)) },
    { label: "Ubicacion anterior", value: valorItem(data.ubicacionAnterior) },
    { label: "Ubicacion encontrada", value: valorItem(data.ubicacionEncontrada) },
    { label: "Observacion anterior", value: valorItem(data.observacionAnterior) },
    { label: "Fecha cierre", value: formatearFecha(valorItem(data.fechaCierre)) },
  ].filter((item) => item.value);

  if (!campos.length) return null;

  return (
    <div className="mt-3 grid gap-2 rounded-lg border border-border bg-muted/20 p-3 text-xs md:grid-cols-3">
      {campos.map((campo) => (
        <TextoDato key={campo.label} label={campo.label} value={campo.value} />
      ))}
    </div>
  );
}

function formatearAccionInventario(value: string) {
  return formatear(value);
}

function describirEventoInventario(evento: InventarioFisicoHistorial) {
  if (evento.accion === "INVENTARIO_APERTURADO") {
    const cantidad = evento.metadata?.activosSnapshot;
    return `Se aperturo el inventario${
      typeof cantidad === "number" ? ` con ${cantidad} activos en snapshot` : ""
    }.`;
  }

  if (evento.accion === "INVENTARIO_CERRADO") {
    return "Se cerro el inventario fisico.";
  }

  if (evento.accion.includes("REVISION_ACTIVO")) {
    return `Se registro revision del activo ${evento.referenciaCodigo ?? ""}.`;
  }

  return "Evento registrado en inventario.";
}

function DiferenciaInventario({
  detalle,
  estado,
  ubicacionEncontrada,
}: {
  detalle: InventarioFisicoDetalle;
  estado: EstadoRevisionInventario;
  ubicacionEncontrada: string;
}) {
  const diferencia = obtenerDiferenciaInventario(
    detalle,
    estado,
    ubicacionEncontrada
  );

  return (
    <Badge
      variant="outline"
      className={
        diferencia.tipo === "ok"
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : diferencia.tipo === "alerta"
            ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
            : diferencia.tipo === "error"
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : ""
      }
    >
      {diferencia.label}
    </Badge>
  );
}

function obtenerDiferenciaInventario(
  detalle: InventarioFisicoDetalle,
  estado: EstadoRevisionInventario,
  ubicacionEncontrada: string
) {
  if (estado === "FALTANTE") {
    return { label: "No ubicado", tipo: "error" as const };
  }

  if (estado === "OBSERVADO") {
    return { label: "Observado", tipo: "alerta" as const };
  }

  if (estado === "NO_APLICA") {
    return { label: "No aplica", tipo: "neutral" as const };
  }

  if (estado === "PENDIENTE") {
    return { label: "Pendiente", tipo: "neutral" as const };
  }

  const esperada = normalizarComparacion(detalle.ubicacionEsperada);
  const encontrada = normalizarComparacion(ubicacionEncontrada);

  if (esperada && encontrada && esperada !== encontrada) {
    return { label: "Ubicacion diferente", tipo: "alerta" as const };
  }

  return { label: "Coincide", tipo: "ok" as const };
}

function normalizarComparacion(value?: string | null) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatearFecha(value?: string | null) {
  if (!value) return "-";

  const fecha = new Date(value);

  if (Number.isNaN(fecha.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Lima",
  }).format(fecha);
}

function formatearFechaCorta(value?: string | null) {
  if (!value) return null;

  const fecha = new Date(value);

  if (Number.isNaN(fecha.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(fecha);
}

function formatearMonto(
  value: number | null | undefined,
  moneda: string | null | undefined
) {
  if (value === null || value === undefined) return null;

  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: moneda || "PEN",
  }).format(value);
}

function formatearEstadoActivo(value?: string | null) {
  if (value === "ACTIVO") return "Activo";
  if (value === "SINIESTRADO") return "Baja / Siniestro";
  if (value === "INACTIVO") return "Baja / De baja";
  return value ?? "-";
}

function construirDetallesInventario(
  inventario: InventarioFisico,
  activosMaestro: Activo[]
): InventarioFisicoDetalle[] {
  const detallesPorActivo = new Map<number, InventarioFisicoDetalle>();

  for (const detalle of inventario.detalles) {
    detallesPorActivo.set(detalle.activoId, detalle);
  }

  const vehiculosVigentes = activosMaestro.filter(
    (activo) => activo.tipoActivo === "VEHICULO" && activo.estadoRegistro !== false
  );

  const detallesDesdeMaestro = vehiculosVigentes.map((activo) => {
    const existente = detallesPorActivo.get(activo.id);

    if (existente) {
      return existente;
    }

    const vehiculo = activo.vehiculo;

    return {
      id: null,
      inventarioId: inventario.id,
      activoId: activo.id,
      estadoRevision: "PENDIENTE",
      codigoActivo: activo.codigo,
      descripcionActivo: activo.descripcion,
      tipoActivo: activo.tipoActivo,
      estadoActivo: activo.estadoActivo,
      marca: vehiculo?.marca ?? null,
      modelo: vehiculo?.modelo ?? null,
      carroceria: vehiculo?.carroceria ?? null,
      estadoOperativo: vehiculo?.estadoOperativo ?? null,
      estadoCalibracion: vehiculo?.estadoCalibracion ?? null,
      placa: vehiculo?.placa ?? null,
      ubicacionEsperada: activo.ubicacion,
      ubicacionEncontrada: null,
      snapshotActivo: {
        id: activo.id,
        codigo: activo.codigo,
        tipoActivo: activo.tipoActivo,
        descripcion: activo.descripcion,
        ubicacion: activo.ubicacion,
        estadoActivo: activo.estadoActivo,
        estadoRegistro: activo.estadoRegistro,
        vehiculo: vehiculo ?? null,
      },
      snapshotFecha: inventario.fechaApertura,
      observacion: null,
      usuarioRevision: null,
      fechaRevision: null,
      createdAt: inventario.createdAt,
      updatedAt: inventario.updatedAt,
    } satisfies InventarioFisicoDetalle;
  });

  const idsMaestro = new Set(vehiculosVigentes.map((activo) => activo.id));
  const detallesFueraDelMaestro = inventario.detalles.filter(
    (detalle) => !idsMaestro.has(detalle.activoId)
  );

  return [...detallesDesdeMaestro, ...detallesFueraDelMaestro];
}

function obtenerDetalleKey(detalle: InventarioFisicoDetalle) {
  return detalle.id === null
    ? `pendiente-${detalle.activoId}`
    : `detalle-${detalle.id}`;
}

function formatear(value?: unknown) {
  if (!value) return "-";
  return String(value)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
