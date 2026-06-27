"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Boxes,
  Car,
  CheckCircle2,
  Cpu,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  FileUp,
  Package,
  Upload,
  Wrench,
  XCircle,
} from "lucide-react";
// Excepcion deliberada a la convencion lucide: el menu de acciones usa los
// mismos iconos @tabler que `activos-tabla.tsx` para verse 100% identico.
import {
  IconDotsVertical,
  IconEye,
  IconFileDescription,
  IconPencil,
} from "@tabler/icons-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/compartido/componentes/ui/sheet";
import { ScrollArea } from "@/compartido/componentes/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/compartido/componentes/ui/dropdown-menu";
import { extraerMensajeError } from "@/compartido/api";
import { cn } from "@/compartido/utilidades/utils";
import { useCatalogosActivos } from "../ganchos/use-catalogos-activos";
import type { CatalogosActivos } from "../ganchos/use-catalogos-activos";
import {
  COLUMNAS_POR_TIPO,
  ETIQUETA_TIPO_ACTIVO,
  TIPO_ACTIVO_DISPOSITIVO_ID,
  TIPO_ACTIVO_EQUIPO_ID,
  TIPO_ACTIVO_HERRAMIENTA_ID,
  TIPO_ACTIVO_OTRO_ID,
  TIPO_ACTIVO_VEHICULO_ID,
} from "../servicios/carga-masiva-columnas";
import {
  descargarPlantilla,
  parsearArchivo,
} from "../servicios/carga-masiva-excel";
import {
  obtenerCargaMasiva,
  obtenerDocumentosPorCodigo,
  procesarCargaMasiva,
} from "../servicios/activos-api";
import { DocumentosActivo } from "../componentes/documentos-activo";
import type { DocumentoActivo } from "../tipos/activo.tipos";
import type {
  CargaMasiva,
  FilaPrevisualizada,
} from "../tipos/carga-masiva.tipos";

type Paso = "tipo" | "cargar" | "revisar" | "resultado";

const TIPOS: Array<{ tipo: number; icono: React.ReactNode; detalle: string }> =
  [
    {
      tipo: TIPO_ACTIVO_VEHICULO_ID,
      icono: <Car className="size-6" />,
      detalle: "Unidades con placa, motor, dimensiones y tanques.",
    },
    {
      tipo: TIPO_ACTIVO_EQUIPO_ID,
      icono: <Boxes className="size-6" />,
      detalle: "Equipos con dimensiones y control operativo.",
    },
    {
      tipo: TIPO_ACTIVO_DISPOSITIVO_ID,
      icono: <Cpu className="size-6" />,
      detalle: "Dispositivos con marca, modelo y serie.",
    },
    {
      tipo: TIPO_ACTIVO_HERRAMIENTA_ID,
      icono: <Wrench className="size-6" />,
      detalle: "Herramientas y activos menores.",
    },
    {
      tipo: TIPO_ACTIVO_OTRO_ID,
      icono: <Package className="size-6" />,
      detalle: "Otros activos con datos basicos.",
    },
  ];

const PASOS: Array<{ id: Paso; titulo: string }> = [
  { id: "tipo", titulo: "Tipo" },
  { id: "cargar", titulo: "Plantilla y archivo" },
  { id: "revisar", titulo: "Revisar" },
  { id: "resultado", titulo: "Resultado" },
];

export function CargaMasivaVista({ loteId }: { loteId?: number }) {
  const router = useRouter();
  const catalogos = useCatalogosActivos();
  const [paso, setPaso] = React.useState<Paso>("tipo");
  const [tipo, setTipo] = React.useState<number | null>(null);
  const [nombreArchivo, setNombreArchivo] = React.useState<string>("");
  const [filas, setFilas] = React.useState<FilaPrevisualizada[]>([]);
  const [procesando, setProcesando] = React.useState(false);
  const [resultado, setResultado] = React.useState<CargaMasiva | null>(null);
  const [cargandoLote, setCargandoLote] = React.useState(Boolean(loteId));

  const validas = filas.filter((fila) => fila.esValida);
  const conError = filas.filter((fila) => !fila.esValida);

  // El Resultado es reconstruible por URL (?lote=ID): si llegamos con un
  // loteId, lo traemos de la BD y arrancamos directo en el paso Resultado
  // en vez del paso 1. Asi "Editar -> Guardar" puede regresar exactamente
  // a este lote (mismo patron que Inventario Fisico con returnTo).
  React.useEffect(() => {
    if (!loteId) return;
    let cancelado = false;
    setCargandoLote(true);
    obtenerCargaMasiva(loteId)
      .then((carga) => {
        if (cancelado) return;
        setResultado(carga);
        setPaso("resultado");
      })
      .catch(() => {
        if (cancelado) return;
        toast.error(`No se encontro el lote ${loteId}.`);
        router.replace("/activos/carga-masiva");
      })
      .finally(() => {
        if (!cancelado) setCargandoLote(false);
      });
    return () => {
      cancelado = true;
    };
  }, [loteId, router]);

  function reiniciar() {
    setPaso("tipo");
    setTipo(null);
    setNombreArchivo("");
    setFilas([]);
    setResultado(null);
    if (loteId) router.replace("/activos/carga-masiva");
  }

  function elegirTipo(nuevoTipo: number) {
    setTipo(nuevoTipo);
    setFilas([]);
    setNombreArchivo("");
    setPaso("cargar");
  }

  async function onArchivo(event: React.ChangeEvent<HTMLInputElement>) {
    const archivo = event.target.files?.[0];
    event.target.value = "";
    if (!archivo || !tipo) return;

    try {
      const parseadas = await parsearArchivo(archivo, tipo, catalogos);
      if (parseadas.length === 0) {
        toast.error("El archivo no tiene filas de datos.");
        return;
      }
      setNombreArchivo(archivo.name);
      setFilas(parseadas);
      setPaso("revisar");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo leer el archivo. Verifica que sea un Excel valido.");
    }
  }

  async function confirmar() {
    if (!tipo || validas.length === 0) return;
    setProcesando(true);
    try {
      const carga = await procesarCargaMasiva({
        tipoActivoReferenciaId: tipo,
        nombreArchivo,
        filas: validas.map((fila) => ({ fila: fila.fila, activo: fila.activo })),
      });
      setResultado(carga);
      setPaso("resultado");
      toast.success(
        `Carga procesada: ${carga.totalCreados} creados, ${carga.totalRechazados} rechazados.`,
      );
    } catch (error) {
      console.error(error);
      const mensaje = extraerMensajeError(
        error,
        "No se pudo procesar la carga masiva.",
      );
      // El backend repite el mismo error por cada fila; lo resumimos y le
      // quitamos el prefijo tecnico "filas.N." para que se entienda.
      const motivos = Array.from(
        new Set(
          mensaje.split(/,\s*/).map((m) => m.replace(/^filas\.\d+\./, "")),
        ),
      );
      const descripcion =
        motivos.slice(0, 3).join(" · ") +
        (motivos.length > 3 ? ` (+${motivos.length - 3} mas)` : "");
      toast.error("No se pudo procesar la carga masiva.", {
        description: descripcion,
      });
    } finally {
      setProcesando(false);
    }
  }

  if (cargandoLote) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-center justify-center gap-3 py-16 text-sm text-muted-foreground">
            Cargando lote {loteId}...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <Pasos pasoActual={paso} />

      {paso === "tipo" && <PasoTipo onElegir={elegirTipo} />}

      {paso === "cargar" && tipo && (
        <PasoCargar
          tipo={tipo}
          catalogos={catalogos}
          onArchivo={onArchivo}
          onVolver={() => setPaso("tipo")}
        />
      )}

      {paso === "revisar" && tipo && (
        <PasoRevisar
          tipo={tipo}
          nombreArchivo={nombreArchivo}
          filas={filas}
          validas={validas.length}
          conError={conError.length}
          procesando={procesando}
          onConfirmar={confirmar}
          onVolver={() => setPaso("cargar")}
        />
      )}

      {paso === "resultado" && resultado && (
        <PasoResultado resultado={resultado} onNueva={reiniciar} />
      )}
    </div>
  );
}

function Pasos({ pasoActual }: { pasoActual: Paso }) {
  const indiceActual = PASOS.findIndex((p) => p.id === pasoActual);
  return (
    <div className="flex items-center gap-2">
      {PASOS.map((p, i) => {
        const completado = i < indiceActual;
        const activo = i === indiceActual;
        return (
          <React.Fragment key={p.id}>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border text-xs font-semibold",
                  activo && "border-primary bg-primary text-primary-foreground",
                  completado &&
                    "border-emerald-500 bg-emerald-500 text-white",
                  !activo && !completado && "border-muted text-muted-foreground",
                )}
              >
                {completado ? <CheckCircle2 className="size-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-sm",
                  activo ? "font-medium" : "text-muted-foreground",
                )}
              >
                {p.titulo}
              </span>
            </div>
            {i < PASOS.length - 1 && (
              <div className="h-px w-6 flex-none bg-border md:w-12" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function PasoTipo({ onElegir }: { onElegir: (tipo: number) => void }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle>1. Selecciona el tipo de activo</CardTitle>
        <CardDescription>
          Cada tipo abre distintos campos. La plantilla traera solo las columnas
          que apliquen.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TIPOS.map(({ tipo, icono, detalle }) => (
          <button
            key={tipo}
            type="button"
            onClick={() => onElegir(tipo)}
            className="flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition hover:border-primary hover:bg-accent"
          >
            <span className="flex size-11 items-center justify-center rounded-md bg-primary/10 text-primary">
              {icono}
            </span>
            <span className="font-medium">{ETIQUETA_TIPO_ACTIVO[tipo]}</span>
            <span className="text-xs text-muted-foreground">{detalle}</span>
            <span className="mt-1 text-xs text-muted-foreground">
              {COLUMNAS_POR_TIPO[tipo].length} columnas
            </span>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}

function PasoCargar({
  tipo,
  catalogos,
  onArchivo,
  onVolver,
}: {
  tipo: number;
  catalogos: CatalogosActivos;
  onArchivo: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onVolver: () => void;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle>
          2. Plantilla y archivo — {ETIQUETA_TIPO_ACTIVO[tipo]}
        </CardTitle>
        <CardDescription>
          Descarga la plantilla, llena los datos en la hoja &quot;Activos&quot; y
          subela aqui. La hoja &quot;Instrucciones&quot; explica cada columna.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col items-start gap-3 rounded-lg border p-5">
          <FileSpreadsheet className="size-8 text-emerald-600" />
          <p className="text-sm font-medium">Paso A — Descargar plantilla</p>
          <p className="text-xs text-muted-foreground">
            Excel con {COLUMNAS_POR_TIPO[tipo].length} columnas y una fila de
            ejemplo.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => descargarPlantilla(tipo, catalogos)}
          >
            <Download className="size-4" />
            Descargar plantilla
          </Button>
        </div>

        <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-5">
          <FileUp className="size-8 text-primary" />
          <p className="text-sm font-medium">Paso B — Subir archivo lleno</p>
          <p className="text-xs text-muted-foreground">
            Formatos: .xlsx, .xls o .csv. Se validara antes de crear nada.
          </p>
          <label htmlFor="archivo-carga">
            <input
              id="archivo-carga"
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={onArchivo}
            />
            <Button type="button" asChild>
              <span className="cursor-pointer">
                <Upload className="size-4" />
                Seleccionar archivo
              </span>
            </Button>
          </label>
        </div>
      </CardContent>
      <CardContent>
        <Button type="button" variant="ghost" onClick={onVolver}>
          Volver
        </Button>
      </CardContent>
    </Card>
  );
}

function PasoRevisar({
  tipo,
  nombreArchivo,
  filas,
  validas,
  conError,
  procesando,
  onConfirmar,
  onVolver,
}: {
  tipo: number;
  nombreArchivo: string;
  filas: FilaPrevisualizada[];
  validas: number;
  conError: number;
  procesando: boolean;
  onConfirmar: () => void;
  onVolver: () => void;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>3. Revisar previsualizacion</CardTitle>
            <CardDescription>
              {nombreArchivo} — {ETIQUETA_TIPO_ACTIVO[tipo]}. Solo se crearan las
              filas validas.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-emerald-600">{validas} validas</Badge>
            <Badge variant={conError ? "destructive" : "outline"}>
              {conError} con error
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-[26rem] overflow-auto rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 bg-muted">
              <TableRow>
                <TableHead className="w-14">Fila</TableHead>
                <TableHead className="w-24">Estado</TableHead>
                <TableHead>Codigo</TableHead>
                <TableHead>Descripcion</TableHead>
                <TableHead>Ubicacion</TableHead>
                <TableHead>Errores</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((fila) => (
                <TableRow
                  key={fila.fila}
                  className={cn(!fila.esValida && "bg-destructive/5")}
                >
                  <TableCell className="text-muted-foreground">
                    {fila.fila}
                  </TableCell>
                  <TableCell>
                    {fila.esValida ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                        <CheckCircle2 className="size-3.5" /> Ok
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-destructive">
                        <XCircle className="size-3.5" /> Error
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {fila.valoresCrudos.codigo || "—"}
                  </TableCell>
                  <TableCell>{fila.valoresCrudos.descripcion || "—"}</TableCell>
                  <TableCell>{fila.valoresCrudos.ubicacion || "—"}</TableCell>
                  <TableCell className="text-xs">
                    {Object.keys(fila.errores).length > 0 ? (
                      <span className="text-destructive">
                        {Object.entries(fila.errores)
                          .map(([campo, msg]) => `${campo}: ${msg}`)
                          .join(" · ")}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="ghost" onClick={onVolver}>
            Volver
          </Button>
          <Button
            type="button"
            onClick={onConfirmar}
            disabled={validas === 0 || procesando}
          >
            {procesando
              ? "Procesando..."
              : `Crear ${validas} activo${validas === 1 ? "" : "s"}`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PasoResultado({
  resultado,
  onNueva,
}: {
  resultado: CargaMasiva;
  onNueva: () => void;
}) {
  const detalles = resultado.detalles ?? [];
  const creados = detalles.filter((d) => d.estado === "CREADO");
  const [activoSeleccionado, setActivoSeleccionado] = React.useState<
    string | null
  >(null);
  const returnToLote = `/activos/carga-masiva?lote=${resultado.id}`;
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>4. Resultado — lote {resultado.codigo}</CardTitle>
            <CardDescription>
              {resultado.totalCreados} creados de {resultado.totalLeidos} leidos.
              Entra a cada activo para agregar documentos o imagenes.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-emerald-600">
              {resultado.totalCreados} creados
            </Badge>
            <Badge variant={resultado.totalRechazados ? "destructive" : "outline"}>
              {resultado.totalRechazados} rechazados
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-[26rem] overflow-auto rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 bg-muted">
              <TableRow>
                <TableHead className="w-14">Fila</TableHead>
                <TableHead className="w-28">Estado</TableHead>
                <TableHead>Codigo</TableHead>
                <TableHead>Detalle</TableHead>
                <TableHead className="w-20 text-center">Accion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detalles.map((detalle) => (
                <TableRow key={detalle.id}>
                  <TableCell className="text-muted-foreground">
                    {detalle.fila}
                  </TableCell>
                  <TableCell>
                    {detalle.estado === "CREADO" ? (
                      <Badge className="bg-emerald-600">Creado</Badge>
                    ) : (
                      <Badge variant="destructive">Rechazado</Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {detalle.codigoActivo || "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {detalle.mensajeError || "Creado correctamente"}
                  </TableCell>
                  <TableCell className="text-center">
                    {detalle.estado === "CREADO" && detalle.codigoActivo ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="outline"
                            aria-label={`Acciones de ${detalle.codigoActivo}`}
                          >
                            <IconDotsVertical />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-44">
                          <DropdownMenuItem
                            onSelect={() =>
                              setActivoSeleccionado(detalle.codigoActivo)
                            }
                          >
                            <IconFileDescription />
                            Documentos
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/activos/${detalle.codigoActivo}`}>
                              <IconEye />
                              Abrir
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/activos/${detalle.codigoActivo}/editar?returnTo=${encodeURIComponent(returnToLote)}`}
                            >
                              <IconPencil />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
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
          <div className="flex flex-wrap gap-2">
            {creados.length > 0 && (
              <Button asChild variant="outline">
                <Link
                  href="/activos/carga-masiva-documentos"
                  target="_blank"
                  onClick={() => {
                    // Pasamos los codigos recien creados para que, si el
                    // siguiente documento es compartido (ej. poliza), el
                    // campo de placas llegue prellenado con este lote.
                    // sessionStorage se copia a la pestana nueva (mismo
                    // origen, sin noopener), por eso no hace falta otra cosa.
                    const codigos = creados
                      .map((detalle) => detalle.codigoActivo)
                      .filter((codigo): codigo is string => Boolean(codigo));
                    window.sessionStorage.setItem(
                      "activos:loteParaDocumentos",
                      JSON.stringify(codigos),
                    );
                  }}
                >
                  <FileText className="size-4" />
                  Agregar documentos a estos activos
                  <ExternalLink className="size-3.5" />
                </Link>
              </Button>
            )}
            <Button type="button" onClick={onNueva}>
              Nueva carga
            </Button>
          </div>
        </div>
      </CardContent>

      <Sheet
        open={activoSeleccionado !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setActivoSeleccionado(null);
        }}
      >
        <SheetContent
          side="right"
          className="w-full gap-0 data-[side=right]:sm:max-w-2xl"
        >
          <SheetHeader className="border-b border-border">
            <SheetTitle>Documentos — {activoSeleccionado}</SheetTitle>
            <SheetDescription>
              Sube el SOAT, poliza u otros documentos de este activo. Al cerrar
              vuelves a la lista para seguir con el siguiente.
            </SheetDescription>
          </SheetHeader>
          {/* min-h-0 + flex-1: el ScrollArea ocupa el resto y scrollea por dentro
              con la barra fina de Radix, no la nativa del navegador. */}
          <ScrollArea className="min-h-0 flex-1">
            {activoSeleccionado ? (
              <div className="p-6">
                <DocumentosDrawerContenido codigo={activoSeleccionado} />
              </div>
            ) : null}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </Card>
  );
}

/** Carga los documentos del activo y los muestra en el panel; recarga al cambiar. */
function DocumentosDrawerContenido({ codigo }: { codigo: string }) {
  const [documentos, setDocumentos] = React.useState<DocumentoActivo[]>([]);

  const recargar = React.useCallback(() => {
    obtenerDocumentosPorCodigo(codigo)
      .then(setDocumentos)
      .catch(() => setDocumentos([]));
  }, [codigo]);

  React.useEffect(() => {
    recargar();
  }, [recargar]);

  return (
    <DocumentosActivo
      codigo={codigo}
      documentos={documentos}
      onCambio={recargar}
      compacto
    />
  );
}
