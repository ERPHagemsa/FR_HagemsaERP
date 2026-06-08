"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
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
  registrarRevisionInventarioFisico,
} from "../servicios/activos-api";
import type {
  Activo,
  EstadoRevisionInventario,
  InventarioFisico,
  InventarioFisicoDetalle,
} from "../tipos/activo.tipos";

const ESTADOS_REVISION: EstadoRevisionInventario[] = [
  "PENDIENTE",
  "ENCONTRADO",
  "FALTANTE",
  "OBSERVADO",
  "NO_APLICA",
];

export function InventarioFisicoDetallePanel({
  inventarioInicial,
  activosMaestro,
}: {
  inventarioInicial: InventarioFisico;
  activosMaestro: Activo[];
}) {
  const [inventario, setInventario] = React.useState(inventarioInicial);
  const [busqueda, setBusqueda] = React.useState("");
  const [estadoFiltro, setEstadoFiltro] =
    React.useState<EstadoRevisionInventario | "TODOS">("TODOS");
  const [pagina, setPagina] = React.useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = React.useState(10);
  const [error, setError] = React.useState<string | null>(null);
  const [cerrando, setCerrando] = React.useState(false);

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
      estadoFiltro === "TODOS" || detalle.estadoRevision === estadoFiltro;

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

  React.useEffect(() => {
    setPagina(1);
  }, [busqueda, estadoFiltro, detallesBase.length, registrosPorPagina]);

  const resumen = {
    total: detallesBase.length,
    pendientes: detallesBase.filter(
      (detalle) => detalle.estadoRevision === "PENDIENTE"
    ).length,
    encontrados: detallesBase.filter(
      (detalle) => detalle.estadoRevision === "ENCONTRADO"
    ).length,
    faltantes: detallesBase.filter(
      (detalle) => detalle.estadoRevision === "FALTANTE"
    ).length,
    observados: detallesBase.filter(
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
            <Badge variant="outline">{resumen.total} activos</Badge>
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
          {inventario.estado !== "CERRADO" ? (
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

      <div className="grid gap-4 md:grid-cols-5">
        <ResumenCard label="Total" value={resumen.total} />
        <ResumenCard label="Pendientes" value={resumen.pendientes} />
        <ResumenCard label="Encontrados" value={resumen.encontrados} />
        <ResumenCard label="Faltantes" value={resumen.faltantes} danger />
        <ResumenCard label="Observados" value={resumen.observados} />
      </div>

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
                setEstadoFiltro(
                  event.target.value as EstadoRevisionInventario | "TODOS"
                )
              }
              className="h-10 rounded-full border border-input bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="TODOS">Todos los estados</option>
              {ESTADOS_REVISION.map((estado) => (
                <option key={estado} value={estado}>
                  {formatear(estado)}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activo</TableHead>
                  <TableHead>Datos del maestro</TableHead>
                  <TableHead>Revision</TableHead>
                  <TableHead>Ubicacion encontrada</TableHead>
                  <TableHead>Conciliacion</TableHead>
                  <TableHead>Observacion</TableHead>
                  <TableHead className="text-right">Accion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detallesVisibles.map((detalle) => (
                  <DetalleRow
                    key={obtenerDetalleKey(detalle)}
                    detalle={detalle}
                    disabled={inventario.estado === "CERRADO"}
                    onGuardar={guardarDetalle}
                  />
                ))} 
                {!detallesFiltrados.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
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
                {detallesFiltrados.length} activos
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
    </section>
  );
}

function DetalleRow({
  detalle,
  disabled,
  onGuardar,
}: {
  detalle: InventarioFisicoDetalle;
  disabled: boolean;
  onGuardar: (
    detalle: InventarioFisicoDetalle,
    payload: {
      estadoRevision: EstadoRevisionInventario;
      ubicacionEncontrada?: string;
      observacion?: string;
    }
  ) => Promise<void>;
}) {
  const [estado, setEstado] = React.useState(detalle.estadoRevision);
  const [ubicacion, setUbicacion] = React.useState(
    detalle.ubicacionEncontrada ?? ""
  );
  const [observacion, setObservacion] = React.useState(
    detalle.observacion ?? ""
  );
  const [guardando, setGuardando] = React.useState(false);

  React.useEffect(() => {
    setEstado(detalle.estadoRevision);
    setUbicacion(detalle.ubicacionEncontrada ?? "");
    setObservacion(detalle.observacion ?? "");
  }, [detalle]);

  async function guardar() {
    setGuardando(true);
    try {
      await onGuardar(detalle, {
        estadoRevision: estado,
        ubicacionEncontrada: ubicacion,
        observacion,
      });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <TableRow>
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
        <select
          value={estado}
          onChange={(event) =>
            setEstado(event.target.value as EstadoRevisionInventario)
          }
          disabled={disabled}
          className="h-9 rounded-full border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
        >
          {ESTADOS_REVISION.map((item) => (
            <option key={item} value={item}>
              {formatear(item)}
            </option>
          ))}
        </select>
      </TableCell>
      <TableCell className="align-top">
        <input
          value={ubicacion}
          onChange={(event) => setUbicacion(event.target.value)}
          disabled={disabled}
          placeholder="Ubicacion real"
          className="h-9 w-full rounded-full border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
        />
      </TableCell>
      <TableCell className="align-top">
        <DiferenciaInventario
          detalle={detalle}
          estado={estado}
          ubicacionEncontrada={ubicacion}
        />
      </TableCell>
      <TableCell className="align-top">
        <input
          value={observacion}
          onChange={(event) => setObservacion(event.target.value)}
          disabled={disabled}
          placeholder="Observacion"
          className="h-9 w-full rounded-full border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
        />
      </TableCell>
      <TableCell className="align-top text-right">
        <Button
          variant="outline"
          size="sm"
          onClick={guardar}
          disabled={disabled || guardando}
        >
          <Save className="size-4" />
          {guardando ? "Guardando" : "Guardar"}
        </Button>
      </TableCell>
    </TableRow>
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

function ResumenCard({
  label,
  value,
  danger,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
        <span
          className={`flex size-10 items-center justify-center rounded-xl border ${
            danger
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-primary/30 bg-primary/10 text-primary"
          }`}
        >
          {danger ? <CircleAlert className="size-5" /> : <CheckCircle2 className="size-5" />}
        </span>
      </CardContent>
    </Card>
  );
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

function formatear(value?: string | null) {
  if (!value) return "-";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
