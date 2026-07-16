"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Layers,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
import { Checkbox } from "@/compartido/componentes/ui/checkbox";
import { Input } from "@/compartido/componentes/ui/input";
import { Label } from "@/compartido/componentes/ui/label";
import {
  Select,
  SelectContent,
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
import { cn } from "@/compartido/utilidades/utils";
import { extraerMensajeError } from "@/compartido/api";
import { useSesion } from "@/modulos/autenticacion/ganchos/use-sesion";
import { useCatalogosActivos } from "../ganchos/use-catalogos-activos";
import {
  buscarActivosConFiltros,
  obtenerTiposDocumento,
  procesarCargaMasivaDocumentos,
} from "../servicios/activos-api";
import type { Activo } from "../tipos/activo.tipos";
import type {
  ArchivoDocumentoMasivo,
  CargaMasivaDocumentosResultado,
  TipoDocumentoCarga,
  TipoDocumentoMaestro,
} from "../tipos/carga-masiva.tipos";

const TAM_MAX_MB = 10;

/** Documento individual en borrador, agregado a UN activo. */
type DocIndividual = {
  id: string;
  tipoDocumento: TipoDocumentoCarga;
  numero: string;
  fechaEmision: string;
  fechaVencimiento: string;
  nombreArchivo: string;
  contenidoBase64: string;
};

type Filtros = {
  codigo: string;
  placa: string;
  marca: string;
  modelo: string;
  anio: string;
  tipoActivoReferenciaId: string;
  claseVehiculoReferenciaId: string;
};

const FILTROS_VACIOS: Filtros = {
  codigo: "",
  placa: "",
  marca: "",
  modelo: "",
  anio: "",
  tipoActivoReferenciaId: "",
  claseVehiculoReferenciaId: "",
};

function archivoADataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* Radix Select no acepta value="" en un item; sentinel para "sin seleccion". */
const SIN_TIPO_COMPARTIDO = "__ninguno__";

export function CargaMasivaDocumentosVista() {
  const catalogos = useCatalogosActivos();
  const { usuario } = useSesion();
  const nombreUsuarioCarga = usuario?.nombreUsuario ?? "usuario.activos";
  const [tiposMaestro, setTiposMaestro] = React.useState<
    TipoDocumentoMaestro[]
  >([]);
  const tiposCompartidos = React.useMemo(
    () => tiposMaestro.filter((t) => t.alcance === "COMPARTIDO"),
    [tiposMaestro],
  );
  const tiposIndividuales = React.useMemo(
    () => tiposMaestro.filter((t) => t.alcance === "INDIVIDUAL"),
    [tiposMaestro],
  );

  const [filtros, setFiltros] = React.useState<Filtros>(FILTROS_VACIOS);
  const [resultados, setResultados] = React.useState<Activo[]>([]);
  const [buscando, setBuscando] = React.useState(false);
  const [yaSeBusco, setYaSeBusco] = React.useState(false);

  const [seleccionados, setSeleccionados] = React.useState<Activo[]>([]);

  // Documento compartido (uno): cualquier tipo con alcance=COMPARTIDO en el
  // catalogo (hoy solo "Poliza de seguro", pero el maestro puede sumar mas
  // sin tocar este flujo). Aplica a TODOS los seleccionados.
  const [compartidoTipo, setCompartidoTipo] = React.useState<string>("");
  const [compartidoNumero, setCompartidoNumero] = React.useState("");
  const [compartidoFechaEmision, setCompartidoFechaEmision] = React.useState("");
  const [compartidoFecha, setCompartidoFecha] = React.useState("");
  const [compartidoArchivo, setCompartidoArchivo] = React.useState<{
    nombreArchivo: string;
    contenidoBase64: string;
  } | null>(null);

  // Documentos individuales por activo (SOAT, revision tecnica, etc.).
  const [docsPorActivo, setDocsPorActivo] = React.useState<
    Record<number, DocIndividual[]>
  >({});

  const [procesando, setProcesando] = React.useState(false);
  const [resultado, setResultado] =
    React.useState<CargaMasivaDocumentosResultado | null>(null);

  React.useEffect(() => {
    obtenerTiposDocumento()
      .then(setTiposMaestro)
      .catch(() => setTiposMaestro([]));
  }, []);

  const compartidoTipoMeta = tiposCompartidos.find((t) => t.codigo === compartidoTipo);

  // Busqueda automatica con debounce: igual que el listado de activos, sin
  // boton "Buscar" — cada cambio de filtro vuelve a consultar solo. No
  // dispara nada mientras no haya al menos un filtro escrito (evita listar
  // el maestro completo de entrada).
  const hayFiltroActivo = Object.values(filtros).some((v) => v.trim() !== "");

  React.useEffect(() => {
    if (!hayFiltroActivo) {
      setResultados([]);
      setYaSeBusco(false);
      return;
    }
    let cancelado = false;
    setBuscando(true);
    const temporizador = setTimeout(() => {
      buscarActivosConFiltros({
        codigo: filtros.codigo,
        placa: filtros.placa,
        marca: filtros.marca,
        modelo: filtros.modelo,
        anioFabricacion: filtros.anio ? Number(filtros.anio) : undefined,
        tipoActivoReferenciaId: filtros.tipoActivoReferenciaId
          ? Number(filtros.tipoActivoReferenciaId)
          : undefined,
        claseVehiculoReferenciaId: filtros.claseVehiculoReferenciaId
          ? Number(filtros.claseVehiculoReferenciaId)
          : undefined,
      })
        .then((activos) => {
          if (cancelado) return;
          setResultados(activos);
          setYaSeBusco(true);
        })
        .catch((error) => {
          if (cancelado) return;
          console.error(error);
          toast.error("No se pudieron buscar los activos.");
          setResultados([]);
        })
        .finally(() => {
          if (!cancelado) setBuscando(false);
        });
    }, 350);
    return () => {
      cancelado = true;
      clearTimeout(temporizador);
    };
  }, [filtros]);

  function limpiarFiltros() {
    setFiltros(FILTROS_VACIOS);
  }

  function toggleSeleccion(activo: Activo, marcar: boolean) {
    setSeleccionados((actuales) =>
      marcar
        ? actuales.some((a) => a.id === activo.id)
          ? actuales
          : [...actuales, activo]
        : actuales.filter((a) => a.id !== activo.id),
    );
    if (!marcar) {
      setDocsPorActivo((actuales) => {
        const copia = { ...actuales };
        delete copia[activo.id];
        return copia;
      });
    }
  }

  async function onCompartidoArchivo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > TAM_MAX_MB * 1024 * 1024) {
      toast.error(`${file.name} supera ${TAM_MAX_MB} MB.`);
      return;
    }
    setCompartidoArchivo({
      nombreArchivo: file.name,
      contenidoBase64: await archivoADataUrl(file),
    });
  }

  function agregarDocIndividual(activoId: number, doc: DocIndividual) {
    setDocsPorActivo((actuales) => ({
      ...actuales,
      [activoId]: [...(actuales[activoId] ?? []), doc],
    }));
  }

  function quitarDocIndividual(activoId: number, docId: string) {
    setDocsPorActivo((actuales) => ({
      ...actuales,
      [activoId]: (actuales[activoId] ?? []).filter((d) => d.id !== docId),
    }));
  }

  const compartidoActivo = Boolean(compartidoTipo && compartidoArchivo);
  const totalIndividuales = React.useMemo(
    () =>
      seleccionados.reduce(
        (suma, a) => suma + (docsPorActivo[a.id]?.length ?? 0),
        0,
      ),
    [seleccionados, docsPorActivo],
  );

  function reiniciar() {
    setResultado(null);
    setSeleccionados([]);
    setDocsPorActivo({});
    setCompartidoTipo("");
    setCompartidoNumero("");
    setCompartidoFechaEmision("");
    setCompartidoFecha("");
    setCompartidoArchivo(null);
    limpiarFiltros();
  }

  async function guardarTodo() {
    if (compartidoActivo) {
      if (!compartidoNumero.trim()) {
        toast.error("Completa el numero del documento compartido.");
        return;
      }
      if (!compartidoFechaEmision) {
        toast.error("Completa la fecha de emision del documento compartido.");
        return;
      }
      if (compartidoTipoMeta?.requiereVencimiento && !compartidoFecha) {
        toast.error("Este documento requiere fecha de vencimiento.");
        return;
      }
    }

    const archivos: ArchivoDocumentoMasivo[] = [];

    if (compartidoActivo && compartidoArchivo && seleccionados.length > 0) {
      archivos.push({
        nombreArchivo: compartidoArchivo.nombreArchivo,
        identificador: seleccionados[0].codigo,
        identificadores: seleccionados.map((a) => a.codigo),
        tipoDocumento: compartidoTipo as TipoDocumentoCarga,
        numero: compartidoNumero.trim(),
        fechaEmision: compartidoFechaEmision,
        fechaVencimiento: compartidoFecha || undefined,
        contenidoBase64: compartidoArchivo.contenidoBase64,
      });
    }

    for (const activo of seleccionados) {
      for (const doc of docsPorActivo[activo.id] ?? []) {
        archivos.push({
          nombreArchivo: doc.nombreArchivo,
          identificador: activo.codigo,
          tipoDocumento: doc.tipoDocumento,
          numero: doc.numero,
          fechaEmision: doc.fechaEmision,
          fechaVencimiento: doc.fechaVencimiento || undefined,
          contenidoBase64: doc.contenidoBase64,
        });
      }
    }

    if (archivos.length === 0) {
      toast.error(
        "Agrega un documento compartido o documentos individuales antes de guardar.",
      );
      return;
    }

    setProcesando(true);
    try {
      const datos = await procesarCargaMasivaDocumentos({
        archivos,
        usuario: nombreUsuarioCarga,
      });
      setResultado(datos);
      toast.success(
        `${datos.totalAsociados} asociados, ${datos.totalSinActivo} sin activo.`,
      );
    } catch (error) {
      console.error(error);
      toast.error(extraerMensajeError(error, "No se pudo guardar."));
    } finally {
      setProcesando(false);
    }
  }

  if (resultado) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Resultado</CardTitle>
                <CardDescription>
                  {resultado.totalAsociados} documento(s) asociados de{" "}
                  {resultado.totalArchivos}.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-emerald-600">
                  {resultado.totalAsociados} asociados
                </Badge>
                <Badge
                  variant={resultado.totalSinActivo ? "destructive" : "outline"}
                >
                  {resultado.totalSinActivo} sin activo
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-[26rem] overflow-auto rounded-lg border">
              <Table>
                <TableHeader className="sticky top-0 bg-muted">
                  <TableRow>
                    <TableHead className="w-24">Estado</TableHead>
                    <TableHead>Activo</TableHead>
                    <TableHead>Archivo</TableHead>
                    <TableHead>Detalle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultado.detalles.map((detalle, i) => (
                    <TableRow
                      key={`${detalle.nombreArchivo}-${i}`}
                      className={cn(
                        detalle.estado !== "ASOCIADO" && "bg-destructive/5",
                      )}
                    >
                      <TableCell>
                        {detalle.estado === "ASOCIADO" ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                            <CheckCircle2 className="size-3.5" /> Ok
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-destructive">
                            <XCircle className="size-3.5" /> Falla
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {detalle.codigoActivo || detalle.identificador}
                      </TableCell>
                      <TableCell>{detalle.nombreArchivo}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {detalle.mensajeError || "Documento cargado"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button asChild variant="ghost">
                <Link href="/activos/inventario">Ir al listado de activos</Link>
              </Button>
              <Button type="button" onClick={reiniciar}>
                Nueva carga de documentos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* PASO 1 — Buscar y seleccionar activos */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{seleccionados.length} seleccionados</Badge>
            <h2 className="text-lg font-semibold">1. Selecciona los activos</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Filtra y marca los activos. Luego aplicales un documento compartido
            y/o documentos individuales sin salir de esta pantalla.
          </p>
        </div>

        <Card className="overflow-hidden">
          <CardContent className="flex flex-col gap-4 p-0">
            <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
              <div className="flex flex-1 flex-wrap items-center gap-2">
                <div className="relative w-44">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    aria-label="Codigo"
                    className="h-9 w-full rounded-4xl pl-9"
                    placeholder="Codigo"
                    value={filtros.codigo}
                    onChange={(e) =>
                      setFiltros((f) => ({ ...f, codigo: e.target.value }))
                    }
                  />
                </div>
                <Input
                  aria-label="Placa"
                  className="h-9 w-36 rounded-4xl"
                  placeholder="Placa"
                  value={filtros.placa}
                  onChange={(e) =>
                    setFiltros((f) => ({ ...f, placa: e.target.value }))
                  }
                />
                <Select
                  value={filtros.tipoActivoReferenciaId || "TODOS"}
                  onValueChange={(v) =>
                    setFiltros((f) => ({
                      ...f,
                      tipoActivoReferenciaId: v === "TODOS" ? "" : v,
                    }))
                  }
                >
                  <SelectTrigger aria-label="Tipo de activo" className="h-9 w-40">
                    <SelectValue placeholder="Tipo: todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Tipo: todos</SelectItem>
                    {catalogos.tiposActivo.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filtros.claseVehiculoReferenciaId || "TODOS"}
                  onValueChange={(v) =>
                    setFiltros((f) => ({
                      ...f,
                      claseVehiculoReferenciaId: v === "TODOS" ? "" : v,
                    }))
                  }
                >
                  <SelectTrigger aria-label="Clase de vehiculo" className="h-9 w-40">
                    <SelectValue placeholder="Clase: todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Clase: todas</SelectItem>
                    {catalogos.clasesVehiculo.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  aria-label="Marca"
                  className="h-9 w-32 rounded-4xl"
                  placeholder="Marca"
                  value={filtros.marca}
                  onChange={(e) =>
                    setFiltros((f) => ({ ...f, marca: e.target.value }))
                  }
                />
                <Input
                  aria-label="Modelo"
                  className="h-9 w-32 rounded-4xl"
                  placeholder="Modelo"
                  value={filtros.modelo}
                  onChange={(e) =>
                    setFiltros((f) => ({ ...f, modelo: e.target.value }))
                  }
                />
                <Input
                  aria-label="Ano de fabricacion"
                  className="h-9 w-24 rounded-4xl"
                  type="number"
                  placeholder="Ano"
                  value={filtros.anio}
                  onChange={(e) =>
                    setFiltros((f) => ({ ...f, anio: e.target.value }))
                  }
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={limpiarFiltros}
              >
                Limpiar
              </Button>
            </div>

            <div className="mx-4 mb-4 overflow-hidden rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead>Codigo</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Placa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buscando ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-28 text-center text-muted-foreground"
                      >
                        Buscando...
                      </TableCell>
                    </TableRow>
                  ) : resultados.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-28 text-center text-muted-foreground"
                      >
                        {yaSeBusco
                          ? "Sin resultados con esos filtros."
                          : "Escribe o filtra para buscar activos."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    resultados.map((activo) => {
                      const marcado = seleccionados.some(
                        (a) => a.id === activo.id,
                      );
                      return (
                        <TableRow
                          key={activo.id}
                          className="cursor-pointer"
                          data-state={marcado ? "selected" : undefined}
                          onClick={() => toggleSeleccion(activo, !marcado)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={marcado}
                              onCheckedChange={(checked) =>
                                toggleSeleccion(activo, Boolean(checked))
                              }
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {activo.codigo}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {[activo.vehiculo?.marca, activo.vehiculo?.modelo]
                              .filter(Boolean)
                              .join(" ") || activo.descripcion}
                          </TableCell>
                          <TableCell>{activo.vehiculo?.placa ?? "—"}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      {seleccionados.length > 0 && (
        <>
          {/* PASO 2A — Documento compartido */}
          {tiposCompartidos.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Layers className="size-4 text-sky-600" />
                  Documento compartido (opcional)
                </CardTitle>
                <CardDescription>
                  Un solo archivo que cubre a los {seleccionados.length} activo(s)
                  seleccionados. Ej. poliza de flota, u otro tipo que se marque
                  como compartido en el Maestro Documentario.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo</Label>
                  <Select
                    value={compartidoTipo}
                    onValueChange={(v) =>
                      setCompartidoTipo(v === SIN_TIPO_COMPARTIDO ? "" : v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        value={SIN_TIPO_COMPARTIDO}
                        className="text-muted-foreground"
                      >
                        Ninguno
                      </SelectItem>
                      {tiposCompartidos.map((t) => (
                        <SelectItem key={t.codigo} value={t.codigo}>
                          {t.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Numero <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="POL-2026-000123"
                    value={compartidoNumero}
                    onChange={(e) => setCompartidoNumero(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Fecha emision <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={compartidoFechaEmision}
                    onChange={(e) => setCompartidoFechaEmision(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Vencimiento{" "}
                    {compartidoTipoMeta?.requiereVencimiento ? (
                      <span className="text-destructive">*</span>
                    ) : null}
                  </Label>
                  <Input
                    type="date"
                    value={compartidoFecha}
                    onChange={(e) => setCompartidoFecha(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Archivo</Label>
                  <input
                    id="compartido-archivo"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={onCompartidoArchivo}
                  />
                  <label htmlFor="compartido-archivo" className="block">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      asChild
                    >
                      <span className="cursor-pointer truncate">
                        <Upload className="size-4" />
                        {compartidoArchivo
                          ? compartidoArchivo.nombreArchivo
                          : "Subir archivo"}
                      </span>
                    </Button>
                  </label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* PASO 2B — Documentos individuales por activo */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">
                Documentos individuales por activo
              </CardTitle>
              <CardDescription>
                Para SOAT, revision tecnica, etc. — un archivo propio por activo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {seleccionados.map((activo) => (
                <FilaActivoSeleccionado
                  key={activo.id}
                  activo={activo}
                  docs={docsPorActivo[activo.id] ?? []}
                  tiposIndividuales={tiposIndividuales}
                  onAgregar={(doc) => agregarDocIndividual(activo.id, doc)}
                  onQuitarDoc={(docId) => quitarDocIndividual(activo.id, docId)}
                  onQuitarActivo={() => toggleSeleccion(activo, false)}
                />
              ))}
            </CardContent>
          </Card>

          {/* Guardar */}
          <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4">
            <div className="max-w-xs space-y-1.5">
              <Label className="text-xs">Cargado por</Label>
              <Input
                value={nombreUsuarioCarga}
                readOnly
                className="cursor-default bg-muted/40 text-muted-foreground"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {compartidoActivo && (
                  <span className="font-medium text-foreground">
                    1 documento compartido ({seleccionados.length} activos)
                  </span>
                )}
                {compartidoActivo && totalIndividuales > 0 ? " + " : ""}
                {totalIndividuales > 0 && (
                  <span className="font-medium text-foreground">
                    {totalIndividuales} individual(es)
                  </span>
                )}
                {!compartidoActivo && totalIndividuales === 0 &&
                  "Aun no agregaste documentos."}
              </p>
              <Button
                type="button"
                onClick={guardarTodo}
                disabled={procesando || (!compartidoActivo && totalIndividuales === 0)}
              >
                {procesando ? "Guardando..." : "Guardar todo"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** Una fila del paso 2B: un activo con sus documentos individuales + mini-form. */
function FilaActivoSeleccionado({
  activo,
  docs,
  tiposIndividuales,
  onAgregar,
  onQuitarDoc,
  onQuitarActivo,
}: {
  activo: Activo;
  docs: DocIndividual[];
  tiposIndividuales: TipoDocumentoMaestro[];
  onAgregar: (doc: DocIndividual) => void;
  onQuitarDoc: (docId: string) => void;
  onQuitarActivo: () => void;
}) {
  const [abierto, setAbierto] = React.useState(false);
  const [tipo, setTipo] = React.useState<string>("");
  const [numero, setNumero] = React.useState("");
  const [fechaEmision, setFechaEmision] = React.useState("");
  const [fecha, setFecha] = React.useState("");
  const [archivo, setArchivo] = React.useState<{
    nombreArchivo: string;
    contenidoBase64: string;
  } | null>(null);

  const tipoMeta = tiposIndividuales.find((t) => t.codigo === tipo);

  async function onArchivo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > TAM_MAX_MB * 1024 * 1024) {
      toast.error(`${file.name} supera ${TAM_MAX_MB} MB.`);
      return;
    }
    setArchivo({
      nombreArchivo: file.name,
      contenidoBase64: await archivoADataUrl(file),
    });
  }

  function agregar() {
    if (!tipo) {
      toast.error("Selecciona el tipo de documento.");
      return;
    }
    if (!numero.trim()) {
      toast.error("Completa el numero del documento.");
      return;
    }
    if (!fechaEmision) {
      toast.error("Completa la fecha de emision.");
      return;
    }
    if (!archivo) {
      toast.error("Sube el archivo del documento.");
      return;
    }
    if (tipoMeta?.requiereVencimiento && !fecha) {
      toast.error("Este tipo requiere fecha de vencimiento.");
      return;
    }
    onAgregar({
      id: crypto.randomUUID(),
      tipoDocumento: tipo as TipoDocumentoCarga,
      numero: numero.trim(),
      fechaEmision,
      fechaVencimiento: fecha,
      nombreArchivo: archivo.nombreArchivo,
      contenidoBase64: archivo.contenidoBase64,
    });
    setTipo("");
    setNumero("");
    setFechaEmision("");
    setFecha("");
    setArchivo(null);
    setAbierto(false);
  }

  return (
    <div className="rounded-lg border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {activo.codigo}
            {activo.vehiculo?.placa ? ` — ${activo.vehiculo.placa}` : ""}
          </span>
          <span className="text-xs text-muted-foreground">
            {docs.length === 0
              ? "Sin documentos individuales"
              : `${docs.length} documento(s)`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAbierto((v) => !v)}
          >
            <Plus className="size-4" />
            Agregar documento
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Quitar ${activo.codigo}`}
            onClick={onQuitarActivo}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {docs.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {docs.map((doc) => {
            const etiqueta = tiposIndividuales.find(
              (t) => t.codigo === doc.tipoDocumento,
            )?.nombre;
            return (
              <Badge key={doc.id} variant="secondary" className="gap-1 pr-1">
                {etiqueta ?? doc.tipoDocumento}
                {doc.numero ? ` · N° ${doc.numero}` : ""}
                {doc.fechaVencimiento ? ` · Vence ${doc.fechaVencimiento}` : ""}
                <button
                  type="button"
                  aria-label="Quitar documento"
                  onClick={() => onQuitarDoc(doc.id)}
                  className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                >
                  <Trash2 className="size-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {abierto && (
        <div className="mt-3 grid gap-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {tiposIndividuales.map((t) => (
                  <SelectItem key={t.codigo} value={t.codigo}>
                    {t.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">
              Numero <span className="text-destructive">*</span>
            </Label>
            <Input
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">
              Fecha emision <span className="text-destructive">*</span>
            </Label>
            <Input
              type="date"
              value={fechaEmision}
              onChange={(e) => setFechaEmision(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">
              Vencimiento{" "}
              {tipoMeta?.requiereVencimiento ? (
                <span className="text-destructive">*</span>
              ) : null}
            </Label>
            <Input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className={cn(
                tipoMeta?.requiereVencimiento && !fecha && "border-destructive",
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Archivo</Label>
            <input
              id={`ind-archivo-${activo.id}`}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={onArchivo}
            />
            <label htmlFor={`ind-archivo-${activo.id}`} className="block">
              <Button type="button" variant="outline" className="w-full" asChild>
                <span className="cursor-pointer truncate">
                  <Upload className="size-4" />
                  {archivo ? archivo.nombreArchivo : "Archivo"}
                </span>
              </Button>
            </label>
          </div>
          <div className="flex items-end">
            <Button type="button" className="w-full" onClick={agregar}>
              Agregar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
