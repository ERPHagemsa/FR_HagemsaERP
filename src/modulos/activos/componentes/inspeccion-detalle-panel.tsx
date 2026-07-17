"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  ClipboardCheck,
  Eye,
  FileSpreadsheet,
  FileText,
  History,
  Plus,
  QrCode,
  Save,
  Trash2,
} from "lucide-react";

import { useSesion } from "@/modulos/autenticacion/ganchos/use-sesion";
import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/compartido/componentes/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
import { Checkbox } from "@/compartido/componentes/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/compartido/componentes/ui/dialog";
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

import { LectorQrEtiqueta } from "./lector-qr-etiqueta";
import { InspeccionImagenes } from "./inspeccion-imagenes";
import { estadoInspeccionClassName } from "./inspecciones-listado";
import {
  cerrarInspeccion,
  descargarArchivoInspeccion,
  exportarInspeccionGlobal,
  exportarInspeccionPorActivo,
  registrarActivosInspeccion,
} from "../servicios/inspeccion-api";
import {
  useCandidatosInspeccionQuery,
  useSnapshotDetalleInspeccionQuery,
} from "../servicios/inspeccion-queries";
import {
  actualizarDatosOperativosDetalle,
  actualizarObservacionesDetalle,
} from "../servicios/inspeccion-api";
import type {
  CandidatoInspeccion,
  FormatoExportacionInspeccion,
  Inspeccion,
  InspeccionDetalle,
  InspeccionHistorial,
} from "../tipos/inspeccion.tipos";

export function InspeccionDetallePanel({
  inspeccionInicial,
}: {
  inspeccionInicial: Inspeccion;
}) {
  const { usuario } = useSesion();
  const usuarioActual = usuario?.nombreUsuario ?? "activos.web";
  const [inspeccion, setInspeccion] = React.useState(inspeccionInicial);
  const [busqueda, setBusqueda] = React.useState("");
  const [pagina, setPagina] = React.useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = React.useState(10);
  const [error, setError] = React.useState<string | null>(null);
  const [cerrando, setCerrando] = React.useState(false);
  const [confirmarCierreAbierto, setConfirmarCierreAbierto] = React.useState(false);
  const [modalRegistrarAbierto, setModalRegistrarAbierto] = React.useState(false);
  const [detalleSeleccionadoId, setDetalleSeleccionadoId] = React.useState<
    number | null
  >(null);
  const [exportando, setExportando] = React.useState<string | null>(null);

  const bloqueada = inspeccion.estado !== "ABIERTA";
  const detalleSeleccionado = inspeccion.detalles.find(
    (detalle) => detalle.id === detalleSeleccionadoId
  );
  const conObservaciones = inspeccion.detalles.filter(
    (detalle) => detalle.observaciones.length > 0
  ).length;

  const detallesFiltrados = inspeccion.detalles.filter((detalle) => {
    const query = busqueda.trim().toUpperCase();
    if (!query) return true;
    const valores = [
      detalle.codigoActivo,
      detalle.placa,
      detalle.marca,
      detalle.modelo,
      detalle.tipoActivo,
    ];
    return valores.some((valor) => valor?.toUpperCase().includes(query));
  });

  const totalPaginas = Math.max(
    1,
    Math.ceil(detallesFiltrados.length / registrosPorPagina)
  );
  const inicioPagina = (pagina - 1) * registrosPorPagina;
  const finPagina = inicioPagina + registrosPorPagina;
  const detallesVisibles = detallesFiltrados.slice(inicioPagina, finPagina);

  React.useEffect(() => {
    setPagina((actual) => Math.min(Math.max(actual, 1), totalPaginas));
  }, [totalPaginas]);

  async function cerrarInspeccionAction() {
    if (bloqueada) {
      setError("La inspeccion ya esta cerrada o anulada.");
      return;
    }

    setError(null);
    setCerrando(true);

    try {
      const actualizado = await cerrarInspeccion(inspeccion.id, {
        usuarioCierre: usuarioActual,
        observacion: `Cierre desde Inspeccion. Activos registrados: ${inspeccion.detalles.length}. Con observaciones: ${conObservaciones}.`,
      });
      setInspeccion(actualizado);
      setConfirmarCierreAbierto(false);
      toast.success("Inspeccion cerrada", {
        description: "La inspeccion quedo en modo solo lectura.",
      });
    } catch (err) {
      const mensaje =
        err instanceof Error ? err.message : "No se pudo cerrar la inspeccion";
      setError(mensaje);
      toast.error("No se pudo cerrar la inspeccion", { description: mensaje });
    } finally {
      setCerrando(false);
    }
  }

  async function exportarGlobal(formato: FormatoExportacionInspeccion) {
    const clave = `global-${formato}`;
    setExportando(clave);
    try {
      const blob = await exportarInspeccionGlobal(inspeccion.id, formato);
      descargarArchivoInspeccion(
        blob,
        `inspeccion-${inspeccion.id}.${formato === "excel" ? "xlsx" : "pdf"}`
      );
    } catch (err) {
      toast.error("No se pudo exportar la inspeccion", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setExportando(null);
    }
  }

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            N° de inspeccion {inspeccion.id}
          </p>
          <h1 className="text-2xl font-semibold">{inspeccion.responsable}</h1>
          <p className="text-sm text-muted-foreground">
            {inspeccion.descripcion || "Inspeccion de activos vehiculares (FT-AS-007)."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={estadoInspeccionClassName(inspeccion.estado)}
            >
              {formatear(inspeccion.estado)}
            </Badge>
            <Badge variant="outline">{inspeccion.detalles.length} activos registrados</Badge>
            <Badge variant="outline">{conObservaciones} con observaciones</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/activos/inspeccion">
              <ArrowLeft className="size-4" />
              Volver
            </Link>
          </Button>
          <Button
            variant="outline"
            disabled={exportando === "global-excel" || !inspeccion.detalles.length}
            onClick={() => exportarGlobal("excel")}
          >
            <FileSpreadsheet className="size-4" />
            {exportando === "global-excel" ? "Generando..." : "Excel"}
          </Button>
          <Button
            variant="outline"
            disabled={exportando === "global-pdf" || !inspeccion.detalles.length}
            onClick={() => exportarGlobal("pdf")}
          >
            <FileText className="size-4" />
            {exportando === "global-pdf" ? "Generando..." : "PDF"}
          </Button>
          {!bloqueada ? (
            <Button onClick={() => setConfirmarCierreAbierto(true)} disabled={cerrando}>
              <ClipboardCheck className="size-4" />
              {cerrando ? "Cerrando..." : "Cerrar inspeccion"}
            </Button>
          ) : null}
        </div>
      </div>

      <AlertDialog open={confirmarCierreAbierto} onOpenChange={setConfirmarCierreAbierto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cerrar inspeccion</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no es reversible: despues del cierre no se podran
              agregar o editar activos, observaciones ni imagenes. La
              inspeccion quedara disponible en modo solo lectura para consulta
              y exportacion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cerrando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={cerrarInspeccionAction} disabled={cerrando}>
              {cerrando ? "Cerrando..." : "Cerrar inspeccion"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {error ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {bloqueada ? (
        <div className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          Esta inspeccion esta {formatear(inspeccion.estado).toLowerCase()}. Puedes
          consultarla y exportarla, pero ya no editar activos, observaciones ni
          imagenes.
        </div>
      ) : null}

      {detalleSeleccionado ? (
        <FichaInspeccionActivo
          key={detalleSeleccionado.id}
          inspeccionId={inspeccion.id}
          detalle={detalleSeleccionado}
          disabled={bloqueada}
          usuarioActual={usuarioActual}
          onActualizado={(actualizado) => setInspeccion(actualizado)}
          onVolver={() => setDetalleSeleccionadoId(null)}
        />
      ) : (
        <Tabs defaultValue="activos">
          <TabsList className="w-fit">
            <TabsTrigger value="activos">Activos</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="activos" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>Activos de la inspeccion</CardTitle>
                  <CardDescription>
                    Registra activos y abre la ficha para llenar los campos de
                    inspeccion (FT-AS-007).
                  </CardDescription>
                </div>
                {!bloqueada ? (
                  <Button onClick={() => setModalRegistrarAbierto(true)}>
                    <Plus className="size-4" />
                    Registrar
                  </Button>
                ) : null}
              </CardHeader>
              <CardContent className="grid gap-4">
                <input
                  value={busqueda}
                  onChange={(event) => setBusqueda(event.target.value)}
                  placeholder="Buscar codigo, placa, marca o modelo"
                  className="h-10 w-full max-w-md rounded-full border border-input bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring"
                />

                <div className="overflow-hidden rounded-xl border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Codigo</TableHead>
                        <TableHead>Placa</TableHead>
                        <TableHead>Marca / Modelo</TableHead>
                        <TableHead>Color</TableHead>
                        <TableHead>Observaciones</TableHead>
                        <TableHead>Imagenes</TableHead>
                        <TableHead className="text-right">Accion</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detallesVisibles.map((detalle) => (
                        <TableRow key={detalle.id}>
                          <TableCell className="font-medium">
                            {detalle.codigoActivo}
                          </TableCell>
                          <TableCell>{detalle.placa || "-"}</TableCell>
                          <TableCell>
                            {[detalle.marca, detalle.modelo]
                              .filter(Boolean)
                              .join(" / ") || "-"}
                          </TableCell>
                          <TableCell>{detalle.color || "-"}</TableCell>
                          <TableCell>{detalle.observaciones.length}</TableCell>
                          <TableCell>{detalle.imagenes.length}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDetalleSeleccionadoId(detalle.id)}
                            >
                              <Eye className="size-4" />
                              Inspeccionar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!detallesFiltrados.length ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="h-24 text-center text-muted-foreground"
                          >
                            {inspeccion.detalles.length
                              ? "Ningun activo coincide con la busqueda."
                              : "Todavia no hay activos registrados en esta inspeccion."}
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </div>

                {detallesFiltrados.length ? (
                  <div className="flex flex-col gap-3 border-t border-border pt-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
                    <div>
                      Mostrando {detallesFiltrados.length ? inicioPagina + 1 : 0}-
                      {Math.min(finPagina, detallesFiltrados.length)} de{" "}
                      {detallesFiltrados.length} activos
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
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
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historial" className="mt-4">
            <HistorialInspeccion eventos={inspeccion.historial ?? []} />
          </TabsContent>
        </Tabs>
      )}

      <ModalRegistrarActivos
        abierto={modalRegistrarAbierto}
        inspeccionId={inspeccion.id}
        usuarioActual={usuarioActual}
        onCerrar={() => setModalRegistrarAbierto(false)}
        onRegistrados={(actualizado) => {
          setInspeccion(actualizado);
          setModalRegistrarAbierto(false);
        }}
      />
    </section>
  );
}

function ModalRegistrarActivos({
  abierto,
  inspeccionId,
  usuarioActual,
  onCerrar,
  onRegistrados,
}: {
  abierto: boolean;
  inspeccionId: number;
  usuarioActual: string;
  onCerrar: () => void;
  onRegistrados: (inspeccion: Inspeccion) => void;
}) {
  const [q, setQ] = React.useState("");
  const [etiqueta, setEtiqueta] = React.useState("");
  const [lectorQrAbierto, setLectorQrAbierto] = React.useState(false);
  const [seleccionados, setSeleccionados] = React.useState<Set<number>>(new Set());
  const [registrando, setRegistrando] = React.useState(false);

  const { data, isLoading, isError } = useCandidatosInspeccionQuery(
    inspeccionId,
    { q: q.trim() || undefined, etiqueta: etiqueta.trim() || undefined },
    { enabled: abierto }
  );
  const candidatos = data ?? [];

  function alternarSeleccion(activoId: number, marcada: boolean) {
    setSeleccionados((prev) => {
      const siguiente = new Set(prev);
      if (marcada) siguiente.add(activoId);
      else siguiente.delete(activoId);
      return siguiente;
    });
  }

  function alHandleOpenChange(open: boolean) {
    if (!open) {
      setQ("");
      setEtiqueta("");
      setSeleccionados(new Set());
      onCerrar();
    }
  }

  async function confirmar() {
    if (!seleccionados.size) return;
    setRegistrando(true);
    try {
      const actualizado = await registrarActivosInspeccion(inspeccionId, {
        activoIds: Array.from(seleccionados),
        usuario: usuarioActual,
      });
      toast.success("Activos registrados", {
        description: `${seleccionados.size} activo(s) agregados a la inspeccion.`,
      });
      setQ("");
      setEtiqueta("");
      setSeleccionados(new Set());
      onRegistrados(actualizado);
    } catch (err) {
      toast.error("No se pudo registrar los activos", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setRegistrando(false);
    }
  }

  return (
    <>
      <Dialog open={abierto} onOpenChange={alHandleOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar activos en la inspeccion</DialogTitle>
            <DialogDescription>
              Busca por codigo, placa, marca, modelo o serie, o escanea el QR
              del activo. Selecciona uno o varios y confirma.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="Buscar codigo, placa, marca, modelo, serie..."
                className="h-10 min-w-0 flex-1 rounded-full border border-input bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setLectorQrAbierto(true)}
              >
                <QrCode className="size-4" />
                Escanear QR
              </Button>
            </div>
            {etiqueta ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                Filtrando por etiqueta escaneada.
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEtiqueta("")}
                >
                  Quitar filtro
                </Button>
              </div>
            ) : null}

            <div className="max-h-96 overflow-y-auto rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead>Codigo</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Marca / Modelo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-20 text-center text-muted-foreground"
                      >
                        Buscando activos...
                      </TableCell>
                    </TableRow>
                  ) : isError ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-20 text-center text-destructive"
                      >
                        No se pudo cargar la lista de candidatos.
                      </TableCell>
                    </TableRow>
                  ) : candidatos.length ? (
                    candidatos.map((candidato: CandidatoInspeccion) => (
                      <TableRow key={candidato.activoId}>
                        <TableCell>
                          <Checkbox
                            checked={seleccionados.has(candidato.activoId)}
                            onCheckedChange={(marcada) =>
                              alternarSeleccion(candidato.activoId, marcada === true)
                            }
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {candidato.codigo}
                        </TableCell>
                        <TableCell>{candidato.placa || "-"}</TableCell>
                        <TableCell>
                          {[candidato.marca, candidato.modelo]
                            .filter(Boolean)
                            .join(" / ") || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-20 text-center text-muted-foreground"
                      >
                        Sin resultados para la busqueda.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => alHandleOpenChange(false)}
              disabled={registrando}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={confirmar}
              disabled={!seleccionados.size || registrando}
            >
              {registrando
                ? "Registrando..."
                : `Registrar (${seleccionados.size})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LectorQrEtiqueta
        abierto={lectorQrAbierto}
        onCerrar={() => setLectorQrAbierto(false)}
        onTokenLeido={(token) => {
          setEtiqueta(token);
          setLectorQrAbierto(false);
        }}
        titulo="Escanear activo"
        descripcion="Toma una foto clara del QR del activo para buscarlo directamente."
      />
    </>
  );
}

function FichaInspeccionActivo({
  inspeccionId,
  detalle,
  disabled,
  usuarioActual,
  onActualizado,
  onVolver,
}: {
  inspeccionId: number;
  detalle: InspeccionDetalle;
  disabled: boolean;
  usuarioActual: string;
  onActualizado: (inspeccion: Inspeccion) => void;
  onVolver: () => void;
}) {
  const snapshotQuery = useSnapshotDetalleInspeccionQuery(inspeccionId, detalle.id);
  const snapshot = snapshotQuery.data;
  const [observaciones, setObservaciones] = React.useState<string[]>(() =>
    [...detalle.observaciones]
      .sort((a, b) => a.orden - b.orden)
      .map((observacion) => observacion.texto)
  );
  const [guardandoObservaciones, setGuardandoObservaciones] = React.useState(false);
  const [exportando, setExportando] = React.useState<string | null>(null);

  React.useEffect(() => {
    setObservaciones(
      [...detalle.observaciones]
        .sort((a, b) => a.orden - b.orden)
        .map((observacion) => observacion.texto)
    );
  }, [detalle]);

  // Datos operativos editables (el propietario NO se edita: viene del
  // manifiesto). Se pre-llenan con lo que trajo el endpoint al registrar y se
  // pueden corregir mientras la inspeccion este abierta.
  const [datosOp, setDatosOp] = React.useState({
    ubicacion: "",
    conductor: "",
    cuenta: "",
  });
  const [guardandoDatosOp, setGuardandoDatosOp] = React.useState(false);

  React.useEffect(() => {
    const op = snapshot?.datosOperativos;
    setDatosOp({
      ubicacion: op?.ubicacion ?? "",
      conductor: op?.conductor ?? "",
      cuenta: op?.cuenta ?? "",
    });
  }, [snapshot?.datosOperativos]);

  async function guardarDatosOperativos() {
    setGuardandoDatosOp(true);
    try {
      const actualizado = await actualizarDatosOperativosDetalle(
        inspeccionId,
        detalle.id,
        {
          ubicacion: datosOp.ubicacion.trim() || null,
          conductor: datosOp.conductor.trim() || null,
          cuenta: datosOp.cuenta.trim() || null,
          usuario: usuarioActual,
        }
      );
      toast.success("Datos operativos guardados");
      onActualizado(actualizado);
      void snapshotQuery.refetch();
    } catch (err) {
      toast.error("No se pudieron guardar los datos operativos", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setGuardandoDatosOp(false);
    }
  }

  async function guardarObservaciones() {
    setGuardandoObservaciones(true);
    try {
      const textos = observaciones.map((texto) => texto.trim()).filter(Boolean);
      const actualizado = await actualizarObservacionesDetalle(
        inspeccionId,
        detalle.id,
        { observaciones: textos, usuario: usuarioActual }
      );
      toast.success("Observaciones guardadas");
      onActualizado(actualizado);
    } catch (err) {
      toast.error("No se pudo guardar las observaciones", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setGuardandoObservaciones(false);
    }
  }

  async function exportar(formato: FormatoExportacionInspeccion) {
    const clave = `activo-${formato}`;
    setExportando(clave);
    try {
      const blob = await exportarInspeccionPorActivo(inspeccionId, detalle.id, formato);
      descargarArchivoInspeccion(
        blob,
        `inspeccion-${inspeccionId}-${detalle.codigoActivo}.${
          formato === "excel" ? "xlsx" : "pdf"
        }`
      );
    } catch (err) {
      toast.error("No se pudo exportar el activo", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setExportando(null);
    }
  }

  const vehiculo = snapshot?.snapshotActivo?.vehiculo ?? null;
  const operativos = snapshot?.datosOperativos ?? null;

  return (
    <div className="grid gap-5">
      <section className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">
            {detalle.codigoActivo}
          </p>
          <h2 className="text-2xl font-semibold tracking-normal">
            {[detalle.marca, detalle.modelo].filter(Boolean).join(" ") ||
              "Sin descripcion"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {detalle.placa || "Sin placa"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={onVolver}>
            <ArrowLeft className="size-4" />
            Volver
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={exportando === "activo-excel"}
            onClick={() => exportar("excel")}
          >
            <FileSpreadsheet className="size-4" />
            {exportando === "activo-excel" ? "Generando..." : "Excel"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={exportando === "activo-pdf"}
            onClick={() => exportar("pdf")}
          >
            <FileText className="size-4" />
            {exportando === "activo-pdf" ? "Generando..." : "PDF"}
          </Button>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>1. Detalle del activo vehicular</CardTitle>
          <CardDescription>
            Identificacion tomada del snapshot de la inspeccion y datos
            operativos del endpoint externo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {snapshotQuery.isLoading ? (
            <div className="rounded-xl border border-border px-4 py-8 text-center text-sm text-muted-foreground">
              Cargando snapshot del activo...
            </div>
          ) : (
            <>
            <FichaGrid>
              <DatoInspeccion
                label="Clase / Equipo"
                value={snapshot?.snapshotActivo?.tipoActivo ?? detalle.tipoActivo}
              />
              <DatoInspeccion label="Marca" value={vehiculo?.marca ?? detalle.marca} />
              <DatoInspeccion label="Modelo" value={vehiculo?.modelo ?? detalle.modelo} />
              <DatoInspeccion label="Placa" value={vehiculo?.placa ?? detalle.placa} />
              <DatoInspeccion
                label="Serie (VIN / chasis)"
                value={vehiculo?.serieChasis ?? detalle.serieChasis}
              />
              <DatoInspeccion label="Color" value={vehiculo?.color ?? detalle.color} />
              <DatoInspeccion
                label="Propietario"
                value={operativos?.propietario ?? "No disponible"}
              />
              <CampoOperativoEditable
                label="Ubicacion"
                value={datosOp.ubicacion}
                onChange={(v) => setDatosOp((d) => ({ ...d, ubicacion: v }))}
                disabled={disabled}
              />
              <CampoOperativoEditable
                label="Conductor"
                value={datosOp.conductor}
                onChange={(v) => setDatosOp((d) => ({ ...d, conductor: v }))}
                disabled={disabled}
              />
              <CampoOperativoEditable
                label="Cuenta"
                value={datosOp.cuenta}
                onChange={(v) => setDatosOp((d) => ({ ...d, cuenta: v }))}
                disabled={disabled}
              />
              </FichaGrid>
              {!disabled ? (
                <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
                  <Button
                    type="button"
                    className="w-fit"
                    onClick={guardarDatosOperativos}
                    disabled={guardandoDatosOp}
                  >
                    {guardandoDatosOp
                      ? "Guardando..."
                      : "Guardar datos operativos"}
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Detalle de la observacion</CardTitle>
          <CardDescription>
            Lista de observaciones de texto libre. Guardar reemplaza toda la
            lista vigente.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {observaciones.map((texto, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="mt-2.5 w-6 shrink-0 text-sm text-muted-foreground">
                {index + 1}
              </span>
              <textarea
                value={texto}
                disabled={disabled}
                onChange={(event) => {
                  const valor = event.target.value;
                  setObservaciones((actual) =>
                    actual.map((item, i) => (i === index ? valor : item))
                  );
                }}
                placeholder="Describe la observacion"
                className="min-h-16 flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              />
              {!disabled ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setObservaciones((actual) => actual.filter((_, i) => i !== index))
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              ) : null}
            </div>
          ))}
          {!observaciones.length ? (
            <p className="text-sm text-muted-foreground">
              Sin observaciones registradas todavia.
            </p>
          ) : null}
          {!disabled ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setObservaciones((actual) => [...actual, ""])}
              >
                <Plus className="size-4" />
                Agregar observacion
              </Button>
              <Button
                type="button"
                onClick={guardarObservaciones}
                disabled={guardandoObservaciones}
              >
                <Save className="size-4" />
                {guardandoObservaciones ? "Guardando..." : "Guardar observaciones"}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <InspeccionImagenes
            inspeccionId={inspeccionId}
            detalleId={detalle.id}
            imagenes={detalle.imagenes}
            editable={!disabled}
            usuarioActual={usuarioActual}
            onCambio={(actualizado) => onActualizado(actualizado)}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function FichaGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

function DatoInspeccion({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) {
  const display = value === null || value === undefined || value === "" ? "-" : value;

  return (
    <div className="grid gap-1">
      <span className="text-xs uppercase text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{display}</span>
    </div>
  );
}

// Campo de datos operativos: input editable con la inspeccion abierta;
// solo lectura (mismo look que DatoInspeccion) cuando esta cerrada/anulada.
function CampoOperativoEditable({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  if (disabled) {
    return <DatoInspeccion label={label} value={value} />;
  }
  return (
    <div className="grid gap-1">
      <label className="text-xs uppercase text-muted-foreground">{label}</label>
      <input
        className="h-9 rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function HistorialInspeccion({ eventos }: { eventos: InspeccionHistorial[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de la inspeccion</CardTitle>
        <CardDescription>
          Acciones registradas dentro del proceso de inspeccion.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {eventos.length ? (
          <div className="grid gap-3">
            {eventos.map((evento) => (
              <div key={evento.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <History className="size-4 text-muted-foreground" />
                      <span className="font-semibold">{formatear(evento.accion)}</span>
                    </div>
                    {evento.motivo ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {evento.motivo}
                      </p>
                    ) : null}
                  </div>
                  <div className="text-sm text-muted-foreground md:text-right">
                    <p>{formatearFecha(evento.fechaCreacion)}</p>
                    <p>Usuario: {evento.usuario || "-"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            Esta inspeccion aun no tiene historial registrado.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatear(value?: string | null) {
  if (!value) return "-";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatearFecha(fecha?: string | null) {
  if (!fecha) return "-";
  const value = new Date(fecha);
  if (Number.isNaN(value.getTime())) return fecha;

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Lima",
  }).format(value);
}
